import json
import math
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ..config import DATA_PATH, MODELS_DIR, WRITABLE_DIR
from ..data_processor import (
    engineer_features,
    get_feature_columns,
    load_raw_data,
    prepare_training_data,
)


def _safe_num(val, default=None):
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return round(f, 2)
    except (TypeError, ValueError):
        return default


def build_preprocessor() -> ColumnTransformer:
    cat_features = ["event_type", "event_cause", "corridor", "zone", "priority"]
    num_features = ["hour", "day_of_week", "month", "is_weekend", "is_peak_hour"]
    return ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                cat_features,
            ),
            ("num", "passthrough", num_features),
        ]
    )


def _train_core(X: pd.DataFrame, y_score: pd.Series, y_duration: pd.Series, y_closure: pd.Series):
    X_train, X_test, ys_train, ys_test = train_test_split(
        X, y_score, test_size=0.2, random_state=42
    )
    _, _, yd_train, yd_test = train_test_split(
        X, y_duration, test_size=0.2, random_state=42
    )
    _, _, yc_train, yc_test = train_test_split(
        X, y_closure, test_size=0.2, random_state=42
    )

    yd_train_log = np.log1p(yd_train)
    yd_test_orig = yd_test.copy()

    score_model = Pipeline(
        [
            ("prep", build_preprocessor()),
            ("reg", GradientBoostingRegressor(n_estimators=150, max_depth=5, random_state=42)),
        ]
    )
    score_model.fit(X_train, ys_train)
    score_pred = score_model.predict(X_test)

    duration_model = Pipeline(
        [
            ("prep", build_preprocessor()),
            ("reg", GradientBoostingRegressor(n_estimators=150, max_depth=5, random_state=42)),
        ]
    )
    duration_model.fit(X_train, yd_train_log)
    duration_pred = np.expm1(duration_model.predict(X_test))

    closure_model = Pipeline(
        [
            ("prep", build_preprocessor()),
            ("clf", RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)),
        ]
    )
    closure_model.fit(X_train, yc_train)
    closure_acc = closure_model.score(X_test, yc_test)

    metrics = {
        "score_mae": round(mean_absolute_error(ys_test, score_pred), 3),
        "score_r2": round(r2_score(ys_test, score_pred), 3),
        "duration_mae_hours": round(mean_absolute_error(yd_test_orig, duration_pred), 2),
        "duration_r2": round(r2_score(yd_test_orig, duration_pred), 3),
        "closure_accuracy": round(closure_acc, 3),
        "duration_log_transform": True,
    }
    return score_model, duration_model, closure_model, metrics


def train_models(output_dir: Path | None = None) -> dict:
    out = output_dir or MODELS_DIR
    out.mkdir(exist_ok=True, parents=True)

    df = load_raw_data(DATA_PATH)
    X, y_score, y_duration = prepare_training_data(df)
    featured = engineer_features(df)
    valid = featured[
        featured["start_dt"].notna()
        & featured["duration_hours"].notna()
        & featured["congestion_score"].notna()
    ].copy()
    y_closure = valid["requires_closure_int"]

    score_model, duration_model, closure_model, metrics = _train_core(
        X, y_score, y_duration, y_closure
    )

    joblib.dump(score_model, out / "congestion_model.joblib")
    joblib.dump(duration_model, out / "duration_model.joblib")
    joblib.dump(closure_model, out / "closure_model.joblib")

    stats = build_recommendation_stats(featured)
    with open(out / "recommendation_stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    metadata = {
        "samples": len(X),
        **metrics,
        "corridors": sorted(X["corridor"].unique().tolist()),
        "causes": sorted(X["event_cause"].unique().tolist()),
        "zones": sorted(X["zone"].unique().tolist()),
    }
    with open(out / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata


def retrain_from_feedback(feedback: list, output_dir: Path | None = None) -> dict:
    """Retrain ML models using historical data augmented with logged feedback outcomes."""
    if len(feedback) < 3:
        raise ValueError("Log at least 3 post-event outcomes before retraining")

    out = output_dir or WRITABLE_DIR
    out.mkdir(exist_ok=True, parents=True)

    if not DATA_PATH.exists():
        raise ValueError("Training dataset required for model retrain")

    df = load_raw_data(DATA_PATH)
    featured = engineer_features(df)
    valid = featured[
        featured["start_dt"].notna()
        & featured["duration_hours"].notna()
        & featured["congestion_score"].notna()
    ].copy()

    sample_size = min(3500, len(valid))
    base = valid.sample(sample_size, random_state=42) if len(valid) > sample_size else valid

    feedback_rows = []
    for entry in feedback:
        feedback_rows.append(
            {
                "event_type": entry.get("event_type", "unplanned"),
                "event_cause": entry.get("event_cause", "others"),
                "corridor": entry.get("corridor", "Non-corridor"),
                "zone": entry.get("zone", "Unknown"),
                "priority": entry.get("priority", "High"),
                "hour": int(entry.get("hour", 12)),
                "day_of_week": int(entry.get("day_of_week", 2)),
                "month": int(entry.get("month", 6)),
                "is_weekend": 1 if int(entry.get("day_of_week", 2)) >= 5 else 0,
                "is_peak_hour": 1 if int(entry.get("hour", 12)) in (8, 9, 17, 18, 19) else 0,
                "congestion_score": float(entry["actual_score"]),
                "duration_hours": float(entry["actual_duration_hours"]),
                "requires_closure_int": 1 if float(entry.get("actual_score", 0)) >= 7 else 0,
            }
        )

    fb_df = pd.DataFrame(feedback_rows)
    fb_featured = fb_df.copy()
    fb_featured["id"] = [f"fb-{i}" for i in range(len(fb_df))]
    fb_featured["start_dt"] = pd.Timestamp.utcnow()
    fb_featured["junction"] = None
    fb_featured["latitude"] = 12.9716
    fb_featured["longitude"] = 77.5946
    fb_featured["address"] = ""
    fb_featured["description"] = ""
    fb_featured["status"] = "closed"
    fb_featured["requires_road_closure"] = fb_featured["requires_closure_int"].astype(bool)

    combined_featured = pd.concat([base, fb_featured], ignore_index=True)
    X = combined_featured[get_feature_columns()]
    y_score = combined_featured["congestion_score"]
    y_duration = combined_featured["duration_hours"]
    y_closure = combined_featured["requires_closure_int"]

    score_model, duration_model, closure_model, metrics = _train_core(
        X, y_score, y_duration, y_closure
    )

    joblib.dump(score_model, out / "congestion_model.joblib")
    joblib.dump(duration_model, out / "duration_model.joblib")
    joblib.dump(closure_model, out / "closure_model.joblib")

    stats = build_recommendation_stats(combined_featured)
    with open(out / "recommendation_stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    metadata = {
        "samples": len(X),
        "feedback_samples": len(feedback),
        **metrics,
        "retrained_from_feedback": True,
        "corridors": sorted(X["corridor"].unique().tolist()),
        "causes": sorted(X["event_cause"].unique().tolist()),
        "zones": sorted(X["zone"].unique().tolist()),
    }
    with open(out / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata


def build_recommendation_stats(df: pd.DataFrame) -> dict:
    stats: dict = {"by_cause_corridor": {}, "by_cause": {}, "junction_hotspots": {}}

    for cause in df["event_cause"].unique():
        subset = df[df["event_cause"] == cause]
        stats["by_cause"][cause] = {
            "avg_duration_hours": _safe_num(subset["duration_hours"].median()),
            "closure_rate": _safe_num(subset["requires_closure_int"].mean(), 0),
            "avg_score": _safe_num(subset["congestion_score"].mean(), 0),
            "count": int(len(subset)),
        }

    grouped = (
        df.groupby(["event_cause", "corridor"])
        .agg(
            avg_duration=("duration_hours", "median"),
            closure_rate=("requires_closure_int", "mean"),
            avg_score=("congestion_score", "mean"),
            count=("id", "count"),
        )
        .reset_index()
    )

    for _, row in grouped.iterrows():
        key = f"{row['event_cause']}|{row['corridor']}"
        stats["by_cause_corridor"][key] = {
            "avg_duration_hours": _safe_num(row["avg_duration"]),
            "closure_rate": _safe_num(row["closure_rate"], 0),
            "avg_score": _safe_num(row["avg_score"], 0),
            "count": int(row["count"]),
        }

    if "junction" in df.columns:
        junctions = (
            df[df["junction"].notna()]
            .groupby("junction")
            .agg(
                event_count=("id", "count"),
                avg_score=("congestion_score", "mean"),
                closure_rate=("requires_closure_int", "mean"),
                lat=("latitude", "mean"),
                lng=("longitude", "mean"),
            )
            .reset_index()
            .sort_values("event_count", ascending=False)
            .head(30)
        )
        for _, row in junctions.iterrows():
            stats["junction_hotspots"][row["junction"]] = {
                "event_count": int(row["event_count"]),
                "avg_score": _safe_num(row["avg_score"], 0),
                "closure_rate": _safe_num(row["closure_rate"], 0),
                "lat": _safe_num(row["lat"], 12.9716),
                "lng": _safe_num(row["lng"], 77.5946),
            }

    return stats


if __name__ == "__main__":
    result = train_models()
    print("Training complete:", json.dumps(result, indent=2))
