"""
M2-T4: Integration tests for new M2 backend APIs.

Tests: FCM token registration, driver daily assignments, vehicle assignment,
student enrollments listing, boarding push notification trigger.
"""

import uuid
from datetime import date, time
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academy_management.models import Academy
from app.modules.auth.models import User, UserRole
from app.modules.auth.service import create_access_token
from app.modules.compliance.models import GuardianConsent
from app.modules.scheduling.models import ScheduleTemplate
from app.modules.student_management.models import Enrollment, Student
from app.modules.vehicle_telemetry.models import Vehicle, VehicleAssignment
from tests.conftest import auth_header


@pytest.fixture
async def safety_escort_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        role=UserRole.SAFETY_ESCORT,
        phone="01055554444",
        name="안전 도우미",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
async def setup_full_scenario(
    db_session: AsyncSession,
    parent_user: User,
    driver_user: User,
    academy_admin_user: User,
    safety_escort_user: User,
) -> dict:
    """Set up a complete scenario with all entities."""
    # Academy
    academy = Academy(
        id=uuid.uuid4(),
        name="테스트 학원",
        address="서울시 강남구",
        latitude=37.4943,
        longitude=127.0573,
        phone="0212345678",
        admin_id=academy_admin_user.id,
    )
    db_session.add(academy)

    # Student
    student = Student(
        id=uuid.uuid4(),
        guardian_id=parent_user.id,
        name="김민준",
        date_of_birth=date(2018, 5, 1),
        grade="초등1",
    )
    db_session.add(student)

    # Consent
    consent = GuardianConsent(
        id=uuid.uuid4(),
        guardian_id=parent_user.id,
        child_id=student.id,
        consent_scope={"service_terms": True, "privacy_policy": True, "child_info_collection": True, "location_tracking": True},
        consent_method="app",
    )
    db_session.add(consent)

    # Vehicle
    vehicle = Vehicle(
        id=uuid.uuid4(),
        license_plate="서울12가3456",
        capacity=15,
        operator_name="안전운수",
    )
    db_session.add(vehicle)

    # Vehicle assignment for 2026-03-16 (Monday)
    assignment = VehicleAssignment(
        id=uuid.uuid4(),
        vehicle_id=vehicle.id,
        driver_id=driver_user.id,
        safety_escort_id=safety_escort_user.id,
        assigned_date=date(2026, 3, 16),
    )
    db_session.add(assignment)

    # Schedule template (Monday)
    template = ScheduleTemplate(
        id=uuid.uuid4(),
        student_id=student.id,
        academy_id=academy.id,
        day_of_week=0,
        pickup_time=time(15, 0),
        pickup_latitude=37.4979,
        pickup_longitude=127.0276,
        pickup_address="강남역 2번 출구",
    )
    db_session.add(template)

    await db_session.flush()

    return {
        "academy": academy,
        "student": student,
        "vehicle": vehicle,
        "assignment": assignment,
        "template": template,
        "parent": parent_user,
        "driver": driver_user,
        "safety_escort": safety_escort_user,
    }


class TestFcmTokenRegistration:
    async def test_register_token(
        self,
        client: AsyncClient,
        parent_user: User,
        parent_token: str,
    ) -> None:
        resp = await client.post(
            "/api/v1/notifications/register-token",
            json={"fcm_token": "test-fcm-token-abc123"},
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 200
        assert resp.json()["message"] == "토큰이 등록되었습니다"

    async def test_register_token_unauthenticated(
        self, client: AsyncClient
    ) -> None:
        resp = await client.post(
            "/api/v1/notifications/register-token",
            json={"fcm_token": "test"},
        )
        assert resp.status_code == 401


class TestDriverDailySchedule:
    async def test_driver_sees_assigned_schedules(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        setup_full_scenario: dict,
    ) -> None:
        data = setup_full_scenario
        driver_token = create_access_token(data["driver"].id, data["driver"].role)
        admin_token = create_access_token(
            data["academy"].admin_id, UserRole.ACADEMY_ADMIN
        )

        # Materialize schedules for Monday 2026-03-16
        resp = await client.post(
            "/api/v1/schedules/daily/materialize?target_date=2026-03-16",
            headers=auth_header(admin_token),
        )
        assert resp.status_code == 200
        instances = resp.json()
        assert len(instances) == 1
        assert instances[0]["vehicle_id"] is not None

        # Driver queries their assignments
        resp = await client.get(
            "/api/v1/schedules/daily/driver?target_date=2026-03-16",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200
        driver_schedules = resp.json()
        assert len(driver_schedules) == 1
        assert driver_schedules[0]["student_name"] == "김민준"
        assert driver_schedules[0]["academy_name"] == "테스트 학원"

    async def test_driver_no_assignment(
        self,
        client: AsyncClient,
        driver_user: User,
        driver_token: str,
    ) -> None:
        resp = await client.get(
            "/api/v1/schedules/daily/driver?target_date=2026-03-16",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200
        assert resp.json() == []


class TestVehicleAssignment:
    async def test_driver_gets_assignment(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        setup_full_scenario: dict,
    ) -> None:
        data = setup_full_scenario
        driver_token = create_access_token(data["driver"].id, data["driver"].role)

        resp = await client.get(
            "/api/v1/telemetry/vehicles/my-assignment?target_date=2026-03-16",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200
        assignment = resp.json()
        assert assignment["license_plate"] == "서울12가3456"
        assert assignment["safety_escort_name"] == "안전 도우미"

    async def test_driver_no_assignment_returns_null(
        self,
        client: AsyncClient,
        driver_user: User,
        driver_token: str,
    ) -> None:
        resp = await client.get(
            "/api/v1/telemetry/vehicles/my-assignment?target_date=2026-03-20",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200
        assert resp.json() is None


class TestStudentEnrollments:
    async def test_list_enrollments(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        setup_full_scenario: dict,
    ) -> None:
        data = setup_full_scenario
        parent_token = create_access_token(data["parent"].id, data["parent"].role)

        # Enroll student in academy
        enrollment = Enrollment(
            id=uuid.uuid4(),
            student_id=data["student"].id,
            academy_id=data["academy"].id,
        )
        db_session.add(enrollment)
        await db_session.flush()

        resp = await client.get(
            f"/api/v1/students/{data['student'].id}/enrollments",
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 200
        enrollments = resp.json()
        assert len(enrollments) == 1
        assert enrollments[0]["academy_id"] == str(data["academy"].id)


class TestBoardingPushNotification:
    async def test_boarding_triggers_push(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        setup_full_scenario: dict,
    ) -> None:
        """When driver marks boarding, push notification is sent to parent."""
        data = setup_full_scenario
        driver_token = create_access_token(data["driver"].id, data["driver"].role)
        admin_token = create_access_token(
            data["academy"].admin_id, UserRole.ACADEMY_ADMIN
        )

        # Register parent's FCM token
        data["parent"].fcm_token = "parent-fcm-token-xyz"
        await db_session.flush()

        # Materialize
        resp = await client.post(
            "/api/v1/schedules/daily/materialize?target_date=2026-03-16",
            headers=auth_header(admin_token),
        )
        instance_id = resp.json()[0]["id"]

        # Mock the FCM push provider
        with patch(
            "app.modules.notification.service._push_provider.send_push",
            new_callable=AsyncMock,
            return_value=True,
        ) as mock_push:
            # Driver marks boarding
            resp = await client.post(
                f"/api/v1/schedules/daily/{instance_id}/board",
                headers=auth_header(driver_token),
            )
            assert resp.status_code == 200
            assert resp.json()["boarded_at"] is not None

            # Verify push was called with correct args
            mock_push.assert_called_once()
            call_kwargs = mock_push.call_args.kwargs
            assert call_kwargs["device_token"] == "parent-fcm-token-xyz"
            assert "김민준" in call_kwargs["body"]

    async def test_boarding_without_fcm_token_no_error(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        setup_full_scenario: dict,
    ) -> None:
        """Boarding works even if parent has no FCM token (push silently skipped)."""
        data = setup_full_scenario
        driver_token = create_access_token(data["driver"].id, data["driver"].role)
        admin_token = create_access_token(
            data["academy"].admin_id, UserRole.ACADEMY_ADMIN
        )

        # No FCM token set on parent

        # Materialize
        resp = await client.post(
            "/api/v1/schedules/daily/materialize?target_date=2026-03-16",
            headers=auth_header(admin_token),
        )
        instance_id = resp.json()[0]["id"]

        # Driver marks boarding — should succeed without error
        resp = await client.post(
            f"/api/v1/schedules/daily/{instance_id}/board",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200
        assert resp.json()["boarded_at"] is not None
