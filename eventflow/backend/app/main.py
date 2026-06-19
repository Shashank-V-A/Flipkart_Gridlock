from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .middleware.auth import AuthMiddleware
from .schemas import AuthResponse, ChatRequest, FeedbackRequest, ForecastRequest, GoogleAuthRequest, UserProfile
from .services.analytics import AnalyticsService
from .services.auth_service import create_access_token, verify_google_token
from .services.chat_agent import ChatAgent
from .services.predictor import PredictorService

app = FastAPI(
    title="Namma Trust",
    description="Event-driven congestion forecasting and resource recommendation for Bengaluru City Traffic Police",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)

predictor = PredictorService()
analytics = AnalyticsService()
chat_agent = ChatAgent(predictor, analytics)


@app.get("/api/health")
def health():
    from .services.llm_service import is_llm_available
    return {
        "status": "ok",
        "models_loaded": predictor.is_ready(),
        "llm_available": is_llm_available(),
    }


@app.post("/api/auth/google", response_model=AuthResponse)
def google_auth(body: GoogleAuthRequest):
    try:
        user = verify_google_token(body.credential)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Google sign-in failed") from exc

    token = create_access_token(user)
    return AuthResponse(access_token=token, user=UserProfile(**user))


@app.get("/api/auth/me", response_model=UserProfile)
def auth_me(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserProfile(**user)


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


@app.get("/api/analytics/impact")
def analytics_impact():
    return analytics.get_impact_metrics()


@app.get("/api/analytics/corridor-risk")
def corridor_risk():
    return analytics.get_corridor_risk()


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


@app.post("/api/chat")
def chat(request: ChatRequest):
    result = chat_agent.handle(
        request.message,
        [m.model_dump() for m in request.history],
    )
    return result


@app.get("/api/chat/suggestions")
def chat_suggestions():
    return {"suggestions": chat_agent.get_suggestions()}


@app.get("/api/learning")
def learning_insights():
    return analytics.get_learning_insights()


@app.post("/api/learning/retrain")
def learning_retrain():
    try:
        return analytics.retrain_from_feedback()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
