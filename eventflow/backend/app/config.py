from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR.parent.parent / "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

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
