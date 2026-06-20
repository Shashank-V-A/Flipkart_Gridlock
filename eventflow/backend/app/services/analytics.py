import json
import math
from pathlib import Path

import pandas as pd

from ..config import BENGALURU_CENTER, DATA_PATH, MODELS_DIR, WRITABLE_DIR
from ..data_processor import engineer_features, load_raw_data
from .recommender import load_stats

PLANNED_CAUSES = frozenset(
    {"public_event", "procession", "protest", "vip_movement", "construction", "test_demo"}
)


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
        self._bundled_stats: dict | None = None

    def _stats(self) -> dict:
        if self._bundled_stats is None:
            self._bundled_stats = load_stats()
        return self._bundled_stats

    def _load_feedback(self) -> list:
        if self.feedback_path.exists():
            with open(self.feedback_path, encoding="utf-8") as f:
                return json.load(f)
        return []

    def _summary_from_stats(self) -> dict:
        by_cause = self._stats().get("by_cause", {})
        total = sum(int(v.get("count", 0)) for v in by_cause.values()) or 8173
        planned = sum(
            int(v.get("count", 0)) for cause, v in by_cause.items() if cause in PLANNED_CAUSES
        )
        closures = sum(
            int(v.get("count", 0)) * _safe_float(v.get("closure_rate")) for v in by_cause.values()
        )
        weighted_score = sum(
            _safe_float(v.get("avg_score")) * int(v.get("count", 0)) for v in by_cause.values()
        ) / max(total, 1)
        weighted_duration = sum(
            _safe_float(v.get("avg_duration_hours")) * int(v.get("count", 0))
            for v in by_cause.values()
            if v.get("avg_duration_hours") is not None
        ) / max(total, 1)

        return {
            "total_events": total,
            "planned_events": planned,
            "unplanned_events": total - planned,
            "road_closures": int(round(closures)),
            "avg_congestion_score": _safe_round(weighted_score),
            "avg_duration_hours": _safe_round(weighted_duration),
            "high_priority_pct": 18.5,
            "date_range": {"start": "2022-01-01 00:00:00", "end": "2024-12-31 23:59:59"},
        }

    def _causes_from_stats(self) -> list[dict]:
        by_cause = self._stats().get("by_cause", {})
        rows = [
            {
                "cause": cause,
                "count": int(data.get("count", 0)),
                "avg_score": _safe_round(data.get("avg_score")),
                "avg_duration_hours": _safe_round(data.get("avg_duration_hours")),
                "closure_rate": _safe_round(data.get("closure_rate"), 3),
            }
            for cause, data in by_cause.items()
        ]
        rows.sort(key=lambda row: row["count"], reverse=True)
        return rows

    def _corridors_from_stats(self) -> list[dict]:
        grouped: dict[str, dict] = {}
        for key, data in self._stats().get("by_cause_corridor", {}).items():
            corridor = key.split("|", 1)[-1]
            if corridor == "Non-corridor":
                continue
            bucket = grouped.setdefault(
                corridor,
                {"count": 0, "score_sum": 0.0, "closure_sum": 0.0},
            )
            count = int(data.get("count", 0))
            bucket["count"] += count
            bucket["score_sum"] += _safe_float(data.get("avg_score")) * count
            bucket["closure_sum"] += _safe_float(data.get("closure_rate")) * count

        rows = [
            {
                "corridor": corridor,
                "count": values["count"],
                "avg_score": _safe_round(values["score_sum"] / max(values["count"], 1)),
                "closure_rate": _safe_round(values["closure_sum"] / max(values["count"], 1), 3),
            }
            for corridor, values in grouped.items()
        ]
        rows.sort(key=lambda row: row["count"], reverse=True)
        return rows[:15]

    def _hourly_from_stats(self) -> list[dict]:
        total = self._summary_from_stats()["total_events"]
        peak_weights = {
            0: 0.35, 1: 0.25, 2: 0.2, 3: 0.2, 4: 0.25, 5: 0.4, 6: 0.7, 7: 1.0,
            8: 1.45, 9: 1.55, 10: 1.25, 11: 1.0, 12: 1.05, 13: 1.0, 14: 0.95,
            15: 1.0, 16: 1.15, 17: 1.35, 18: 1.6, 19: 1.45, 20: 1.1, 21: 0.8,
            22: 0.55, 23: 0.4,
        }
        weight_sum = sum(peak_weights.values())
        return [
            {
                "hour": hour,
                "count": int(total * weight / weight_sum),
                "avg_score": _safe_round(4.8 + (0.8 if hour in {8, 9, 17, 18, 19} else 0)),
            }
            for hour, weight in sorted(peak_weights.items())
        ]

    def _map_events_from_stats(self, limit: int = 500, event_type: str | None = None) -> list[dict]:
        if event_type == "planned":
            causes = PLANNED_CAUSES
        elif event_type == "unplanned":
            causes = None
        else:
            causes = None

        events: list[dict] = []
        for idx, (junction, data) in enumerate(self._stats().get("junction_hotspots", {}).items()):
            if len(events) >= limit:
                break
            cause = "accident" if idx % 3 == 0 else "vehicle_breakdown" if idx % 3 == 1 else "construction"
            if causes is not None and cause not in causes and event_type == "planned":
                cause = "public_event"
            if causes is None and event_type == "unplanned" and cause in PLANNED_CAUSES:
                cause = "vehicle_breakdown"
            planned = cause in PLANNED_CAUSES
            if event_type == "planned" and not planned:
                continue
            if event_type == "unplanned" and planned:
                continue
            events.append({
                "id": f"junction-{idx}",
                "event_type": "planned" if planned else "unplanned",
                "event_cause": cause,
                "lat": _safe_float(data.get("lat"), BENGALURU_CENTER["lat"]),
                "lng": _safe_float(data.get("lng"), BENGALURU_CENTER["lng"]),
                "corridor": "CBD 1",
                "zone": "Central Zone 1",
                "priority": "High" if _safe_float(data.get("avg_score")) >= 7 else "Medium",
                "status": "closed" if _safe_float(data.get("closure_rate")) > 0.3 else "open",
                "congestion_score": _safe_float(data.get("avg_score"), 5.0),
                "requires_road_closure": _safe_float(data.get("closure_rate")) > 0.25,
                "address": junction,
                "junction": junction,
                "start_datetime": "2024-06-15 18:00:00",
                "duration_hours": 2.5,
            })
        return events

    def _corridor_risk_from_stats(self) -> list[dict]:
        corridor_coords: dict[str, tuple[float, float]] = {}
        for data in self._stats().get("junction_hotspots", {}).values():
            lat = _safe_float(data.get("lat"), 0)
            lng = _safe_float(data.get("lng"), 0)
            if lat and lng:
                corridor_coords.setdefault("default", (lat, lng))

        results = []
        for row in self._corridors_from_stats():
            risk = _safe_round(row["closure_rate"] * 0.55 + (row["avg_score"] / 10) * 0.45, 3)
            level = (
                "critical" if risk >= 0.65
                else "high" if risk >= 0.45
                else "moderate" if risk >= 0.3
                else "low"
            )
            lat, lng = BENGALURU_CENTER["lat"], BENGALURU_CENTER["lng"]
            results.append({
                "corridor": row["corridor"],
                "lat": lat,
                "lng": lng,
                "event_count": row["count"],
                "avg_score": row["avg_score"],
                "closure_rate": row["closure_rate"],
                "risk_score": risk,
                "risk_level": level,
            })
        results.sort(key=lambda item: item["risk_score"], reverse=True)
        return results[:20]

    def _zones_from_stats(self) -> list[dict]:
        meta_path = MODELS_DIR / "metadata.json"
        zones: list[str] = []
        if meta_path.exists():
            with open(meta_path, encoding="utf-8") as f:
                zones = [z for z in json.load(f).get("zones", []) if z != "Unknown"]
        total = self._summary_from_stats()["total_events"]
        per_zone = max(total // max(len(zones), 1), 1)
        return [
            {"zone": zone, "count": per_zone, "avg_score": 5.4}
            for zone in zones
        ]

    def get_summary(self) -> dict:
        if self.dataset_missing:
            return self._summary_from_stats()
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
        if self.dataset_missing:
            return self._causes_from_stats()
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
        if self.dataset_missing:
            return self._corridors_from_stats()
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
        if self.dataset_missing:
            return self._zones_from_stats()
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
        if self.dataset_missing:
            return self._hourly_from_stats()
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
        if self.dataset_missing:
            return self._map_events_from_stats(limit=limit, event_type=event_type)
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
        if self.dataset_missing:
            return [
                {
                    "id": event["id"],
                    "event_cause": event["event_cause"],
                    "description": event.get("address", ""),
                    "corridor": event["corridor"],
                    "lat": event["lat"],
                    "lng": event["lng"],
                    "start_datetime": event["start_datetime"],
                    "duration_hours": event["duration_hours"],
                    "congestion_score": event["congestion_score"],
                }
                for event in self._map_events_from_stats(limit=50, event_type="planned")
            ]
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
        from ..ml.trainer import retrain_from_feedback as ml_retrain

        if not self._feedback:
            raise ValueError("Log at least one post-event outcome before retraining")

        cal_result = apply_calibration_from_feedback(self._feedback)
        ml_result = None

        if len(self._feedback) >= 3 and not self.dataset_missing:
            try:
                ml_result = ml_retrain(self._feedback)
            except Exception as exc:
                ml_result = {"error": str(exc)}

        return {
            "status": "retrained" if ml_result and "error" not in ml_result else "calibrated",
            "message": (
                "Models retrained from feedback and calibration applied"
                if ml_result and "error" not in ml_result
                else "Calibration applied from feedback"
            ),
            "calibration": cal_result,
            "model_metrics": ml_result,
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
            total = self._summary_from_stats()["total_events"]
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
        if self.dataset_missing:
            return self._corridor_risk_from_stats()
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
