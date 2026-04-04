"""CareConnect service layer — children (PII encrypted), caregivers, bookings, sessions with geofence, wallets."""

import logging
import math
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.careconnect.models import (
    CareActivityLog,
    CaregiverAvailability,
    CaregiverQualification,
    CaregiverReview,
    CaregiverWallet,
    CareSession,
    CcBooking,
    CcBookingStatus,
    CcChild,
    ChildConsent,
)
from app.apps.careconnect.schemas import (
    ActivityLogCreate,
    AvailabilityCreate,
    CaregiverQualCreate,
    CcBookingCreate,
    CcReviewCreate,
    CheckinRequest,
    ChildCreate,
    ConsentCreate,
)
from app.common.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.common.security import decrypt_value, encrypt_value
from app.core.models import CommissionRecord, WalletTransaction
from app.modules.auth.models import APP_CARECONNECT

logger = logging.getLogger(__name__)

GEOFENCE_RADIUS_M = 200
GPS_ACCURACY_THRESHOLD_M = 50


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Child Service (PII Encrypted) ────────────────────────────────

def _age_group(birth_date) -> str:
    from datetime import date
    age = (date.today() - birth_date).days // 365
    if age < 1: return "infant"
    if age < 4: return "toddler"
    if age < 7: return "preschool"
    return "school_age"


async def create_child(db: AsyncSession, parent_id: uuid.UUID, data: ChildCreate) -> dict:
    child = CcChild(
        parent_id=parent_id,
        name_encrypted=encrypt_value(data.name),
        birth_date=data.birth_date,
        age_group=data.age_group or _age_group(data.birth_date),
        allergies_encrypted=encrypt_value(data.allergies) if data.allergies else None,
        medical_notes_encrypted=encrypt_value(data.medical_notes) if data.medical_notes else None,
        emergency_contact_encrypted=encrypt_value(data.emergency_contact) if data.emergency_contact else None,
        school_name=data.school_name,
        favorite_activities=data.favorite_activities,
        photo_url=data.photo_url,
    )
    db.add(child)
    await db.flush()
    return _decrypt_child(child)


def _decrypt_child(child: CcChild) -> dict:
    return {
        "id": child.id,
        "name": decrypt_value(child.name_encrypted),
        "birth_date": child.birth_date,
        "age_group": child.age_group,
        "allergies": decrypt_value(child.allergies_encrypted) if child.allergies_encrypted else None,
        "medical_notes": decrypt_value(child.medical_notes_encrypted) if child.medical_notes_encrypted else None,
        "emergency_contact": decrypt_value(child.emergency_contact_encrypted) if child.emergency_contact_encrypted else None,
        "school_name": child.school_name,
        "photo_url": child.photo_url,
        "is_active": child.is_active,
    }


async def list_children(db: AsyncSession, parent_id: uuid.UUID) -> list[dict]:
    stmt = select(CcChild).where(CcChild.parent_id == parent_id, CcChild.is_active.is_(True))
    children = (await db.execute(stmt)).scalars().all()
    return [_decrypt_child(c) for c in children]


# ── Consent Service ��─────────────────────────────────────────────

async def create_consent(
    db: AsyncSession, parent_id: uuid.UUID, data: ConsentCreate, ip: str | None = None,
) -> ChildConsent:
    # Verify child belongs to parent
    child = (await db.execute(
        select(CcChild).where(CcChild.id == data.child_id, CcChild.parent_id == parent_id)
    )).scalar_one_or_none()
    if not child:
        raise NotFoundError(detail="아이를 찾을 수 없습니다")

    # Check existing active consent
    existing = (await db.execute(
        select(ChildConsent).where(
            ChildConsent.child_id == data.child_id,
            ChildConsent.parent_id == parent_id,
            ChildConsent.withdrawn_at.is_(None),
        )
    )).scalar_one_or_none()
    if existing:
        raise ValidationError(detail="이미 유효한 동의가 존재합니다")

    consent = ChildConsent(
        parent_id=parent_id,
        child_id=data.child_id,
        consent_scope=data.consent_scope,
        ip_address=ip,
    )
    db.add(consent)
    await db.flush()
    return consent


# ── Caregiver Service ────────────────────────────────────────────

async def submit_caregiver_qualification(
    db: AsyncSession, user_id: uuid.UUID, data: CaregiverQualCreate,
) -> CaregiverQualification:
    existing = (await db.execute(
        select(CaregiverQualification).where(CaregiverQualification.user_id == user_id)
    )).scalar_one_or_none()
    if existing:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        existing.approval_status = "pending"
        await db.flush()
        return existing
    qual = CaregiverQualification(user_id=user_id, **data.model_dump())
    db.add(qual)
    await db.flush()
    return qual


async def approve_caregiver(
    db: AsyncSession, cg_user_id: uuid.UUID, admin_id: uuid.UUID, approve: bool,
) -> CaregiverQualification:
    qual = (await db.execute(
        select(CaregiverQualification).where(CaregiverQualification.user_id == cg_user_id)
    )).scalar_one_or_none()
    if not qual:
        raise NotFoundError(detail="돌봄자 자�� 정보를 찾을 수 없습니다")
    qual.approval_status = "approved" if approve else "rejected"
    qual.approved_at = datetime.now(UTC) if approve else None
    qual.approved_by = admin_id if approve else None
    await db.flush()
    return qual


async def get_caregiver_profile(db: AsyncSession, cg_id: uuid.UUID) -> dict:
    from app.modules.auth.models import User
    user = (await db.execute(select(User).where(User.id == cg_id))).scalar_one_or_none()
    if not user:
        raise NotFoundError(detail="돌봄자를 찾을 수 없습니다")
    qual = (await db.execute(
        select(CaregiverQualification).where(CaregiverQualification.user_id == cg_id)
    )).scalar_one_or_none()

    rating_r = await db.execute(
        select(func.avg(CaregiverReview.rating), func.count(CaregiverReview.id))
        .where(CaregiverReview.caregiver_id == cg_id)
    )
    avg_rating, total_reviews = rating_r.one()
    total_sessions = (await db.execute(
        select(func.count(CareSession.id)).where(CareSession.caregiver_id == cg_id)
    )).scalar() or 0

    return {
        "id": user.id, "name": user.name,
        "bio": qual.bio if qual else None,
        "experience_years": qual.experience_years if qual else 0,
        "approval_status": qual.approval_status if qual else "pending",
        "has_background_check": bool(qual and qual.background_check_date),
        "has_child_abuse_check": bool(qual and qual.child_abuse_check_date),
        "has_sex_offense_check": bool(qual and qual.sex_offense_check_date),
        "has_cpr_cert": bool(qual and qual.cpr_cert_date),
        "avg_rating": round(float(avg_rating), 1) if avg_rating else None,
        "total_sessions": total_sessions,
        "total_reviews": total_reviews or 0,
    }


async def search_caregivers(db: AsyncSession, lat: float, lon: float, date_val, radius_km: float = 5.0) -> list[dict]:
    from app.modules.auth.models import User, UserRole
    stmt = (
        select(User, CaregiverQualification, CaregiverAvailability)
        .join(CaregiverQualification, CaregiverQualification.user_id == User.id)
        .join(CaregiverAvailability, CaregiverAvailability.caregiver_id == User.id)
        .where(
            User.role == UserRole.CAREGIVER,
            User.app_context == APP_CARECONNECT,
            User.is_active.is_(True),
            CaregiverQualification.approval_status == "approved",
            CaregiverAvailability.available_date == date_val,
            CaregiverAvailability.status == "available",
        )
    )
    rows = (await db.execute(stmt)).all()
    results = []
    for user, qual, _ in rows:
        if not qual.service_areas:
            continue
        for area in qual.service_areas:
            dist = haversine_m(lat, lon, area.get("lat", 0), area.get("lon", 0)) / 1000
            if dist <= radius_km:
                rating_r = await db.execute(
                    select(func.avg(CaregiverReview.rating)).where(CaregiverReview.caregiver_id == user.id)
                )
                avg_rating = rating_r.scalar()
                results.append({
                    "id": user.id, "name": user.name, "distance_km": round(dist, 1),
                    "avg_rating": round(float(avg_rating), 1) if avg_rating else None,
                    "bio": qual.bio, "experience_years": qual.experience_years,
                    "has_background_check": bool(qual.background_check_date),
                    "has_child_abuse_check": bool(qual.child_abuse_check_date),
                    "has_cpr_cert": bool(qual.cpr_cert_date),
                })
                break
    results.sort(key=lambda x: (-(x.get("avg_rating") or 0), x["distance_km"]))
    return results


# ── Booking Service ──────────────────────────────────────────────

async def create_cc_booking(db: AsyncSession, parent_id: uuid.UUID, data: CcBookingCreate) -> CcBooking:
    child = (await db.execute(
        select(CcChild).where(CcChild.id == data.child_id, CcChild.parent_id == parent_id, CcChild.is_active.is_(True))
    )).scalar_one_or_none()
    if not child:
        raise NotFoundError(detail="아이를 찾을 수 없습니다")

    # Check consent exists
    consent = (await db.execute(
        select(ChildConsent).where(
            ChildConsent.child_id == data.child_id, ChildConsent.parent_id == parent_id,
            ChildConsent.withdrawn_at.is_(None),
        )
    )).scalar_one_or_none()
    if not consent:
        raise ValidationError(detail="14세 미만 아동에 대한 법정대리인 동의가 필요합니다")

    booking = CcBooking(
        parent_id=parent_id, child_id=data.child_id,
        care_type="visit", scheduled_at=data.scheduled_at,
        duration_hours=data.duration_hours, hourly_rate=data.hourly_rate,
        care_latitude=data.care_latitude, care_longitude=data.care_longitude,
        care_address=data.care_address, commission_rate=20,
        status=CcBookingStatus.PENDING,
        timeout_at=data.scheduled_at + timedelta(minutes=30),
    )
    db.add(booking)
    await db.flush()
    return booking


async def accept_cc_booking(db: AsyncSession, booking_id: uuid.UUID, cg_id: uuid.UUID) -> CcBooking:
    booking = (await db.execute(
        select(CcBooking).where(CcBooking.id == booking_id, CcBooking.status == CcBookingStatus.PENDING)
    )).scalar_one_or_none()
    if not booking:
        raise NotFoundError(detail="예약을 찾을 수 없거나 이미 처리되었습니다")
    booking.caregiver_id = cg_id
    booking.status = CcBookingStatus.CONFIRMED
    booking.accepted_at = datetime.now(UTC)
    await db.flush()
    return booking


async def cancel_cc_booking(db: AsyncSession, booking_id: uuid.UUID, user_id: uuid.UUID, reason: str | None = None) -> CcBooking:
    booking = (await db.execute(select(CcBooking).where(CcBooking.id == booking_id))).scalar_one_or_none()
    if not booking:
        raise NotFoundError(detail="예약을 찾을 수 없습니다")
    if booking.parent_id != user_id and booking.caregiver_id != user_id:
        raise ForbiddenError(detail="이 예약을 취소할 권한이 없습니다")
    if booking.status in (CcBookingStatus.COMPLETED, CcBookingStatus.CANCELLED):
        raise ValidationError(detail="이미 완료되거나 취소된 예약��니다")
    booking.status = CcBookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(UTC)
    booking.cancel_reason = reason
    await db.flush()
    return booking


async def list_cc_bookings(db: AsyncSession, user_id: uuid.UUID, role: str, status: str | None = None) -> list[CcBooking]:
    if role == "parent":
        stmt = select(CcBooking).where(CcBooking.parent_id == user_id)
    else:
        stmt = select(CcBooking).where(CcBooking.caregiver_id == user_id)
    if status:
        stmt = stmt.where(CcBooking.status == status)
    return list((await db.execute(stmt.order_by(CcBooking.scheduled_at.desc()))).scalars().all())


# ── Session Service (Geofence Check-in) ──────────────────────────

async def checkin(db: AsyncSession, booking_id: uuid.UUID, cg_id: uuid.UUID, data: CheckinRequest) -> CareSession:
    booking = (await db.execute(
        select(CcBooking).where(
            CcBooking.id == booking_id, CcBooking.caregiver_id == cg_id,
            CcBooking.status == CcBookingStatus.CONFIRMED,
        )
    )).scalar_one_or_none()
    if not booking:
        raise NotFoundError(detail="확정된 예약을 찾을 수 없습니다")

    # GPS accuracy check
    if data.accuracy > GPS_ACCURACY_THRESHOLD_M:
        raise ValidationError(detail=f"GPS 정확도가 부족합니다 ({data.accuracy:.0f}m). {GPS_ACCURACY_THRESHOLD_M}m 이내여야 합니다")

    # Geofence check (200m)
    distance = haversine_m(data.latitude, data.longitude, booking.care_latitude, booking.care_longitude)
    if distance > GEOFENCE_RADIUS_M:
        raise ValidationError(
            detail=f"돌봄 주소 {GEOFENCE_RADIUS_M}m 반경 내에서 체크인해 주세요 (현재 거리: {distance:.0f}m)"
        )

    booking.status = CcBookingStatus.IN_PROGRESS

    session = CareSession(
        booking_id=booking_id, caregiver_id=cg_id,
        checked_in_at=datetime.now(UTC),
        checkin_latitude=data.latitude,
        checkin_longitude=data.longitude,
        checkin_accuracy=data.accuracy,
    )
    db.add(session)
    await db.flush()
    return session


async def add_activity_log(db: AsyncSession, session_id: uuid.UUID, cg_id: uuid.UUID, data: ActivityLogCreate) -> CareActivityLog:
    session = (await db.execute(
        select(CareSession).where(CareSession.id == session_id, CareSession.caregiver_id == cg_id)
    )).scalar_one_or_none()
    if not session:
        raise NotFoundError(detail="돌봄 세션을 찾을 수 없습니다")
    if session.checked_out_at:
        raise ValidationError(detail="이미 종료된 세션입니다")

    log = CareActivityLog(session_id=session_id, activity_type=data.activity_type, description=data.description, photo_url=data.photo_url)
    db.add(log)
    await db.flush()
    return log


async def checkout(db: AsyncSession, session_id: uuid.UUID, cg_id: uuid.UUID) -> CareSession:
    session = (await db.execute(
        select(CareSession).where(CareSession.id == session_id, CareSession.caregiver_id == cg_id)
    )).scalar_one_or_none()
    if not session:
        raise NotFoundError(detail="돌봄 세션을 찾을 수 없습니다")
    if session.checked_out_at:
        raise ValidationError(detail="이미 체크아웃되었습니다")

    session.checked_out_at = datetime.now(UTC)
    if session.checked_in_at:
        session.total_minutes = int((session.checked_out_at - session.checked_in_at).total_seconds() / 60)
    await db.flush()
    return session


async def confirm_handover(db: AsyncSession, session_id: uuid.UUID, parent_id: uuid.UUID) -> CareSession:
    session = (await db.execute(select(CareSession).where(CareSession.id == session_id))).scalar_one_or_none()
    if not session:
        raise NotFoundError(detail="돌봄 세션을 찾을 수 없습니다")

    # Verify parent owns the booking
    booking = (await db.execute(
        select(CcBooking).where(CcBooking.id == session.booking_id, CcBooking.parent_id == parent_id)
    )).scalar_one_or_none()
    if not booking:
        raise ForbiddenError(detail="이 세션에 대한 권한이 없습니다")

    session.handover_confirmed_at = datetime.now(UTC)
    booking.status = CcBookingStatus.COMPLETED

    # Commission + wallet credit
    total_price = int(booking.hourly_rate * booking.duration_hours)
    commission_amount = total_price * booking.commission_rate // 100
    provider_amount = total_price - commission_amount

    db.add(CommissionRecord(
        app_context=APP_CARECONNECT, booking_id=booking.id, booking_type="cc_booking",
        gross_amount=total_price, commission_rate=booking.commission_rate,
        commission_amount=commission_amount, provider_amount=provider_amount,
    ))

    wallet = (await db.execute(
        select(CaregiverWallet).where(CaregiverWallet.user_id == session.caregiver_id)
    )).scalar_one_or_none()
    if not wallet:
        wallet = CaregiverWallet(user_id=session.caregiver_id)
        db.add(wallet)
        await db.flush()
    wallet.balance += provider_amount

    db.add(WalletTransaction(
        wallet_type="caregiver", wallet_id=wallet.id, amount=provider_amount,
        tx_type="earning", reference_id=booking.id, reference_type="cc_booking", status="completed",
    ))
    await db.flush()
    return session


# ── Review + Wallet (parallel to PetTracker pattern) ─────────────

async def create_cc_review(db: AsyncSession, reviewer_id: uuid.UUID, data: CcReviewCreate) -> CaregiverReview:
    booking = (await db.execute(
        select(CcBooking).where(CcBooking.id == data.booking_id, CcBooking.parent_id == reviewer_id, CcBooking.status == CcBookingStatus.COMPLETED)
    )).scalar_one_or_none()
    if not booking:
        raise NotFoundError(detail="완료된 예약을 찾을 수 없습니다")
    if not booking.caregiver_id:
        raise ValidationError(detail="돌봄자가 배정되지 않은 예약입니다")
    existing = (await db.execute(select(CaregiverReview).where(CaregiverReview.booking_id == data.booking_id))).scalar_one_or_none()
    if existing:
        raise ValidationError(detail="이미 리뷰를 작성했습니다")
    review = CaregiverReview(booking_id=data.booking_id, reviewer_id=reviewer_id, caregiver_id=booking.caregiver_id, rating=data.rating, comment=data.comment)
    db.add(review)
    await db.flush()
    return review


async def get_cc_wallet(db: AsyncSession, user_id: uuid.UUID) -> CaregiverWallet:
    wallet = (await db.execute(select(CaregiverWallet).where(CaregiverWallet.user_id == user_id))).scalar_one_or_none()
    if not wallet:
        wallet = CaregiverWallet(user_id=user_id)
        db.add(wallet)
        await db.flush()
    return wallet


async def cc_withdraw(db: AsyncSession, user_id: uuid.UUID, amount: int) -> WalletTransaction:
    wallet = await get_cc_wallet(db, user_id)
    if wallet.balance < amount:
        raise ValidationError(detail=f"잔액이 부족합니다. 현재: {wallet.balance:,}원")
    wallet.balance -= amount
    tx = WalletTransaction(wallet_type="caregiver", wallet_id=wallet.id, amount=-amount, tx_type="withdrawal", status="pending")
    db.add(tx)
    await db.flush()
    return tx
