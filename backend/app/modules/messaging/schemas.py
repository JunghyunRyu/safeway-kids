"""ITEM-P1-23: Messaging schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreateRequest(BaseModel):
    receiver_id: uuid.UUID | None = Field(default=None, description="수신자 ID (1:1 메시지)")
    academy_id: uuid.UUID | None = Field(default=None, description="학원 ID (공지사항)")
    content: str = Field(..., min_length=1, max_length=200, description="메시지 내용 (최대 200자)")
    message_type: str = Field(
        default="operational",
        pattern=r"^(operational|notice)$",
        description="메시지 유형: operational(운영) | notice(공지). 광고성 메시지는 차단됩니다.",
    )


class MessageResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    sender_name: str | None = None
    receiver_id: uuid.UUID | None = None
    receiver_role: str | None = None
    academy_id: uuid.UUID | None = None
    content: str
    message_type: str = "operational"
    is_read: bool
    sent_at: datetime

    model_config = {"from_attributes": True}
