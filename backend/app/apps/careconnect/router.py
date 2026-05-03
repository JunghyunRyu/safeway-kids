"""CareConnect API router — /api/v1/cc/"""

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.careconnect import service
from app.apps.careconnect.models import CcBooking, CcChild
from app.common.security import decrypt_value
from app.apps.careconnect.schemas import (
    ActivityLogCreate,
    AvailabilityCreate,
    CaregiverProfileResponse,
    CaregiverQualCreate,
    CcBookingCreate,
    CcBookingResponse,
    CcReviewCreate,
    CcWalletResponse,
    CheckinRequest,
    ChildCreate,
    ChildResponse,
    ConsentCreate,
    ReviewReplyRequest,
    SessionMemoRequest,
    WithdrawRequest,
)
from app.database import get_db
from app.middleware.rbac import require_caregiver, require_cc_any, require_cc_parent, require_platform_admin
from app.modules.auth.models import User

router = APIRouter(prefix="/cc", tags=["CareConnect"])


# ── Children ─────────────────────────────────────────────────────

@router.post("/children", response_model=ChildResponse, status_code=201)
async def create_child(body: ChildCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent)):
    data = await service.create_child(db, user.id, body)
    await db.commit()
    return ChildResponse(**data)


@router.get("/children", response_model=list[ChildResponse])
async def list_children(db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent)):
    return [ChildResponse(**c) for c in await service.list_children(db, user.id)]


@router.post("/children/{child_id}/consent", status_code=201)
async def create_consent(
    child_id: uuid.UUID, body: ConsentCreate, request: Request,
    db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent),
):
    body.child_id = child_id
    consent = await service.create_consent(db, user.id, body, ip=request.client.host if request.client else None)
    await db.commit()
    return {"message": "법정대리인 동의가 등록되었습니다", "consent_id": str(consent.id)}


# ── Caregiver Qualification ──────────────────────────────────────

@router.post("/caregivers/qualification", status_code=201)
async def submit_qualification(body: CaregiverQualCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    qual = await service.submit_caregiver_qualification(db, user.id, body)
    await db.commit()
    return {"message": "자격 서류가 제출되었습니다", "status": qual.approval_status}


@router.post("/admin/caregivers/{cg_id}/approve")
async def approve_caregiver(
    cg_id: uuid.UUID, approve: bool = Query(True),
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_platform_admin),
):
    qual = await service.approve_caregiver(db, cg_id, admin.id, approve)
    await db.commit()
    return {"message": f"돌봄자 {'승인' if approve else '거부'}됨", "status": qual.approval_status}


# ── Caregiver Search & Profile ───────────────────────────────────

@router.get("/caregivers/search")
async def search_caregivers(
    latitude: float = Query(...), longitude: float = Query(...),
    date: str = Query(...), radius_km: float = Query(5.0),
    db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent),
):
    from datetime import date as dt_date
    return await service.search_caregivers(db, latitude, longitude, dt_date.fromisoformat(date), radius_km)


@router.get("/caregivers/{cg_id}/profile", response_model=CaregiverProfileResponse)
async def get_caregiver_profile(cg_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent)):
    return CaregiverProfileResponse(**await service.get_caregiver_profile(db, cg_id))


@router.post("/caregivers/availability", status_code=201)
async def set_availability(body: AvailabilityCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    from app.apps.careconnect.models import CaregiverAvailability
    from sqlalchemy import select
    existing = (await db.execute(
        select(CaregiverAvailability).where(CaregiverAvailability.caregiver_id == user.id, CaregiverAvailability.available_date == body.available_date)
    )).scalar_one_or_none()
    if existing:
        existing.start_time = body.start_time
        existing.end_time = body.end_time
        existing.status = "available"
    else:
        db.add(CaregiverAvailability(caregiver_id=user.id, available_date=body.available_date, start_time=body.start_time, end_time=body.end_time))
    await db.commit()
    return {"message": "가용 시간이 등록되었습니다"}




@router.get("/caregivers/availability")
async def list_availability(db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    from datetime import date as dt_date
    from app.apps.careconnect.models import CaregiverAvailability
    from sqlalchemy import select
    today = dt_date.today()
    slots = (await db.execute(
        select(CaregiverAvailability)
        .where(CaregiverAvailability.caregiver_id == user.id, CaregiverAvailability.available_date >= today)
        .order_by(CaregiverAvailability.available_date)
    )).scalars().all()
    return [
        {
            "id": str(s.id),
            "available_date": s.available_date.isoformat(),
            "start_time": s.start_time.strftime("%H:%M"),
            "end_time": s.end_time.strftime("%H:%M"),
            "status": s.status,
        }
        for s in slots
    ]


@router.delete("/caregivers/availability/{avail_id}", status_code=204)
async def delete_availability(avail_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    from app.apps.careconnect.models import CaregiverAvailability
    from sqlalchemy import select
    from fastapi import HTTPException
    slot = (await db.execute(
        select(CaregiverAvailability).where(CaregiverAvailability.id == avail_id, CaregiverAvailability.caregiver_id == user.id)
    )).scalar_one_or_none()
    if not slot:
        raise HTTPException(404, "가용 시간을 찾을 수 없습니다")
    await db.delete(slot)
    await db.commit()


# ── Bookings ─────────────────────────────────────────────────────

async def _booking_with_names(db: AsyncSession, booking: CcBooking) -> CcBookingResponse:
    base = CcBookingResponse.model_validate(booking).model_dump()
    if booking.child_id:
        child = await db.get(CcChild, booking.child_id)
        if child and child.name_encrypted:
            try:
                base["child_name"] = decrypt_value(child.name_encrypted)
            except Exception:
                base["child_name"] = None
    if booking.caregiver_id:
        cg = await db.get(User, booking.caregiver_id)
        base["caregiver_name"] = cg.name if cg else None
    return CcBookingResponse(**base)


@router.post("/bookings", response_model=CcBookingResponse, status_code=201)
async def create_booking(body: CcBookingCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent)):
    booking = await service.create_cc_booking(db, user.id, body)
    await db.commit()
    return await _booking_with_names(db, booking)


@router.post("/bookings/{booking_id}/accept", response_model=CcBookingResponse)
async def accept_booking(booking_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    booking = await service.accept_cc_booking(db, booking_id, user.id)
    await db.commit()
    return await _booking_with_names(db, booking)


@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: uuid.UUID, reason: str | None = None, db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_any)):
    await service.cancel_cc_booking(db, booking_id, user.id, reason)
    await db.commit()
    return {"message": "예약이 취소되었습니다"}


@router.get("/bookings", response_model=list[CcBookingResponse])
async def list_bookings(status: str | None = Query(None), db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_any)):
    role_str = user.role.value if hasattr(user.role, "value") else user.role
    # CareConnect PARENT role uses "parent" value
    bookings = await service.list_cc_bookings(db, user.id, role_str, status)
    return [await _booking_with_names(db, b) for b in bookings]


# ── Sessions (Geofence Check-in) ─────────────────────────────────

@router.post("/sessions/{booking_id}/checkin")
async def session_checkin(booking_id: uuid.UUID, body: CheckinRequest, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    session = await service.checkin(db, booking_id, user.id, body)
    await db.commit()
    return {"session_id": str(session.id), "checked_in_at": session.checked_in_at.isoformat()}  # type: ignore


@router.post("/sessions/{session_id}/activity", status_code=201)
async def add_activity(session_id: uuid.UUID, body: ActivityLogCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    log = await service.add_activity_log(db, session_id, user.id, body)
    await db.commit()
    return {"activity_id": str(log.id), "activity_type": log.activity_type}


@router.post("/sessions/{session_id}/checkout")
async def session_checkout(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    session = await service.checkout(db, session_id, user.id)
    await db.commit()
    return {"total_minutes": session.total_minutes, "checked_out_at": session.checked_out_at.isoformat() if session.checked_out_at else None}


@router.post("/sessions/{session_id}/handover")
async def confirm_handover(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent)):
    session = await service.confirm_handover(db, session_id, user.id)
    await db.commit()
    return {"message": "인수가 확인되었습니다"}


@router.get("/sessions/{session_id}/activities")
async def get_session_activities(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_any)):
    from sqlalchemy import select
    from app.apps.careconnect.models import CareActivityLog
    logs = (await db.execute(
        select(CareActivityLog).where(CareActivityLog.session_id == session_id).order_by(CareActivityLog.logged_at.desc())
    )).scalars().all()
    return [
        {"id": str(l.id), "activity_type": l.activity_type, "description": l.description or "",
         "time": l.logged_at.strftime("%H:%M") if l.logged_at else "", "photo_url": l.photo_url}
        for l in logs
    ]


@router.post("/sessions/{session_id}/memo")
async def save_session_memo(session_id: uuid.UUID, body: SessionMemoRequest, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    from sqlalchemy import select
    from app.apps.careconnect.models import CareSession
    session = (await db.execute(select(CareSession).where(CareSession.id == session_id))).scalar_one_or_none()
    if not session:
        from fastapi import HTTPException
        raise HTTPException(404, "세션을 찾을 수 없습니다")
    session.caregiver_memo = body.memo
    await db.commit()
    return {"message": "메모가 저장되었습니다"}


# ── Caregiver Qualification Status ──────────────────────────────

@router.get("/caregivers/qualification/status")
async def get_qualification_status(db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    from sqlalchemy import select
    from app.apps.careconnect.models import CaregiverQualification
    qual = (await db.execute(
        select(CaregiverQualification).where(CaregiverQualification.user_id == user.id)
    )).scalar_one_or_none()
    if not qual:
        return {"approval_status": "not_submitted"}
    return {"approval_status": qual.approval_status}


# ── Reviews ──────────────────────────────────────────────────────

@router.post("/reviews", status_code=201)
async def create_review(body: CcReviewCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent)):
    review = await service.create_cc_review(db, user.id, body)
    await db.commit()
    return {"review_id": str(review.id), "rating": review.rating}


@router.post("/reviews/{review_id}/reply")
async def reply_to_review(review_id: uuid.UUID, body: ReviewReplyRequest, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    from datetime import datetime, timezone
    from sqlalchemy import select
    from app.apps.careconnect.models import CaregiverReview
    review = (await db.execute(select(CaregiverReview).where(CaregiverReview.id == review_id))).scalar_one_or_none()
    if not review:
        from fastapi import HTTPException
        raise HTTPException(404, "리뷰를 찾을 수 없습니다")
    if review.caregiver_id != user.id:
        from fastapi import HTTPException
        raise HTTPException(403, "본인의 리뷰에만 답변할 수 있습니다")
    review.caregiver_reply = body.reply
    review.replied_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "답변이 등록되었습니다"}


# ── Wallet ───────────────────────────────────────────────────────

@router.get("/wallet", response_model=CcWalletResponse)
async def get_wallet(db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    wallet = await service.get_cc_wallet(db, user.id)
    return CcWalletResponse.model_validate(wallet)


@router.post("/wallet/withdraw")
async def withdraw(body: WithdrawRequest, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    tx = await service.cc_withdraw(db, user.id, body.amount)
    await db.commit()
    return {"message": f"{body.amount:,}원 출금 요청됨", "tx_id": str(tx.id)}


@router.get("/wallet/transactions")
async def list_transactions(db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    from sqlalchemy import select
    from app.apps.careconnect.models import CaregiverWallet
    from app.core.models import WalletTransaction
    wallet = (await db.execute(select(CaregiverWallet).where(CaregiverWallet.user_id == user.id))).scalar_one_or_none()
    if not wallet:
        return []
    txs = (await db.execute(
        select(WalletTransaction).where(WalletTransaction.wallet_id == wallet.id).order_by(WalletTransaction.created_at.desc()).limit(50)
    )).scalars().all()
    return [
        {"id": str(t.id), "amount": t.amount, "tx_type": t.tx_type, "status": t.status, "created_at": t.created_at.isoformat()}
        for t in txs
    ]


@router.get("/wallet/export")
async def export_cc_transactions_csv(
    month: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_caregiver),
):
    """Export CareConnect wallet transactions as CSV for the given month."""
    from fastapi.responses import StreamingResponse
    from fastapi import HTTPException
    from sqlalchemy import select
    from app.apps.careconnect.models import CaregiverWallet
    from app.core.models import WalletTransaction
    import io
    import csv
    try:
        year, mon = month.split('-')
        y = int(year)
        m = int(mon)
    except Exception:
        raise HTTPException(400, "month must be YYYY-MM")
    wallet = (await db.execute(select(CaregiverWallet).where(CaregiverWallet.user_id == user.id))).scalar_one_or_none()
    commission_rate = 20
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["날짜", "구분", "총 금액", "수수료", "실수령", "상태"])
    if wallet:
        txs = (await db.execute(
            select(WalletTransaction).where(WalletTransaction.wallet_id == wallet.id).order_by(WalletTransaction.created_at)
        )).scalars().all()
        for t in txs:
            dt = t.created_at
            if dt.year != y or dt.month != m:
                continue
            gross = t.amount
            fee = 0
            if t.tx_type == "earning":
                gross = round(t.amount / (1 - commission_rate / 100))
                fee = gross - t.amount
            writer.writerow([dt.strftime("%Y-%m-%d"), t.tx_type, gross, fee, t.amount, t.status])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue().encode('utf-8-sig')]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="cc-transactions-{month}.csv"'},
    )


# ── Admin ────────────────────────────────────────────────────────

@router.get("/admin/dashboard")
async def admin_dashboard(db: AsyncSession = Depends(get_db), admin: User = Depends(require_platform_admin)):
    from sqlalchemy import func as sqlfunc, select
    from app.apps.careconnect.models import CcBooking, CaregiverQualification, CareSession
    from app.core.models import CommissionRecord

    total_bookings = (await db.execute(select(sqlfunc.count(CcBooking.id)))).scalar() or 0
    active_sessions = (await db.execute(select(sqlfunc.count(CcBooking.id)).where(CcBooking.status == "in_progress"))).scalar() or 0
    total_caregivers = (await db.execute(select(sqlfunc.count(CaregiverQualification.id)).where(CaregiverQualification.approval_status == "approved"))).scalar() or 0
    pending_approvals = (await db.execute(select(sqlfunc.count(CaregiverQualification.id)).where(CaregiverQualification.approval_status == "pending"))).scalar() or 0
    total_revenue = (await db.execute(select(sqlfunc.sum(CommissionRecord.commission_amount)).where(CommissionRecord.app_context == "careconnect"))).scalar() or 0

    return {
        "total_bookings": total_bookings,
        "active_sessions": active_sessions,
        "total_caregivers": total_caregivers,
        "pending_approvals": pending_approvals,
        "total_revenue_krw": total_revenue,
    }


@router.get("/admin/consents")
async def list_consents(db: AsyncSession = Depends(get_db), admin: User = Depends(require_platform_admin)):
    from sqlalchemy import select
    from app.apps.careconnect.models import ChildConsent
    consents = (await db.execute(select(ChildConsent).order_by(ChildConsent.created_at.desc()).limit(50))).scalars().all()
    return [
        {"id": str(c.id), "parent_id": str(c.parent_id), "child_id": str(c.child_id),
         "scope": c.consent_scope, "granted_at": c.granted_at.isoformat(), "withdrawn": c.withdrawn_at is not None}
        for c in consents
    ]
