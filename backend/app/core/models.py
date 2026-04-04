"""
Shared models for multi-app platform.
These tables are used by PetTracker, CareConnect, and SafeWay Kids.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Uuid, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WalletTransaction(Base):
    """Shared wallet transaction ledger for walker and caregiver payouts."""
    __tablename__ = "wallet_transactions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    wallet_type: Mapped[str] = mapped_column(String(20), nullable=False)  # walker, caregiver
    wallet_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # + credit, - debit (KRW)
    tx_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # earning, withdrawal, refund, adjustment
    reference_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)  # booking_id
    reference_type: Mapped[str | None] = mapped_column(String(30))  # pt_booking, cc_booking
    pg_transfer_id: Mapped[str | None] = mapped_column(String(200))  # Toss transfer ID
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, completed, failed
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CommissionRecord(Base):
    """Platform commission records per booking."""
    __tablename__ = "commission_records"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    app_context: Mapped[str] = mapped_column(String(30), nullable=False)
    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    booking_type: Mapped[str] = mapped_column(String(30), nullable=False)  # pt_booking, cc_booking
    gross_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # total payment KRW
    commission_rate: Mapped[int] = mapped_column(Integer, nullable=False)  # 15 or 20 (percent)
    commission_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # platform take KRW
    provider_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # walker/caregiver KRW
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class LocationConsent(Base):
    """Location tracking consent for walkers and caregivers (위치정보법)."""
    __tablename__ = "location_consents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    app_context: Mapped[str] = mapped_column(String(30), nullable=False)
    consent_granted: Mapped[bool] = mapped_column(Boolean, default=True)
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_address: Mapped[str | None] = mapped_column(String(45))


class Subscription(Base):
    """Premium subscription plans for all apps."""
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    app_context: Mapped[str] = mapped_column(String(30), nullable=False)
    plan_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # owner_premium, walker_premium, parent_premium, caregiver_premium
    price: Mapped[int] = mapped_column(Integer, nullable=False)  # 4900 or 9900 KRW
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )  # active, cancelled, expired
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    pg_subscription_key: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
