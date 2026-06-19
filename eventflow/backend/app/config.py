import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BUNDLED_MODELS_DIR = BASE_DIR / "models"
IS_VERCEL = bool(os.getenv("VERCEL"))

if IS_VERCEL:
    WRITABLE_DIR = Path("/tmp/namma-trust")
    WRITABLE_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR = BUNDLED_MODELS_DIR
else:
    WRITABLE_DIR = BUNDLED_MODELS_DIR
    MODELS_DIR = BUNDLED_MODELS_DIR

MODELS_DIR.mkdir(exist_ok=True)

_csv_candidates = [
    Path(p) for p in [os.getenv("DATA_CSV_PATH", "").strip()] if p.strip()
] + [
    BASE_DIR / "data" / "events.csv",
    BASE_DIR.parent.parent / "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv",
]
DATA_PATH = next((p for p in _csv_candidates if p.exists()), _csv_candidates[0])

BENGALURU_CENTER = {"lat": 12.9716, "lng": 77.5946}

CORRIDOR_ALTERNATES = {
    "Mysore Road": ["Magadi Road", "ORR West 1"],
    "Bellary Road 1": ["ORR North 1", "Sankey Road corridor"],
    "Bellary Road 2": ["ORR North 2", "Hebbal Flyover bypass"],
    "Tumkur Road": ["ORR North 1", "Yeshwanthpur internal roads"],
    "Hosur Road": ["Bannerghata Road", "ORR South 1"],
    "Old Madras Road": ["ORR East 1", "Indiranagar 100ft Road"],
    "Magadi Road": ["Mysore Road", "Vijayanagar main roads"],
    "ORR East 1": ["ORR East 2", "Old Madras Road"],
    "ORR East 2": ["ORR East 1", "Whitefield Main Road"],
    "ORR North 1": ["ORR North 2", "Bellary Road 1"],
    "ORR North 2": ["ORR North 1", "Tumkur Road"],
    "ORR West 1": ["ORR West 2", "Mysore Road"],
    "Bannerghata Road": ["Hosur Road", "ORR South 1"],
    "CBD 1": ["CBD 2", "Kumarakrupa Road"],
    "CBD 2": ["CBD 1", "Sankey Road"],
}


def cors_origins() -> list[str]:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://namma-trust.vercel.app",
        "https://eventflow-murex-one.vercel.app",
    ]
    for key in ("FRONTEND_URL", "VERCEL_URL", "VERCEL_BRANCH_URL"):
        val = os.getenv(key, "").strip()
        if not val:
            continue
        if not val.startswith("http"):
            val = f"https://{val}"
        origins.append(val.rstrip("/"))
    extra = os.getenv("ALLOWED_ORIGINS", "")
    if extra:
        origins.extend(part.strip() for part in extra.split(",") if part.strip())
    return list(dict.fromkeys(origins))
