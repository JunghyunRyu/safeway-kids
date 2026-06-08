"""CareConnect Pydantic schemas."""

import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, Field


class ChildCreate(BaseModel):
    name: str = Field(..., max_length=100)
    birth_date: date
    age_group: str = Field(..., pattern="^(infant|toddler|preschool|school_age)$")
    allergies: str | None = None
    medical_notes: str | None = None
    emergency_contact: str | None = None
    school_name: str | None = None
    favorite_activities: list[str] | None = None
    photo_url: str | None = None


class ChildResponse(BaseModel):
    id: uuid.UUID
    name: str  # decrypted
    birth_date: date
    age_group: str
    allergies: str | None  # decrypted
    medical_notes: str | None  # decrypted
    emergency_contact: str | None  # decrypted
    school_name: str | None
    photo_url: str | None
    is_active: bool
    model_config = {"from_attributes": True}


class ConsentCreate(BaseModel):
    child_id: uuid.UUID
    consent_scope: dict  # {"gps_tracking": true, "activity_photos": true, ...}


class CaregiverQualCreate(BaseModel):
    background_check_date: date | None = None
    background_check_doc_url: str | None = None
    child_abuse_check_date: date | None = None
    child_abuse_doc_url: str | None = None
    sex_offense_check_date: date | None = None
    sex_offense_doc_url: str | None = None
    cpr_cert_date: date | None = None
    cpr_doc_url: str | None = None
    bio: str | None = None
    experience_years: int = 0
    service_areas: list[dict] | None = None
    preferred_age_groups: list[str] | None = None


class CaregiverProfileResponse(BaseModel):
    id: uuid.UUID
    name: str
    bio: str | None
    experience_years: int
    approval_status: str
    has_background_check: bool
    has_child_abuse_check: bool
    has_sex_offense_check: bool
    has_cpr_cert: bool
    has_insurance: bool = False
    avg_rating: float | None = None
    total_sessions: int = 0
    total_reviews: int = 0
    model_config = {"from_attributes": True}


class CcBookingCreate(BaseModel):
    child_id: uuid.UUID
    duration_hours: float = Field(..., gt=0, le=12)
    scheduled_at: datetime
    hourly_rate: int = Field(..., gt=0)
    care_latitude: float = Field(..., ge=-90, le=90)
    care_longitude: float = Field(..., ge=-180, le=180)
    care_address: str | None = None


class CcBookingResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    caregiver_id: uuid.UUID | None
    caregiver_name: str | None = None
    child_id: uuid.UUID
    child_name: str | None = None
    care_type: str
    scheduled_at: datetime
    duration_hours: float
    hourly_rate: int
    care_address: str | None
    status: str
    commission_rate: int
    created_at: datetime
    model_config = {"from_attributes": True}


class CheckinRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: float = Field(..., ge=0)


class ActivityLogCreate(BaseModel):
    activity_type: str = Field(..., pattern="^(homework|play|meal|snack|nap|outdoor|other)$")
    description: str | None = None
    photo_url: str | None = None


class CcReviewCreate(BaseModel):
    booking_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class AvailabilityCreate(BaseModel):
    available_date: date
    start_time: time
    end_time: time


class CcWalletResponse(BaseModel):
    balance: int
    bank_name: str | None
    account_holder: str | None
    commission_rate: int = 20
    model_config = {"from_attributes": True}


class ReviewReplyRequest(BaseModel):
    reply: str = Field(..., min_length=1, max_length=1000)


class SessionMemoRequest(BaseModel):
    memo: str = Field(..., min_length=1, max_length=2000)


class WithdrawRequest(BaseModel):
    amount: int = Field(..., gt=0)


# ── Payments (PortOne v2) — PetTracker 패리티 ─────────────────────

class CcPaymentPrepareRequest(BaseModel):
    booking_id: uuid.UUID


class CcPaymentPrepareResponse(BaseModel):
    payment_id: uuid.UUID
    merchant_uid: str
    amount: int
    currency: str = "KRW"
    pg_provider: str = "portone"


class CcPaymentConfirmRequest(BaseModel):
    imp_uid: str = Field(..., min_length=1, max_length=100)
    merchant_uid: str = Field(..., min_length=1, max_length=100)


class CcPaymentConfirmResponse(BaseModel):
    payment_id: uuid.UUID
    status: str
    amount: int
    paid_at: datetime | None
    imp_uid: str | None


class CcPaymentCancelRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=200)
    cancel_amount: int | None = Field(None, gt=0)


class CcPaymentCancelResponse(BaseModel):
    payment_id: uuid.UUID
    status: str
    cancel_amount: int | None
    cancelled_at: datetime | None
