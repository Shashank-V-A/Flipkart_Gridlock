from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import FeedbackRequest, ForecastRequest
from .services.analytics import AnalyticsService
from .services.predictor import PredictorService

app = FastAPI(
    title="EventFlow AI",
    description="Event-driven congestion forecasting and resource recommendation for Bengaluru traffic",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = PredictorService()
analytics = AnalyticsService()


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "models_loaded": predictor.is_ready(),
    }


@app.get("/api/metadata")
def metadata():
    return analytics.get_metadata_options()


@app.get("/api/analytics/summary")
def analytics_summary():
    return analytics.get_summary()


@app.get("/api/analytics/causes")
def analytics_causes():
    return analytics.get_cause_breakdown()


@app.get("/api/analytics/corridors")
def analytics_corridors():
    return analytics.get_corridor_stats()


@app.get("/api/analytics/zones")
def analytics_zones():
    return analytics.get_zone_stats()


@app.get("/api/analytics/hourly")
def analytics_hourly():
    return analytics.get_hourly_pattern()


@app.get("/api/events/map")
def map_events(limit: int = 500, event_type: str | None = None):
    return analytics.get_map_events(limit=limit, event_type=event_type)


@app.get("/api/events/planned")
def planned_events():
    return analytics.get_planned_events()


@app.post("/api/forecast")
def forecast(request: ForecastRequest):
    if not predictor.is_ready():
        raise HTTPException(status_code=503, detail="ML models not trained. Run: python -m app.ml.trainer")
    return predictor.forecast(request.model_dump())


@app.post("/api/feedback")
def feedback(request: FeedbackRequest):
    return analytics.add_feedback(request.model_dump())


@app.get("/api/learning")
def learning_insights():
    return analytics.get_learning_insights()
