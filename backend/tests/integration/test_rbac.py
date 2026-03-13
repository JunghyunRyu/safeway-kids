import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


class TestRBAC:
    @pytest.mark.asyncio
    async def test_parent_cannot_create_academy(
        self, client: AsyncClient, parent_token: str
    ) -> None:
        response = await client.post(
            "/api/v1/academies",
            json={
                "name": "테스트 학원",
                "address": "서울시 강남구",
                "latitude": 37.5172,
                "longitude": 127.0473,
            },
            headers=auth_header(parent_token),
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_driver_cannot_create_student(
        self, client: AsyncClient, driver_token: str
    ) -> None:
        response = await client.post(
            "/api/v1/students",
            json={
                "name": "김민수",
                "date_of_birth": "2018-03-15",
            },
            headers=auth_header(driver_token),
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_unauthenticated_request_rejected(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/students")
        assert response.status_code == 401  # No Bearer token

    @pytest.mark.asyncio
    async def test_academy_admin_can_create_academy(
        self, client: AsyncClient, academy_admin_token: str
    ) -> None:
        response = await client.post(
            "/api/v1/academies",
            json={
                "name": "해피 영어학원",
                "address": "서울시 서초구 서초대로 123",
                "latitude": 37.4916,
                "longitude": 127.0073,
                "phone": "02-1234-5678",
            },
            headers=auth_header(academy_admin_token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "해피 영어학원"
