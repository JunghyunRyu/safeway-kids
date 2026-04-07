"""PetTracker Pydantic schemas for request/response validation."""

import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, Field


# ── Pet Schemas ──────────────────────────────────────────────────

class PetCreate(BaseModel):
    name: str = Field(..., max_length=100)
    species: str = Field(default="dog", pattern="^(dog|cat)$")
    breed: str | None = None
    birth_date: date | None = None
    weight_kg: float | None = Field(None, gt=0, le=200)
    photo_url: str | None = None
    medical_notes: str | None = None
    temperament: str | None = None
    vaccination_status: str = "unknown"
    special_needs: str | None = None


class PetUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    breed: str | None = None
    weight_kg: float | None = Field(None, gt=0, le=200)
    photo_url: str | None = None
    medical_notes: str | None = None
    temperament: str | None = None
    vaccination_status: str | None = None
    special_needs: str | None = None


class PetResponse(BaseModel):
    id: uuid.UUID
    name: str
    species: str
    breed: str | None
    birth_date: date | None
    weight_kg: float | None
    photo_url: str | None
    medical_notes: str | None
    temperament: str | None
    vaccination_status: str
    special_needs: str | None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Walker Schemas ───────────────────────────────────────────────

class WalkerQualificationCreate(BaseModel):
    background_check_date: date | None = None
    background_check_doc_url: str | None = None
    certification_type: str | None = None
    certification_doc_url: str | None = None
    service_areas: list[dict] | None = None
    bio: str | None = None
    experience_years: int = 0


class WalkerProfileResponse(BaseModel):
    id: uuid.UUID
    name: str
    bio: str | None
    experience_years: int
    approval_status: str
    certification_type: str | None
    avg_rating: float | None = None
    total_walks: int = 0
    total_reviews: int = 0

    model_config = {"from_attributes": True}


class WalkerAvailabilityCreate(BaseModel):
    available_date: date
    start_time: time
    end_time: time


# ── Booking Schemas ──────────────────────────────────────────────

class BookingCreate(BaseModel):
    pet_id: uuid.UUID
    duration_minutes: int = Field(30, ge=30, le=120)
    scheduled_at: datetime
    pickup_latitude: float = Field(..., ge=-90, le=90)
    pickup_longitude: float = Field(..., ge=-180, le=180)
    pickup_address: str | None = None
    price: int = Field(..., gt=0)


class BookingResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    walker_id: uuid.UUID | None
    pet_id: uuid.UUID
    service_type: str
    duration_minutes: int
    scheduled_at: datetime
    pickup_address: str | None
    status: str
    price: int
    commission_rate: int
    created_at: datetime
    # Pet info (populated from relationship)
    pet_name: str | None = None
    pet_species: str | None = None
    pet_temperament: str | None = None
    pet_weight_kg: float | None = None
    pet_special_needs: str | None = None
    owner_name: str | None = None

    model_config = {"from_attributes": True}


# ── Walk Session Schemas ─────────────────────────────────────────

class GpsPoint(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    heading: float | None = None
    speed: float | None = None
    accuracy: float | None = None
    recorded_at: datetime


class WalkReportResponse(BaseModel):
    session_id: uuid.UUID
    booking_id: uuid.UUID
    started_at: datetime | None
    ended_at: datetime | None
    distance_meters: int | None
    walker_memo: str | None
    route_polyline: list | None

    model_config = {"from_attributes": True}


# ── Review Schemas ───────────────────────────────────────────────

class ReviewCreate(BaseModel):
    booking_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    reviewer_id: uuid.UUID
    walker_id: uuid.UUID
    rating: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Wallet Schemas ───────────────────────────────────────────────

class WalletResponse(BaseModel):
    balance: int
    bank_name: str | None
    account_holder: str | None
    commission_rate: int = 15

    model_config = {"from_attributes": True}


class WithdrawRequest(BaseModel):
    amount: int = Field(..., gt=0)


# ── Search Schemas ───────────────────────────────────────────────

class WalkerSearchParams(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    date: date
    radius_km: float = Field(default=3.0, gt=0, le=50)
