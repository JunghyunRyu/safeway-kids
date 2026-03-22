"""P3-68: ERP Integration schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="API 키 이름")


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    academy_id: uuid.UUID
    key_prefix: str
    name: str
    is_active: bool
    created_at: datetime
    raw_key: str | None = None  # only returned on creation

    model_config = {"from_attributes": True}


class WebhookCreateRequest(BaseModel):
    url: str = Field(..., description="Webhook URL")
    events: str = Field(..., description="이벤트 목록 (comma-separated): boarding,alighting,schedule_created")


class WebhookResponse(BaseModel):
    id: uuid.UUID
    academy_id: uuid.UUID
    url: str
    events: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
