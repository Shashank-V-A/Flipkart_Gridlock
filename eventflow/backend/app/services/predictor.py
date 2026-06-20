import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from ..config import MODELS_DIR, WRITABLE_DIR
from ..data_processor import get_feature_columns
from .calibration_service import load_calibration, peak_hour_alert
from .recommender import generate_recommendations


class PredictorService:
    def __init__(self):
        self.score_model = None
        self.duration_model = None
        self.closure_model = None
        self.metadata = {}
        self.stats = {}
        self.models_dir = MODELS_DIR
        self._load()

    def _model_paths(self) -> Path:
        writable_score = WRITABLE_DIR / "congestion_model.joblib"
        if writable_score.exists():
            return WRITABLE_DIR
        return self.models_dir

    def _load(self):
        base = self._model_paths()
        score_path = base / "congestion_model.joblib"
        if score_path.exists():
            self.score_model = joblib.load(score_path)
            self.duration_model = joblib.load(base / "duration_model.joblib")
            self.closure_model = joblib.load(base / "closure_model.joblib")
        meta_path = base / "metadata.json"
        if not meta_path.exists():
            meta_path = MODELS_DIR / "metadata.json"
        if meta_path.exists():
            with open(meta_path, encoding="utf-8") as f:
                self.metadata = json.load(f)

        stats_path = base / "recommendation_stats.json"
        if not stats_path.exists():
            stats_path = MODELS_DIR / "recommendation_stats.json"
        if stats_path.exists():
            with open(stats_path, encoding="utf-8") as f:
                self.stats = json.load(f)

    def reload(self):
        self._load()

    def is_ready(self) -> bool:
        return self.score_model is not None

    def _build_input(self, payload: dict) -> pd.DataFrame:
        hour = payload.get("hour", 12)
        return pd.DataFrame(
            [
                {
                    "event_type": payload["event_type"],
                    "event_cause": payload["event_cause"],
                    "corridor": payload.get("corridor", "Non-corridor"),
                    "zone": payload.get("zone", "Unknown"),
                    "priority": payload.get("priority", "High"),
                    "hour": hour,
                    "day_of_week": payload.get("day_of_week", 2),
                    "month": payload.get("month", 3),
                    "is_weekend": 1 if payload.get("day_of_week", 2) >= 5 else 0,
                    "is_peak_hour": 1 if hour in (8, 9, 17, 18, 19) else 0,
                }
            ]
        )[get_feature_columns()]

    def _predict_duration(self, X: pd.DataFrame) -> float:
        raw = float(self.duration_model.predict(X)[0])
        if self.metadata.get("duration_log_transform"):
            return float(np.expm1(raw))
        return raw

    def _explain(self, payload: dict) -> list[dict]:
        hour = int(payload.get("hour", 12))
        cause = payload["event_cause"]
        corridor = payload.get("corridor", "Non-corridor")
        factors: list[dict] = []

        if hour in (8, 9, 17, 18, 19):
            factors.append({
                "feature": "Peak hour",
                "value": f"{hour}:00",
                "contribution": "Amplifies congestion during rush windows",
            })

        cause_stats = self.stats.get("by_cause", {}).get(cause, {})
        if cause_stats.get("avg_score", 0) >= 6:
            factors.append({
                "feature": "Event cause",
                "value": cause.replace("_", " "),
                "contribution": f"Historical avg severity {cause_stats.get('avg_score', '—')}/10",
            })

        corridor_key = f"{cause}|{corridor}"
        corridor_stats = self.stats.get("by_cause_corridor", {}).get(corridor_key, {})
        if corridor_stats.get("count", 0) >= 5:
            factors.append({
                "feature": "Corridor history",
                "value": corridor,
                "contribution": f"{corridor_stats.get('count', 0)} similar events logged",
            })
        elif corridor != "Non-corridor":
            factors.append({
                "feature": "Corridor",
                "value": corridor,
                "contribution": "Primary traffic axis for deployment planning",
            })

        if payload.get("priority") == "High" and len(factors) < 3:
            factors.append({
                "feature": "Priority",
                "value": "High",
                "contribution": "Elevates officer tier and reserve pool",
            })

        if payload.get("event_type") == "planned" and len(factors) < 3:
            factors.append({
                "feature": "Event type",
                "value": "Planned",
                "contribution": "Allows proactive barricade staging",
            })

        fallbacks = [
            {"feature": "Day of week", "value": str(payload.get("day_of_week", 2)), "contribution": "Weekly traffic pattern"},
            {"feature": "Month", "value": str(payload.get("month", 3)), "contribution": "Seasonal event density"},
        ]
        for item in fallbacks:
            if len(factors) >= 3:
                break
            factors.append(item)

        return factors[:3]

    def forecast(self, payload: dict) -> dict:
        if not self.is_ready():
            raise RuntimeError("Models not trained. Run train_models first.")

        hour = payload.get("hour", 12)
        X = self._build_input(payload)
        score = float(self.score_model.predict(X)[0])
        duration = self._predict_duration(X)
        historical = self.stats.get("by_cause", {}).get(payload["event_cause"], {})

        historical_duration = historical.get("avg_duration_hours")

        if historical_duration:
            duration = min(duration, historical_duration * 3)
        closure_prob = float(self.closure_model.predict_proba(X)[0][1])

        calibration = load_calibration()
        if calibration:
            score += calibration.get("score_adjustment", 0)
            duration += calibration.get("duration_adjustment_hours", 0)

        score = round(max(1, min(10, score)), 1)
        duration = round(max(0.5, duration), 2)
        closure_prob = round(closure_prob, 3)

        score_mae = float(self.metadata.get("score_mae", 0.29))
        dur_mae = float(self.metadata.get("duration_mae_hours", 68))

        severity_label = (
            "Critical"
            if score >= 8
            else "High"
            if score >= 6
            else "Moderate"
            if score >= 4
            else "Low"
        )

        recommendations = generate_recommendations(
            event_cause=payload["event_cause"],
            corridor=payload.get("corridor", "Non-corridor"),
            congestion_score=score,
            duration_hours=duration,
            closure_prob=closure_prob,
            lat=payload.get("latitude", 12.9716),
            lng=payload.get("longitude", 77.5946),
        )

        peak = peak_hour_alert(int(hour))

        return {
            "congestion_score": score,
            "congestion_score_ci": {
                "low": round(max(1, score - score_mae), 1),
                "high": round(min(10, score + score_mae), 1),
            },
            "severity_label": severity_label,
            "estimated_duration_hours": duration,
            "duration_hours_ci": {
                "low": round(max(0.5, duration - dur_mae * 0.25), 1),
                "high": round(duration + dur_mae * 0.25, 1),
            },
            "closure_probability": closure_prob,
            "peak_hour_warning": peak,
            "calibration_applied": calibration is not None,
            "score_drivers": self._explain(payload),
            "recommendations": recommendations,
            "model_metadata": {
                "score_mae": self.metadata.get("score_mae"),
                "duration_mae_hours": self.metadata.get("duration_mae_hours"),
                "score_r2": self.metadata.get("score_r2"),
                "closure_accuracy": self.metadata.get("closure_accuracy"),
                "retrained_from_feedback": self.metadata.get("retrained_from_feedback", False),
            },
        }
