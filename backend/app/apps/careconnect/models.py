"""
CareConnect domain models.
Children's PII fields are encrypted at the application layer (AES-256-GCM).
"""

import enum
import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    Boolean, Date, DateTime, Float, ForeignKey, Index, Integer,
    JSON, String, Text, Time, UniqueConstraint, Uuid, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.security import decrypt_value, encrypt_value
from app.database import Base


# ── Enums ────────────────────────────────────────────────────────

class CcBookingStatus(enum.StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class CareActivityType(enum.StrEnum):
    HOMEWORK = "homework"
    PLAY = "play"
    MEAL = "meal"
    SNACK = "snack"
    NAP = "nap"
    OUTDOOR = "outdoor"
    OTHER = "other"


# ── Children (PII encrypted) ────────────────────────────────────

class CcChild(Base):
    """Child profile — PII fields (name, allergies, medical_notes, emergency_contact)
    are stored encrypted via app-layer AES-256-GCM. See service.py for encrypt/decrypt."""
    __tablename__ = "cc_children"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    parent_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    name_encrypted: Mapped[str] = mapped_column(String(500), nullable=False)  # AES-GCM encrypted
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    age_group: Mapped[str] = mapped_column(String(20), nullable=False)  # infant, toddler, preschool, school_age
    allergies_encrypted: Mapped[str | None] = mapped_column(Text)  # AES-GCM encrypted
    medical_notes_encrypted: Mapped[str | None] = mapped_column(Text)  # AES-GCM encrypted
    emergency_contact_encrypted: Mapped[str | None] = mapped_column(String(500))  # AES-GCM encrypted
    school_name: Mapped[str | None] = mapped_column(String(200))
    favorite_activities: Mapped[dict | None] = mapped_column(JSON)  # type: ignore[assignment]
    photo_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ── Child Consent (14세 미만 법정대리인 동의) ────────────────────

class ChildConsent(Base):
    __tablename__ = "child_consents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    parent_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("cc_children.id"), nullable=False)
    consent_scope: Mapped[dict] = mapped_column(JSON, nullable=False)  # type: ignore[assignment]
    consent_method: Mapped[str] = mapped_column(String(50), nullable=False, default="app_checkbox")
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ── Caregiver Qualification (5중 인증) ───────────────────────────

class CaregiverQualification(Base):
    __tablename__ = "caregiver_qualifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, unique=True)
    # ���죄경력조���
    background_check_date: Mapped[date | None] = mapped_column(Date)
    background_check_doc_url: Mapped[str | None] = mapped_column(String(500))
    # �����학대전력조회
    child_abuse_check_date: Mapped[date | None] = mapped_column(Date)
    child_abuse_doc_url: Mapped[str | None] = mapped_column(String(500))
    # 성범죄전력조회
    sex_offense_check_date: Mapped[date | None] = mapped_column(Date)
    sex_offense_doc_url: Mapped[str | None] = mapped_column(String(500))
    # 응급처치 자격
    cpr_cert_date: Mapped[date | None] = mapped_column(Date)
    cpr_doc_url: Mapped[str | None] = mapped_column(String(500))
    # 추가 자격증
    additional_certs: Mapped[dict | None] = mapped_column(JSON)  # type: ignore[assignment]
    service_areas: Mapped[dict | None] = mapped_column(JSON)  # type: ignore[assignment]
    preferred_age_groups: Mapped[dict | None] = mapped_column(JSON)  # type: ignore[assignment]
    bio: Mapped[str | None] = mapped_column(Text)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    approval_status: Mapped[str] = mapped_column(String(20), default="pending")
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ── Caregiver Availability ──────────────────────────────────────���

class CaregiverAvailability(Base):
    __tablename__ = "caregiver_availabilities"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    caregiver_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    available_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="available")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("caregiver_id", "available_date", name="uq_caregiver_avail_date"),
    )


# ── Bookings ─────────────────────────────────────────────────────

class CcBooking(Base):
    __tablename__ = "cc_bookings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    parent_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    caregiver_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"))
    child_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("cc_children.id"), nullable=False)
    care_type: Mapped[str] = mapped_column(String(20), nullable=False, default="visit")
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_hours: Mapped[float] = mapped_column(Float, nullable=False)
    hourly_rate: Mapped[int] = mapped_column(Integer, nullable=False)  # KRW per hour
    care_address: Mapped[str | None] = mapped_column(String(500))
    care_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    care_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    commission_rate: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    timeout_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancel_reason: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_cc_bookings_status_scheduled", "status", "scheduled_at"),
        Index("ix_cc_bookings_caregiver_scheduled", "caregiver_id", "scheduled_at"),
        Index("ix_cc_bookings_parent_status", "parent_id", "status"),
    )


# ── Care Sessions ────────────────────────────────────────────────

class CareSession(Base):
    __tablename__ = "care_sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("cc_bookings.id"), nullable=False, unique=True)
    caregiver_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checkin_latitude: Mapped[float | None] = mapped_column(Float)
    checkin_longitude: Mapped[float | None] = mapped_column(Float)
    checkin_accuracy: Mapped[float | None] = mapped_column(Float)
    checked_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    total_minutes: Mapped[int | None] = mapped_column(Integer)
    handover_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    caregiver_memo: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ── Care Activity Logs ───────────────────────────────────────────

class CareActivityLog(Base):
    __tablename__ = "care_activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("care_sessions.id"), nullable=False)
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_care_activity_session_time", "session_id", "logged_at"),
    )


# ── Caregiver Wallet ─��──────────────────────────────────────────

class CaregiverWallet(Base):
    __tablename__ = "caregiver_wallets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, unique=True)
    balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    bank_name: Mapped[str | None] = mapped_column(String(50))
    # 개인정보보호법 §29 + 전자금융거래법 — AES-GCM 암호화 저장
    bank_account_encrypted: Mapped[str | None] = mapped_column(String(500))
    account_holder: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def bank_account(self) -> str | None:
        return decrypt_value(self.bank_account_encrypted) if self.bank_account_encrypted else None

    @bank_account.setter
    def bank_account(self, value: str | None) -> None:
        self.bank_account_encrypted = encrypt_value(value) if value else None


# ── Caregiver Reviews ───────────────────────────────────────────

class CaregiverReview(Base):
    __tablename__ = "caregiver_reviews"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("cc_bookings.id"), nullable=False, unique=True)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    caregiver_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    comment: Mapped[str | None] = mapped_column(Text)
    caregiver_reply: Mapped[str | None] = mapped_column(Text)
    replied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_caregiver_reviews_cg_time", "caregiver_id", "created_at"),
    )
