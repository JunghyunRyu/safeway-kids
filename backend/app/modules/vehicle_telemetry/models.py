import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    license_plate: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    operator_name: Mapped[str | None] = mapped_column(String(200))
    manufacture_year: Mapped[int | None] = mapped_column(Integer)
    school_bus_registration_no: Mapped[str | None] = mapped_column(String(30))
    is_yellow_painted: Mapped[bool] = mapped_column(Boolean, default=False)
    vehicle_type: Mapped[str | None] = mapped_column(String(30))
    has_cctv: Mapped[bool] = mapped_column(Boolean, default=False)
    has_stop_sign: Mapped[bool] = mapped_column(Boolean, default=False)
    last_inspection_date: Mapped[date | None] = mapped_column(Date)
    insurance_expiry: Mapped[date | None] = mapped_column(Date)
    insurance_type: Mapped[str | None] = mapped_column(String(50))  # 대인, 대물, 종합
    insurance_coverage_amount: Mapped[int | None] = mapped_column(Integer)  # 보장 금액 (만원)
    registration_expiry: Mapped[date | None] = mapped_column(Date)
    safety_inspection_expiry: Mapped[date | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    assignments: Mapped[list["VehicleAssignment"]] = relationship(back_populates="vehicle")


class VehicleAssignment(Base):
    __tablename__ = "vehicle_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vehicles.id"), nullable=False
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    safety_escort_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id")
    )
    assigned_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship(back_populates="assignments")


class LocationAccessLog(Base):
    """위치정보법 제16조: 위치정보 수집/이용/제공 기록 (6개월 보관)"""
    __tablename__ = "location_access_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    subject_type: Mapped[str] = mapped_column(String(20), nullable=False)  # driver, student
    subject_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("vehicles.id"), nullable=False)
    accessor_user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    access_purpose: Mapped[str] = mapped_column(String(100), nullable=False, default="safety_monitoring")
    accessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    retention_until: Mapped[date] = mapped_column(Date, nullable=False)


class GpsHistory(Base):
    __tablename__ = "gps_history"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vehicles.id"), nullable=False, index=True
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    heading: Mapped[float | None] = mapped_column(Float)
    speed: Mapped[float | None] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
