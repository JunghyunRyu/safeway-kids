"""Integration tests: Toss Payments PG endpoints (prepare, confirm, webhook)."""

import uuid
from datetime import date, time
from unittest.mock import AsyncMock, patch

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academy_management.models import Academy
from app.modules.auth.models import User, UserRole
from app.modules.billing.models import BillingPlan, Invoice, Payment
from app.modules.scheduling.models import DailyScheduleInstance
from app.modules.student_management.models import Enrollment, Student
from tests.conftest import auth_header


async def _setup_invoice(db: AsyncSession, parent: User) -> dict:
    """Create academy, student, billing plan, rides, and a pending invoice."""
    academy = Academy(
        id=uuid.uuid4(),
        name="PG테스트학원",
        address="서울시 강남구",
        latitude=37.5,
        longitude=127.0,
    )
    db.add(academy)
    await db.flush()

    student = Student(
        id=uuid.uuid4(),
        guardian_id=parent.id,
        name="PG학생",
        date_of_birth=date(2018, 5, 10),
    )
    db.add(student)
    await db.flush()

    db.add(Enrollment(student_id=student.id, academy_id=academy.id))

    plan = BillingPlan(
        academy_id=academy.id,
        name="PG 요금제",
        price_per_ride=5000,
        monthly_cap=150000,
    )
    db.add(plan)

    for day in range(1, 6):
        db.add(DailyScheduleInstance(
            student_id=student.id,
            academy_id=academy.id,
            schedule_date=date(2026, 3, day),
            pickup_time=time(14, 0),
            pickup_latitude=37.501,
            pickup_longitude=127.001,
            status="completed",
        ))
    await db.flush()

    # Create invoice directly
    invoice = Invoice(
        id=uuid.uuid4(),
        parent_id=parent.id,
        academy_id=academy.id,
        student_id=student.id,
        billing_month="2026-03",
        total_rides=5,
        amount=25000,
        due_date=date(2026, 4, 10),
        status="pending",
    )
    db.add(invoice)
    await db.flush()

    return {"academy": academy, "student": student, "invoice": invoice}


class TestPaymentPrepare:
    """Test POST /api/v1/billing/payments/prepare."""

    async def test_prepare_returns_order_id_and_client_key(
        self, client, db_session, parent_user, parent_token,
    ):
        scenario = await _setup_invoice(db_session, parent_user)
        invoice = scenario["invoice"]

        response = await client.post(
            "/api/v1/billing/payments/prepare",
            json={"invoice_id": str(invoice.id)},
            headers=auth_header(parent_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["order_id"].startswith("SAFEWAY-")
        assert data["amount"] == 25000
        assert "client_key" in data
        assert "order_name" in data

    async def test_prepare_nonexistent_invoice_returns_404(
        self, client, parent_token,
    ):
        response = await client.post(
            "/api/v1/billing/payments/prepare",
            json={"invoice_id": str(uuid.uuid4())},
            headers=auth_header(parent_token),
        )
        assert response.status_code == 404

    async def test_prepare_already_paid_returns_422(
        self, client, db_session, parent_user, parent_token,
    ):
        scenario = await _setup_invoice(db_session, parent_user)
        invoice = scenario["invoice"]
        invoice.status = "paid"
        await db_session.flush()

        response = await client.post(
            "/api/v1/billing/payments/prepare",
            json={"invoice_id": str(invoice.id)},
            headers=auth_header(parent_token),
        )
        assert response.status_code == 422

    async def test_prepare_other_parents_invoice_returns_403(
        self, client, db_session, parent_user, parent_token,
    ):
        """A parent cannot prepare payment for another parent's invoice."""
        other_parent = User(
            id=uuid.uuid4(),
            role=UserRole.PARENT,
            phone="01099990000",
            name="다른 학부모",
            is_active=True,
        )
        db_session.add(other_parent)
        await db_session.flush()

        scenario = await _setup_invoice(db_session, other_parent)
        invoice = scenario["invoice"]

        response = await client.post(
            "/api/v1/billing/payments/prepare",
            json={"invoice_id": str(invoice.id)},
            headers=auth_header(parent_token),
        )
        assert response.status_code == 403


class TestPaymentConfirm:
    """Test POST /api/v1/billing/payments/confirm."""

    async def test_confirm_creates_payment_and_marks_invoice_paid(
        self, client, db_session, parent_user, parent_token,
    ):
        scenario = await _setup_invoice(db_session, parent_user)
        invoice = scenario["invoice"]

        # First prepare to get order_id
        prepare_resp = await client.post(
            "/api/v1/billing/payments/prepare",
            json={"invoice_id": str(invoice.id)},
            headers=auth_header(parent_token),
        )
        order_id = prepare_resp.json()["order_id"]
        payment_key = "test_pk_" + uuid.uuid4().hex[:12]

        # Confirm (dev mode auto-returns DONE)
        response = await client.post(
            "/api/v1/billing/payments/confirm",
            json={
                "payment_key": payment_key,
                "order_id": order_id,
                "amount": 25000,
            },
            headers=auth_header(parent_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["invoice_id"] == str(invoice.id)
        assert data["amount"] == 25000
        assert data["status"] == "paid"
        assert data["pg_payment_key"] == payment_key
        assert data["pg_status"] == "DONE"

    async def test_confirm_amount_mismatch_returns_422(
        self, client, db_session, parent_user, parent_token,
    ):
        scenario = await _setup_invoice(db_session, parent_user)
        invoice = scenario["invoice"]

        prepare_resp = await client.post(
            "/api/v1/billing/payments/prepare",
            json={"invoice_id": str(invoice.id)},
            headers=auth_header(parent_token),
        )
        order_id = prepare_resp.json()["order_id"]

        response = await client.post(
            "/api/v1/billing/payments/confirm",
            json={
                "payment_key": "test_pk_wrong",
                "order_id": order_id,
                "amount": 99999,  # wrong amount
            },
            headers=auth_header(parent_token),
        )
        assert response.status_code == 422

    async def test_confirm_invalid_order_id_returns_422(
        self, client, parent_token,
    ):
        response = await client.post(
            "/api/v1/billing/payments/confirm",
            json={
                "payment_key": "test_pk_bad",
                "order_id": "BAD-ORDER-ID",
                "amount": 10000,
            },
            headers=auth_header(parent_token),
        )
        assert response.status_code == 422


class TestTossWebhook:
    """Test POST /api/v1/billing/webhook."""

    async def test_webhook_updates_payment_status(
        self, client, db_session, parent_user, parent_token,
    ):
        scenario = await _setup_invoice(db_session, parent_user)
        invoice = scenario["invoice"]

        # Create a payment record directly
        payment = Payment(
            id=uuid.uuid4(),
            invoice_id=invoice.id,
            amount=25000,
            method="카드",
            pg_payment_key="wh_test_pk_123",
            pg_order_id=f"SAFEWAY-{invoice.id}-abc12345",
            pg_status="DONE",
        )
        db_session.add(payment)
        invoice.status = "paid"
        await db_session.flush()

        # Send cancel webhook
        response = await client.post(
            "/api/v1/billing/webhook",
            json={
                "event_type": "PAYMENT_STATUS_CHANGED",
                "data": {
                    "paymentKey": "wh_test_pk_123",
                    "status": "CANCELED",
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"

    async def test_webhook_empty_payload_ignored(self, client):
        response = await client.post(
            "/api/v1/billing/webhook",
            json={"event_type": None, "data": None},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ignored"

    async def test_webhook_unknown_payment_key_ignored(self, client):
        response = await client.post(
            "/api/v1/billing/webhook",
            json={
                "event_type": "PAYMENT_STATUS_CHANGED",
                "data": {
                    "paymentKey": "unknown_key_999",
                    "status": "DONE",
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ignored"
        assert data["reason"] == "payment_not_found"
