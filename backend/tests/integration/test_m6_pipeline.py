"""M6 integration tests: daily pipeline, route endpoints, seed."""

import uuid
from datetime import date, time

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academy_management.models import Academy
from app.modules.auth.models import User, UserRole
from app.modules.compliance.models import GuardianConsent
from app.modules.scheduling.models import RoutePlan, ScheduleTemplate
from app.modules.student_management.models import Enrollment, Student
from app.modules.vehicle_telemetry.models import Vehicle, VehicleAssignment
from tests.conftest import auth_header


async def _create_full_scenario(db: AsyncSession, target_date: date) -> dict:
    """Create a complete test scenario."""
    # Admin
    admin = User(
        id=uuid.uuid4(), role=UserRole.PLATFORM_ADMIN,
        phone="01099990000", name="테스트 관리자",
    )
    db.add(admin)
    await db.flush()

    # Academy
    academy = Academy(
        id=uuid.uuid4(), name="테스트 학원", address="서울시 강남구",
        latitude=37.5, longitude=127.0, admin_id=admin.id,
    )
    db.add(academy)

    # Drivers
    driver1 = User(
        id=uuid.uuid4(), role=UserRole.DRIVER,
        phone="01099991111", name="기사1",
    )
    driver2 = User(
        id=uuid.uuid4(), role=UserRole.DRIVER,
        phone="01099992222", name="기사2",
    )
    db.add_all([driver1, driver2])

    # Vehicles
    v1 = Vehicle(id=uuid.uuid4(), license_plate="99가1111", capacity=10)
    v2 = Vehicle(id=uuid.uuid4(), license_plate="99나2222", capacity=10)
    db.add_all([v1, v2])

    # Parent + Students
    parent = User(
        id=uuid.uuid4(), role=UserRole.PARENT,
        phone="01099993333", name="학부모1",
    )
    db.add(parent)
    await db.flush()

    students = []
    for i in range(3):
        s = Student(
            guardian_id=parent.id, name=f"학생{i+1}",
            date_of_birth=date(2018, 1, 1 + i),
        )
        db.add(s)
        students.append(s)
    await db.flush()

    # Enrollments + Consents
    for s in students:
        db.add(Enrollment(student_id=s.id, academy_id=academy.id))
        db.add(GuardianConsent(
            guardian_id=parent.id, child_id=s.id,
            consent_scope={"service_terms": True, "privacy_policy": True, "child_info_collection": True, "location_tracking": True}, consent_method="app",
        ))

    # Schedule Templates (for target_date's day_of_week)
    dow = target_date.weekday()
    for i, s in enumerate(students):
        db.add(ScheduleTemplate(
            student_id=s.id, academy_id=academy.id, day_of_week=dow,
            pickup_time=time(14, i * 10),
            pickup_latitude=37.5 + i * 0.002,
            pickup_longitude=127.0 + i * 0.003,
        ))

    await db.flush()

    return {
        "admin": admin, "academy": academy,
        "drivers": [driver1, driver2],
        "vehicles": [v1, v2], "parent": parent, "students": students,
    }


class TestDailyPipeline:
    """Test the full daily pipeline: materialize → assign → route."""

    async def test_pipeline_creates_schedules_and_routes(self, db_session):
        target = date(2026, 3, 16)  # Monday
        await _create_full_scenario(db_session, target)

        from app.modules.scheduling.scheduler import run_daily_pipeline
        result = await run_daily_pipeline(db_session, target)

        assert result["schedules_created"] == 3
        assert result["assignments_created"] == 2
        assert result["routes_generated"] >= 1
        assert result["academies_processed"] == 1

    async def test_pipeline_is_idempotent(self, db_session):
        target = date(2026, 3, 16)
        await _create_full_scenario(db_session, target)

        from app.modules.scheduling.scheduler import run_daily_pipeline

        result1 = await run_daily_pipeline(db_session, target)
        assert result1["schedules_created"] == 3

        result2 = await run_daily_pipeline(db_session, target)
        assert result2["schedules_created"] == 0  # already materialized

    async def test_pipeline_with_no_templates(self, db_session):
        """Pipeline with no matching templates creates nothing."""
        await _create_full_scenario(db_session, date(2026, 3, 16))  # Monday

        from app.modules.scheduling.scheduler import run_daily_pipeline
        # Run pipeline for Sunday — no templates match
        result = await run_daily_pipeline(db_session, date(2026, 3, 15))
        assert result["schedules_created"] == 0


class TestDriverRouteEndpoint:
    """Test GET /routes/my-route."""

    async def test_driver_gets_route(
        self, client, db_session, driver_user, driver_token,
    ):
        """Driver with assignment and route plan gets route."""
        academy = Academy(
            id=uuid.uuid4(), name="테스트학원", address="강남",
            latitude=37.5, longitude=127.0,
        )
        db_session.add(academy)

        vehicle = Vehicle(
            id=uuid.uuid4(), license_plate="88가8888", capacity=15,
        )
        db_session.add(vehicle)
        await db_session.flush()

        assignment = VehicleAssignment(
            vehicle_id=vehicle.id, driver_id=driver_user.id,
            assigned_date=date(2026, 3, 16),
        )
        db_session.add(assignment)

        plan = RoutePlan(
            vehicle_id=vehicle.id, plan_date=date(2026, 3, 16), version=1,
            stops=[
                {
                    "stop_id": "s1", "order": 1,
                    "latitude": 37.501, "longitude": 127.001,
                    "student_name": "학생1",
                },
                {
                    "stop_id": "s2", "order": 2,
                    "latitude": 37.502, "longitude": 127.002,
                    "student_name": "학생2",
                },
            ],
            total_distance_km=1.5, total_duration_min=8.0,
            generated_by="vrp-tw-v1",
        )
        db_session.add(plan)
        await db_session.flush()

        response = await client.get(
            "/api/v1/routes/my-route?plan_date=2026-03-16",
            headers=auth_header(driver_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["vehicle_id"] == str(vehicle.id)
        assert len(data["stops"]) == 2
        assert data["stops"][0]["order"] == 1
        assert data["total_distance_km"] == 1.5

    async def test_driver_no_assignment_returns_null(
        self, client, driver_token,
    ):
        """Driver without assignment gets null."""
        response = await client.get(
            "/api/v1/routes/my-route?plan_date=2026-03-16",
            headers=auth_header(driver_token),
        )
        assert response.status_code == 200
        assert response.json() is None

    async def test_parent_cannot_access_driver_route(
        self, client, parent_token,
    ):
        """Parent role should be rejected from driver route endpoint."""
        response = await client.get(
            "/api/v1/routes/my-route?plan_date=2026-03-16",
            headers=auth_header(parent_token),
        )
        assert response.status_code == 403


class TestPipelineEndpoint:
    """Test POST /schedules/daily/pipeline."""

    async def test_pipeline_requires_admin(self, client, parent_token):
        """Parent cannot trigger pipeline."""
        response = await client.post(
            "/api/v1/schedules/daily/pipeline?target_date=2026-03-16",
            headers=auth_header(parent_token),
        )
        assert response.status_code == 403

    async def test_pipeline_via_api(
        self, client, db_session,
        academy_admin_user, academy_admin_token,
    ):
        """Admin can trigger pipeline via API."""
        target = date(2026, 3, 16)
        await _create_full_scenario(db_session, target)

        response = await client.post(
            f"/api/v1/schedules/daily/pipeline?target_date={target}",
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["schedules_created"] >= 0
        assert "routes_generated" in data
