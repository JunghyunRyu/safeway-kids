"""PetTracker service layer — business logic for pets, walkers, bookings, walks, wallets."""

import json
import logging
import math
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker.models import (
    Pet,
    PtBooking,
    PtBookingStatus,
    PtPayment,
    PtPaymentStatus,
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
from app.core.gps_validation import MAX_WALK_SPEED_MS, validate_gps_accuracy, validate_gps_speed
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


async def delete_pet(db: AsyncSession, pet_id: uuid.UUID, owner_id: uuid.UUID) -> None:
    """반려동물 소프트 삭제 (is_active=False). 예약 이력 보존 + 소유권 검증."""
    stmt = select(Pet).where(Pet.id == pet_id, Pet.owner_id == owner_id, Pet.is_active.is_(True))
    pet = (await db.execute(stmt)).scalar_one_or_none()
    if not pet:
        raise NotFoundError(detail="반려동물을 찾을 수 없습니다")
    pet.is_active = False
    await db.flush()


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
        "has_insurance": qual.has_insurance if qual else False,
        "insurance_expiry": qual.insurance_expiry if qual else None,
        "profile_photo_url": qual.profile_photo_url if qual else None,
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
        # 견종 크기 필터 (O-02): 워커가 수용 크기를 지정했고 요청 크기가 빠지면 제외.
        # accepted_sizes 미지정(None/빈) = 모든 크기 수용 (레거시 워커 호환).
        if params.size and qual.accepted_sizes and params.size not in qual.accepted_sizes:
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


async def end_walk(
    db: AsyncSession, session_id: uuid.UUID, walker_id: uuid.UUID,
    walker_memo: str | None = None, photo_url: str | None = None,
) -> WalkSession:
    session = (await db.execute(
        select(WalkSession).where(WalkSession.id == session_id, WalkSession.walker_id == walker_id)
    )).scalar_one_or_none()
    if not session:
        raise NotFoundError(detail="산책 세션을 찾을 수 없습니다")
    if session.ended_at:
        raise ValidationError(detail="이미 종료된 산책입니다")

    session.ended_at = datetime.now(UTC)
    # 워커가 산책 중 남긴 메모/사진을 보호자 리포트에 전달 (W-04)
    if walker_memo:
        session.walker_memo = walker_memo
    if photo_url:
        session.arrival_photo_url = photo_url

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


async def _get_owned_walk_session(
    db: AsyncSession, session_id: uuid.UUID, walker_id: uuid.UUID
) -> WalkSession:
    """G-21: 세션 소유권 검증. 세션이 없으면 404, 소유자가 아니면 403.

    워커 토큰을 가진 임의 사용자가 타인의 session_id에 GPS를 주입하는 것을 차단한다.
    """
    session = (await db.execute(
        select(WalkSession).where(WalkSession.id == session_id)
    )).scalar_one_or_none()
    if session is None:
        raise NotFoundError(detail="산책 세션을 찾을 수 없습니다")
    if session.walker_id != walker_id:
        logger.warning(
            "[PT AUTHZ] GPS 주입 시도 차단: session=%s owner=%s requester=%s",
            session_id, session.walker_id, walker_id,
        )
        raise ForbiddenError(detail="해당 산책 세션의 소유자가 아닙니다")
    return session


async def record_gps(
    db: AsyncSession, session_id: uuid.UUID, point: GpsPoint, walker_id: uuid.UUID
) -> None:
    """Record a single GPS point for a walk session.

    G-21: walker_id로 세션 소유권을 먼저 검증한다.
    G-01: 직전 포인트 대비 속도·정확도 이상을 검증한다 (현재는 로그온리 — 아래 참조).
    DB 영속 후 Redis pub/sub 채널 `pt:walk:{session_id}:updates`에 발행.
    Publish 실패는 영속을 깨지 않음 (fail-soft).
    Gap Note: artifacts/gap-notes/2026-04-30-record-gps-publish-missing.md
    Gap Note: artifacts/gap-notes/2026-06-03-gps-speed-validation-log-only.md (도보 임계 로그온리 사유)
    """
    # G-21: 소유권 검증 (반환 세션을 polyline 갱신에 재사용)
    walk_session = await _get_owned_walk_session(db, session_id, walker_id)

    # G-01: 정확도 검증 — 도심 GPS 정확도 변동이 커 현재는 로그온리(거부하지 않음).
    if not validate_gps_accuracy(point.accuracy, threshold=30.0):
        logger.warning(
            "[GPS ACCURACY] session=%s accuracy=%.1fm > 30m (로그온리)",
            session_id, point.accuracy,
        )

    # G-01: 속도 기반 텔레포트 탐지 — 직전 DB 포인트 대비. GPS 지터 false-positive 회피 위해 로그온리.
    last_point = (await db.execute(
        select(WalkGpsHistory)
        .where(WalkGpsHistory.session_id == session_id)
        .order_by(WalkGpsHistory.recorded_at.desc())
        .limit(1)
    )).scalar_one_or_none()
    if last_point is not None:
        is_valid, speed_ms = validate_gps_speed(
            last_point.latitude, last_point.longitude, last_point.recorded_at,
            point.latitude, point.longitude, point.recorded_at,
            max_speed_ms=MAX_WALK_SPEED_MS,
        )
        if not is_valid:
            logger.warning(
                "[GPS TELEPORT] session=%s speed=%.1f m/s 도보 임계 초과 (로그온리)",
                session_id, speed_ms,
            )

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

    if walk_session is not None:
        polyline = list(walk_session.route_polyline) if walk_session.route_polyline else []
        polyline.append([point.latitude, point.longitude])
        walk_session.route_polyline = polyline
        await db.flush()

    try:
        import asyncio
        from app.redis import redis_client
        payload = json.dumps({
            "type": "gps",
            "session_id": str(session_id),
            "lat": point.latitude,
            "lng": point.longitude,
            "heading": point.heading,
            "speed": point.speed,
            "recorded_at": point.recorded_at.isoformat(),
        })
        # Short timeout so missing redis (test/dev) does not block GPS persistence.
        await asyncio.wait_for(
            redis_client.publish(f"pt:walk:{session_id}:updates", payload),
            timeout=1.0,
        )
    except Exception as e:
        logger.warning("PT GPS publish failed (session=%s): %s", session_id, e)


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
    updated = booking.updated_at.replace(tzinfo=UTC) if booking.updated_at and booking.updated_at.tzinfo is None else booking.updated_at
    if updated and (datetime.now(UTC) - updated) > timedelta(hours=48):
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


# ── Payment Service (PortOne v2) ─────────────────────────────────

def _build_merchant_uid(booking_id: uuid.UUID) -> str:
    """`pt_<booking_short>_<unix_ts>` 형태의 가맹점 주문번호 생성."""
    ts = int(datetime.now(UTC).timestamp())
    return f"pt_{booking_id.hex[:12]}_{ts}"


async def prepare_payment(
    db: AsyncSession,
    owner_id: uuid.UUID,
    booking_id: uuid.UUID,
) -> PtPayment:
    """결제 prepare — PortOne 결제창 호출 직전 백엔드에 merchant_uid 발급/저장.

    호출 시점: 워커 수락 직후 ~ 산책 시작 전. booking 상태가 in_progress / completed면 차단.
    동일 booking에 PAID payment가 이미 있으면 중복 방지.
    """
    booking = await db.get(PtBooking, booking_id)
    if not booking:
        raise NotFoundError(detail="예약을 찾을 수 없습니다")
    if booking.owner_id != owner_id:
        raise ForbiddenError(detail="본인의 예약에 대해서만 결제할 수 있습니다")
    if booking.status in (PtBookingStatus.IN_PROGRESS, PtBookingStatus.COMPLETED, PtBookingStatus.CANCELLED, PtBookingStatus.EXPIRED):
        raise ValidationError(detail=f"현재 상태({booking.status})에서는 결제할 수 없습니다")

    existing_paid = (await db.execute(
        select(PtPayment)
        .where(PtPayment.booking_id == booking_id)
        .where(PtPayment.status == PtPaymentStatus.PAID)
    )).scalar_one_or_none()
    if existing_paid:
        return existing_paid

    payment = PtPayment(
        booking_id=booking_id,
        amount=booking.price,
        currency="KRW",
        pg_provider="portone",
        merchant_uid=_build_merchant_uid(booking_id),
        status=PtPaymentStatus.PENDING,
    )
    db.add(payment)
    await db.flush()
    return payment


async def confirm_payment(
    db: AsyncSession,
    owner_id: uuid.UUID,
    imp_uid: str,
    merchant_uid: str,
) -> PtPayment:
    """결제 confirm — PortOne 결제창 종료 후 백엔드에서 결제 상태/금액 검증.

    Idempotent: 이미 PAID 상태이고 imp_uid도 같으면 그대로 반환.
    """
    from app.modules.billing.providers.portone import portone_provider

    payment = (await db.execute(
        select(PtPayment).where(PtPayment.merchant_uid == merchant_uid)
    )).scalar_one_or_none()
    if not payment:
        raise NotFoundError(detail="결제 정보를 찾을 수 없습니다")

    booking = await db.get(PtBooking, payment.booking_id)
    if not booking or booking.owner_id != owner_id:
        raise ForbiddenError(detail="본인의 결제만 확인할 수 있습니다")

    if payment.status == PtPaymentStatus.PAID and payment.imp_uid == imp_uid:
        return payment

    if payment.status not in (PtPaymentStatus.PENDING, PtPaymentStatus.PAID):
        raise ValidationError(detail=f"결제 상태({payment.status})에서는 confirm할 수 없습니다")

    pg_resp = await portone_provider.confirm_payment(
        payment_key=imp_uid,
        order_id=merchant_uid,
        amount=payment.amount,
    )
    pg_status = pg_resp.get("status")
    if pg_status not in ("PAID", "VIRTUAL_ACCOUNT_ISSUED"):
        raise ValidationError(detail=f"PG 결제 상태가 비정상입니다: {pg_status}")


# ── 위치정보법 §16 자동 파기 (180일) — PT 산책 GPS 이력 ─────────────────

async def purge_old_walk_gps_history(db: AsyncSession) -> int:
    """Delete WalkGpsHistory older than 180 days (위치정보법 제16조 보유 한도)."""
    cutoff = datetime.now(UTC) - timedelta(days=180)
    stmt = delete(WalkGpsHistory).where(WalkGpsHistory.recorded_at < cutoff)
    result = await db.execute(stmt)
    count = result.rowcount
    if count > 0:
        logger.info("[PT GPS] Purged %d old walk GPS records (before %s)", count, cutoff.isoformat())
    return count

    payment.imp_uid = imp_uid
    payment.status = PtPaymentStatus.PAID
    payment.paid_at = datetime.now(UTC)
    await db.flush()
    return payment


async def cancel_payment(
    db: AsyncSession,
    owner_id: uuid.UUID,
    payment_id: uuid.UUID,
    reason: str,
    cancel_amount: int | None = None,
) -> PtPayment:
    """결제 취소/환불.

    - cancel_amount=None 또는 amount와 같으면 전액 취소 (CANCELLED)
    - 부분 취소면 REFUNDED, 잔액은 cancel_amount 컬럼에 누적.
    """
    from app.modules.billing.providers.portone import portone_provider

    payment = await db.get(PtPayment, payment_id)
    if not payment:
        raise NotFoundError(detail="결제 정보를 찾을 수 없습니다")

    booking = await db.get(PtBooking, payment.booking_id)
    if not booking or booking.owner_id != owner_id:
        raise ForbiddenError(detail="본인의 결제만 취소할 수 있습니다")

    if payment.status != PtPaymentStatus.PAID:
        raise ValidationError(detail=f"결제 상태({payment.status})에서는 취소할 수 없습니다")

    if not payment.imp_uid:
        raise ValidationError(detail="PG 결제 식별자(imp_uid)가 없어 취소할 수 없습니다")

    if cancel_amount is not None and cancel_amount > payment.amount:
        raise ValidationError(detail="취소 금액이 결제 금액을 초과합니다")

    await portone_provider.cancel_payment(
        payment_key=payment.imp_uid,
        cancel_reason=reason,
        cancel_amount=cancel_amount,
    )

    payment.cancel_amount = cancel_amount if cancel_amount is not None else payment.amount
    payment.cancel_reason = reason
    payment.cancelled_at = datetime.now(UTC)
    payment.status = (
        PtPaymentStatus.CANCELLED
        if cancel_amount is None or cancel_amount == payment.amount
        else PtPaymentStatus.REFUNDED
    )
    await db.flush()
    return payment


async def handle_portone_webhook_event(
    db: AsyncSession,
    payload: dict,
) -> dict:
    """PortOne v2 webhook 상태 sync.

    Payload 예시 (V2): {"type": "Transaction.Paid", "data": {"paymentId": "...", "status": "PAID", ...}}
    또는 V1: {"imp_uid": "...", "merchant_uid": "...", "status": "paid"}.
    Payment row가 없으면 조용히 200 반환 (확장 결제 흐름 또는 다른 가맹점 noise).
    """
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    imp_uid = data.get("paymentId") or data.get("imp_uid")
    merchant_uid = data.get("orderId") or data.get("merchant_uid")
    pg_status = (data.get("status") or "").upper()

    if not imp_uid and not merchant_uid:
        logger.warning("PortOne webhook: paymentId/merchant_uid 모두 없음 — 무시")
        return {"status": "ignored", "reason": "missing identifiers"}

    stmt = select(PtPayment)
    if imp_uid and merchant_uid:
        stmt = stmt.where(
            (PtPayment.imp_uid == imp_uid) | (PtPayment.merchant_uid == merchant_uid)
        )
    elif imp_uid:
        stmt = stmt.where(PtPayment.imp_uid == imp_uid)
    else:
        stmt = stmt.where(PtPayment.merchant_uid == merchant_uid)

    payment = (await db.execute(stmt)).scalar_one_or_none()
    if not payment:
        logger.info("PortOne webhook: 일치하는 PtPayment 없음 imp_uid=%s merchant_uid=%s", imp_uid, merchant_uid)
        return {"status": "ignored", "reason": "no matching payment"}

    if imp_uid and not payment.imp_uid:
        payment.imp_uid = imp_uid

    if pg_status == "PAID" and payment.status != PtPaymentStatus.PAID:
        payment.status = PtPaymentStatus.PAID
        payment.paid_at = payment.paid_at or datetime.now(UTC)
    elif pg_status in ("CANCELLED", "PARTIAL_CANCELLED"):
        cancel_amount_raw = data.get("cancelAmount") or data.get("cancel_amount")
        if isinstance(cancel_amount_raw, dict):
            cancel_amount_raw = cancel_amount_raw.get("total")
        try:
            cancel_amount = int(cancel_amount_raw) if cancel_amount_raw is not None else None
        except (TypeError, ValueError):
            cancel_amount = None
        payment.cancelled_at = payment.cancelled_at or datetime.now(UTC)
        payment.cancel_amount = cancel_amount if cancel_amount is not None else payment.amount
        payment.status = (
            PtPaymentStatus.CANCELLED
            if pg_status == "CANCELLED" or cancel_amount is None or cancel_amount == payment.amount
            else PtPaymentStatus.REFUNDED
        )
    elif pg_status == "FAILED":
        payment.status = PtPaymentStatus.PENDING

    await db.flush()
    return {
        "status": "applied",
        "payment_id": str(payment.id),
        "new_status": payment.status,
    }
