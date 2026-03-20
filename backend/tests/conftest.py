import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.modules.auth.models import User, UserRole
from app.modules.auth.service import create_access_token

# Use in-memory SQLite for tests (async).
# StaticPool keeps a single connection alive so the in-memory DB persists
# across sessions and eliminates "database is locked" errors.
TEST_DATABASE_URL = "sqlite+aiosqlite://"

engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)

TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_database() -> AsyncGenerator[None, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        # Ensure any pending transaction is rolled back before teardown.
        if session.in_transaction():
            await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def parent_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        role=UserRole.PARENT,
        phone="01012345678",
        name="테스트 학부모",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
async def driver_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        role=UserRole.DRIVER,
        phone="01087654321",
        name="테스트 기사",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
async def academy_admin_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        role=UserRole.ACADEMY_ADMIN,
        phone="01099998888",
        name="테스트 원장",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def parent_token(parent_user: User) -> str:
    return create_access_token(parent_user.id, parent_user.role)


@pytest.fixture
def driver_token(driver_user: User) -> str:
    return create_access_token(driver_user.id, driver_user.role)


@pytest.fixture
def academy_admin_token(academy_admin_user: User) -> str:
    return create_access_token(academy_admin_user.id, academy_admin_user.role)


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
