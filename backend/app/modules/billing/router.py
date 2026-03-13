"""Billing API endpoints."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.billing import service
from app.modules.billing.schemas import (
    BillingPlanCreate,
    BillingPlanResponse,
    GenerateInvoicesRequest,
    GenerateInvoicesResponse,
    InvoiceResponse,
)

router = APIRouter()


@router.post("/plans", response_model=BillingPlanResponse)
async def create_plan(
    request: BillingPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> BillingPlanResponse:
    """요금제 생성 (관리자)"""
    plan = await service.create_plan(
        db, request.academy_id, request.name,
        request.price_per_ride, request.monthly_cap,
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
    return [InvoiceResponse.model_validate(i) for i in invoices]


@router.get("/invoices", response_model=list[InvoiceResponse])
async def academy_invoices(
    academy_id: uuid.UUID,
    billing_month: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> list[InvoiceResponse]:
    """학원 청구서 목록 (관리자)"""
    invoices = await service.get_academy_invoices(
        db, academy_id, billing_month,
    )
    return [InvoiceResponse.model_validate(i) for i in invoices]


@router.post("/invoices/{invoice_id}/mark-paid", response_model=InvoiceResponse)
async def mark_paid(
    invoice_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> InvoiceResponse:
    """청구서 결제 완료 처리"""
    invoice = await service.mark_invoice_paid(db, invoice_id)
    if not invoice:
        from app.common.exceptions import NotFoundError
        raise NotFoundError(detail="청구서를 찾을 수 없습니다")
    await db.commit()
    return InvoiceResponse.model_validate(invoice)
