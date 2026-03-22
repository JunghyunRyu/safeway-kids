"""Notification models: log tracking + user preferences."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    recipient_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    recipient_phone: Mapped[str | None] = mapped_column(String(20))
    channel: Mapped[str] = mapped_column(String(10))  # fcm / sms
    notification_type: Mapped[str] = mapped_column(String(50))  # boarding / alighting / delay / sos / manual etc.
    title: Mapped[str | None] = mapped_column(String(200))
    body: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(10))  # sent / failed
    error_message: Mapped[str | None] = mapped_column(Text)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class NotificationPreference(Base):
    """ITEM-P2-41: Per-user notification preference by type and channel."""
    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    channel: Mapped[str] = mapped_column(String(10), nullable=False)  # fcm / sms
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)  # boarding / alighting / delay / arrival / no_show / sos
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("user_id", "channel", "notification_type", name="uq_notification_pref"),
    )
