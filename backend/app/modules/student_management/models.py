import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    guardian_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    grade: Mapped[str | None] = mapped_column(String(20))
    profile_photo_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("guardian_id", "name", "date_of_birth", name="uq_student_guardian"),
    )

    # Relationships
    guardian: Mapped["User"] = relationship(back_populates="students")  # type: ignore[name-defined] # noqa: F821
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="student")
    consents: Mapped[list["GuardianConsent"]] = relationship(back_populates="child")  # type: ignore[name-defined] # noqa: F821
    schedule_templates: Mapped[list["ScheduleTemplate"]] = relationship(back_populates="student")  # type: ignore[name-defined] # noqa: F821


class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("students.id"), nullable=False
    )
    academy_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("academies.id"), nullable=False
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("student_id", "academy_id", name="uq_enrollment"),
    )

    # Relationships
    student: Mapped["Student"] = relationship(back_populates="enrollments")
    academy: Mapped["Academy"] = relationship(back_populates="enrollments")  # type: ignore[name-defined] # noqa: F821
