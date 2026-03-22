import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(enum.StrEnum):
    PARENT = "parent"
    DRIVER = "driver"
    STUDENT = "student"
    SAFETY_ESCORT = "safety_escort"
    ACADEMY_ADMIN = "academy_admin"
    PLATFORM_ADMIN = "platform_admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    kakao_id: Mapped[str | None] = mapped_column(String(100), unique=True)
    fcm_token: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    students: Mapped[list["Student"]] = relationship(back_populates="guardian", foreign_keys="[Student.guardian_id]")  # type: ignore[name-defined] # noqa: F821
    consents: Mapped[list["GuardianConsent"]] = relationship(back_populates="guardian")  # type: ignore[name-defined] # noqa: F821


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
