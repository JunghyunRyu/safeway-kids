"""M7 integration tests: billing plans, invoice generation, parent view, mark paid."""

import uuid
from datetime import date, time

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academy_management.models import Academy
from app.modules.auth.models import User, UserRole
from app.modules.billing.models import BillingPlan, Invoice
from app.modules.scheduling.models import DailyScheduleInstance
from app.modules.student_management.models import Enrollment, Student
from tests.conftest import auth_header


async def _billing_scenario(db: AsyncSession, parent: User) -> dict:
    """Set up academy, student, enrollment, billing plan, and completed rides."""
    academy = Academy(
        id=uuid.uuid4(),
        name="빌링테스트학원",
        address="서울시 강남구",
        latitude=37.5,
        longitude=127.0,
    )
    db.add(academy)
    await db.flush()

    student = Student(
        id=uuid.uuid4(),
        guardian_id=parent.id,
        name="빌링학생",
        date_of_birth=date(2018, 5, 10),
    )
    db.add(student)
    await db.flush()

    enrollment = Enrollment(student_id=student.id, academy_id=academy.id)
    db.add(enrollment)

    plan = BillingPlan(
        academy_id=academy.id,
        name="기본 요금제",
        price_per_ride=5000,
        monthly_cap=150000,
    )
    db.add(plan)

    # Create 5 completed rides in March 2026
    for day in range(1, 6):
        ride = DailyScheduleInstance(
            student_id=student.id,
            academy_id=academy.id,
            schedule_date=date(2026, 3, day),
            pickup_time=time(14, 0),
            pickup_latitude=37.501,
            pickup_longitude=127.001,
            status="completed",
        )
        db.add(ride)

    await db.flush()
    return {"academy": academy, "student": student, "plan": plan}


class TestBillingPlanCreate:
    """Test POST /api/v1/billing/plans."""

    async def test_admin_creates_billing_plan(
        self, client, db_session, academy_admin_user, academy_admin_token,
    ):
        academy = Academy(
            id=uuid.uuid4(),
            name="요금제학원",
            address="서울시 서초구",
            latitude=37.49,
            longitude=127.01,
        )
        db_session.add(academy)
        await db_session.flush()

        response = await client.post(
            "/api/v1/billing/plans",
            json={
                "academy_id": str(academy.id),
                "name": "프리미엄 요금제",
                "price_per_ride": 7000,
                "monthly_cap": 200000,
            },
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "프리미엄 요금제"
        assert data["price_per_ride"] == 7000
        assert data["monthly_cap"] == 200000
        assert data["is_active"] is True

    async def test_parent_cannot_create_plan(
        self, client, parent_token,
    ):
        response = await client.post(
            "/api/v1/billing/plans",
            json={
                "academy_id": str(uuid.uuid4()),
                "name": "불법 요금제",
                "price_per_ride": 1000,
            },
            headers=auth_header(parent_token),
        )
        assert response.status_code == 403

    async def test_create_plan_without_monthly_cap(
        self, client, db_session, academy_admin_user, academy_admin_token,
    ):
        academy = Academy(
            id=uuid.uuid4(),
            name="무제한학원",
            address="서울시 송파구",
            latitude=37.51,
            longitude=127.05,
        )
        db_session.add(academy)
        await db_session.flush()

        response = await client.post(
            "/api/v1/billing/plans",
            json={
                "academy_id": str(academy.id),
                "name": "무제한 요금제",
                "price_per_ride": 5000,
            },
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["monthly_cap"] is None


class TestGenerateInvoices:
    """Test POST /api/v1/billing/generate-invoices."""

    async def test_generate_invoices_for_month(
        self, client, db_session, parent_user, academy_admin_user, academy_admin_token,
    ):
        scenario = await _billing_scenario(db_session, parent_user)
        academy = scenario["academy"]

        response = await client.post(
            "/api/v1/billing/generate-invoices",
            json={
                "academy_id": str(academy.id),
                "billing_month": "2026-03",
            },
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["invoices_created"] == 1
        # 5 rides * 5000 = 25000
        assert data["total_amount"] == 25000

    async def test_generate_invoices_respects_monthly_cap(
        self, client, db_session, parent_user, academy_admin_user, academy_admin_token,
    ):
        """When rides exceed monthly cap, cap is applied."""
        academy = Academy(
            id=uuid.uuid4(),
            name="캡테스트학원",
            address="서울시",
            latitude=37.5,
            longitude=127.0,
        )
        db_session.add(academy)
        await db_session.flush()

        student = Student(
            guardian_id=parent_user.id,
            name="캡학생",
            date_of_birth=date(2019, 1, 1),
        )
        db_session.add(student)
        await db_session.flush()

        db_session.add(Enrollment(student_id=student.id, academy_id=academy.id))

        # Low cap: 10000 KRW
        plan = BillingPlan(
            academy_id=academy.id,
            name="캡 요금제",
            price_per_ride=5000,
            monthly_cap=10000,
        )
        db_session.add(plan)

        # 5 rides = 25000 but cap is 10000
        for day in range(1, 6):
            db_session.add(DailyScheduleInstance(
                student_id=student.id,
                academy_id=academy.id,
                schedule_date=date(2026, 3, day),
                pickup_time=time(14, 0),
                pickup_latitude=37.5,
                pickup_longitude=127.0,
                status="boarded",
            ))
        await db_session.flush()

        response = await client.post(
            "/api/v1/billing/generate-invoices",
            json={
                "academy_id": str(academy.id),
                "billing_month": "2026-03",
            },
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["invoices_created"] == 1
        assert data["total_amount"] == 10000  # capped

    async def test_generate_invoices_no_rides_creates_nothing(
        self, client, db_session, parent_user, academy_admin_user, academy_admin_token,
    ):
        """No completed rides means no invoices."""
        academy = Academy(
            id=uuid.uuid4(),
            name="빈학원",
            address="서울시",
            latitude=37.5,
            longitude=127.0,
        )
        db_session.add(academy)
        await db_session.flush()

        student = Student(
            guardian_id=parent_user.id,
            name="빈학생",
            date_of_birth=date(2019, 6, 1),
        )
        db_session.add(student)
        await db_session.flush()

        db_session.add(Enrollment(student_id=student.id, academy_id=academy.id))
        db_session.add(BillingPlan(
            academy_id=academy.id,
            name="기본",
            price_per_ride=5000,
        ))
        await db_session.flush()

        response = await client.post(
            "/api/v1/billing/generate-invoices",
            json={
                "academy_id": str(academy.id),
                "billing_month": "2026-03",
            },
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["invoices_created"] == 0
        assert data["total_amount"] == 0

    async def test_generate_invoices_idempotent(
        self, client, db_session, parent_user, academy_admin_user, academy_admin_token,
    ):
        """Running generate twice does not duplicate invoices."""
        scenario = await _billing_scenario(db_session, parent_user)
        academy = scenario["academy"]
        payload = {
            "academy_id": str(academy.id),
            "billing_month": "2026-03",
        }

        resp1 = await client.post(
            "/api/v1/billing/generate-invoices",
            json=payload,
            headers=auth_header(academy_admin_token),
        )
        assert resp1.json()["invoices_created"] == 1

        resp2 = await client.post(
            "/api/v1/billing/generate-invoices",
            json=payload,
            headers=auth_header(academy_admin_token),
        )
        assert resp2.json()["invoices_created"] == 0  # already exists


class TestParentInvoices:
    """Test GET /api/v1/billing/invoices/my."""

    async def test_parent_sees_own_invoices(
        self, client, db_session, parent_user, parent_token,
        academy_admin_user, academy_admin_token,
    ):
        scenario = await _billing_scenario(db_session, parent_user)
        academy = scenario["academy"]

        # Generate invoices first
        await client.post(
            "/api/v1/billing/generate-invoices",
            json={
                "academy_id": str(academy.id),
                "billing_month": "2026-03",
            },
            headers=auth_header(academy_admin_token),
        )

        # Parent fetches their invoices
        response = await client.get(
            "/api/v1/billing/invoices/my",
            headers=auth_header(parent_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["billing_month"] == "2026-03"
        assert data[0]["total_rides"] == 5
        assert data[0]["amount"] == 25000
        assert data[0]["status"] == "pending"
        assert data[0]["parent_id"] == str(parent_user.id)

    async def test_parent_no_invoices_returns_empty(
        self, client, parent_token,
    ):
        response = await client.get(
            "/api/v1/billing/invoices/my",
            headers=auth_header(parent_token),
        )
        assert response.status_code == 200
        assert response.json() == []


class TestMarkInvoicePaid:
    """Test POST /api/v1/billing/invoices/{id}/mark-paid."""

    async def test_admin_marks_invoice_paid(
        self, client, db_session, parent_user, academy_admin_user, academy_admin_token,
    ):
        scenario = await _billing_scenario(db_session, parent_user)
        academy = scenario["academy"]

        # Generate invoice
        await client.post(
            "/api/v1/billing/generate-invoices",
            json={
                "academy_id": str(academy.id),
                "billing_month": "2026-03",
            },
            headers=auth_header(academy_admin_token),
        )

        # Fetch invoices to get the ID
        invoices_resp = await client.get(
            f"/api/v1/billing/invoices?academy_id={academy.id}",
            headers=auth_header(academy_admin_token),
        )
        invoices = invoices_resp.json()
        assert len(invoices) == 1
        invoice_id = invoices[0]["id"]

        # Mark as paid
        response = await client.post(
            f"/api/v1/billing/invoices/{invoice_id}/mark-paid",
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "paid"
        assert data["paid_at"] is not None

    async def test_mark_nonexistent_invoice_returns_404(
        self, client, academy_admin_token,
    ):
        fake_id = uuid.uuid4()
        response = await client.post(
            f"/api/v1/billing/invoices/{fake_id}/mark-paid",
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 404

    async def test_parent_cannot_mark_paid(
        self, client, parent_token,
    ):
        fake_id = uuid.uuid4()
        response = await client.post(
            f"/api/v1/billing/invoices/{fake_id}/mark-paid",
            headers=auth_header(parent_token),
        )
        assert response.status_code == 403
