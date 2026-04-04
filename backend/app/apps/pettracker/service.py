"""PetTracker service layer — business logic for pets, walkers, bookings, walks, wallets."""

import logging
import math
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker.models import (
    Pet,
    PtBooking,
    PtBookingStatus,
    WalkGpsHistory,
    WalkSession,
    WalkerAvailability,
    WalkerQualification,
    WalkerReview,
    WalkerWallet,
)
from app.apps.pettracker.schemas import (
    BookingCreate,
    GpsPoint,
    PetCreate,
    PetUpdate,
    ReviewCreate,
    WalkerAvailabilityCreate,
    WalkerQualificationCreate,
    WalkerSearchParams,
)
from app.common.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.core.models import CommissionRecord, WalletTransaction
from app.modules.auth.models import APP_PETTRACKER

logger = logging.getLogger(__name__)


# ── Haversine ────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two GPS coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Pet Service ──────────────────────────────────────────────────

async def create_pet(db: AsyncSession, owner_id: uuid.UUID, data: PetCreate) -> Pet:
    pet = Pet(owner_id=owner_id, **data.model_dump())
    db.add(pet)
    await db.flush()
    return pet


async def list_pets(db: AsyncSession, owner_id: uuid.UUID) -> list[Pet]:
    stmt = select(Pet).where(Pet.owner_id == owner_id, Pet.is_active.is_(True)).order_by(Pet.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_pet(db: AsyncSession, pet_id: uuid.UUID, owner_id: uuid.UUID, data: PetUpdate) -> Pet:
    stmt = select(Pet).where(Pet.id == pet_id, Pet.owner_id == owner_id, Pet.is_active.is_(True))
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if not pet:
        raise NotFoundError(detail="반려동물을 찾을 수 없습니다")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pet, field, value)
    await db.flush()
    return pet


# ── Walker Qualification Service ─────────────────────────────────

async def submit_qualification(
    db: AsyncSession, user_id: uuid.UUID, data: WalkerQualificationCreate,
) -> WalkerQualification:
    existing = (await db.execute(
        select(WalkerQualification).where(WalkerQualification.user_id == user_id)
    )).scalar_one_or_none()
    if existing:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        existing.approval_status = "pending"
        await db.flush()
        return existing
    qual = WalkerQualification(user_id=user_id, **data.model_dump())
    db.add(qual)
    await db.flush()
    return qual


async def approve_walker(
    db: AsyncSession, walker_user_id: uuid.UUID, admin_id: uuid.UUID, approve: bool,
) -> WalkerQualification:
    stmt = select(WalkerQualification).where(WalkerQualification.user_id == walker_user_id)
    result = await db.execute(stmt)
    qual = result.scalar_one_or_none()
    if not qual:
        raise NotFoundError(detail="워커 자격 정보를 찾을 수 없습니다")
    qual.approval_status = "approved" if approve else "rejected"
    qual.approved_at = datetime.now(UTC) if approve else None
    qual.approved_by = admin_id if approve else None
    await db.flush()
    return qual


async def get_walker_profile(db: AsyncSession, walker_id: uuid.UUID) -> dict:
    from app.modules.auth.models import User
    user = (await db.execute(select(User).where(User.id == walker_id))).scalar_one_or_none()
    if not user:
        raise NotFoundError(detail="워커를 찾을 수 없습니다")
    qual = (await db.execute(
        select(WalkerQualification).where(WalkerQualification.user_id == walker_id)
    )).scalar_one_or_none()

    # Avg rating + counts
    rating_result = await db.execute(
        select(func.avg(WalkerReview.rating), func.count(WalkerReview.id))
        .where(WalkerReview.walker_id == walker_id)
    )
    avg_rating, total_reviews = rating_result.one()
    total_walks = (await db.execute(
        select(func.count(WalkSession.id)).where(WalkSession.walker_id == walker_id)
    )).scalar() or 0

    return {
        "id": user.id,
        "name": user.name,
        "bio": qual.bio if qual else None,
        "experience_years": qual.experience_years if qual else 0,
        "approval_status": qual.approval_status if qual else "pending",
        "certification_type": qual.certification_type if qual else None,
        "avg_rating": round(float(avg_rating), 1) if avg_rating else None,
        "total_walks": total_walks,
        "total_reviews": total_reviews or 0,
    }


# ── Walker Availability Service ──────────────────────────────────

async def set_availability(
    db: AsyncSession, walker_id: uuid.UUID, data: WalkerAvailabilityCreate,
) -> WalkerAvailability:
    existing = (await db.execute(
        select(WalkerAvailability).where(
            WalkerAvailability.walker_id == walker_id,
            WalkerAvailability.available_date == data.available_date,
        )
    )).scalar_one_or_none()
    if existing:
        existing.start_time = data.start_time
        existing.end_time = data.end_time
        existing.status = "available"
        await db.flush()
        return existing
    avail = WalkerAvailability(walker_id=walker_id, **data.model_dump())
    db.add(avail)
    await db.flush()
    return avail


async def list_availability(db: AsyncSession, walker_id: uuid.UUID) -> list[WalkerAvailability]:
    stmt = (
        select(WalkerAvailability)
        .where(WalkerAvailability.walker_id == walker_id, WalkerAvailability.status == "available")
        .order_by(WalkerAvailability.available_date)
    )
    return list((await db.execute(stmt)).scalars().all())


# ── Walker Search (Haversine + bounding box) ─────────────────────

async def search_walkers(db: AsyncSession, params: WalkerSearchParams) -> list[dict]:
    """Find available, approved walkers within radius on a given date."""
    from app.modules.auth.models import User, UserRole

    # Get all approved walkers available on that date
    stmt = (
        select(User, WalkerQualification, WalkerAvailability)
        .join(WalkerQualification, WalkerQualification.user_id == User.id)
        .join(WalkerAvailability, WalkerAvailability.walker_id == User.id)
        .where(
            User.role == UserRole.WALKER,
            User.app_context == APP_PETTRACKER,
            User.is_active.is_(True),
            WalkerQualification.approval_status == "approved",
            WalkerAvailability.available_date == params.date,
            WalkerAvailability.status == "available",
        )
    )
    rows = (await db.execute(stmt)).all()

    results = []
    for user, qual, avail in rows:
        # Check if walker has service areas with coordinates
        if not qual.service_areas:
            continue
        for area in qual.service_areas:
            area_lat = area.get("lat", 0)
            area_lon = area.get("lon", 0)
            dist = haversine_km(params.latitude, params.longitude, area_lat, area_lon)
            if dist <= params.radius_km:
                # Get rating
                rating_r = await db.execute(
                    select(func.avg(WalkerReview.rating)).where(WalkerReview.walker_id == user.id)
                )
                avg_rating = rating_r.scalar()
                results.append({
                    "id": user.id,
                    "name": user.name,
                    "distance_km": round(dist, 1),
                    "avg_rating": round(float(avg_rating), 1) if avg_rating else None,
                    "bio": qual.bio,
                    "experience_years": qual.experience_years,
                    "certification_type": qual.certification_type,
                })
                break

    results.sort(key=lambda x: (-(x.get("avg_rating") or 0), x["distance_km"]))
    return results


# ── Booking Service ──────────────────────────────────────────────

async def create_booking(
    db: AsyncSession, owner_id: uuid.UUID, data: BookingCreate,
) -> PtBooking:
    # Verify pet belongs to owner
    pet = (await db.execute(
        select(Pet).where(Pet.id == data.pet_id, Pet.owner_id == owner_id, Pet.is_active.is_(True))
    )).scalar_one_or_none()
    if not pet:
        raise NotFoundError(detail="반려동물을 찾을 수 없습니다")

    booking = PtBooking(
        owner_id=owner_id,
        pet_id=data.pet_id,
        service_type="walk",
        duration_minutes=data.duration_minutes,
        scheduled_at=data.scheduled_at,
        pickup_latitude=data.pickup_latitude,
        pickup_longitude=data.pickup_longitude,
        pickup_address=data.pickup_address,
        price=data.price,
        commission_rate=15,
        status=PtBookingStatus.PENDING,
        timeout_at=data.scheduled_at + timedelta(minutes=15),
    )
    db.add(booking)
    await db.flush()
    return booking


async def accept_booking(
    db: AsyncSession, booking_id: uuid.UUID, walker_id: uuid.UUID,
) -> PtBooking:
    booking = (await db.execute(
        select(PtBooking).where(PtBooking.id == booking_id, PtBooking.status == PtBookingStatus.PENDING)
    )).scalar_one_or_none()
    if not booking:
        raise NotFoundError(detail="예약을 찾을 수 없거나 이미 처리되었습니다")

    booking.walker_id = walker_id
    booking.status = PtBookingStatus.CONFIRMED
    booking.accepted_at = datetime.now(UTC)
    await db.flush()
    return booking


async def decline_booking(
    db: AsyncSession, booking_id: uuid.UUID, walker_id: uuid.UUID,
) -> PtBooking:
    booking = (await db.execute(
        select(PtBooking).where(
            PtBooking.id == booking_id,
            PtBooking.walker_id == walker_id,
            PtBooking.status == PtBookingStatus.PENDING,
        )
    )).scalar_one_or_none()
    if not booking:
        raise NotFoundError(detail="예약을 찾을 수 없습니다")
    booking.walker_id = None
    await db.flush()
    return booking


async def cancel_booking(
    db: AsyncSession, booking_id: uuid.UUID, user_id: uuid.UUID, reason: str | None = None,
) -> PtBooking:
    booking = (await db.execute(
        select(PtBooking).where(PtBooking.id == booking_id)
    )).scalar_one_or_none()
    if not booking:
        raise NotFoundError(detail="예약을 찾을 수 없습니다")
    if booking.owner_id != user_id and booking.walker_id != user_id:
        raise ForbiddenError(detail="이 예약을 취소할 권한이 없습니다")
    if booking.status in (PtBookingStatus.COMPLETED, PtBookingStatus.CANCELLED):
        raise ValidationError(detail="이미 완료되거나 취소된 예약입니다")

    booking.status = PtBookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(UTC)
    booking.cancel_reason = reason
    await db.flush()
    return booking


async def list_bookings(
    db: AsyncSession, user_id: uuid.UUID, role: str, status: str | None = None,
) -> list[PtBooking]:
    if role == "pet_owner":
        stmt = select(PtBooking).where(PtBooking.owner_id == user_id)
    else:
        stmt = select(PtBooking).where(PtBooking.walker_id == user_id)
    if status:
        stmt = stmt.where(PtBooking.status == status)
    stmt = stmt.order_by(PtBooking.scheduled_at.desc())
    return list((await db.execute(stmt)).scalars().all())


# ── Walk Session Service ─────────────────────────────────────────

async def start_walk(db: AsyncSession, booking_id: uuid.UUID, walker_id: uuid.UUID) -> WalkSession:
    booking = (await db.execute(
        select(PtBooking).where(
            PtBooking.id == booking_id,
            PtBooking.walker_id == walker_id,
            PtBooking.status == PtBookingStatus.CONFIRMED,
        )
    )).scalar_one_or_none()
    if not booking:
        raise NotFoundError(detail="확정된 예약을 찾을 수 없습니다")

    booking.status = PtBookingStatus.IN_PROGRESS

    session = WalkSession(
        booking_id=booking_id,
        walker_id=walker_id,
        started_at=datetime.now(UTC),
    )
    db.add(session)
    await db.flush()
    return session


async def end_walk(db: AsyncSession, session_id: uuid.UUID, walker_id: uuid.UUID) -> WalkSession:
    session = (await db.execute(
        select(WalkSession).where(WalkSession.id == session_id, WalkSession.walker_id == walker_id)
    )).scalar_one_or_none()
    if not session:
        raise NotFoundError(detail="산책 세션을 찾을 수 없습니다")
    if session.ended_at:
        raise ValidationError(detail="이미 종료된 산책입니다")

    session.ended_at = datetime.now(UTC)

    # Calculate distance from GPS history
    gps_points = (await db.execute(
        select(WalkGpsHistory)
        .where(WalkGpsHistory.session_id == session_id)
        .order_by(WalkGpsHistory.recorded_at)
    )).scalars().all()

    total_distance = 0.0
    route = []
    for i, point in enumerate(gps_points):
        route.append([point.latitude, point.longitude])
        if i > 0:
            prev = gps_points[i - 1]
            total_distance += haversine_km(prev.latitude, prev.longitude, point.latitude, point.longitude) * 1000

    session.distance_meters = int(total_distance)
    session.route_polyline = route

    # Complete booking
    booking = (await db.execute(
        select(PtBooking).where(PtBooking.id == session.booking_id)
    )).scalar_one()
    booking.status = PtBookingStatus.COMPLETED

    # Create commission record + wallet credit
    commission_amount = booking.price * booking.commission_rate // 100
    provider_amount = booking.price - commission_amount

    commission = CommissionRecord(
        app_context=APP_PETTRACKER,
        booking_id=booking.id,
        booking_type="pt_booking",
        gross_amount=booking.price,
        commission_rate=booking.commission_rate,
        commission_amount=commission_amount,
        provider_amount=provider_amount,
    )
    db.add(commission)

    # Credit walker wallet
    wallet = (await db.execute(
        select(WalkerWallet).where(WalkerWallet.user_id == walker_id)
    )).scalar_one_or_none()
    if not wallet:
        wallet = WalkerWallet(user_id=walker_id)
        db.add(wallet)
        await db.flush()
    wallet.balance += provider_amount

    tx = WalletTransaction(
        wallet_type="walker",
        wallet_id=wallet.id,
        amount=provider_amount,
        tx_type="earning",
        reference_id=booking.id,
        reference_type="pt_booking",
        status="completed",
    )
    db.add(tx)
    await db.flush()
    return session


async def record_gps(db: AsyncSession, session_id: uuid.UUID, point: GpsPoint) -> None:
    """Record a single GPS point for a walk session."""
    gps = WalkGpsHistory(
        session_id=session_id,
        latitude=point.latitude,
        longitude=point.longitude,
        heading=point.heading,
        speed=point.speed,
        accuracy=point.accuracy,
        recorded_at=point.recorded_at,
    )
    db.add(gps)
    await db.flush()


async def get_walk_report(db: AsyncSession, session_id: uuid.UUID) -> WalkSession:
    session = (await db.execute(
        select(WalkSession).where(WalkSession.id == session_id)
    )).scalar_one_or_none()
    if not session:
        raise NotFoundError(detail="산책 세션을 찾을 수 없습니다")
    return session


# ── Review Service ───────────────────────────────────────────────

async def create_review(
    db: AsyncSession, reviewer_id: uuid.UUID, data: ReviewCreate,
) -> WalkerReview:
    booking = (await db.execute(
        select(PtBooking).where(
            PtBooking.id == data.booking_id,
            PtBooking.owner_id == reviewer_id,
            PtBooking.status == PtBookingStatus.COMPLETED,
        )
    )).scalar_one_or_none()
    if not booking:
        raise NotFoundError(detail="완료된 예약을 찾을 수 없습니다")
    if not booking.walker_id:
        raise ValidationError(detail="워커가 배정되지 않은 예약입니다")

    # Check 48-hour window
    if booking.updated_at and (datetime.now(UTC) - booking.updated_at) > timedelta(hours=48):
        raise ValidationError(detail="리뷰 작성 기한(48시간)이 지났습니다")

    # Check no duplicate
    existing = (await db.execute(
        select(WalkerReview).where(WalkerReview.booking_id == data.booking_id)
    )).scalar_one_or_none()
    if existing:
        raise ValidationError(detail="이미 리뷰를 작성했습니다")

    review = WalkerReview(
        booking_id=data.booking_id,
        reviewer_id=reviewer_id,
        walker_id=booking.walker_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    await db.flush()
    return review


# ── Wallet Service ───────────────────────────────────────────────

async def get_wallet(db: AsyncSession, user_id: uuid.UUID) -> WalkerWallet:
    wallet = (await db.execute(
        select(WalkerWallet).where(WalkerWallet.user_id == user_id)
    )).scalar_one_or_none()
    if not wallet:
        wallet = WalkerWallet(user_id=user_id)
        db.add(wallet)
        await db.flush()
    return wallet


async def request_withdrawal(db: AsyncSession, user_id: uuid.UUID, amount: int) -> WalletTransaction:
    wallet = await get_wallet(db, user_id)
    if wallet.balance < amount:
        raise ValidationError(detail=f"잔액이 부족합니다. 현재 잔액: {wallet.balance:,}원")

    wallet.balance -= amount
    tx = WalletTransaction(
        wallet_type="walker",
        wallet_id=wallet.id,
        amount=-amount,
        tx_type="withdrawal",
        status="pending",
    )
    db.add(tx)
    await db.flush()
    return tx


async def list_transactions(db: AsyncSession, user_id: uuid.UUID) -> list[WalletTransaction]:
    wallet = await get_wallet(db, user_id)
    stmt = (
        select(WalletTransaction)
        .where(WalletTransaction.wallet_id == wallet.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(50)
    )
    return list((await db.execute(stmt)).scalars().all())
