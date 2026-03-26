"""Edge AI 이벤트 데이터 모델."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EdgeEventType(str, enum.Enum):
    FACE_RECOGNIZED = "face_recognized"
    ABNORMAL_BEHAVIOR = "abnormal_behavior"
    REMAINING_PASSENGER = "remaining_passenger"


class EdgeEvent(Base):
    __tablename__ = "edge_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    event_type: Mapped[str] = mapped_column(
        Enum(EdgeEventType, name="edge_event_type", create_constraint=True),
        nullable=False,
        index=True,
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True,
    )
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    event_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )
