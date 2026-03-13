import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class GpsUpdateRequest(BaseModel):
    vehicle_id: uuid.UUID
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    heading: float | None = Field(default=None, ge=0, le=360)
    speed: float | None = Field(default=None, ge=0, description="km/h")


class GpsLocationResponse(BaseModel):
    vehicle_id: uuid.UUID
    latitude: float
    longitude: float
    heading: float | None
    speed: float | None
    recorded_at: str


class VehicleCreateRequest(BaseModel):
    license_plate: str = Field(..., max_length=20, description="차량 번호판")
    capacity: int = Field(..., ge=1, le=100, description="탑승 인원")
    operator_name: str | None = Field(default=None, description="운수업체명")


class VehicleResponse(BaseModel):
    id: uuid.UUID
    license_plate: str
    capacity: int
    operator_name: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VehicleAssignmentResponse(BaseModel):
    vehicle_id: uuid.UUID
    license_plate: str
    capacity: int
    operator_name: str | None
    safety_escort_name: str | None = None
    assigned_date: datetime
