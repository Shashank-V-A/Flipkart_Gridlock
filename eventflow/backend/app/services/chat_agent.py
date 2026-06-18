import re
from datetime import datetime

from .analytics import AnalyticsService
from .chat_knowledge import (
    CAUSE_KEYWORDS,
    CORRIDOR_KEYWORDS,
    DAY_KEYWORDS,
    LOCATION_DB,
    SUGGESTED_PROMPTS,
)
from .llm_service import generate_explanation, is_llm_available
from .predictor import PredictorService

PLANNED_CAUSES = {"public_event", "construction", "procession", "vip_movement", "protest"}


class ChatAgent:
    def __init__(self, predictor: PredictorService, analytics: AnalyticsService):
        self.predictor = predictor
        self.analytics = analytics

    def handle(self, message: str, history: list[dict] | None = None) -> dict:
        text = message.strip()
        lower = text.lower()
        steps: list[dict] = []

        # Greeting / help
        if self._is_greeting(lower):
            return self._finalize(self._respond_greeting(steps), text, None, None, None)

        if self._is_help(lower):
            return self._finalize(self._respond_help(steps), text, None, None, None)

        # Stats / analytics questions
        if any(kw in lower for kw in ["risk corridor", "top corridor", "statistics", "how many events", "summary", "dashboard"]):
            return self._finalize(self._respond_stats(lower, steps), text, None, None, self.analytics.get_summary())

        # Forecast intent
        steps.append({"agent": "Sense", "action": "Parsing natural language event description"})
        parsed = self._parse_event(text, lower)
        steps.append({
            "agent": "Sense",
            "action": "Extracted structured event",
            "detail": parsed,
        })

        if not parsed.get("event_cause"):
            return self._finalize({
                "reply": (
                    "I understood your message but couldn't identify the **event type**. "
                    "Try mentioning things like: cricket match, rally, construction, accident, or bus breakdown.\n\n"
                    "**Example:** *Cricket match at Chinnaswamy Stadium Saturday evening*"
                ),
                "intent": "clarify",
                "steps": steps,
                "parsed": parsed,
                "forecast": None,
                "suggestions": SUGGESTED_PROMPTS[:3],
            }, text, parsed, None, None)

        steps.append({"agent": "Forecast", "action": "Running ML models (congestion, duration, closure)"})
        try:
            forecast = self.predictor.forecast(parsed)
        except Exception as exc:
            return self._finalize({
                "reply": f"I couldn't run the forecast: {exc}. Make sure ML models are trained.",
                "intent": "error",
                "steps": steps,
                "parsed": parsed,
                "forecast": None,
                "suggestions": SUGGESTED_PROMPTS[:3],
            }, text, parsed, None, None)

        steps.append({"agent": "Plan", "action": "Generating manpower, barricade & diversion recommendations"})
        reply = self._format_forecast_reply(parsed, forecast)

        if is_llm_available():
            steps.append({"agent": "Explain", "action": "OpenRouter LLM generating detailed operations briefing"})

        steps.append({"agent": "Plan", "action": "Response ready for traffic control team"})

        return self._finalize({
            "reply": reply,
            "intent": "forecast",
            "steps": steps,
            "parsed": parsed,
            "forecast": forecast,
            "suggestions": self._follow_up_suggestions(parsed),
        }, text, parsed, forecast, None)

    def _finalize(
        self,
        result: dict,
        user_message: str,
        parsed: dict | None,
        forecast: dict | None,
        analytics_summary: dict | None,
    ) -> dict:
        """Enhance reply with OpenRouter LLM when API key is configured."""
        result["llm_enhanced"] = False
        result["llm_available"] = is_llm_available()

        if is_llm_available():
            enhanced = generate_explanation(
                user_message=user_message,
                intent=result.get("intent", "general"),
                parsed=parsed or result.get("parsed"),
                forecast=forecast or result.get("forecast"),
                analytics_summary=analytics_summary,
            )
            if enhanced:
                result["reply"] = enhanced
                result["llm_enhanced"] = True
                if not any(s.get("agent") == "Explain" for s in result.get("steps", [])):
                    result.setdefault("steps", []).append({
                        "agent": "Explain",
                        "action": "OpenRouter LLM enriched the response",
                    })

        return result

    def get_suggestions(self) -> list[str]:
        return SUGGESTED_PROMPTS

    def _is_greeting(self, lower: str) -> bool:
        return lower in {"hi", "hello", "hey", "start", "help me"} or lower.startswith(("hi ", "hello "))

    def _is_help(self, lower: str) -> bool:
        return "help" in lower and len(lower) < 40

    def _respond_greeting(self, steps: list) -> dict:
        steps.append({"agent": "Orchestrator", "action": "Greeting detected"})
        return {
            "reply": (
                "👋 **Hello! I'm Namma Trust AI** — your Bengaluru traffic intelligence agent.\n\n"
                "I can **forecast congestion impact** and **recommend deployment plans** for planned and unplanned events.\n\n"
                "Just describe an event in plain English, for example:\n"
                "• *Cricket match at Chinnaswamy Stadium Saturday 6 PM*\n"
                "• *Bus breakdown on Hosur Road during evening peak*\n"
                "• *Political rally on Mysore Road this Sunday*\n\n"
                "I'll predict severity, duration, road closure risk, and suggest officers, barricades & diversions."
            ),
            "intent": "greeting",
            "steps": steps,
            "parsed": None,
            "forecast": None,
            "suggestions": SUGGESTED_PROMPTS,
        }

    def _respond_help(self, steps: list) -> dict:
        steps.append({"agent": "Orchestrator", "action": "Help requested"})
        return {
            "reply": (
                "**How to use Namma Trust Agent:**\n\n"
                "1️⃣ **Describe an event** — type, location, time\n"
                "2️⃣ **Forecast Agent** — predicts congestion score, duration, closure risk\n"
                "3️⃣ **Plan Agent** — recommends officers, barricades, diversion routes\n"
                "4️⃣ **Learn Agent** — use Post-Event Learning page to improve predictions\n\n"
                "**Supported events:** cricket matches, rallies, construction, accidents, breakdowns, tree falls, VIP movement\n\n"
                "**Supported locations:** Chinnaswamy, MG Road, Mysore Road, ORR, Whitefield, Hebbal, Hosur Road, and more."
            ),
            "intent": "help",
            "steps": steps,
            "parsed": None,
            "forecast": None,
            "suggestions": SUGGESTED_PROMPTS,
        }

    def _respond_stats(self, lower: str, steps: list) -> dict:
        steps.append({"agent": "Sense", "action": "Querying historical analytics"})
        summary = self.analytics.get_summary()
        corridors = self.analytics.get_corridor_stats()[:5]
        steps.append({"agent": "Sense", "action": f"Analyzed {summary['total_events']} historical events"})

        corridor_lines = "\n".join(
            f"• **{c['corridor']}** — {c['count']} events, avg score {c['avg_score']}/10"
            for c in corridors
        )
        return {
            "reply": (
                f"📊 **Bengaluru Traffic Intelligence Summary**\n\n"
                f"• Total events analyzed: **{summary['total_events']:,}**\n"
                f"• Planned: {summary['planned_events']} | Unplanned: {summary['unplanned_events']}\n"
                f"• Avg congestion score: **{summary['avg_congestion_score']}/10**\n"
                f"• Road closures recorded: **{summary['road_closures']}**\n"
                f"• Median resolution time: **{summary['avg_duration_hours']}h**\n\n"
                f"**Top high-risk corridors:**\n{corridor_lines}\n\n"
                f"Want me to plan for a specific event? Just describe it!"
            ),
            "intent": "stats",
            "steps": steps,
            "parsed": None,
            "forecast": None,
            "suggestions": SUGGESTED_PROMPTS[:3],
        }

    def _parse_event(self, text: str, lower: str) -> dict:
        now = datetime.now()
        cause = self._extract_cause(lower)
        location = self._extract_location(lower)
        corridor = location.get("corridor") or self._extract_corridor(lower) or "Non-corridor"
        zone = location.get("zone", "Unknown")
        hour = self._extract_hour(lower) or now.hour
        day = self._extract_day(lower)
        if day is None:
            day = now.weekday()

        event_type = "planned" if cause in PLANNED_CAUSES else "unplanned"
        if any(kw in lower for kw in ["unplanned", "sudden", "unexpected", "just happened", "breakdown", "accident"]):
            event_type = "unplanned"
        if any(kw in lower for kw in ["planned", "scheduled", "tomorrow", "this weekend", "upcoming"]):
            if cause in PLANNED_CAUSES or cause is None:
                event_type = "planned"

        return {
            "event_type": event_type,
            "event_cause": cause or "others",
            "corridor": corridor,
            "zone": zone,
            "priority": "High",
            "latitude": location.get("lat", 12.9716),
            "longitude": location.get("lng", 77.5946),
            "hour": hour,
            "day_of_week": day,
            "month": now.month,
            "description": text,
            "_location_label": location.get("label", "Bengaluru"),
        }

    def _extract_cause(self, lower: str) -> str | None:
        for cause, keywords in CAUSE_KEYWORDS.items():
            if any(kw in lower for kw in keywords):
                return cause
        return None

    def _extract_location(self, lower: str) -> dict:
        for key, loc in LOCATION_DB.items():
            if key in lower:
                return loc
        return {}

    def _extract_corridor(self, lower: str) -> str | None:
        for corridor, keywords in CORRIDOR_KEYWORDS.items():
            if any(kw in lower for kw in keywords):
                return corridor
        return None

    def _extract_hour(self, lower: str) -> int | None:
        for pattern, default in [
            (r"(\d{1,2})\s*pm", None),
            (r"(\d{1,2})\s*am", None),
            (r"(\d{1,2}):(\d{2})", None),
            (r"\bmorning\b", 9),
            (r"\bafternoon\b", 14),
            (r"\bevening\b", 18),
            (r"\bnight\b", 21),
        ]:
            m = re.search(pattern, lower)
            if m:
                if default is not None:
                    return default
                h = int(m.group(1))
                if "pm" in pattern and h < 12:
                    h += 12
                if "am" in pattern and h == 12:
                    h = 0
                return h
        return None

    def _extract_day(self, lower: str) -> int | None:
        for day_name, day_num in DAY_KEYWORDS.items():
            if day_name in lower:
                if day_num is not None:
                    return day_num
        if "saturday" in lower:
            return 5
        if "sunday" in lower:
            return 6
        return None

    def _format_forecast_reply(self, parsed: dict, forecast: dict) -> str:
        rec = forecast["recommendations"]
        mp = rec["manpower"]
        bar = rec["barricading"]
        loc = parsed.get("_location_label", "the location")
        cause = parsed["event_cause"].replace("_", " ").title()

        div_lines = "\n".join(
            f"  {d['priority']}. **{d['corridor']}** (+{d['estimated_delay_minutes']} min delay)"
            for d in rec["diversions"][:2]
        )
        checklist = "\n".join(f"  ☑ {item}" for item in rec["action_checklist"][:4])

        hist = rec.get("historical_reference") or {}
        hist_note = ""
        if hist.get("count"):
            hist_note = (
                f"\n\n📚 **Historical context:** {hist['count']} similar events on this corridor "
                f"averaged **{hist.get('avg_score', '—')}/10** severity."
            )

        return (
            f"## 🚨 Forecast for {cause} at {loc}\n\n"
            f"**Severity:** {forecast['severity_label']} — **{forecast['congestion_score']}/10**\n"
            f"**Est. duration:** {forecast['estimated_duration_hours']} hours\n"
            f"**Road closure risk:** {forecast['closure_probability']*100:.0f}%\n\n"
            f"### 👮 Manpower Plan\n"
            f"• **{mp['total_officers']} total officers** ({mp['traffic_controllers']} traffic controllers, "
            f"{mp['supervisors']} supervisors, {mp['reserve_pool']} reserve)\n"
            f"• {mp['rationale']}\n\n"
            f"### 🚧 Barricading\n"
            f"• **{bar['count']} barricade points** within {bar['radius_km']} km radius\n"
            f"• Road closure: **{'Recommended' if bar['road_closure_recommended'] else 'Not required'}**\n\n"
            f"### 🔀 Diversion Routes\n{div_lines}\n\n"
            f"### ✅ Action Checklist\n{checklist}"
            f"{hist_note}\n\n"
            f"_Open **Event Planner** to see barricade points on the map._"
        )

    def _follow_up_suggestions(self, parsed: dict) -> list[str]:
        corridor = parsed.get("corridor", "ORR East 1")
        return [
            f"What if road closure is needed on {corridor}?",
            "Show me Bengaluru traffic statistics",
            "Plan for VIP convoy on Bellary Road Friday morning",
        ]
