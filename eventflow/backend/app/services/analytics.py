import json
import math
from pathlib import Path

import pandas as pd

from ..config import DATA_PATH, MODELS_DIR, WRITABLE_DIR
from ..data_processor import engineer_features, load_raw_data


def _safe_float(val, default=0.0) -> float:
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (TypeError, ValueError):
        return default


def _safe_round(val, digits: int = 2, default: float = 0.0) -> float:
    return round(_safe_float(val, default), digits)


class AnalyticsService:
    def __init__(self):
        self.dataset_missing = not DATA_PATH.exists()
        if self.dataset_missing:
            self.df = pd.DataFrame()
        else:
            self.df = engineer_features(load_raw_data(DATA_PATH))
        self.feedback_path = WRITABLE_DIR / "feedback_log.json"
        self._feedback = self._load_feedback()

    def _require_dataset(self):
        if self.dataset_missing:
            raise ValueError(
                "Astram dataset not found. Place events.csv in backend/data/ or set DATA_CSV_PATH."
            )

    def _load_feedback(self) -> list:
        if self.feedback_path.exists():
            with open(self.feedback_path, encoding="utf-8") as f:
                return json.load(f)
        return []

    def get_summary(self) -> dict:
        self._require_dataset()
        df = self.df
        planned = df[df["event_type"] == "planned"]
        unplanned = df[df["event_type"] == "unplanned"]

        return {
            "total_events": len(df),
            "planned_events": len(planned),
            "unplanned_events": len(unplanned),
            "road_closures": int(df["requires_closure_int"].sum()),
            "avg_congestion_score": _safe_round(df["congestion_score"].mean()),
            "avg_duration_hours": _safe_round(df["duration_hours"].median()),
            "high_priority_pct": _safe_round((df["priority"] == "High").mean() * 100, 1),
            "date_range": {
                "start": str(df["start_dt"].min()),
                "end": str(df["start_dt"].max()),
            },
        }

    def get_cause_breakdown(self) -> list[dict]:
        self._require_dataset()
        grouped = (
            self.df.groupby("event_cause")
            .agg(
                count=("id", "count"),
                avg_score=("congestion_score", "mean"),
                avg_duration=("duration_hours", "median"),
                closure_rate=("requires_closure_int", "mean"),
            )
            .reset_index()
            .sort_values("count", ascending=False)
        )
        return [
            {
                "cause": row["event_cause"],
                "count": int(row["count"]),
                "avg_score": _safe_round(row["avg_score"]),
                "avg_duration_hours": _safe_round(row["avg_duration"]),
                "closure_rate": _safe_round(row["closure_rate"], 3),
            }
            for _, row in grouped.iterrows()
        ]

    def get_corridor_stats(self) -> list[dict]:
        self._require_dataset()
        grouped = (
            self.df.groupby("corridor")
            .agg(
                count=("id", "count"),
                avg_score=("congestion_score", "mean"),
                closure_rate=("requires_closure_int", "mean"),
            )
            .reset_index()
            .sort_values("count", ascending=False)
            .head(15)
        )
        return [
            {
                "corridor": row["corridor"],
                "count": int(row["count"]),
                "avg_score": _safe_round(row["avg_score"]),
                "closure_rate": _safe_round(row["closure_rate"], 3),
            }
            for _, row in grouped.iterrows()
        ]

    def get_zone_stats(self) -> list[dict]:
        self._require_dataset()
        grouped = (
            self.df[self.df["zone"] != "Unknown"]
            .groupby("zone")
            .agg(count=("id", "count"), avg_score=("congestion_score", "mean"))
            .reset_index()
            .sort_values("count", ascending=False)
        )
        return [
            {
                "zone": row["zone"],
                "count": int(row["count"]),
                "avg_score": _safe_round(row["avg_score"]),
            }
            for _, row in grouped.iterrows()
        ]

    def get_hourly_pattern(self) -> list[dict]:
        self._require_dataset()
        grouped = (
            self.df.groupby("hour")
            .agg(count=("id", "count"), avg_score=("congestion_score", "mean"))
            .reset_index()
            .sort_values("hour")
        )
        return [
            {"hour": int(row["hour"]), "count": int(row["count"]), "avg_score": _safe_round(row["avg_score"])}
            for _, row in grouped.iterrows()
        ]

    def get_map_events(self, limit: int = 500, event_type: str | None = None) -> list[dict]:
        self._require_dataset()
        df = self.df.copy()
        if event_type:
            df = df[df["event_type"] == event_type]
        df = df.dropna(subset=["latitude", "longitude"]).head(limit)
        return [
            {
                "id": row["id"],
                "event_type": row["event_type"],
                "event_cause": row["event_cause"],
                "lat": _safe_float(row["latitude"]),
                "lng": _safe_float(row["longitude"]),
                "corridor": row["corridor"],
                "zone": row["zone"],
                "priority": row["priority"],
                "status": row["status"],
                "congestion_score": _safe_float(row["congestion_score"], 4.0),
                "requires_road_closure": bool(row["requires_closure_int"]),
                "address": row["address"] if pd.notna(row["address"]) else "",
                "junction": row["junction"] if pd.notna(row["junction"]) else None,
                "start_datetime": str(row["start_dt"]),
                "duration_hours": round(_safe_float(row["duration_hours"], 1.0), 2),
            }
            for _, row in df.iterrows()
        ]

    def get_planned_events(self) -> list[dict]:
        self._require_dataset()
        planned = self.df[self.df["event_type"] == "planned"].sort_values("start_dt", ascending=False)
        return [
            {
                "id": row["id"],
                "event_cause": row["event_cause"],
                "description": row["description"] if pd.notna(row["description"]) else "",
                "corridor": row["corridor"],
                "lat": _safe_float(row["latitude"]),
                "lng": _safe_float(row["longitude"]),
                "start_datetime": str(row["start_dt"]),
                "duration_hours": round(_safe_float(row["duration_hours"], 1.0), 2),
                "congestion_score": _safe_float(row["congestion_score"], 4.0),
            }
            for _, row in planned.head(50).iterrows()
        ]

    def get_metadata_options(self) -> dict:
        meta_path = MODELS_DIR / "metadata.json"
        if meta_path.exists():
            with open(meta_path, encoding="utf-8") as f:
                return json.load(f)
        return {
            "corridors": sorted(self.df["corridor"].unique().tolist()),
            "causes": sorted(self.df["event_cause"].unique().tolist()),
            "zones": sorted(self.df["zone"].unique().tolist()),
        }

    def add_feedback(self, payload: dict) -> dict:
        self._feedback.append(payload)
        with open(self.feedback_path, "w", encoding="utf-8") as f:
            json.dump(self._feedback, f, indent=2)
        score_error = abs(payload["predicted_score"] - payload["actual_score"])
        duration_error = abs(payload["predicted_duration_hours"] - payload["actual_duration_hours"])
        return {
            "logged": True,
            "total_feedback_entries": len(self._feedback),
            "score_error": round(score_error, 2),
            "duration_error_hours": round(duration_error, 2),
        }

    def get_learning_insights(self) -> dict:
        from .calibration_service import _avg_errors, load_calibration, load_learning_state

        if not self._feedback:
            return {
                "entries": 0,
                "avg_score_error": None,
                "avg_duration_error_hours": None,
                "calibrated": False,
                "message": "No feedback logged yet",
            }

        calibration = load_calibration()
        state = load_learning_state()
        score_err, dur_err = _avg_errors(self._feedback, calibration)

        before_score, before_dur = _avg_errors(self._feedback, None)
        after_score, after_dur = _avg_errors(self._feedback, calibration) if calibration else (None, None)

        return {
            "entries": len(self._feedback),
            "avg_score_error": score_err,
            "avg_duration_error_hours": dur_err,
            "calibrated": calibration is not None,
            "calibration": calibration,
            "avg_score_error_before": before_score,
            "avg_score_error_after": after_score if calibration else None,
            "avg_duration_error_before": before_dur,
            "avg_duration_error_after": after_dur if calibration else None,
            "retrain_count": state.get("retrain_count", 0),
            "recent": self._feedback[-5:],
        }

    def retrain_from_feedback(self) -> dict:
        from .calibration_service import apply_calibration_from_feedback

        if not self._feedback:
            raise ValueError("Log at least one post-event outcome before retraining")

        result = apply_calibration_from_feedback(self._feedback)
        return {
            "status": "calibrated",
            "message": "Models calibrated from post-event feedback",
            **result,
        }

    def get_impact_metrics(self) -> dict:
        import json

        meta_path = MODELS_DIR / "metadata.json"
        meta = {}
        if meta_path.exists():
            with open(meta_path, encoding="utf-8") as f:
                meta = json.load(f)

        if self.dataset_missing:
            corridors = len(meta.get("corridors", []))
            zones = len([z for z in meta.get("zones", []) if z != "Unknown"])
            total = meta.get("samples", 8173)
        else:
            corridors = self.df["corridor"].nunique()
            zones = self.df[self.df["zone"] != "Unknown"]["zone"].nunique()
            total = len(self.df)
        manual_min = 15
        auto_sec = 30
        saved_min = manual_min - auto_sec / 60
        annual_events = 8000

        return {
            "manual_planning_minutes": manual_min,
            "automated_planning_seconds": auto_sec,
            "time_saved_per_event_minutes": round(saved_min, 1),
            "estimated_annual_hours_saved": round(annual_events * saved_min / 60),
            "events_in_dataset": total,
            "corridors_covered": int(corridors),
            "zones_covered": int(zones),
            "model_score_r2": meta.get("score_r2"),
            "model_score_mae": meta.get("score_mae"),
            "closure_accuracy_pct": round(float(meta.get("closure_accuracy", 0)) * 100, 1),
        }

    def get_corridor_risk(self) -> list[dict]:
        self._require_dataset()
        grouped = (
            self.df.dropna(subset=["latitude", "longitude"])
            .groupby("corridor")
            .agg(
                lat=("latitude", "mean"),
                lng=("longitude", "mean"),
                count=("id", "count"),
                avg_score=("congestion_score", "mean"),
                closure_rate=("requires_closure_int", "mean"),
            )
            .reset_index()
        )
        results = []
        for _, row in grouped.iterrows():
            if row["corridor"] == "Non-corridor":
                continue
            risk = _safe_round(row["closure_rate"] * 0.55 + (row["avg_score"] / 10) * 0.45, 3)
            level = "critical" if risk >= 0.65 else "high" if risk >= 0.45 else "moderate" if risk >= 0.3 else "low"
            results.append({
                "corridor": row["corridor"],
                "lat": _safe_round(row["lat"], 6),
                "lng": _safe_round(row["lng"], 6),
                "event_count": int(row["count"]),
                "avg_score": _safe_round(row["avg_score"]),
                "closure_rate": _safe_round(row["closure_rate"], 3),
                "risk_score": risk,
                "risk_level": level,
            })
        results.sort(key=lambda x: x["risk_score"], reverse=True)
        return results[:20]
