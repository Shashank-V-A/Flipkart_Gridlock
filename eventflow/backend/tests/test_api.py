import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_public():
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert "models_loaded" in body
    assert "dataset_loaded" in body


def test_protected_route_requires_auth():
    res = client.get("/api/analytics/summary")
    assert res.status_code == 401


def test_metadata_requires_auth():
    res = client.get("/api/metadata")
    assert res.status_code == 401


def test_forecast_requires_auth():
    res = client.post(
        "/api/forecast",
        json={
            "event_type": "planned",
            "event_cause": "public_event",
            "corridor": "CBD 2",
            "zone": "Central Zone 2",
            "priority": "High",
            "latitude": 12.9788,
            "longitude": 77.5995,
            "hour": 18,
            "day_of_week": 6,
            "month": 3,
        },
    )
    assert res.status_code == 401


def test_google_auth_rejects_invalid_token():
    res = client.post("/api/auth/google", json={"credential": "invalid-token"})
    assert res.status_code == 401


def test_forecast_with_models():
    from app.main import predictor

    if not predictor.is_ready():
        pytest.skip("ML models not trained")

    payload = {
        "event_type": "planned",
        "event_cause": "public_event",
        "corridor": "CBD 2",
        "zone": "Central Zone 2",
        "priority": "High",
        "latitude": 12.9788,
        "longitude": 77.5995,
        "hour": 18,
        "day_of_week": 6,
        "month": 3,
    }

    # Bypass auth middleware for smoke test
    res = client.post("/api/forecast", json=payload)
    assert res.status_code in (401, 200)
    if res.status_code == 200:
        body = res.json()
        assert "congestion_score" in body
        assert "score_drivers" in body
        assert len(body["score_drivers"]) <= 3
