import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


class TestStudentCRUD:
    @pytest.mark.asyncio
    async def test_create_and_list_students(
        self, client: AsyncClient, parent_token: str
    ) -> None:
        # Create student
        create_resp = await client.post(
            "/api/v1/students",
            json={
                "name": "김민수",
                "date_of_birth": "2018-03-15",
                "grade": "초등 1학년",
            },
            headers=auth_header(parent_token),
        )
        assert create_resp.status_code == 201
        student = create_resp.json()
        assert student["name"] == "김민수"
        assert student["grade"] == "초등 1학년"

        # List students
        list_resp = await client.get(
            "/api/v1/students",
            headers=auth_header(parent_token),
        )
        assert list_resp.status_code == 200
        data = list_resp.json()
        students = data["items"]
        assert data["total"] == 1
        assert len(students) == 1
        assert students[0]["name"] == "김민수"

    @pytest.mark.asyncio
    async def test_update_student(
        self, client: AsyncClient, parent_token: str
    ) -> None:
        # Create
        create_resp = await client.post(
            "/api/v1/students",
            json={"name": "이영희", "date_of_birth": "2017-07-20"},
            headers=auth_header(parent_token),
        )
        student_id = create_resp.json()["id"]

        # Update
        update_resp = await client.patch(
            f"/api/v1/students/{student_id}",
            json={"grade": "초등 2학년"},
            headers=auth_header(parent_token),
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["grade"] == "초등 2학년"

    @pytest.mark.asyncio
    async def test_deactivate_student(
        self, client: AsyncClient, parent_token: str
    ) -> None:
        # Create
        create_resp = await client.post(
            "/api/v1/students",
            json={"name": "박철수", "date_of_birth": "2019-01-10"},
            headers=auth_header(parent_token),
        )
        student_id = create_resp.json()["id"]

        # Deactivate (soft delete)
        del_resp = await client.delete(
            f"/api/v1/students/{student_id}",
            headers=auth_header(parent_token),
        )
        assert del_resp.status_code == 200
        assert del_resp.json()["is_active"] is False
