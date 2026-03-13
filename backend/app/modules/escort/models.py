import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Time,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EscortAvailability(Base):
    __tablename__ = "escort_availabilities"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    escort_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    available_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="available"
    )  # available, matched, completed, cancelled
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "escort_id", "available_date", name="uq_escort_date"
        ),
    )


class EscortShift(Base):
    __tablename__ = "escort_shifts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    escort_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    vehicle_assignment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vehicle_assignments.id"), nullable=False
    )
    shift_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    check_out_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    compensation_amount: Mapped[int] = mapped_column(
        Integer, default=50000
    )  # KRW, default 5만원
    status: Mapped[str] = mapped_column(
        String(20), default="assigned"
    )  # assigned, checked_in, completed, no_show
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
