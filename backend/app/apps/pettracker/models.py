"""
PetTracker domain models.
All tables prefixed or namespaced to avoid collision with SafeWay Kids / CareConnect.
"""

import enum
import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    Boolean, Date, DateTime, Float, ForeignKey, Index, Integer,
    JSON, String, Text, Time, UniqueConstraint, Uuid, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ── Enums ────────────────────────────────────────────────────────

class PetSpecies(enum.StrEnum):
    DOG = "dog"
    CAT = "cat"


class PtBookingStatus(enum.StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class WalkerApprovalStatus(enum.StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# ── Pets ─────────────────────────────────────────────────────────

class Pet(Base):
    __tablename__ = "pets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    species: Mapped[str] = mapped_column(String(20), nullable=False, default="dog")
    breed: Mapped[str | None] = mapped_column(String(100))
    birth_date: Mapped[date | None] = mapped_column(Date)
    weight_kg: Mapped[float | None] = mapped_column(Float)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    medical_notes: Mapped[str | None] = mapped_column(Text)
    temperament: Mapped[str | None] = mapped_column(String(50))  # calm, active, aggressive, anxious
    vaccination_status: Mapped[str] = mapped_column(String(20), default="unknown")
    special_needs: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ── Walker Qualification ─────────────────────────────────────────

class WalkerQualification(Base):
    __tablename__ = "walker_qualifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, unique=True)
    background_check_date: Mapped[date | None] = mapped_column(Date)
    background_check_doc_url: Mapped[str | None] = mapped_column(String(500))
    certification_type: Mapped[str | None] = mapped_column(String(100))
    certification_doc_url: Mapped[str | None] = mapped_column(String(500))
    service_areas: Mapped[dict | None] = mapped_column(JSON)  # type: ignore[assignment]
    bio: Mapped[str | None] = mapped_column(Text)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    approval_status: Mapped[str] = mapped_column(String(20), default="pending")
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ── Walker Availability ──────────────────────────────────────────

class WalkerAvailability(Base):
    __tablename__ = "walker_availabilities"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    walker_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    available_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="available")  # available, booked, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("walker_id", "available_date", name="uq_walker_avail_date"),
    )


# ── Bookings ─────────────────────────────────────────────────────

class PtBooking(Base):
    __tablename__ = "pt_bookings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    walker_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"))
    pet_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("pets.id"), nullable=False)
    service_type: Mapped[str] = mapped_column(String(20), nullable=False, default="walk")
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    pickup_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_address: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    price: Mapped[int] = mapped_column(Integer, nullable=False)  # KRW
    commission_rate: Mapped[int] = mapped_column(Integer, nullable=False, default=15)  # percent
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    timeout_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancel_reason: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    pet: Mapped["Pet"] = relationship(lazy="joined")

    __table_args__ = (
        Index("ix_pt_bookings_status_scheduled", "status", "scheduled_at"),
        Index("ix_pt_bookings_walker_scheduled", "walker_id", "scheduled_at"),
        Index("ix_pt_bookings_owner_status", "owner_id", "status"),
    )


# ── Walk Sessions ────────────────────────────────────────────────

class WalkSession(Base):
    __tablename__ = "walk_sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("pt_bookings.id"), nullable=False, unique=True)
    walker_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    distance_meters: Mapped[int | None] = mapped_column(Integer)
    route_polyline: Mapped[dict | None] = mapped_column(JSON)  # type: ignore[assignment]
    arrival_photo_url: Mapped[str | None] = mapped_column(String(500))
    walker_memo: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    booking: Mapped["PtBooking"] = relationship(lazy="joined")


# ── Walk GPS History (partitioned by month in production) ────────

class WalkGpsHistory(Base):
    __tablename__ = "walk_gps_history"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("walk_sessions.id"), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    heading: Mapped[float | None] = mapped_column(Float)
    speed: Mapped[float | None] = mapped_column(Float)
    accuracy: Mapped[float | None] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_walk_gps_session_time", "session_id", "recorded_at"),
    )


# ── Walker Wallet ────────────────────────────────────────────────

class WalkerWallet(Base):
    __tablename__ = "walker_wallets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, unique=True)
    balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # KRW
    bank_name: Mapped[str | None] = mapped_column(String(50))
    bank_account: Mapped[str | None] = mapped_column(String(100))  # should be encrypted in prod
    account_holder: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ── Walker Reviews ───────────────────────────────────────────────

class WalkerReview(Base):
    __tablename__ = "walker_reviews"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("pt_bookings.id"), nullable=False, unique=True)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    walker_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_walker_reviews_walker_time", "walker_id", "created_at"),
    )
