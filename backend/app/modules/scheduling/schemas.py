import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, Field


class ScheduleTemplateCreateRequest(BaseModel):
    student_id: uuid.UUID
    academy_id: uuid.UUID
    day_of_week: int = Field(..., ge=0, le=6, description="요일 (0=월, 6=일)")
    pickup_time: time = Field(..., description="픽업 시간")
    pickup_latitude: float = Field(..., ge=-90, le=90)
    pickup_longitude: float = Field(..., ge=-180, le=180)
    pickup_address: str | None = None


class ScheduleTemplateResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    academy_id: uuid.UUID
    day_of_week: int
    pickup_time: time
    pickup_latitude: float
    pickup_longitude: float
    pickup_address: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DailyScheduleResponse(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID | None
    student_id: uuid.UUID
    academy_id: uuid.UUID
    vehicle_id: uuid.UUID | None = None
    schedule_date: date
    pickup_time: time
    status: str
    boarded_at: datetime | None
    alighted_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DriverDailyScheduleResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    academy_id: uuid.UUID
    academy_name: str
    schedule_date: date
    pickup_time: time
    pickup_latitude: float
    pickup_longitude: float
    status: str
    boarded_at: datetime | None
    alighted_at: datetime | None


class ScheduleCancelRequest(BaseModel):
    reason: str | None = Field(default=None, description="취소 사유")
