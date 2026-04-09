"""PetTracker API router — /api/v1/pt/"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker import service
from app.apps.pettracker.schemas import (
    BookingCreate,
    BookingResponse,
    GpsPoint,
    PetCreate,
    PetResponse,
    PetUpdate,
    ReviewCreate,
    ReviewReplyRequest,
    ReviewWithReplyResponse,
    ReviewResponse,
    WalkerAvailabilityCreate,
    WalkerProfileResponse,
    WalkerQualificationCreate,
    WalkerSearchParams,
    WalkMemoUpdate,
    WalkReportResponse,
    WalletResponse,
    WithdrawRequest,
)
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_pet_owner, require_platform_admin, require_pt_any, require_walker
from app.modules.auth.models import User

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
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_pet_owner),
) -> list[dict]:
    from datetime import date as dt_date
    params = WalkerSearchParams(
        latitude=latitude, longitude=longitude,
        date=dt_date.fromisoformat(date), radius_km=radius_km,
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
    await service.record_gps(db, session_id, body)
    await db.commit()
    return {"status": "ok"}


@router.post("/walks/{session_id}/end")
async def end_walk(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_walker),
) -> dict:
    session = await service.end_walk(db, session_id, user.id)
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
    return WalkReportResponse(
        session_id=session.id,
        booking_id=session.booking_id,
        started_at=session.started_at,
        ended_at=session.ended_at,
        distance_meters=session.distance_meters,
        walker_memo=session.walker_memo,
        route_polyline=session.route_polyline,
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
from sqlalchemy import select
from app.apps.pettracker.models import WalkerQualification as _WQ
