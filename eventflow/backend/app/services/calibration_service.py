import json
from datetime import datetime, timezone
from pathlib import Path

from ..config import MODELS_DIR

CALIBRATION_PATH = MODELS_DIR / "calibration.json"
LEARNING_STATE_PATH = MODELS_DIR / "learning_state.json"

PEAK_HOURS = {8, 9, 17, 18, 19}


def load_calibration() -> dict | None:
    if not CALIBRATION_PATH.exists():
        return None
    with open(CALIBRATION_PATH, encoding="utf-8") as f:
        return json.load(f)


def load_learning_state() -> dict:
    if not LEARNING_STATE_PATH.exists():
        return {"retrain_count": 0, "history": []}
    with open(LEARNING_STATE_PATH, encoding="utf-8") as f:
        return json.load(f)


def _avg_errors(feedback: list, calibration: dict | None = None) -> tuple[float | None, float | None]:
    if not feedback:
        return None, None
    score_errors = []
    dur_errors = []
    score_adj = calibration.get("score_adjustment", 0) if calibration else 0
    dur_adj = calibration.get("duration_adjustment_hours", 0) if calibration else 0
    for entry in feedback:
        pred_score = float(entry["predicted_score"]) + score_adj
        pred_dur = float(entry["predicted_duration_hours"]) + dur_adj
        score_errors.append(abs(pred_score - float(entry["actual_score"])))
        dur_errors.append(abs(pred_dur - float(entry["actual_duration_hours"])))
    return (
        round(sum(score_errors) / len(score_errors), 2),
        round(sum(dur_errors) / len(dur_errors), 2),
    )


def apply_calibration_from_feedback(feedback: list) -> dict:
    """Derive bias corrections from logged outcomes and persist."""
    if not feedback:
        raise ValueError("No feedback entries to calibrate from")

    score_adj = sum(
        float(f["actual_score"]) - float(f["predicted_score"]) for f in feedback
    ) / len(feedback)
    dur_adj = sum(
        float(f["actual_duration_hours"]) - float(f["predicted_duration_hours"]) for f in feedback
    ) / len(feedback)

    before_score, before_dur = _avg_errors(feedback, None)
    calibration = {
        "score_adjustment": round(score_adj, 3),
        "duration_adjustment_hours": round(dur_adj, 3),
        "entries_used": len(feedback),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    after_score, after_dur = _avg_errors(feedback, calibration)

    with open(CALIBRATION_PATH, "w", encoding="utf-8") as f:
        json.dump(calibration, f, indent=2)

    state = load_learning_state()
    state["retrain_count"] = state.get("retrain_count", 0) + 1
    state.setdefault("history", []).append({
        "at": calibration["updated_at"],
        "entries": len(feedback),
        "avg_score_error_before": before_score,
        "avg_score_error_after": after_score,
        "avg_duration_error_before": before_dur,
        "avg_duration_error_after": after_dur,
    })
    with open(LEARNING_STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    return {
        "calibration": calibration,
        "avg_score_error_before": before_score,
        "avg_score_error_after": after_score,
        "avg_duration_error_before": before_dur,
        "avg_duration_error_after": after_dur,
        "retrain_count": state["retrain_count"],
    }


def peak_hour_alert(hour: int) -> dict:
    if hour in PEAK_HOURS:
        return {
            "peak_hour_overlap": True,
            "message": (
                f"Event at {hour}:00 overlaps Bengaluru peak traffic (8–10 AM / 5–8 PM). "
                "Expect amplified congestion — consider shifting timing or adding reserve officers."
            ),
        }
    return {"peak_hour_overlap": False, "message": None}
