import pandas as pd
import numpy as np
from pathlib import Path

from .config import DATA_PATH

CAUSE_SEVERITY = {
    "accident": 9,
    "protest": 8,
    "vip_movement": 8,
    "construction": 7,
    "public_event": 7,
    "procession": 6,
    "tree_fall": 6,
    "water_logging": 6,
    "congestion": 5,
    "vehicle_breakdown": 4,
    "pot_holes": 3,
    "road_conditions": 4,
    "others": 3,
    "Debris": 4,
    "test_demo": 1,
}


def load_raw_data(path: Path = DATA_PATH) -> pd.DataFrame:
    return pd.read_csv(path)


def compute_duration_hours(df: pd.DataFrame) -> pd.Series:
    start = pd.to_datetime(df["start_datetime"], utc=True, errors="coerce")
    resolved = pd.to_datetime(df["resolved_datetime"], utc=True, errors="coerce")
    end = pd.to_datetime(df["end_datetime"], utc=True, errors="coerce")
    closed = pd.to_datetime(df["closed_datetime"], utc=True, errors="coerce")
    finish = resolved.fillna(end).fillna(closed)
    duration = (finish - start).dt.total_seconds() / 3600
    return duration.clip(lower=0.1, upper=720)


def derive_congestion_score(df: pd.DataFrame) -> pd.Series:
    base = df["event_cause"].map(CAUSE_SEVERITY).fillna(4)
    priority_boost = (df["priority"] == "High").astype(int) * 1.5
    closure_boost = df["requires_road_closure"].map({True: 2, False: 0}).fillna(0)
    planned_boost = (df["event_type"] == "planned").astype(int) * 0.5
    score = base + priority_boost + closure_boost + planned_boost
    return score.clip(1, 10).round(1)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["start_dt"] = pd.to_datetime(out["start_datetime"], utc=True, errors="coerce")
    out["hour"] = out["start_dt"].dt.hour
    out["day_of_week"] = out["start_dt"].dt.dayofweek
    out["month"] = out["start_dt"].dt.month
    out["is_weekend"] = (out["day_of_week"] >= 5).astype(int)
    out["is_peak_hour"] = out["hour"].isin([8, 9, 17, 18, 19]).astype(int)
    out["duration_hours"] = compute_duration_hours(out)
    out["congestion_score"] = derive_congestion_score(out)
    out["requires_closure_int"] = out["requires_road_closure"].map({True: 1, False: 0}).fillna(0)
    out["corridor"] = out["corridor"].fillna("Non-corridor")
    out["zone"] = out["zone"].fillna("Unknown")
    out["event_cause"] = out["event_cause"].fillna("others")
    out["event_type"] = out["event_type"].fillna("unplanned")
    out["priority"] = out["priority"].fillna("Low")
    return out


def get_feature_columns() -> list[str]:
    return [
        "event_type",
        "event_cause",
        "corridor",
        "zone",
        "priority",
        "hour",
        "day_of_week",
        "month",
        "is_weekend",
        "is_peak_hour",
    ]


def prepare_training_data(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    featured = engineer_features(df)
    valid = featured[
        featured["start_dt"].notna()
        & featured["duration_hours"].notna()
        & featured["congestion_score"].notna()
    ].copy()
    X = valid[get_feature_columns()]
    y_score = valid["congestion_score"]
    y_duration = valid["duration_hours"]
    return X, y_score, y_duration
