"""Edge AI 이벤트 API 스키마."""

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class EdgeEventTypeEnum(str, Enum):
    face_recognized = "face_recognized"
    abnormal_behavior = "abnormal_behavior"
    remaining_passenger = "remaining_passenger"


class EdgeEventCreate(BaseModel):
    event_type: EdgeEventTypeEnum
    details: dict = Field(default_factory=dict)
    vehicle_id: str | None = None
    timestamp: datetime | None = None


class EdgeEventResponse(BaseModel):
    id: str
    event_type: str
    vehicle_id: str | None
    details: dict
    event_timestamp: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class EdgeEventListResponse(BaseModel):
    events: list[EdgeEventResponse]
    total: int
