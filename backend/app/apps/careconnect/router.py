"""CareConnect API router — /api/v1/cc/"""

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.careconnect import service
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


# ── Bookings ─────────────────────────────────────────────────────

@router.post("/bookings", response_model=CcBookingResponse, status_code=201)
async def create_booking(body: CcBookingCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent)):
    booking = await service.create_cc_booking(db, user.id, body)
    await db.commit()
    return CcBookingResponse.model_validate(booking)


@router.post("/bookings/{booking_id}/accept", response_model=CcBookingResponse)
async def accept_booking(booking_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_caregiver)):
    booking = await service.accept_cc_booking(db, booking_id, user.id)
    await db.commit()
    return CcBookingResponse.model_validate(booking)


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
    return [CcBookingResponse.model_validate(b) for b in bookings]


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


# ── Reviews ──────────────────────────────────────────────────────

@router.post("/reviews", status_code=201)
async def create_review(body: CcReviewCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_cc_parent)):
    review = await service.create_cc_review(db, user.id, body)
    await db.commit()
    return {"review_id": str(review.id), "rating": review.rating}


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
