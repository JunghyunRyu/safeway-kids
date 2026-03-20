import io
import uuid

import pytest
from httpx import AsyncClient
from openpyxl import Workbook
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academy_management.models import Academy
from app.modules.auth.models import User, UserRole
from app.modules.auth.service import create_access_token
from tests.conftest import auth_header


def _create_xlsx(rows: list[list]) -> bytes:
    """Create an in-memory .xlsx file from a list of rows (first row = headers)."""
    wb = Workbook()
    ws = wb.active
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()


@pytest.fixture
async def academy_with_admin(db_session: AsyncSession) -> tuple[User, Academy]:
    """Create an academy admin user and associated academy."""
    admin = User(
        id=uuid.uuid4(),
        role=UserRole.ACADEMY_ADMIN,
        phone="01055551111",
        name="테스트 원장",
        is_active=True,
    )
    db_session.add(admin)
    await db_session.flush()

    academy = Academy(
        id=uuid.uuid4(),
        name="해피학원",
        address="서울시 강남구 테스트로 1",
        latitude=37.5,
        longitude=127.0,
        admin_id=admin.id,
    )
    db_session.add(academy)
    await db_session.commit()
    return admin, academy


@pytest.fixture
async def guardian_user(db_session: AsyncSession) -> User:
    """Create a parent/guardian user to be referenced by bulk upload rows."""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.PARENT,
        phone="01012340001",
        name="김학부모",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


class TestBulkUpload:
    @pytest.mark.asyncio
    async def test_successful_upload(
        self,
        client: AsyncClient,
        academy_with_admin: tuple[User, Academy],
        guardian_user: User,
    ) -> None:
        admin, academy = academy_with_admin
        token = create_access_token(admin.id, admin.role)

        xlsx = _create_xlsx([
            ["이름", "생년월일", "학년", "보호자전화번호"],
            ["김민수", "2018-03-15", "초등 1학년", guardian_user.phone],
            ["김영희", "2019-07-20", "유치원", guardian_user.phone],
        ])

        resp = await client.post(
            "/api/v1/students/bulk-upload",
            files={"file": ("students.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["success_count"] == 2
        assert data["error_count"] == 0
        assert all(r["status"] == "success" for r in data["results"])

    @pytest.mark.asyncio
    async def test_duplicate_detection(
        self,
        client: AsyncClient,
        academy_with_admin: tuple[User, Academy],
        guardian_user: User,
    ) -> None:
        admin, academy = academy_with_admin
        token = create_access_token(admin.id, admin.role)

        xlsx = _create_xlsx([
            ["이름", "생년월일", "학년", "보호자전화번호"],
            ["김민수", "2018-03-15", "초등 1학년", guardian_user.phone],
        ])

        # First upload — success
        resp1 = await client.post(
            "/api/v1/students/bulk-upload",
            files={"file": ("students.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            headers=auth_header(token),
        )
        assert resp1.status_code == 200
        assert resp1.json()["success_count"] == 1

        # Second upload — duplicate
        resp2 = await client.post(
            "/api/v1/students/bulk-upload",
            files={"file": ("students.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            headers=auth_header(token),
        )
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["error_count"] == 1
        assert "중복" in data2["results"][0]["message"]

    @pytest.mark.asyncio
    async def test_invalid_data_handling(
        self,
        client: AsyncClient,
        academy_with_admin: tuple[User, Academy],
        guardian_user: User,
    ) -> None:
        admin, academy = academy_with_admin
        token = create_access_token(admin.id, admin.role)

        xlsx = _create_xlsx([
            ["이름", "생년월일", "학년", "보호자전화번호"],
            ["", "2018-03-15", "초등 1학년", guardian_user.phone],         # missing name
            ["이영희", "invalid-date", "초등 2학년", guardian_user.phone],   # bad date
            ["박철수", "2017-01-10", "초등 3학년", ""],                     # missing phone
            ["최지은", "2016-05-05", "초등 4학년", "01099999999"],          # phone not registered
            ["김민수", "2018-03-15", "초등 1학년", guardian_user.phone],     # valid row
        ])

        resp = await client.post(
            "/api/v1/students/bulk-upload",
            files={"file": ("students.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success_count"] == 1
        assert data["error_count"] == 4

        results = data["results"]
        # Row 2: missing name
        assert results[0]["row"] == 2
        assert results[0]["status"] == "error"
        assert "이름" in results[0]["message"]

        # Row 3: invalid date
        assert results[1]["row"] == 3
        assert results[1]["status"] == "error"
        assert "생년월일" in results[1]["message"]

        # Row 4: missing phone
        assert results[2]["row"] == 4
        assert results[2]["status"] == "error"
        assert "전화번호" in results[2]["message"]

        # Row 5: unregistered phone
        assert results[3]["row"] == 5
        assert results[3]["status"] == "error"
        assert "찾을 수 없습니다" in results[3]["message"]

        # Row 6: success
        assert results[4]["row"] == 6
        assert results[4]["status"] == "success"

    @pytest.mark.asyncio
    async def test_missing_required_columns(
        self,
        client: AsyncClient,
        academy_with_admin: tuple[User, Academy],
    ) -> None:
        admin, _ = academy_with_admin
        token = create_access_token(admin.id, admin.role)

        xlsx = _create_xlsx([
            ["이름", "학년"],  # missing 생년월일, 보호자전화번호
            ["김민수", "초등 1학년"],
        ])

        resp = await client.post(
            "/api/v1/students/bulk-upload",
            files={"file": ("students.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["error_count"] == 1
        assert "필수 컬럼 누락" in data["results"][0]["message"]

    @pytest.mark.asyncio
    async def test_forbidden_for_parent(
        self,
        client: AsyncClient,
        parent_token: str,
    ) -> None:
        xlsx = _create_xlsx([["이름", "생년월일", "보호자전화번호"]])

        resp = await client.post(
            "/api/v1/students/bulk-upload",
            files={"file": ("students.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 403
