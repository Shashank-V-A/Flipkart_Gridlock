from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    event_type: str = Field(..., examples=["planned", "unplanned"])
    event_cause: str = Field(..., examples=["public_event", "construction"])
    corridor: str = Field(default="Non-corridor")
    zone: str = Field(default="Unknown")
    priority: str = Field(default="High", examples=["High", "Low"])
    latitude: float = Field(default=12.9716)
    longitude: float = Field(default=77.5946)
    hour: int = Field(default=12, ge=0, le=23)
    day_of_week: int = Field(default=2, ge=0, le=6)
    month: int = Field(default=3, ge=1, le=12)
    description: str | None = None
    compare_hour: int | None = Field(default=None, ge=0, le=23)


class FeedbackRequest(BaseModel):
    event_id: str | None = None
    predicted_score: float
    actual_score: float
    predicted_duration_hours: float
    actual_duration_hours: float
    notes: str | None = None
    event_type: str | None = None
    event_cause: str | None = None
    corridor: str | None = None
    zone: str | None = None
    priority: str | None = None
    hour: int | None = None
    day_of_week: int | None = None
    month: int | None = None


class ChatMessage(BaseModel):
    role: str = Field(..., examples=["user", "assistant"])
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    intent: str
    steps: list[dict] = Field(default_factory=list)
    parsed: dict | None = None
    forecast: dict | None = None
    suggestions: list[str] = Field(default_factory=list)


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., min_length=10)


class UserProfile(BaseModel):
    sub: str
    email: str
    name: str
    picture: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    user: UserProfile
