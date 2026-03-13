"""Billing service: invoice generation from completed rides."""

import uuid
from datetime import UTC, date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.billing.models import BillingPlan, Invoice
from app.modules.scheduling.models import DailyScheduleInstance
from app.modules.student_management.models import Enrollment, Student


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


async def mark_invoice_paid(
    db: AsyncSession, invoice_id: uuid.UUID
) -> Invoice | None:
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        return None
    from datetime import datetime
    invoice.status = "paid"
    invoice.paid_at = datetime.now(UTC)
    await db.flush()
    return invoice
