"""Bengaluru landmarks for natural-language location resolution."""

LOCATION_DB = {
    "chinnaswamy": {"lat": 12.9788, "lng": 77.5995, "corridor": "CBD 2", "zone": "Central Zone 2", "label": "M Chinnaswamy Stadium"},
    "mg road": {"lat": 12.9755, "lng": 77.6063, "corridor": "CBD 2", "zone": "Central Zone 2", "label": "MG Road"},
    "koramangala": {"lat": 12.9352, "lng": 77.6245, "corridor": "ORR East 1", "zone": "South Zone 2", "label": "Koramangala"},
    "whitefield": {"lat": 12.9698, "lng": 77.7500, "corridor": "ORR East 2", "zone": "East Zone 2", "label": "Whitefield"},
    "hebbal": {"lat": 13.0358, "lng": 77.5970, "corridor": "Bellary Road 1", "zone": "North Zone 1", "label": "Hebbal"},
    "electronic city": {"lat": 12.8456, "lng": 77.6603, "corridor": "Hosur Road", "zone": "South Zone 2", "label": "Electronic City"},
    "mysore road": {"lat": 12.9445, "lng": 77.5274, "corridor": "Mysore Road", "zone": "West Zone 1", "label": "Mysore Road"},
    "tumkur road": {"lat": 13.0287, "lng": 77.5345, "corridor": "Tumkur Road", "zone": "West Zone 1", "label": "Tumkur Road"},
    "hosur road": {"lat": 12.9071, "lng": 77.6286, "corridor": "Hosur Road", "zone": "South Zone 2", "label": "Hosur Road"},
    "indiranagar": {"lat": 12.9784, "lng": 77.6408, "corridor": "Old Madras Road", "zone": "East Zone 1", "label": "Indiranagar"},
    "jayanagar": {"lat": 12.9250, "lng": 77.5937, "corridor": "Non-corridor", "zone": "South Zone 1", "label": "Jayanagar"},
    "yeshwanthpur": {"lat": 13.0287, "lng": 77.5365, "corridor": "Tumkur Road", "zone": "West Zone 1", "label": "Yeshwanthpur"},
    "marathahalli": {"lat": 12.9591, "lng": 77.6974, "corridor": "ORR East 1", "zone": "East Zone 1", "label": "Marathahalli"},
    "peenya": {"lat": 13.0400, "lng": 77.5181, "corridor": "Tumkur Road", "zone": "West Zone 1", "label": "Peenya"},
    "town hall": {"lat": 12.9639, "lng": 77.5844, "corridor": "CBD 1", "zone": "Central Zone 2", "label": "Town Hall"},
    "lalbagh": {"lat": 12.9507, "lng": 77.5848, "corridor": "Non-corridor", "zone": "South Zone 1", "label": "Lalbagh"},
    "outer ring road": {"lat": 12.9591, "lng": 77.6974, "corridor": "ORR East 1", "zone": "East Zone 1", "label": "Outer Ring Road"},
    "orr": {"lat": 12.9591, "lng": 77.6974, "corridor": "ORR East 1", "zone": "East Zone 1", "label": "ORR"},
}

CAUSE_KEYWORDS = {
    "public_event": ["cricket", "match", "concert", "festival", "public event", "stadium", "ipl", "show"],
    "procession": ["procession", "rally", "march", "parade", "ganesh", "idgah"],
    "construction": ["construction", "metro", "road work", "digging", "bwssb", "kride"],
    "vip_movement": ["vip", "minister", "cm visit", "dignitary", "convoy"],
    "protest": ["protest", "dharna", "agitation", "strike"],
    "accident": ["accident", "collision", "crash", "hit"],
    "vehicle_breakdown": ["breakdown", "break down", "stuck", "bus broke", "vehicle stopped"],
    "water_logging": ["water logging", "flooding", "waterlogged", "rain"],
    "tree_fall": ["tree fall", "tree fell", "fallen tree"],
    "pot_holes": ["pothole", "pot hole", "road damage"],
    "congestion": ["congestion", "jam", "traffic jam", "slow traffic"],
}

CORRIDOR_KEYWORDS = {
    "Mysore Road": ["mysore road"],
    "Tumkur Road": ["tumkur road"],
    "Hosur Road": ["hosur road"],
    "Bellary Road 1": ["bellary road"],
    "ORR East 1": ["orr east", "outer ring road east"],
    "ORR East 2": ["orr east 2", "whitefield road"],
    "ORR North 1": ["orr north"],
    "Old Madras Road": ["old madras road", "indiranagar road"],
    "Magadi Road": ["magadi road"],
    "Bannerghata Road": ["bannerghatta", "bannerghata"],
    "CBD 2": ["cbd", "mg road", "central"],
}

DAY_KEYWORDS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
    "weekend": 6, "today": None,
}

HOUR_PATTERNS = [
    (r"\b(\d{1,2})\s*(?:am|pm)\b", None),
    (r"\b(\d{1,2}):(\d{2})\b", None),
    (r"\bmorning\b", 9),
    (r"\bafternoon\b", 14),
    (r"\bevening\b", 18),
    (r"\bnight\b", 21),
    (r"\bnoon\b", 12),
]

SUGGESTED_PROMPTS = [
    "Cricket match at Chinnaswamy Stadium this Saturday evening",
    "Political rally on Mysore Road Sunday morning",
    "Metro construction on ORR near Marathahalli Wednesday 9 AM",
    "BMTC bus breakdown on Hosur Road Friday evening",
    "What are the highest risk corridors in Bengaluru?",
]
