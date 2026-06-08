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

from app.common.security import decrypt_value, encrypt_value

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


class PtPaymentStatus(enum.StrEnum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class WalkPhotoCaptionStatus(enum.StrEnum):
    """축 B 캡션 생성 라이프사이클 — Tech Spec FR-B2."""
    PENDING = "pending"        # 업로드 직후, LLM 캡션 대기
    GENERATED = "generated"    # LLM 캡션 생성 완료
    EDITED = "edited"          # 펫시터 1-tap 수정 (FR-B5)
    FAILED = "failed"          # LLM 호출 실패/timeout (EC-1)


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
    # 반려동물 의료 정보 — AES-GCM 암호화 (보호자 신뢰 + 도메인 PII 동격 처리)
    medical_notes_encrypted: Mapped[str | None] = mapped_column(Text)
    temperament: Mapped[str | None] = mapped_column(String(50))  # calm, active, aggressive, anxious
    vaccination_status: Mapped[str] = mapped_column(String(20), default="unknown")
    special_needs: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def medical_notes(self) -> str | None:
        return decrypt_value(self.medical_notes_encrypted) if self.medical_notes_encrypted else None

    @medical_notes.setter
    def medical_notes(self, value: str | None) -> None:
        self.medical_notes_encrypted = encrypt_value(value) if value else None


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
    has_insurance: Mapped[bool] = mapped_column(Boolean, default=False)
    insurance_expiry: Mapped[date | None] = mapped_column(Date)
    profile_photo_url: Mapped[str | None] = mapped_column(String(500))
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
    recurrence_type: Mapped[str | None] = mapped_column(String(20))  # none, daily, weekly, biweekly
    recurrence_end_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("walker_id", "available_date", "start_time", name="uq_walker_avail_date_time"),
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


# ── Walk Photos (AI 캡션 + 컨디션 영속 레이어) ──────────────────────

class WalkPhoto(Base):
    """산책 사진 + AI 캡션/컨디션 — Tech Spec FR-B2 / FR-F2.

    축 B(산책 사진 자동 캡션) + 축 F(사진 → 펫 컨디션 1줄)의 영속 레이어.
    본 슬라이스(P1-3)는 스키마 골격만 추가한다 — 업로드 시 caption_status
    "pending"으로 INSERT 되고, 실제 LLM 캡션/컨디션 채움은 P2-2
    (generate_caption BackgroundTask)에서 wire 한다. 지금은 LLM 호출 0.
    """

    __tablename__ = "walk_photos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("walk_sessions.id"), nullable=False
    )
    s3_key: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(Text)
    caption_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending"
    )
    # 축 F — 사진 → 펫 컨디션 1줄 (베타). LLM(P2-2)이 캡션과 동일 응답에 통합.
    # 값: 활기 | 평온 | 지친_듯 | 이상 | 불명 (varchar — 코드베이스 enum 컨벤션 준수)
    condition: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    session: Mapped["WalkSession"] = relationship(lazy="joined")

    __table_args__ = (
        Index("ix_walk_photos_session_created", "session_id", "created_at"),
    )


# ── Walker Wallet ────────────────────────────────────────────────

class WalkerWallet(Base):
    __tablename__ = "walker_wallets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False, unique=True)
    balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # KRW
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


# ── Walker Reviews ───────────────────────────────────────────────

class WalkerReview(Base):
    __tablename__ = "walker_reviews"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("pt_bookings.id"), nullable=False, unique=True)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    walker_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    comment: Mapped[str | None] = mapped_column(Text)
    walker_reply: Mapped[str | None] = mapped_column(Text)
    replied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_walker_reviews_walker_time", "walker_id", "created_at"),
    )


# ── PetTracker Payments (PortOne v2) ─────────────────────────────

class PtPayment(Base):
    """PortOne v2 결제 기록 — Tech Spec FR-1.1.

    SafeWay Kids `payments` 테이블과 격리: 컬럼 academy_id 등 도메인 강결합 회피.
    pg_provider 컬럼으로 향후 다른 PG 추가 가능 (현재는 "portone" 단일).
    """

    __tablename__ = "pt_payments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("pt_bookings.id"), nullable=False, index=True
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # KRW (정수)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="KRW")
    pg_provider: Mapped[str] = mapped_column(String(20), nullable=False, default="portone")
    imp_uid: Mapped[str | None] = mapped_column(String(100), unique=True, index=True)
    merchant_uid: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancel_amount: Mapped[int | None] = mapped_column(Integer)
    cancel_reason: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    booking: Mapped["PtBooking"] = relationship(lazy="joined")

    __table_args__ = (
        Index("ix_pt_payments_booking_status", "booking_id", "status"),
    )
