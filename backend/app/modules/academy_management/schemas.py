import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AcademyCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="학원 이름")
    address: str = Field(..., description="주소")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    phone: str | None = Field(default=None, max_length=20)


class AcademyUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    phone: str | None = None


class AcademyResponse(BaseModel):
    id: uuid.UUID
    name: str
    address: str
    latitude: float
    longitude: float
    phone: str | None
    admin_id: uuid.UUID | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
