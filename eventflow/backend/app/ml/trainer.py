import json
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

from ..config import DATA_PATH, MODELS_DIR
from ..data_processor import (
    engineer_features,
    get_feature_columns,
    load_raw_data,
    prepare_training_data,
)


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


def train_models() -> dict:
    df = load_raw_data(DATA_PATH)
    X, y_score, y_duration = prepare_training_data(df)
    featured = engineer_features(df)
    valid = featured[
        featured["start_dt"].notna()
        & featured["duration_hours"].notna()
        & featured["congestion_score"].notna()
    ].copy()
    y_closure = valid["requires_closure_int"]

    X_train, X_test, ys_train, ys_test = train_test_split(
        X, y_score, test_size=0.2, random_state=42
    )
    _, _, yd_train, yd_test = train_test_split(
        X, y_duration, test_size=0.2, random_state=42
    )
    _, _, yc_train, yc_test = train_test_split(
        X, y_closure, test_size=0.2, random_state=42
    )

    preprocessor = build_preprocessor()

    score_model = Pipeline(
        [
            ("prep", preprocessor),
            (
                "reg",
                GradientBoostingRegressor(
                    n_estimators=150, max_depth=5, random_state=42
                ),
            ),
        ]
    )
    score_model.fit(X_train, ys_train)
    score_pred = score_model.predict(X_test)

    duration_model = Pipeline(
        [
            ("prep", build_preprocessor()),
            (
                "reg",
                GradientBoostingRegressor(
                    n_estimators=150, max_depth=5, random_state=42
                ),
            ),
        ]
    )
    duration_model.fit(X_train, yd_train)
    duration_pred = duration_model.predict(X_test)

    closure_model = Pipeline(
        [
            ("prep", build_preprocessor()),
            (
                "clf",
                RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42),
            ),
        ]
    )
    closure_model.fit(X_train, yc_train)
    closure_acc = closure_model.score(X_test, yc_test)

    joblib.dump(score_model, MODELS_DIR / "congestion_model.joblib")
    joblib.dump(duration_model, MODELS_DIR / "duration_model.joblib")
    joblib.dump(closure_model, MODELS_DIR / "closure_model.joblib")

    stats = build_recommendation_stats(featured)
    with open(MODELS_DIR / "recommendation_stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    metadata = {
        "samples": len(X),
        "score_mae": round(mean_absolute_error(ys_test, score_pred), 3),
        "score_r2": round(r2_score(ys_test, score_pred), 3),
        "duration_mae_hours": round(mean_absolute_error(yd_test, duration_pred), 2),
        "duration_r2": round(r2_score(yd_test, duration_pred), 3),
        "closure_accuracy": round(closure_acc, 3),
        "corridors": sorted(X["corridor"].unique().tolist()),
        "causes": sorted(X["event_cause"].unique().tolist()),
        "zones": sorted(X["zone"].unique().tolist()),
    }
    with open(MODELS_DIR / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata


def build_recommendation_stats(df: pd.DataFrame) -> dict:
    stats: dict = {"by_cause_corridor": {}, "by_cause": {}, "junction_hotspots": {}}

    for cause in df["event_cause"].unique():
        subset = df[df["event_cause"] == cause]
        stats["by_cause"][cause] = {
            "avg_duration_hours": round(float(subset["duration_hours"].median()), 2),
            "closure_rate": round(float(subset["requires_closure_int"].mean()), 3),
            "avg_score": round(float(subset["congestion_score"].mean()), 2),
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
            "avg_duration_hours": round(float(row["avg_duration"]), 2),
            "closure_rate": round(float(row["closure_rate"]), 3),
            "avg_score": round(float(row["avg_score"]), 2),
            "count": int(row["count"]),
        }

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
            "avg_score": round(float(row["avg_score"]), 2),
            "closure_rate": round(float(row["closure_rate"]), 3),
            "lat": round(float(row["lat"]), 6),
            "lng": round(float(row["lng"]), 6),
        }

    return stats


if __name__ == "__main__":
    result = train_models()
    print("Training complete:", json.dumps(result, indent=2))
