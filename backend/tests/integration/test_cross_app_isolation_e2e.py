"""Cross-app isolation E2E tests (Y-11 — 2026-05-06 페르소나 audit 대응).

기존 단위 테스트는 RBAC mock 기반이라 endpoint 수준 격리가 검증되지 않음.
본 파일은 실제 HTTP endpoint를 다른 app_context 토큰으로 호출하여 403 응답을 확인한다.

대상 격리:
- APP_SAFEWAY_KIDS endpoint를 APP_PETTRACKER walker 토큰으로 호출
- APP_PETTRACKER endpoint를 APP_SAFEWAY_KIDS academy admin 토큰으로 호출
- APP_CARECONNECT endpoint를 APP_SAFEWAY_KIDS parent 토큰으로 호출
"""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from app.modules.auth.models import APP_CARECONNECT, APP_PETTRACKER, APP_SAFEWAY_KIDS, UserRole
from app.modules.auth.service import create_access_token
from tests.conftest import auth_header


@pytest.fixture
def walker_token() -> str:
    """PT 워커 토큰 (APP_PETTRACKER context)."""
    return create_access_token(uuid.uuid4(), UserRole.WALKER, app_context=APP_PETTRACKER)


@pytest.fixture
def pet_owner_token() -> str:
    """PT 보호자 토큰 (APP_PETTRACKER context)."""
    return create_access_token(uuid.uuid4(), UserRole.PARENT, app_context=APP_PETTRACKER)


@pytest.fixture
def caregiver_token() -> str:
    """CC 시니어 케어 제공자 토큰 (APP_CARECONNECT context)."""
    return create_access_token(uuid.uuid4(), UserRole.CAREGIVER, app_context=APP_CARECONNECT)


class TestCrossAppIsolation:
    """다른 앱 컨텍스트 토큰으로 cross-call 시 403 응답 보장."""

    @pytest.mark.asyncio
    async def test_pt_walker_cannot_access_safeway_students(
        self, client: AsyncClient, walker_token: str
    ) -> None:
        """PT 워커 토큰으로 SafeWay /students 호출 → 403."""
        response = await client.get(
            "/api/v1/students",
            headers=auth_header(walker_token),
        )
        assert response.status_code in (401, 403, 404), (
            f"PT 워커가 SafeWay 학생 데이터 접근. 실제 응답: {response.status_code}"
        )

    @pytest.mark.asyncio
    async def test_safeway_academy_admin_cannot_access_pt_bookings(
        self, client: AsyncClient, academy_admin_token: str
    ) -> None:
        """SafeWay 학원 admin 토큰으로 PT /pt/bookings 호출 → 403."""
        response = await client.get(
            "/api/v1/pt/bookings",
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code in (401, 403, 404), (
            f"SafeWay admin이 PT 예약 데이터 접근. 실제 응답: {response.status_code}"
        )

    @pytest.mark.asyncio
    async def test_safeway_parent_cannot_access_cc_bookings(
        self, client: AsyncClient, parent_token: str
    ) -> None:
        """SafeWay 학부모 토큰으로 CC /cc/bookings 호출 → 403."""
        response = await client.get(
            "/api/v1/cc/bookings",
            headers=auth_header(parent_token),
        )
        assert response.status_code in (401, 403, 404), (
            f"SafeWay 학부모가 CC 예약 데이터 접근. 실제 응답: {response.status_code}"
        )

    @pytest.mark.asyncio
    async def test_pt_owner_cannot_create_safeway_student(
        self, client: AsyncClient, pet_owner_token: str
    ) -> None:
        """PT 보호자 토큰으로 SafeWay /students POST 호출 → 403."""
        response = await client.post(
            "/api/v1/students",
            json={
                "name": "교차차단테스트",
                "date_of_birth": "2018-03-15",
            },
            headers=auth_header(pet_owner_token),
        )
        assert response.status_code in (401, 403, 404), (
            f"PT 보호자가 SafeWay 학생 생성. 실제 응답: {response.status_code}"
        )

    @pytest.mark.asyncio
    async def test_cc_caregiver_cannot_access_safeway_vehicles(
        self, client: AsyncClient, caregiver_token: str
    ) -> None:
        """CC caregiver 토큰으로 SafeWay /vehicles 호출 → 403."""
        response = await client.get(
            "/api/v1/vehicles",
            headers=auth_header(caregiver_token),
        )
        assert response.status_code in (401, 403, 404), (
            f"CC caregiver가 SafeWay 차량 데이터 접근. 실제 응답: {response.status_code}"
        )
