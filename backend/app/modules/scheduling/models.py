import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    Time,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ScheduleTemplate(Base):
    __tablename__ = "schedule_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("students.id"), nullable=False
    )
    academy_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("academies.id"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 0=Mon, 6=Sun
    pickup_time: Mapped[time] = mapped_column(Time, nullable=False)
    pickup_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_address: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    student: Mapped["Student"] = relationship(back_populates="schedule_templates")  # type: ignore[name-defined] # noqa: F821


class DailyScheduleInstance(Base):
    __tablename__ = "daily_schedule_instances"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("schedule_templates.id")
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("students.id"), nullable=False
    )
    academy_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("academies.id"), nullable=False
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("vehicles.id")
    )
    schedule_date: Mapped[date] = mapped_column(Date, nullable=False)
    pickup_time: Mapped[time] = mapped_column(Time, nullable=False)
    pickup_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="scheduled"
    )  # scheduled, cancelled, completed, no_show
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id")
    )
    boarded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    alighted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delay_notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    arrival_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    handoff_type: Mapped[str | None] = mapped_column(String(20))  # guardian / academy_staff / self
    notification_sent: Mapped[bool | None] = mapped_column(Boolean)
    version: Mapped[int] = mapped_column(Integer, default=1)  # optimistic locking
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RouteSession(Base):
    __tablename__ = "route_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vehicles.id"), nullable=False
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    schedule_date: Mapped[date] = mapped_column(Date, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("vehicle_id", "schedule_date", name="uq_route_session"),
    )


class RoutePlan(Base):
    __tablename__ = "route_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vehicles.id"), nullable=False
    )
    plan_date: Mapped[date] = mapped_column(Date, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    stops: Mapped[dict] = mapped_column(JSON, nullable=False)  # type: ignore[assignment]
    total_distance_km: Mapped[float | None] = mapped_column(Float)
    total_duration_min: Mapped[float | None] = mapped_column(Float)
    generated_by: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("vehicle_id", "plan_date", "version", name="uq_route_plan"),
    )


class VehicleClearance(Base):
    __tablename__ = "vehicle_clearances"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vehicles.id"), nullable=False
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    schedule_date: Mapped[date] = mapped_column(Date, nullable=False)
    checklist: Mapped[dict] = mapped_column(JSON, nullable=False)  # type: ignore[assignment]
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("vehicle_id", "schedule_date", name="uq_vehicle_clearance"),
    )


class DriverMemo(Base):
    """ITEM-P2-49: Driver memo per student per daily schedule."""
    __tablename__ = "driver_memos"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    daily_schedule_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("daily_schedule_instances.id"), nullable=False
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    memo: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
