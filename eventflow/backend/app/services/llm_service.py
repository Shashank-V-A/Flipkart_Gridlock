import json
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen-2.5-7b-instruct")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """You are Namma Trust AI — an expert Bengaluru traffic management agent for Bangalore City Traffic Police.

Your job is to explain ML-generated traffic forecasts to police and traffic control officers in clear, detailed, actionable language.

RULES:
- Use ONLY the numbers and facts provided in the forecast data. Never invent statistics.
- Write longer, richer explanations (4-6 short paragraphs or structured sections).
- Cover: (1) situation overview, (2) predicted impact & why, (3) manpower rationale, (4) barricading & closure strategy, (5) diversion plan, (6) priority actions.
- Reference Bengaluru-specific corridors, zones, and peak-hour context when relevant.
- Use markdown: ## headers, **bold** for key numbers, bullet lists for actions.
- Tone: professional, confident, operations-focused — like briefing a traffic control room.
- End with one sentence on what to monitor during the event."""


def is_llm_available() -> bool:
    return bool(OPENROUTER_API_KEY.strip())


def _strip_internal_keys(data: dict) -> dict:
    return {k: v for k, v in data.items() if not str(k).startswith("_")}


def generate_explanation(
    user_message: str,
    intent: str,
    parsed: dict | None,
    forecast: dict | None,
    analytics_summary: dict | None = None,
) -> str | None:
    """Call OpenRouter to produce a richer natural-language explanation."""
    if not is_llm_available():
        return None

    context_parts = [f"User message: {user_message}", f"Intent: {intent}"]

    if parsed:
        context_parts.append(f"Parsed event:\n{json.dumps(_strip_internal_keys(parsed), indent=2)}")
    if forecast:
        context_parts.append(f"ML forecast & recommendations:\n{json.dumps(forecast, indent=2, default=str)}")
    if analytics_summary:
        context_parts.append(f"City analytics:\n{json.dumps(analytics_summary, indent=2)}")

    user_prompt = (
        "Based on the data below, write a detailed traffic operations briefing for Bengaluru.\n\n"
        + "\n\n".join(context_parts)
    )

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": 1200,
        "temperature": 0.4,
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Namma Trust",
    }

    try:
        with httpx.Client(timeout=45.0) as client:
            response = client.post(OPENROUTER_BASE_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None
