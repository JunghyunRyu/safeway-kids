"""Billing API endpoints."""

import logging
import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError, ValidationError
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.billing import service
from app.modules.billing.schemas import (
    BillingPlanCreate,
    BillingPlanResponse,
    BillingPlanUpdateRequest,
    GenerateInvoicesRequest,
    GenerateInvoicesResponse,
    InvoiceResponse,
    PaymentConfirmRequest,
    PaymentConfirmResponse,
    PaymentPrepareRequest,
    PaymentPrepareResponse,
    TossWebhookPayload,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/plans", response_model=BillingPlanResponse)
async def create_plan(
    request: Request,
    body: BillingPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> BillingPlanResponse:
    """요금제 생성 (관리자)"""
    from app.modules.admin.service import log_audit

    plan = await service.create_plan(
        db, body.academy_id, body.name,
        body.price_per_ride, body.monthly_cap,
    )
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="CREATE",
        entity_type="billing_plan",
        entity_id=str(plan.id),
        details={"name": body.name, "price_per_ride": body.price_per_ride},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
    return BillingPlanResponse.model_validate(plan)


@router.get("/plans", response_model=list[BillingPlanResponse])
async def list_plans(
    academy_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> list[BillingPlanResponse]:
    """요금제 목록 조회"""
    plans = await service.get_plans(db, academy_id)
    return [BillingPlanResponse.model_validate(p) for p in plans]


@router.patch("/plans/{plan_id}", response_model=BillingPlanResponse)
async def update_plan(
    plan_id: uuid.UUID,
    body: BillingPlanUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> BillingPlanResponse:
    """요금제 수정 (관리자)"""
    from app.modules.admin.service import log_audit

    plan = await service.update_plan(
        db, plan_id,
        name=body.name,
        price_per_ride=body.price_per_ride,
        monthly_cap=body.monthly_cap,
        is_active=body.is_active,
    )
    changes = {}
    if body.name is not None:
        changes["name"] = body.name
    if body.price_per_ride is not None:
        changes["price_per_ride"] = body.price_per_ride
    if body.monthly_cap is not None:
        changes["monthly_cap"] = body.monthly_cap
    if body.is_active is not None:
        changes["is_active"] = body.is_active
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="UPDATE",
        entity_type="billing_plan",
        entity_id=str(plan_id),
        details=changes,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
    return BillingPlanResponse.model_validate(plan)


@router.delete("/plans/{plan_id}", response_model=BillingPlanResponse)
async def deactivate_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> BillingPlanResponse:
    """요금제 비활성화 (관리자)"""
    plan = await service.deactivate_plan(db, plan_id)
    await db.commit()
    return BillingPlanResponse.model_validate(plan)


@router.post("/generate-invoices", response_model=GenerateInvoicesResponse)
async def generate_invoices(
    request: GenerateInvoicesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> dict:
    """월별 청구서 일괄 생성"""
    result = await service.generate_invoices(
        db, request.academy_id, request.billing_month,
    )
    await db.commit()
    return result


@router.get("/invoices/my", response_model=list[InvoiceResponse])
async def my_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[InvoiceResponse]:
    """내 청구서 목록 (학부모)"""
    invoices = await service.get_parent_invoices(db, current_user.id)
    return [InvoiceResponse(**i) for i in invoices]


@router.get("/invoices", response_model=list[InvoiceResponse])
async def academy_invoices(
    academy_id: uuid.UUID | None = None,
    billing_month: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> list[InvoiceResponse]:
    """학원 청구서 목록 (관리자) — academy_id 없으면 플랫폼 관리자 전체 조회"""
    if academy_id:
        invoices = await service.get_academy_invoices(db, academy_id, billing_month)
    else:
        invoices = await service.get_all_invoices(db, billing_month)
    return [InvoiceResponse.model_validate(i) for i in invoices]


@router.post("/invoices/{invoice_id}/mark-paid", response_model=InvoiceResponse)
async def mark_paid(
    invoice_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> InvoiceResponse:
    """청구서 결제 완료 처리"""
    from app.modules.admin.service import log_audit

    invoice = await service.mark_invoice_paid(db, invoice_id)
    if not invoice:
        raise NotFoundError(detail="청구서를 찾을 수 없습니다")
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="UPDATE",
        entity_type="invoice",
        entity_id=str(invoice_id),
        details={"status": "paid"},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
    return InvoiceResponse.model_validate(invoice)


# --- PG (Toss Payments) endpoints ---


@router.post("/payments/prepare", response_model=PaymentPrepareResponse)
async def prepare_payment(
    request: PaymentPrepareRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentPrepareResponse:
    """결제 준비: order_id 생성 및 프론트엔드용 client_key 반환"""
    result = await service.prepare_payment(db, request.invoice_id, current_user.id)
    if "error" in result:
        error = result["error"]
        if error == "invoice_not_found":
            raise NotFoundError(detail="청구서를 찾을 수 없습니다")
        if error == "not_owner":
            from app.common.exceptions import ForbiddenError
            raise ForbiddenError(detail="본인의 청구서만 결제할 수 있습니다")
        if error == "already_paid":
            raise ValidationError(detail="이미 결제된 청구서입니다")
        raise ValidationError(detail=error)
    return PaymentPrepareResponse(**result)


@router.post("/payments/confirm", response_model=PaymentConfirmResponse)
async def confirm_payment(
    request: PaymentConfirmRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentConfirmResponse:
    """결제 승인: Toss Payments 결제 확인 후 청구서 상태 업데이트"""
    result = await service.confirm_payment(
        db, request.payment_key, request.order_id, request.amount,
    )
    if "error" in result:
        error = result["error"]
        if error == "invoice_not_found":
            raise NotFoundError(detail="청구서를 찾을 수 없습니다")
        if error == "invalid_order_id":
            raise ValidationError(detail="잘못된 주문 ID입니다")
        if error == "already_paid":
            raise ValidationError(detail="이미 결제된 청구서입니다")
        if error == "amount_mismatch":
            raise ValidationError(detail="결제 금액이 일치하지 않습니다")
        raise ValidationError(detail=error)
    await db.commit()
    return PaymentConfirmResponse(**result)


@router.post("/webhook")
async def toss_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Toss Payments 웹훅 수신 (결제 상태 업데이트) — 서명 검증"""
    import hashlib
    import hmac

    from app.config import settings

    body_bytes = await request.body()

    # Verify webhook signature if secret is configured
    webhook_secret = settings.toss_payments_webhook_secret
    if webhook_secret:
        sig_header = request.headers.get("Toss-Signature") or request.headers.get("toss-signature")
        if not sig_header:
            logger.warning("Toss webhook missing signature header")
            from app.common.exceptions import ForbiddenError
            raise ForbiddenError(detail="Missing webhook signature")
        expected = hmac.new(
            webhook_secret.encode(), body_bytes, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig_header, expected):
            logger.warning("Toss webhook signature mismatch")
            from app.common.exceptions import ForbiddenError
            raise ForbiddenError(detail="Invalid webhook signature")

    import json
    payload_data = json.loads(body_bytes)
    payload = TossWebhookPayload(**payload_data)
    result = await service.handle_toss_webhook(
        db, payload.event_type, payload.data,
    )
    await db.commit()
    return result
