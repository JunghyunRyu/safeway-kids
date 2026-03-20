"""Billing service: invoice generation from completed rides."""

import logging
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.billing.models import BillingPlan, Invoice, Payment
from app.modules.billing.providers.toss_payments import toss_provider
from app.modules.scheduling.models import DailyScheduleInstance
from app.modules.student_management.models import Enrollment, Student

logger = logging.getLogger(__name__)


async def create_plan(
    db: AsyncSession,
    academy_id: uuid.UUID,
    name: str,
    price_per_ride: int,
    monthly_cap: int | None = None,
) -> BillingPlan:
    plan = BillingPlan(
        academy_id=academy_id,
        name=name,
        price_per_ride=price_per_ride,
        monthly_cap=monthly_cap,
    )
    db.add(plan)
    await db.flush()
    return plan


async def get_plan(db: AsyncSession, plan_id: uuid.UUID) -> BillingPlan:
    """Get a single billing plan by id."""
    plan = await db.get(BillingPlan, plan_id)
    if not plan:
        from app.common.exceptions import NotFoundError
        raise NotFoundError(detail="요금제를 찾을 수 없습니다")
    return plan


async def update_plan(
    db: AsyncSession,
    plan_id: uuid.UUID,
    name: str | None = None,
    price_per_ride: int | None = None,
    monthly_cap: int | None = None,
    is_active: bool | None = None,
) -> BillingPlan:
    """Update billing plan fields."""
    plan = await get_plan(db, plan_id)
    if name is not None:
        plan.name = name
    if price_per_ride is not None:
        plan.price_per_ride = price_per_ride
    if monthly_cap is not None:
        plan.monthly_cap = monthly_cap
    if is_active is not None:
        plan.is_active = is_active
    await db.flush()
    return plan


async def deactivate_plan(db: AsyncSession, plan_id: uuid.UUID) -> BillingPlan:
    """Soft-deactivate a billing plan."""
    plan = await get_plan(db, plan_id)
    plan.is_active = False
    await db.flush()
    return plan


async def get_plans(
    db: AsyncSession, academy_id: uuid.UUID
) -> list[BillingPlan]:
    stmt = select(BillingPlan).where(
        BillingPlan.academy_id == academy_id,
        BillingPlan.is_active.is_(True),
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def generate_invoices(
    db: AsyncSession, academy_id: uuid.UUID, billing_month: str
) -> dict:
    """Generate invoices for all students at an academy for a given month.

    Counts completed rides (status in boarded/completed) from
    DailyScheduleInstance for the billing month.
    """
    # Parse month
    year, month = int(billing_month[:4]), int(billing_month[5:7])
    month_start = date(year, month, 1)
    month_end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    # Get active billing plan
    plan_stmt = select(BillingPlan).where(
        BillingPlan.academy_id == academy_id,
        BillingPlan.is_active.is_(True),
    )
    plan_result = await db.execute(plan_stmt)
    plan = plan_result.scalar_one_or_none()
    if not plan:
        return {"invoices_created": 0, "total_amount": 0}

    # Get enrolled students
    enroll_stmt = (
        select(Enrollment.student_id)
        .where(Enrollment.academy_id == academy_id)
    )
    enrolled = await db.execute(enroll_stmt)
    student_ids = [row[0] for row in enrolled.all()]

    invoices_created = 0
    total_amount = 0

    for student_id in student_ids:
        # Check if invoice already exists
        existing = await db.execute(
            select(Invoice).where(
                Invoice.student_id == student_id,
                Invoice.academy_id == academy_id,
                Invoice.billing_month == billing_month,
            )
        )
        if existing.scalar_one_or_none():
            continue

        # Count completed rides
        ride_count_stmt = select(func.count()).where(
            DailyScheduleInstance.student_id == student_id,
            DailyScheduleInstance.academy_id == academy_id,
            DailyScheduleInstance.schedule_date >= month_start,
            DailyScheduleInstance.schedule_date < month_end,
            DailyScheduleInstance.status.in_(["boarded", "completed"]),
        )
        ride_result = await db.execute(ride_count_stmt)
        ride_count = ride_result.scalar() or 0

        if ride_count == 0:
            continue

        # Calculate amount
        amount = ride_count * plan.price_per_ride
        if plan.monthly_cap and amount > plan.monthly_cap:
            amount = plan.monthly_cap

        # Get parent_id
        student = await db.get(Student, student_id)
        if not student:
            continue

        # Due date: 10th of next month
        due = date(year + 1, 1, 10) if month == 12 else date(year, month + 1, 10)

        invoice = Invoice(
            parent_id=student.guardian_id,
            academy_id=academy_id,
            student_id=student_id,
            billing_month=billing_month,
            total_rides=ride_count,
            amount=amount,
            due_date=due,
        )
        db.add(invoice)
        invoices_created += 1
        total_amount += amount

    await db.flush()
    return {"invoices_created": invoices_created, "total_amount": total_amount}


async def get_parent_invoices(
    db: AsyncSession, parent_id: uuid.UUID
) -> list[Invoice]:
    stmt = (
        select(Invoice)
        .where(Invoice.parent_id == parent_id)
        .order_by(Invoice.billing_month.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_academy_invoices(
    db: AsyncSession, academy_id: uuid.UUID, billing_month: str | None = None
) -> list[Invoice]:
    stmt = select(Invoice).where(Invoice.academy_id == academy_id)
    if billing_month:
        stmt = stmt.where(Invoice.billing_month == billing_month)
    stmt = stmt.order_by(Invoice.billing_month.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_all_invoices(
    db: AsyncSession, billing_month: str | None = None
) -> list[Invoice]:
    """플랫폼 관리자: 전체 청구서 목록."""
    stmt = select(Invoice)
    if billing_month:
        stmt = stmt.where(Invoice.billing_month == billing_month)
    stmt = stmt.order_by(Invoice.billing_month.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def mark_invoice_paid(
    db: AsyncSession, invoice_id: uuid.UUID
) -> Invoice | None:
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        return None
    invoice.status = "paid"
    invoice.paid_at = datetime.now(UTC)
    await db.flush()
    return invoice


# --- PG (Toss Payments) service functions ---


async def prepare_payment(
    db: AsyncSession, invoice_id: uuid.UUID, parent_id: uuid.UUID
) -> dict:
    """Create an order_id and return details needed for frontend Toss widget."""
    from app.config import settings

    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        return {"error": "invoice_not_found"}
    if invoice.parent_id != parent_id:
        return {"error": "not_owner"}
    if invoice.status == "paid":
        return {"error": "already_paid"}

    order_id = f"SAFEWAY-{invoice_id!s}-{uuid.uuid4().hex[:8]}"

    return {
        "order_id": order_id,
        "amount": invoice.amount,
        "order_name": f"통학버스 이용료 ({invoice.billing_month})",
        "client_key": settings.toss_payments_client_key,
        "customer_name": None,
    }


async def confirm_payment(
    db: AsyncSession,
    payment_key: str,
    order_id: str,
    amount: int,
) -> dict:
    """Confirm payment with Toss and record it locally."""
    # Extract invoice_id from order_id (format: SAFEWAY-{uuid}-{hex8})
    parts = order_id.split("-")
    # UUID is parts[1] through parts[5] (standard UUID has 5 groups)
    if len(parts) < 7:
        return {"error": "invalid_order_id"}

    invoice_id_str = "-".join(parts[1:6])
    try:
        invoice_id = uuid.UUID(invoice_id_str)
    except ValueError:
        return {"error": "invalid_order_id"}

    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        return {"error": "invoice_not_found"}
    if invoice.status == "paid":
        return {"error": "already_paid"}
    if invoice.amount != amount:
        return {"error": "amount_mismatch"}

    # Call Toss Payments API
    toss_result = await toss_provider.confirm_payment(payment_key, order_id, amount)

    pg_status = toss_result.get("status", "UNKNOWN")

    # Create payment record
    payment = Payment(
        invoice_id=invoice_id,
        amount=amount,
        method=toss_result.get("method", "card"),
        pg_payment_key=payment_key,
        pg_order_id=order_id,
        pg_status=pg_status,
    )
    db.add(payment)

    # Mark invoice as paid
    if pg_status == "DONE":
        invoice.status = "paid"
        invoice.paid_at = datetime.now(UTC)

    await db.flush()

    return {
        "payment_id": payment.id,
        "invoice_id": invoice_id,
        "amount": amount,
        "status": invoice.status,
        "pg_payment_key": payment_key,
        "pg_status": pg_status,
    }


async def handle_toss_webhook(
    db: AsyncSession, event_type: str | None, data: dict | None
) -> dict:
    """Process Toss Payments webhook events."""
    if not event_type or not data:
        return {"status": "ignored", "reason": "empty_payload"}

    payment_key = data.get("paymentKey")
    if not payment_key:
        return {"status": "ignored", "reason": "no_payment_key"}

    # Find the payment record by pg_payment_key
    stmt = select(Payment).where(Payment.pg_payment_key == payment_key)
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()

    if not payment:
        logger.warning("Webhook received for unknown payment_key=%s", payment_key)
        return {"status": "ignored", "reason": "payment_not_found"}

    new_status = data.get("status")
    if new_status:
        payment.pg_status = new_status

    # If payment was canceled, update invoice
    if new_status == "CANCELED" and payment.invoice_id:
        invoice = await db.get(Invoice, payment.invoice_id)
        if invoice and invoice.status == "paid":
            invoice.status = "pending"
            invoice.paid_at = None

    await db.flush()
    return {"status": "processed", "payment_key": payment_key}
