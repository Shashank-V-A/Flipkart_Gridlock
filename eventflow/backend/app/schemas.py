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


class FeedbackRequest(BaseModel):
    event_id: str | None = None
    predicted_score: float
    actual_score: float
    predicted_duration_hours: float
    actual_duration_hours: float
    notes: str | None = None
