import uuid
from datetime import date, datetime, time

from pydantic import BaseModel


class AvailabilityCreate(BaseModel):
    available_date: date
    start_time: time
    end_time: time


class AvailabilityResponse(BaseModel):
    id: uuid.UUID
    escort_id: uuid.UUID
    available_date: date
    start_time: time
    end_time: time
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ShiftResponse(BaseModel):
    id: uuid.UUID
    escort_id: uuid.UUID
    vehicle_assignment_id: uuid.UUID
    shift_date: date
    check_in_at: datetime | None
    check_out_at: datetime | None
    compensation_amount: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchRequest(BaseModel):
    target_date: date


class MatchResponse(BaseModel):
    shifts_created: int
    unmatched_assignments: int
