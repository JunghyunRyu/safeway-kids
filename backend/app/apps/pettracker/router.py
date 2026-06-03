"""PetTracker API router — /api/v1/pt/"""

import asyncio
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker import service

logger = logging.getLogger(__name__)
from app.apps.pettracker.schemas import (
    BookingCreate,
    BookingResponse,
    GpsPoint,
    PaymentCancelRequest,
    PaymentCancelResponse,
    PaymentConfirmRequest,
    PaymentConfirmResponse,
    PaymentPrepareRequest,
    PaymentPrepareResponse,
    PetCreate,
    PetResponse,
    PetUpdate,
    PtSosRequest,
    PtSosResponse,
    ReviewCreate,
    ReviewReplyRequest,
    ReviewWithReplyResponse,
    ReviewResponse,
    WalkerAvailabilityCreate,
    WalkerProfileResponse,
    WalkerQualificationCreate,
    WalkerReviewResponse,
    WalkerSearchParams,
    WalkEndRequest,
    WalkMemoUpdate,
    WalkReportResponse,
    WalletResponse,
    WithdrawRequest,
)
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_pet_owner, require_platform_admin, require_pt_any, require_walker
from app.modules.auth.models import User, UserRole

router = APIRouter(prefix="/pt", tags=["PetTracker"])


# ── Pets ─────────────────────────────────────────────────────────

@router.post("/pets", response_model=PetResponse, status_code=201)
async def create_pet(
    body: PetCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> PetResponse:
    pet = await service.create_pet(db, user.id, body)
    await db.commit()
    return PetResponse.model_validate(pet)


@router.get("/pets", response_model=list[PetResponse])
async def list_pets(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> list[PetResponse]:
    pets = await service.list_pets(db, user.id)
    return [PetResponse.model_validate(p) for p in pets]


@router.put("/pets/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: uuid.UUID,
    body: PetUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> PetResponse:
    pet = await service.update_pet(db, pet_id, user.id, body)
    await db.commit()
    return PetResponse.model_validate(pet)


@router.delete("/pets/{pet_id}", status_code=204)
async def delete_pet(
    pet_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> None:
    await service.delete_pet(db, pet_id, user.id)
    await db.commit()


# ── Walker Qualification ─────────────────────────────────────────

@router.post("/walkers/qualification", status_code=201)
async def submit_qualification(
    body: WalkerQualificationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> dict:
    qual = await service.submit_qualification(db, user.id, body)
    await db.commit()
    return {"message": "자격 서류가 제출되었습니다", "status": qual.approval_status}


@router.post("/admin/walkers/{walker_id}/approve")
async def approve_walker(
    walker_id: uuid.UUID,
    approve: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
) -> dict:
    qual = await service.approve_walker(db, walker_id, admin.id, approve)
    await db.commit()
    return {"message": f"워커 {'승인' if approve else '거부'}됨", "status": qual.approval_status}


# ── Walker Search & Profile ──────────────────────────────────────

@router.get("/walkers/search")
async def search_walkers(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    date: str = Query(..., description="YYYY-MM-DD"),
    radius_km: float = Query(3.0, gt=0, le=50),
    size: str | None = Query(None, pattern="^(small|medium|large)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> list[dict]:
    from datetime import date as dt_date
    params = WalkerSearchParams(
        latitude=latitude, longitude=longitude,
        date=dt_date.fromisoformat(date), radius_km=radius_km, size=size,
    )
    return await service.search_walkers(db, params)


@router.get("/walkers/{walker_id}/profile", response_model=WalkerProfileResponse)
async def get_walker_profile(
    walker_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> WalkerProfileResponse:
    data = await service.get_walker_profile(db, walker_id)
    return WalkerProfileResponse(**data)


# ── Walker Availability ──��───────────────────────────────────────

@router.post("/walkers/availability", status_code=201)
async def set_availability(
    body: WalkerAvailabilityCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> dict:
    avail = await service.set_availability(db, user.id, body)
    await db.commit()
    return {"message": "가용 시간이 등록되었습니다", "date": str(avail.available_date)}


@router.get("/walkers/availability")
async def list_availability(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> list[dict]:
    items = await service.list_availability(db, user.id)
    return [
        {"date": str(a.available_date), "start": str(a.start_time), "end": str(a.end_time), "status": a.status}
        for a in items
    ]


# ── Bookings ─────────────────────────────────────────────────────

@router.post("/bookings", response_model=BookingResponse, status_code=201)
async def create_booking(
    body: BookingCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> BookingResponse:
    booking = await service.create_booking(db, user.id, body)
    await db.commit()
    return BookingResponse.model_validate(booking)


@router.post("/bookings/{booking_id}/accept", response_model=BookingResponse)
async def accept_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> BookingResponse:
    booking = await service.accept_booking(db, booking_id, user.id)
    await db.commit()
    return BookingResponse.model_validate(booking)


@router.post("/bookings/{booking_id}/decline")
async def decline_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> dict:
    await service.decline_booking(db, booking_id, user.id)
    await db.commit()
    return {"message": "예약을 거절했습니다"}


@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: uuid.UUID,
    reason: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pt_any),
) -> dict:
    await service.cancel_booking(db, booking_id, user.id, reason)
    await db.commit()
    return {"message": "예약이 취소���었습니다"}


@router.get("/bookings", response_model=list[BookingResponse])
async def list_bookings(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pt_any),
) -> list[BookingResponse]:
    role_str = user.role.value if hasattr(user.role, "value") else user.role
    bookings = await service.list_bookings(db, user.id, role_str, status)

    # 배치 조회로 N+1/lazy-load(MissingGreenlet) 회피.
    from app.apps.pettracker.models import WalkSession, WalkerReview
    booking_ids = [b.id for b in bookings]

    # 1) 산책 세션 (in_progress + completed 모두 — 완료 예약 리포트 도달용)
    session_map: dict = {}
    if booking_ids:
        rows = (await db.execute(
            select(WalkSession.booking_id, WalkSession.id).where(
                WalkSession.booking_id.in_(booking_ids)
            )
        )).all()
        session_map = {row[0]: row[1] for row in rows}

    # 2) 워커 이름/전화 (배정된 워커들만)
    walker_ids = list({b.walker_id for b in bookings if b.walker_id})
    walker_map: dict = {}
    if walker_ids:
        wrows = (await db.execute(
            select(User.id, User.name, User.phone).where(User.id.in_(walker_ids))
        )).all()
        walker_map = {row[0]: (row[1], row[2]) for row in wrows}

    # 3) 리뷰 존재 여부 (owner가 작성한 리뷰)
    reviewed_ids: set = set()
    if booking_ids:
        rrows = (await db.execute(
            select(WalkerReview.booking_id).where(WalkerReview.booking_id.in_(booking_ids))
        )).all()
        reviewed_ids = {row[0] for row in rrows}

    results = []
    for b in bookings:
        resp = BookingResponse.model_validate(b)
        # Populate pet info from joined relationship
        if hasattr(b, "pet") and b.pet:
            resp.pet_name = b.pet.name
            resp.pet_species = b.pet.species
            resp.pet_temperament = b.pet.temperament
            resp.pet_weight_kg = b.pet.weight_kg
            resp.pet_special_needs = b.pet.special_needs
        if b.walker_id and b.walker_id in walker_map:
            resp.walker_name, resp.walker_phone = walker_map[b.walker_id]
        if b.id in session_map:
            resp.session_id = session_map[b.id]
        resp.has_review = b.id in reviewed_ids
        results.append(resp)
    return results


# ── Walk Sessions ────────���───────────────────────────────────────

@router.post("/walks/{booking_id}/start")
async def start_walk(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> dict:
    session = await service.start_walk(db, booking_id, user.id)
    await db.commit()
    return {"session_id": str(session.id), "started_at": session.started_at.isoformat()}  # type: ignore


@router.post("/walks/{session_id}/gps")
async def record_gps(
    session_id: uuid.UUID,
    body: GpsPoint,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> dict:
    await service.record_gps(db, session_id, body, walker_id=user.id)  # G-21: 소유권 검증
    await db.commit()
    return {"status": "ok"}


@router.post("/sos", response_model=PtSosResponse)
async def pt_sos_alert(
    body: PtSosRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pt_any),
) -> PtSosResponse:
    """M-02: PT 긴급 신고 — 플랫폼 관리자에게 즉시 알림 + 감사 로그.

    위치 미확인 시 (0,0) 대신 명시적 표기 (G-05 동일 정책).
    """
    from app.modules.admin.service import log_audit
    from app.modules.notification import service as notif_service
    from app.modules.notification.providers.fcm import FCMProvider

    location_known = (
        not body.location_unknown
        and body.latitude is not None
        and body.longitude is not None
    )

    await log_audit(
        db,
        user_id=str(user.id),
        user_name=user.name,
        action="SOS",
        entity_type="pt_sos_alert",
        entity_id=str(body.session_id) if body.session_id else "",
        details={
            "latitude": body.latitude,
            "longitude": body.longitude,
            "location_unknown": not location_known,
            "session_id": str(body.session_id) if body.session_id else None,
            "message": body.message,
            "user_role": user.role.value if hasattr(user.role, "value") else user.role,
        },
        ip_address=request.client.host if request.client else None,
    )

    location_str = (
        f"위치: ({body.latitude:.6f}, {body.longitude:.6f})"
        if location_known
        else "위치: 미확인 (주소 수동 확인 필요)"
    )
    sos_msg = f"[PT SOS 긴급] {user.name} {location_str}"
    if body.message:
        sos_msg += f" 메시지: {body.message}"

    _fcm = FCMProvider()
    admins = (await db.execute(
        select(User).where(
            User.role == UserRole.PLATFORM_ADMIN,
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
    )).scalars().all()
    for admin in admins:
        try:
            if admin.fcm_token:
                await _fcm.send_push(
                    device_token=admin.fcm_token,
                    title="🚨 PT SOS 긴급 신고",
                    body=sos_msg,
                    data={"type": "pt_sos", "session_id": str(body.session_id) if body.session_id else ""},
                )
            if admin.phone and not admin.phone.startswith("kakao_"):
                await notif_service.send_critical_alert_sms(admin.phone, sos_msg)
        except Exception:
            logger.warning("Failed to send PT SOS alert to admin %s", admin.id, exc_info=True)

    logger.info("[PT SOS] Alert from user=%s session=%s", user.id, body.session_id)
    return PtSosResponse(success=True)


@router.post("/walks/{session_id}/end")
async def end_walk(
    session_id: uuid.UUID,
    body: WalkEndRequest | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> dict:
    body = body or WalkEndRequest()
    session = await service.end_walk(
        db, session_id, user.id,
        walker_memo=body.walker_memo, photo_url=body.photo_url,
    )
    await db.commit()
    return {
        "session_id": str(session.id),
        "distance_meters": session.distance_meters,
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
    }


@router.get("/walks/{session_id}/report", response_model=WalkReportResponse)
async def get_walk_report(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pt_any),
) -> WalkReportResponse:
    session = await service.get_walk_report(db, session_id)
    # 보호자가 산책 중 도우미에게 연락할 수 있도록 전화번호 포함 (O-01)
    walker_phone = None
    if session.walker_id:
        walker_phone = (await db.execute(
            select(User.phone).where(User.id == session.walker_id)
        )).scalar_one_or_none()
    return WalkReportResponse(
        session_id=session.id,
        booking_id=session.booking_id,
        started_at=session.started_at,
        ended_at=session.ended_at,
        distance_meters=session.distance_meters,
        walker_memo=session.walker_memo,
        route_polyline=session.route_polyline,
        walker_phone=walker_phone,
    )


# ── Reviews ──────────────────────────────────────────────────────

@router.post("/reviews", response_model=ReviewResponse, status_code=201)
async def create_review(
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> ReviewResponse:
    review = await service.create_review(db, user.id, body)
    await db.commit()
    return ReviewResponse.model_validate(review)


@router.get("/reviews")
async def list_my_reviews(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
):
    from sqlalchemy import select
    from app.apps.pettracker.models import WalkerReview
    reviews = (await db.execute(
        select(WalkerReview)
        .where(WalkerReview.walker_id == user.id)
        .order_by(WalkerReview.created_at.desc())
    )).scalars().all()
    return [ReviewWithReplyResponse.model_validate(r) for r in reviews]


@router.get("/walkers/{walker_id}/reviews", response_model=list[WalkerReviewResponse])
async def list_walker_reviews(
    walker_id: uuid.UUID,
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pt_any),
) -> list[WalkerReviewResponse]:
    """보호자가 워커 프로필에서 실제 후기를 읽을 수 있도록 공개 (O-15).

    배치 조회로 작성자 이름을 채운다 (lazy-load 회피).
    """
    from app.apps.pettracker.models import WalkerReview
    reviews = (await db.execute(
        select(WalkerReview)
        .where(WalkerReview.walker_id == walker_id)
        .order_by(WalkerReview.created_at.desc())
        .limit(limit)
    )).scalars().all()

    reviewer_ids = list({r.reviewer_id for r in reviews})
    name_map: dict = {}
    if reviewer_ids:
        nrows = (await db.execute(
            select(User.id, User.name).where(User.id.in_(reviewer_ids))
        )).all()
        name_map = {row[0]: row[1] for row in nrows}

    out = []
    for r in reviews:
        resp = WalkerReviewResponse.model_validate(r)
        resp.reviewer_name = name_map.get(r.reviewer_id)
        out.append(resp)
    return out


@router.post("/reviews/{review_id}/reply")
async def reply_to_review(
    review_id: uuid.UUID,
    body: ReviewReplyRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
):
    from datetime import datetime, timezone
    from sqlalchemy import select
    from app.apps.pettracker.models import WalkerReview
    review = (await db.execute(
        select(WalkerReview).where(WalkerReview.id == review_id)
    )).scalar_one_or_none()
    if not review:
        raise HTTPException(404, "리뷰를 찾을 수 없습니다")
    if review.walker_id != user.id:
        raise HTTPException(403, "본인의 리뷰에만 답변할 수 있습니다")
    if review.walker_reply:
        raise HTTPException(400, "이미 답변을 등록했습니다")
    review.walker_reply = body.reply
    review.replied_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "답변이 등록되었습니다"}


@router.patch("/walks/{session_id}")
async def update_walk_memo(
    session_id: uuid.UUID,
    body: WalkMemoUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
):
    from sqlalchemy import select
    from app.apps.pettracker.models import WalkSession
    session = (await db.execute(
        select(WalkSession).where(WalkSession.id == session_id)
    )).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "산책 세션을 찾을 수 없습니다")
    session.walker_memo = body.walker_memo
    await db.commit()
    return {"message": "메모가 저장되었습니다"}


# ── Wallet ───────────────────────────────────────────────────────

@router.get("/wallet", response_model=WalletResponse)
async def get_wallet(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> WalletResponse:
    wallet = await service.get_wallet(db, user.id)
    return WalletResponse.model_validate(wallet)


@router.get("/wallet/transactions")
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> list[dict]:
    txs = await service.list_transactions(db, user.id)
    results = []
    for t in txs:
        # For earning transactions, calculate gross and fee based on 15% commission
        commission_rate = 15
        gross_amount = t.amount
        platform_fee = 0
        if t.tx_type == "earning":
            # net = gross * (1 - rate/100) => gross = net / (1 - rate/100)
            gross_amount = round(t.amount / (1 - commission_rate / 100))
            platform_fee = gross_amount - t.amount
        results.append({
            "id": str(t.id),
            "amount": t.amount,
            "tx_type": t.tx_type,
            "status": t.status,
            "created_at": t.created_at.isoformat(),
            "gross_amount": gross_amount,
            "platform_fee": platform_fee,
            "description": t.description if hasattr(t, "description") else None,
        })
    return results


@router.get("/wallet/export")
async def export_transactions_csv(
    month: str = Query(..., description="YYYY-MM"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
):
    """Export PetTracker wallet transactions as CSV for the given month."""
    from datetime import datetime
    from fastapi.responses import StreamingResponse
    import io
    import csv
    try:
        year, mon = month.split('-')
        y = int(year)
        m = int(mon)
    except Exception:
        raise HTTPException(400, "month must be YYYY-MM")
    txs = await service.list_transactions(db, user.id)
    commission_rate = 15
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["날짜", "구분", "총 금액", "수수료", "실수령", "상태"])
    for t in txs:
        dt = t.created_at
        if dt.year != y or dt.month != m:
            continue
        gross = t.amount
        fee = 0
        if t.tx_type == "earning":
            gross = round(t.amount / (1 - commission_rate / 100))
            fee = gross - t.amount
        writer.writerow([
            dt.strftime("%Y-%m-%d"),
            t.tx_type,
            gross,
            fee,
            t.amount,
            t.status,
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue().encode('utf-8-sig')]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="pt-transactions-{month}.csv"'},
    )


@router.post("/wallet/withdraw")
async def request_withdrawal(
    body: WithdrawRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> dict:
    tx = await service.request_withdrawal(db, user.id, body.amount)
    await db.commit()
    return {"message": f"{body.amount:,}원 출금 요청됨", "tx_id": str(tx.id)}


# ── Payments (PortOne v2) ────────────────────────────────────────

@router.post("/payments/prepare", response_model=PaymentPrepareResponse, status_code=201)
async def prepare_payment(
    body: PaymentPrepareRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> PaymentPrepareResponse:
    """결제 prepare — PortOne 결제창 호출 직전 merchant_uid 발급."""
    payment = await service.prepare_payment(db, user.id, body.booking_id)
    await db.commit()
    return PaymentPrepareResponse(
        payment_id=payment.id,
        merchant_uid=payment.merchant_uid,
        amount=payment.amount,
        currency=payment.currency,
        pg_provider=payment.pg_provider,
    )


@router.post("/payments/confirm", response_model=PaymentConfirmResponse)
async def confirm_payment(
    body: PaymentConfirmRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> PaymentConfirmResponse:
    """결제 confirm — PortOne 결제창 종료 후 백엔드에서 금액/상태 검증."""
    payment = await service.confirm_payment(db, user.id, body.imp_uid, body.merchant_uid)
    await db.commit()
    return PaymentConfirmResponse(
        payment_id=payment.id,
        status=payment.status,
        amount=payment.amount,
        paid_at=payment.paid_at,
        imp_uid=payment.imp_uid,
    )


@router.post("/payments/{payment_id}/cancel", response_model=PaymentCancelResponse)
async def cancel_payment(
    payment_id: uuid.UUID,
    body: PaymentCancelRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> PaymentCancelResponse:
    """결제 취소/환불 (전액 또는 부분)."""
    payment = await service.cancel_payment(
        db, user.id, payment_id, body.reason, body.cancel_amount,
    )
    await db.commit()
    return PaymentCancelResponse(
        payment_id=payment.id,
        status=payment.status,
        cancel_amount=payment.cancel_amount,
        cancelled_at=payment.cancelled_at,
    )


# ── Admin Dashboard ──────────────────────────────────────────────

@router.get("/admin/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
) -> dict:
    from sqlalchemy import func as sqlfunc

    from app.apps.pettracker.models import PtBooking as _PtBooking
    from app.apps.pettracker.models import WalkerQualification as _WalkerQual

    total_bookings = (await db.execute(
        select(sqlfunc.count(_PtBooking.id))
    )).scalar() or 0
    active_walks = (await db.execute(
        select(sqlfunc.count(_PtBooking.id)).where(_PtBooking.status == "in_progress")
    )).scalar() or 0
    total_walkers = (await db.execute(
        select(sqlfunc.count(_WalkerQual.id)).where(_WalkerQual.approval_status == "approved")
    )).scalar() or 0
    pending_approvals = (await db.execute(
        select(sqlfunc.count(_WalkerQual.id)).where(_WalkerQual.approval_status == "pending")
    )).scalar() or 0
    from app.core.models import CommissionRecord
    total_revenue = (await db.execute(
        select(sqlfunc.sum(CommissionRecord.commission_amount))
        .where(CommissionRecord.app_context == "pettracker")
    )).scalar() or 0

    return {
        "total_bookings": total_bookings,
        "active_walks": active_walks,
        "total_walkers": total_walkers,
        "pending_approvals": pending_approvals,
        "total_revenue_krw": total_revenue,
    }


# Need to import for type hints in select
from app.apps.pettracker.models import WalkerQualification as _WQ


# ── Realtime Walk Tracking (WebSocket) ───────────────────────────

@router.websocket("/ws/walks/{session_id}")
async def walk_session_ws(websocket: WebSocket, session_id: uuid.UUID) -> None:
    """PT 산책 실시간 WebSocket — 토픽 `pt:walk:{session_id}:updates`.

    인증: JWT(SafeWay 듀얼 미들웨어 패턴 — Firebase 전환은 Milestone B-7).
    인가: WalkSession.walker_id == user.id 또는 booking.owner_id == user.id.
    """
    from app.config import settings
    from app.database import async_session_factory
    from app.middleware.ws_auth import authenticate_jwt_token, negotiate_ws_auth
    from app.redis import redis_client
    from app.apps.pettracker.models import PtBooking, WalkSession

    user = await negotiate_ws_auth(
        websocket,
        lambda t: authenticate_jwt_token(t, session_factory=async_session_factory),
    )
    if not user:
        return

    # 인가: WalkSession + Booking 권한 확인
    try:
        async with async_session_factory() as auth_db:
            ws_session = (await auth_db.execute(
                select(WalkSession).where(WalkSession.id == session_id)
            )).scalar_one_or_none()
            if not ws_session:
                await websocket.close(code=4404, reason="Walk session not found")
                return
            booking = await auth_db.get(PtBooking, ws_session.booking_id)
            if not booking:
                await websocket.close(code=4404, reason="Booking not found")
                return
            if user.id not in (booking.owner_id, ws_session.walker_id):
                logger.warning(
                    "PT WS authorization denied: session=%s user=%s",
                    session_id, user.id,
                )
                await websocket.close(code=4003, reason="Forbidden")
                return
    except (ValueError, RuntimeError) as e:
        # Test teardown race: 연결이 미리 닫힌 경우 흡수
        logger.debug("PT WS auth_db teardown race (session=%s): %s", session_id, e)
        return

    logger.info("PT WS connected: session=%s user=%s", session_id, user.id)

    pubsub = redis_client.pubsub()
    channel = f"pt:walk:{session_id}:updates"
    await pubsub.subscribe(channel)

    async def ping_loop() -> None:
        try:
            while True:
                await asyncio.sleep(settings.ws_ping_interval_seconds)
                await websocket.send_json({"type": "ping"})
        except WebSocketDisconnect:
            logger.debug("PT WS ping loop: client disconnected, session=%s", session_id)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.warning("PT WS ping loop error: session=%s error=%s", session_id, e)

    ping_task = asyncio.create_task(ping_loop())

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"])
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    finally:
        ping_task.cancel()
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()
        logger.info("PT WS disconnected: session=%s user=%s", session_id, user.id)
