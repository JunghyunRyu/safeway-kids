"""ITEM-P1-23: Message model for parent-driver/academy messaging."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    sender_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"))
    receiver_role: Mapped[str | None] = mapped_column(String(50))  # for broadcast to all parents of an academy
    academy_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("academies.id"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(
        String(30), default="operational", server_default="operational"
    )  # operational | notice — 광고성 메시지 차단 (정보통신망법 §50)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    retention_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )  # 메시지 보관 만료일 (통신비밀보호법 준수, 기본 6개월)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
