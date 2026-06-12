import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Index, String, UniqueConstraint, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(enum.StrEnum):
    PARENT = "parent"
    DRIVER = "driver"
    STUDENT = "student"
    SAFETY_ESCORT = "safety_escort"
    ACADEMY_ADMIN = "academy_admin"
    PLATFORM_ADMIN = "platform_admin"
    # Multi-app roles (PetTracker / CareConnect)
    PET_OWNER = "pet_owner"
    WALKER = "walker"
    CAREGIVER = "caregiver"


# App context constants
APP_SAFEWAY_KIDS = "safeway_kids"
APP_PETTRACKER = "pettracker"
APP_CARECONNECT = "careconnect"

VALID_APP_CONTEXTS = {APP_SAFEWAY_KIDS, APP_PETTRACKER, APP_CARECONNECT}

# Role-to-app mapping for validation
ROLE_APP_MAP: dict[UserRole, str] = {
    UserRole.PARENT: APP_SAFEWAY_KIDS,
    UserRole.DRIVER: APP_SAFEWAY_KIDS,
    UserRole.STUDENT: APP_SAFEWAY_KIDS,
    UserRole.SAFETY_ESCORT: APP_SAFEWAY_KIDS,
    UserRole.ACADEMY_ADMIN: APP_SAFEWAY_KIDS,
    UserRole.PLATFORM_ADMIN: APP_SAFEWAY_KIDS,  # admin can access all apps
    UserRole.PET_OWNER: APP_PETTRACKER,
    UserRole.WALKER: APP_PETTRACKER,
    UserRole.CAREGIVER: APP_CARECONNECT,
}


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    kakao_id: Mapped[str | None] = mapped_column(String(100))
    firebase_uid: Mapped[str | None] = mapped_column(String(128), unique=True)
    portone_customer_uid: Mapped[str | None] = mapped_column(String(128))
    fcm_token: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    app_context: Mapped[str] = mapped_column(
        String(30), nullable=False, default=APP_SAFEWAY_KIDS
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    academy_sub_role: Mapped[str | None] = mapped_column(String(20))  # P3-67: owner / manager / staff
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("phone", "app_context", name="uq_users_phone_app"),
        Index("ix_users_kakao_app", "kakao_id", "app_context", unique=True, postgresql_where=text("kakao_id IS NOT NULL")),
    )

    # Relationships
    students: Mapped[list["Student"]] = relationship(back_populates="guardian", foreign_keys="[Student.guardian_id]")  # type: ignore[name-defined] # noqa: F821
    consents: Mapped[list["GuardianConsent"]] = relationship(back_populates="guardian")  # type: ignore[name-defined] # noqa: F821


class ConsentDocType(enum.StrEnum):
    TERMS = "terms"
    PRIVACY = "privacy"
    LOCATION = "location"
    MARKETING = "marketing"
    AGE14 = "age14"


class UserConsent(Base):
    """약관·개인정보·위치정보 동의 기록 — Tech Spec FR-C1 (2026-06-11).

    개인정보보호법 §15/§22 증빙: 어떤 문서 버전(doc_version)에 어떤 방식
    (consent_method)으로 언제(granted_at) 동의했는지 행 단위 보존.
    철회는 행 삭제가 아니라 withdrawn_at 기록 (감사 추적 유지).
    GuardianConsent(SafeWay 아동 동의)와 별개 — 사용자 본인 동의 전용.
    """

    __tablename__ = "user_consents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    doc_type: Mapped[str] = mapped_column(String(20), nullable=False)
    doc_version: Mapped[str] = mapped_column(String(64), nullable=False)
    consent_method: Mapped[str] = mapped_column(
        String(40), nullable=False, default="mobile_checkbox_v1"
    )
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_address: Mapped[str | None] = mapped_column(String(45))

    __table_args__ = (
        Index("ix_user_consents_user_doc", "user_id", "doc_type"),
    )


class DriverQualification(Base):
    __tablename__ = "driver_qualifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), unique=True)
    license_number: Mapped[str] = mapped_column(String(20))
    license_type: Mapped[str] = mapped_column(String(50))  # 1종대형, 1종보통 등
    license_expiry: Mapped[date] = mapped_column(Date)
    criminal_check_date: Mapped[date | None] = mapped_column(Date)
    criminal_check_clear: Mapped[bool] = mapped_column(Boolean, default=False)
    safety_training_date: Mapped[date | None] = mapped_column(Date)
    safety_training_expiry: Mapped[date | None] = mapped_column(Date)
    is_qualified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
