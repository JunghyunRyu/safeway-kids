import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ContactCreateRequest(BaseModel):
    name: str = Field(..., max_length=100)
    phone: str = Field(..., pattern=r"^01[0-9]{8,9}$")
    inquiry_type: Literal["academy", "parent", "driver", "escort", "other"]
    message: str = Field(..., max_length=2000)


class ContactResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    inquiry_type: str
    message: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
