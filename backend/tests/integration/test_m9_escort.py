"""M9 integration tests: escort availability, auto-matching, check-in/check-out."""

import uuid
from datetime import date, time

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academy_management.models import Academy
from app.modules.auth.models import User, UserRole
from app.modules.auth.service import create_access_token
from app.modules.vehicle_telemetry.models import Vehicle, VehicleAssignment
from tests.conftest import auth_header


# ---------------------------------------------------------------------------
# Fixtures local to this module
# ---------------------------------------------------------------------------

async def _create_escort_user(db: AsyncSession, phone: str = "01055550001") -> User:
    """Create and persist a safety escort user."""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.SAFETY_ESCORT,
        phone=phone,
        name="테스트 안전도우미",
        is_active=True,
    )
    db.add(user)
    await db.flush()
    return user


def _escort_token(user: User) -> str:
    return create_access_token(user.id, user.role)


async def _create_vehicle_assignment(
    db: AsyncSession, driver: User, target_date: date,
) -> VehicleAssignment:
    """Create a vehicle and assignment without a safety escort."""
    vehicle = Vehicle(
        id=uuid.uuid4(),
        license_plate=f"77가{uuid.uuid4().hex[:4]}",
        capacity=15,
    )
    db.add(vehicle)
    await db.flush()

    assignment = VehicleAssignment(
        vehicle_id=vehicle.id,
        driver_id=driver.id,
        assigned_date=target_date,
    )
    db.add(assignment)
    await db.flush()
    return assignment


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestRegisterAvailability:
    """Test POST /api/v1/escorts/availability."""

    async def test_escort_registers_availability(self, client, db_session):
        escort = await _create_escort_user(db_session)
        token = _escort_token(escort)

        response = await client.post(
            "/api/v1/escorts/availability",
            json={
                "available_date": "2026-03-16",
                "start_time": "07:00:00",
                "end_time": "09:00:00",
            },
            headers=auth_header(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["escort_id"] == str(escort.id)
        assert data["available_date"] == "2026-03-16"
        assert data["status"] == "available"

    async def test_escort_views_own_availability(self, client, db_session):
        escort = await _create_escort_user(db_session, phone="01055550002")
        token = _escort_token(escort)

        # Register two dates
        for day in ("2026-03-16", "2026-03-17"):
            await client.post(
                "/api/v1/escorts/availability",
                json={
                    "available_date": day,
                    "start_time": "07:00:00",
                    "end_time": "09:00:00",
                },
                headers=auth_header(token),
            )

        response = await client.get(
            "/api/v1/escorts/availability/my",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    async def test_parent_cannot_register_availability(self, client, parent_token):
        response = await client.post(
            "/api/v1/escorts/availability",
            json={
                "available_date": "2026-03-16",
                "start_time": "07:00:00",
                "end_time": "09:00:00",
            },
            headers=auth_header(parent_token),
        )
        assert response.status_code == 403


class TestAutoMatch:
    """Test POST /api/v1/escorts/match."""

    async def test_auto_match_creates_shifts(
        self, client, db_session, driver_user, academy_admin_user, academy_admin_token,
    ):
        target = date(2026, 3, 16)

        # Create escort with availability
        escort = await _create_escort_user(db_session, phone="01055550003")
        from app.modules.escort.models import EscortAvailability

        avail = EscortAvailability(
            escort_id=escort.id,
            available_date=target,
            start_time=time(7, 0),
            end_time=time(9, 0),
            status="available",
        )
        db_session.add(avail)

        # Create vehicle assignment without escort
        await _create_vehicle_assignment(db_session, driver_user, target)
        await db_session.flush()

        response = await client.post(
            "/api/v1/escorts/match",
            json={"target_date": "2026-03-16"},
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["shifts_created"] == 1
        assert data["unmatched_assignments"] == 0

    async def test_auto_match_more_assignments_than_escorts(
        self, client, db_session, driver_user, academy_admin_user, academy_admin_token,
    ):
        """When there are more assignments than escorts, some remain unmatched."""
        target = date(2026, 3, 17)

        # One escort
        escort = await _create_escort_user(db_session, phone="01055550004")
        from app.modules.escort.models import EscortAvailability

        db_session.add(EscortAvailability(
            escort_id=escort.id,
            available_date=target,
            start_time=time(7, 0),
            end_time=time(9, 0),
            status="available",
        ))

        # Two drivers -> two assignments
        driver2 = User(
            id=uuid.uuid4(),
            role=UserRole.DRIVER,
            phone="01066660001",
            name="기사2",
            is_active=True,
        )
        db_session.add(driver2)
        await db_session.flush()

        await _create_vehicle_assignment(db_session, driver_user, target)
        await _create_vehicle_assignment(db_session, driver2, target)

        response = await client.post(
            "/api/v1/escorts/match",
            json={"target_date": "2026-03-17"},
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["shifts_created"] == 1
        assert data["unmatched_assignments"] == 1

    async def test_auto_match_no_availability_creates_nothing(
        self, client, db_session, driver_user, academy_admin_user, academy_admin_token,
    ):
        target = date(2026, 3, 18)
        await _create_vehicle_assignment(db_session, driver_user, target)

        response = await client.post(
            "/api/v1/escorts/match",
            json={"target_date": "2026-03-18"},
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["shifts_created"] == 0
        assert data["unmatched_assignments"] == 1

    async def test_parent_cannot_trigger_match(self, client, parent_token):
        response = await client.post(
            "/api/v1/escorts/match",
            json={"target_date": "2026-03-16"},
            headers=auth_header(parent_token),
        )
        assert response.status_code == 403


class TestCheckInCheckOut:
    """Test check-in and check-out flow for escort shifts."""

    async def _setup_matched_shift(self, client, db_session, driver_user, academy_admin_token):
        """Helper: create escort, availability, assignment, run match, return (escort, token)."""
        target = date(2026, 3, 20)

        escort = await _create_escort_user(db_session, phone="01055550010")
        token = _escort_token(escort)

        from app.modules.escort.models import EscortAvailability

        db_session.add(EscortAvailability(
            escort_id=escort.id,
            available_date=target,
            start_time=time(7, 0),
            end_time=time(9, 0),
            status="available",
        ))

        await _create_vehicle_assignment(db_session, driver_user, target)

        # Run auto-match
        await client.post(
            "/api/v1/escorts/match",
            json={"target_date": "2026-03-20"},
            headers=auth_header(academy_admin_token),
        )

        return escort, token

    async def test_check_in_and_check_out(
        self, client, db_session, driver_user, academy_admin_user, academy_admin_token,
    ):
        escort, token = await self._setup_matched_shift(
            client, db_session, driver_user, academy_admin_token,
        )

        # Get my shifts to find the shift ID
        shifts_resp = await client.get(
            "/api/v1/escorts/shifts/my",
            headers=auth_header(token),
        )
        assert shifts_resp.status_code == 200
        shifts = shifts_resp.json()
        assert len(shifts) == 1
        shift_id = shifts[0]["id"]
        assert shifts[0]["status"] == "assigned"

        # Check in
        checkin_resp = await client.post(
            f"/api/v1/escorts/shifts/{shift_id}/check-in",
            headers=auth_header(token),
        )
        assert checkin_resp.status_code == 200
        checkin_data = checkin_resp.json()
        assert checkin_data["status"] == "checked_in"
        assert checkin_data["check_in_at"] is not None

        # Check out
        checkout_resp = await client.post(
            f"/api/v1/escorts/shifts/{shift_id}/check-out",
            headers=auth_header(token),
        )
        assert checkout_resp.status_code == 200
        checkout_data = checkout_resp.json()
        assert checkout_data["status"] == "completed"
        assert checkout_data["check_out_at"] is not None

    async def test_check_in_wrong_escort_returns_404(
        self, client, db_session, driver_user, academy_admin_user, academy_admin_token,
    ):
        _, _ = await self._setup_matched_shift(
            client, db_session, driver_user, academy_admin_token,
        )

        # Create a different escort
        other_escort = await _create_escort_user(db_session, phone="01055550099")
        other_token = _escort_token(other_escort)

        # The other escort tries to check in to the first escort's shift
        # First get the shift from the first escort's perspective via DB
        from app.modules.escort.models import EscortShift
        from sqlalchemy import select

        result = await db_session.execute(select(EscortShift))
        shift = result.scalar_one()

        response = await client.post(
            f"/api/v1/escorts/shifts/{shift.id}/check-in",
            headers=auth_header(other_token),
        )
        assert response.status_code == 404

    async def test_check_in_nonexistent_shift_returns_404(self, client, db_session):
        escort = await _create_escort_user(db_session, phone="01055550011")
        token = _escort_token(escort)

        fake_id = uuid.uuid4()
        response = await client.post(
            f"/api/v1/escorts/shifts/{fake_id}/check-in",
            headers=auth_header(token),
        )
        assert response.status_code == 404
