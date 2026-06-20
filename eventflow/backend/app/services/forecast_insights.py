import math
from typing import Any

import httpx
import pandas as pd

from ..config import CORRIDOR_ALTERNATES

RAIN_SENSITIVE_CAUSES = frozenset(
    {"water_logging", "accident", "tree_fall", "pot_holes", "road_conditions", "congestion"}
)


def detect_conflicts(df: pd.DataFrame, payload: dict) -> dict:
    corridor = payload.get("corridor", "Non-corridor")
    zone = payload.get("zone", "Unknown")
    hour = int(payload.get("hour", 12))
    window = 2

    if df.empty or corridor == "Non-corridor":
        return {
            "has_conflict": False,
            "conflict_count": 0,
            "compound_risk_pct": 0,
            "corridor_overlaps": [],
            "zone_stress_events": [],
            "adjacent_corridor_alerts": [],
            "message": "Insufficient corridor data for conflict scan",
        }

    corridor_mask = df["corridor"] == corridor
    time_mask = (df["hour"] >= hour - window) & (df["hour"] <= hour + window)
    high_impact = df["congestion_score"] >= 6

    overlaps = df[corridor_mask & time_mask & high_impact].sort_values(
        "congestion_score", ascending=False
    ).head(8)

    zone_stress = df[
        (df["zone"] == zone)
        & (df["zone"] != "Unknown")
        & time_mask
        & (df["congestion_score"] >= 7)
    ].sort_values("congestion_score", ascending=False).head(5)

    adjacent = []
    for alt in CORRIDOR_ALTERNATES.get(corridor, [])[:2]:
        alt_rows = df[(df["corridor"] == alt) & time_mask & high_impact]
        if len(alt_rows) >= 3:
            adjacent.append({
                "corridor": alt,
                "event_count": int(len(alt_rows)),
                "avg_score": round(float(alt_rows["congestion_score"].mean()), 1),
            })

    corridor_overlaps = [
        {
            "id": str(row.get("id", "")),
            "cause": row["event_cause"],
            "hour": int(row["hour"]),
            "congestion_score": round(float(row["congestion_score"]), 1),
            "duration_hours": round(float(row["duration_hours"]), 1),
            "requires_closure": bool(row["requires_closure_int"]),
        }
        for _, row in overlaps.iterrows()
    ]

    zone_events = [
        {
            "corridor": row["corridor"],
            "cause": row["event_cause"],
            "hour": int(row["hour"]),
            "congestion_score": round(float(row["congestion_score"]), 1),
        }
        for _, row in zone_stress.iterrows()
    ]

    count = len(corridor_overlaps) + len(zone_events)
    compound = min(95, 12 + count * 9 + len(adjacent) * 6)
    has_conflict = count > 0 or len(adjacent) > 0

    message = "No significant historical overlap in this corridor/time window"
    if has_conflict:
        message = (
            f"{len(corridor_overlaps)} high-impact events historically occurred on {corridor} "
            f"between {max(0, hour - window)}:00–{min(23, hour + window)}:00. "
            f"Compound corridor stress estimate: {compound}%."
        )

    return {
        "has_conflict": has_conflict,
        "conflict_count": count,
        "compound_risk_pct": compound,
        "corridor_overlaps": corridor_overlaps,
        "zone_stress_events": zone_events,
        "adjacent_corridor_alerts": adjacent,
        "message": message,
    }


def find_similar_events(df: pd.DataFrame, payload: dict, limit: int = 5) -> list[dict]:
    if df.empty:
        stats_cause = payload.get("event_cause", "")
        return []

    cause = payload.get("event_cause", "")
    corridor = payload.get("corridor", "Non-corridor")
    hour = int(payload.get("hour", 12))

    subset = df[df["event_cause"] == cause].copy()
    if len(subset) < 3:
        subset = df.copy()

    if corridor != "Non-corridor" and len(subset[subset["corridor"] == corridor]) >= 3:
        subset = subset[subset["corridor"] == corridor].copy()

    subset["hour_dist"] = (subset["hour"] - hour).abs()
    subset = subset.sort_values(["hour_dist", "congestion_score"], ascending=[True, False])

    results = []
    for _, row in subset.head(limit).iterrows():
        results.append({
            "id": str(row.get("id", "")),
            "event_type": row.get("event_type", ""),
            "cause": row["event_cause"],
            "corridor": row["corridor"],
            "hour": int(row["hour"]),
            "congestion_score": round(float(row["congestion_score"]), 1),
            "duration_hours": round(float(row["duration_hours"]), 1),
            "requires_closure": bool(row["requires_closure_int"]),
            "address": str(row["address"]) if pd.notna(row.get("address")) else "",
            "junction": str(row["junction"]) if pd.notna(row.get("junction")) else None,
        })
    return results


def build_deployment_timeline(payload: dict, result: dict) -> list[dict]:
    hour = int(payload.get("hour", 12))
    duration_h = float(result.get("estimated_duration_hours", 2))
    officers = result["recommendations"]["manpower"]["total_officers"]
    barricades = result["recommendations"]["barricading"]["count"]
    corridor = payload.get("corridor", "corridor")
    closure = result["recommendations"]["barricading"]["road_closure_recommended"]

    timeline = [
        {
            "offset_minutes": -120,
            "label": "T−120 min",
            "phase": "Prepare",
            "action": "Brief control room; confirm alternate corridor availability",
        },
        {
            "offset_minutes": -90,
            "label": "T−90 min",
            "phase": "Notify",
            "action": "Notify local police station, BMTC control, and emergency services",
        },
        {
            "offset_minutes": -60,
            "label": "T−60 min",
            "phase": "Stage",
            "action": f"Position {barricades} barricade units along {corridor}",
        },
        {
            "offset_minutes": -30,
            "label": "T−30 min",
            "phase": "Deploy",
            "action": f"All {officers} officers on ground; activate advance warning signage 1 km out",
        },
        {
            "offset_minutes": -15,
            "label": "T−15 min",
            "phase": "Divert",
            "action": "Enable diversion routes and update digital message boards",
        },
        {
            "offset_minutes": 0,
            "label": f"T−0 ({hour}:00)",
            "phase": "Event live",
            "action": "Monitor spillover; adjust barricades if queue exceeds 500 m",
        },
    ]

    if closure:
        timeline.insert(4, {
            "offset_minutes": -20,
            "label": "T−20 min",
            "phase": "Close",
            "action": "Execute partial road closure protocol with signed U-turn points",
        })

    timeline.append({
        "offset_minutes": int(duration_h * 60),
        "label": f"T+{int(duration_h)}h",
        "phase": "Stand-down",
        "action": "Phased reopening; log actual duration for learning loop",
    })

    return timeline


def estimate_citizen_impact(df: pd.DataFrame, payload: dict, result: dict) -> dict:
    corridor = payload.get("corridor", "Non-corridor")
    score = float(result["congestion_score"])
    duration = float(result["estimated_duration_hours"])
    closure_prob = float(result["closure_probability"])
    radius = float(result["recommendations"].get("estimated_impact_radius_km", 1))

    corridor_volume = 600
    if not df.empty and corridor != "Non-corridor":
        corridor_rows = df[df["corridor"] == corridor]
        corridor_volume = int(500 + len(corridor_rows) * 1.5 + score * 120)

    avg_delay = round(2.5 + score * 2.2 + closure_prob * 18, 1)
    peak_multiplier = 1.35 if int(payload.get("hour", 12)) in (8, 9, 17, 18, 19) else 1.0
    vehicles_affected = int(corridor_volume * peak_multiplier)
    total_delay_vehicle_hours = round(vehicles_affected * duration * (avg_delay / 60), 0)

    return {
        "estimated_vehicles_affected": vehicles_affected,
        "avg_delay_minutes": avg_delay,
        "total_delay_vehicle_hours": total_delay_vehicle_hours,
        "impact_radius_km": radius,
        "peak_hour_multiplier": peak_multiplier,
        "summary": (
            f"~{vehicles_affected:,} vehicles may experience ~{avg_delay} min average delay "
            f"within {radius} km over {duration}h"
        ),
    }


def fetch_weather_risk(lat: float, lng: float, event_cause: str) -> dict:
    default = {
        "applied": False,
        "is_raining": False,
        "precipitation_mm": 0.0,
        "score_adjustment": 0.0,
        "message": None,
        "condition": "unavailable",
    }
    try:
        url = (
            "https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lng}&current=precipitation,weather_code&timezone=Asia/Kolkata"
        )
        with httpx.Client(timeout=4.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            current = resp.json().get("current", {})
    except Exception:
        return default

    precip = float(current.get("precipitation") or 0)
    weather_code = int(current.get("weather_code") or 0)
    is_raining = precip > 0.1 or weather_code in {51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99}

    score_adj = 0.0
    message = None
    if is_raining and event_cause in RAIN_SENSITIVE_CAUSES:
        score_adj = 0.6 if precip < 2 else 1.0
        message = (
            f"Rain detected ({precip:.1f} mm) — congestion score boosted +{score_adj} "
            f"for {event_cause.replace('_', ' ')} events"
        )
    elif is_raining:
        score_adj = 0.3
        message = f"Light rain ({precip:.1f} mm) — minor congestion amplification applied"

    return {
        "applied": score_adj > 0,
        "is_raining": is_raining,
        "precipitation_mm": round(precip, 2),
        "score_adjustment": score_adj,
        "message": message,
        "condition": "rain" if is_raining else "clear",
    }


def build_plan_comparison(base: dict, alternative: dict, base_hour: int, alt_hour: int) -> dict:
    def delta(a: float, b: float) -> float:
        return round(b - a, 2)

    return {
        "base_hour": base_hour,
        "alternative_hour": alt_hour,
        "base": {
            "hour": base_hour,
            "congestion_score": base["congestion_score"],
            "estimated_duration_hours": base["estimated_duration_hours"],
            "closure_probability": base["closure_probability"],
            "officers": base["recommendations"]["manpower"]["total_officers"],
            "peak_overlap": base.get("peak_hour_warning", {}).get("peak_hour_overlap", False),
        },
        "alternative": {
            "hour": alt_hour,
            "congestion_score": alternative["congestion_score"],
            "estimated_duration_hours": alternative["estimated_duration_hours"],
            "closure_probability": alternative["closure_probability"],
            "officers": alternative["recommendations"]["manpower"]["total_officers"],
            "peak_overlap": alternative.get("peak_hour_warning", {}).get("peak_hour_overlap", False),
        },
        "delta": {
            "congestion_score": delta(base["congestion_score"], alternative["congestion_score"]),
            "duration_hours": delta(base["estimated_duration_hours"], alternative["estimated_duration_hours"]),
            "closure_probability": delta(base["closure_probability"], alternative["closure_probability"]),
            "officers": alternative["recommendations"]["manpower"]["total_officers"]
            - base["recommendations"]["manpower"]["total_officers"],
        },
        "recommendation": _comparison_recommendation(base, alternative, base_hour, alt_hour),
    }


def _comparison_recommendation(base: dict, alt: dict, base_hour: int, alt_hour: int) -> str:
    base_score = base["congestion_score"]
    alt_score = alt["congestion_score"]
    if alt_score < base_score - 0.5:
        return f"Shifting from {base_hour}:00 to {alt_hour}:00 reduces congestion score by {base_score - alt_score:.1f} points."
    if alt_score > base_score + 0.5:
        return f"{base_hour}:00 is safer than {alt_hour}:00 — lower score by {alt_score - base_score:.1f} points at base time."
    if not base.get("peak_hour_warning", {}).get("peak_hour_overlap") and alt.get("peak_hour_warning", {}).get("peak_hour_overlap"):
        return f"Avoid {alt_hour}:00 — overlaps peak traffic window."
    if base.get("peak_hour_warning", {}).get("peak_hour_overlap") and not alt.get("peak_hour_warning", {}).get("peak_hour_overlap"):
        return f"{alt_hour}:00 avoids peak-hour overlap — recommended if schedule allows."
    return "Both time slots show similar impact — choose based on operational convenience."


def enrich_forecast(result: dict, payload: dict, df: pd.DataFrame, compare_hour: int | None = None) -> dict:
    weather = fetch_weather_risk(
        float(payload.get("latitude", 12.9716)),
        float(payload.get("longitude", 77.5946)),
        payload.get("event_cause", ""),
    )
    if weather["score_adjustment"]:
        result["congestion_score"] = round(
            min(10, result["congestion_score"] + weather["score_adjustment"]), 1
        )
        if result["congestion_score"] >= 8:
            result["severity_label"] = "Critical"
        elif result["congestion_score"] >= 6:
            result["severity_label"] = "High"
        elif result["congestion_score"] >= 4:
            result["severity_label"] = "Moderate"
        else:
            result["severity_label"] = "Low"

    result["weather"] = weather
    result["conflict_radar"] = detect_conflicts(df, payload)
    result["similar_events"] = find_similar_events(df, payload)
    result["deployment_timeline"] = build_deployment_timeline(payload, result)
    result["citizen_impact"] = estimate_citizen_impact(df, payload, result)
    return result
