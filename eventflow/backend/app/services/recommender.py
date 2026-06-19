import json
import math
from pathlib import Path

import numpy as np

from ..config import CORRIDOR_ALTERNATES, MODELS_DIR


def _sanitize(obj):
    """Replace NaN/inf with None for JSON-safe API responses."""
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    if isinstance(obj, (float, np.floating)):
        if math.isnan(float(obj)) or math.isinf(float(obj)):
            return None
        return float(obj)
    if isinstance(obj, (np.integer,)):
        return int(obj)
    return obj


def load_stats() -> dict:
    path = MODELS_DIR / "recommendation_stats.json"
    if not path.exists():
        return {"by_cause": {}, "by_cause_corridor": {}, "junction_hotspots": {}}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def estimate_manpower(
    congestion_score: float,
    closure_prob: float,
    event_cause: str,
    historical: dict | None = None,
) -> dict:
    base = 2
    if congestion_score >= 8:
        base = 12
    elif congestion_score >= 6:
        base = 8
    elif congestion_score >= 4:
        base = 5

    cause_adjust = {
        "public_event": 4,
        "procession": 5,
        "vip_movement": 10,
        "protest": 8,
        "construction": 3,
        "accident": 4,
    }.get(event_cause, 0)

    closure_adjust = int(closure_prob * 6)
    rule_total = base + cause_adjust + closure_adjust

    hist_total = None
    if historical:
        hist_score = float(historical.get("avg_score", congestion_score))
        hist_closure = float(historical.get("closure_rate", closure_prob))
        hist_total = max(2, int(hist_score * 1.2 + hist_closure * 12 + 2))

    total = round((rule_total + hist_total) / 2) if hist_total else rule_total

    rationale = f"Blended rule-based ({rule_total})"
    if hist_total:
        rationale += f" with historical pattern ({hist_total}) for this cause/corridor"
    rationale += f" — severity {congestion_score}/10, {closure_prob:.0%} closure risk"

    return {
        "total_officers": total,
        "traffic_controllers": max(2, total // 2),
        "supervisors": max(1, total // 6),
        "reserve_pool": max(1, total // 4),
        "rationale": rationale,
        "data_driven": hist_total is not None,
    }


def estimate_barricades(
    closure_prob: float,
    congestion_score: float,
    lat: float,
    lng: float,
    corridor: str,
) -> dict:
    count = max(2, int(closure_prob * 10 + congestion_score))
    radius_km = round(0.3 + congestion_score * 0.15, 2)

    points = []
    angles = [0, 90, 180, 270]
    for i, angle in enumerate(angles[: min(4, count)]):
        rad = math.radians(angle)
        offset_lat = lat + (radius_km / 111) * math.cos(rad)
        offset_lng = lng + (radius_km / (111 * math.cos(math.radians(lat)))) * math.sin(
            rad
        )
        points.append(
            {
                "id": f"B{i + 1}",
                "lat": round(offset_lat, 6),
                "lng": round(offset_lng, 6),
                "type": "hard_barricade" if closure_prob > 0.5 else "soft_cone",
                "label": f"Closure point {i + 1} — {corridor}",
            }
        )

    return {
        "count": count,
        "radius_km": radius_km,
        "points": points,
        "road_closure_recommended": closure_prob >= 0.4,
    }


def suggest_diversions(corridor: str, congestion_score: float) -> list[dict]:
    alternates = CORRIDOR_ALTERNATES.get(
        corridor, ["ORR segments", "Parallel service roads"]
    )
    diversions = []
    for i, alt in enumerate(alternates[:3]):
        diversions.append(
            {
                "route_id": f"D{i + 1}",
                "corridor": alt,
                "priority": i + 1,
                "estimated_delay_minutes": round(5 + congestion_score * 3 + i * 4),
                "description": f"Divert via {alt} to bypass {corridor} congestion zone",
            }
        )
    return diversions


def generate_recommendations(
    event_cause: str,
    corridor: str,
    congestion_score: float,
    duration_hours: float,
    closure_prob: float,
    lat: float,
    lng: float,
) -> dict:
    stats = load_stats()
    key = f"{event_cause}|{corridor}"
    historical = stats.get("by_cause_corridor", {}).get(key) or stats.get(
        "by_cause", {}
    ).get(event_cause, {})

    manpower = estimate_manpower(congestion_score, closure_prob, event_cause, historical)
    barricades = estimate_barricades(closure_prob, congestion_score, lat, lng, corridor)
    diversions = suggest_diversions(corridor, congestion_score)

    nearby_hotspots = []
    for name, data in stats.get("junction_hotspots", {}).items():
        dist = math.sqrt((data["lat"] - lat) ** 2 + (data["lng"] - lng) ** 2) * 111
        if dist < 3:
            nearby_hotspots.append(
                {"junction": name, "distance_km": round(dist, 2), **data}
            )

    nearby_hotspots.sort(key=lambda x: x["event_count"], reverse=True)

    return _sanitize(
        {
            "manpower": manpower,
            "barricading": barricades,
            "diversions": diversions,
            "historical_reference": historical,
            "nearby_hotspots": nearby_hotspots[:5],
            "estimated_impact_radius_km": barricades["radius_km"],
            "estimated_duration_hours": round(duration_hours, 2),
            "action_checklist": build_checklist(
                event_cause, closure_prob, congestion_score
            ),
        }
    )


def build_checklist(event_cause: str, closure_prob: float, score: float) -> list[str]:
    items = [
        "Notify local police station and traffic control room",
        "Deploy advance warning signage 1km before event zone",
    ]
    if closure_prob >= 0.4:
        items.append("Prepare full road closure protocol with U-turn points")
    if score >= 6:
        items.append("Activate corridor-level diversion plan")
        items.append("Coordinate with BMTC for route adjustments")
    if event_cause in ("public_event", "procession", "vip_movement"):
        items.append("Schedule pre-event reconnaissance 24h before start")
        items.append("Set up crowd management zones with marshals")
    if event_cause == "construction":
        items.append("Ensure night-time lane marking and reflective barricades")
    items.append("Log post-event resolution time for model feedback")
    return items
