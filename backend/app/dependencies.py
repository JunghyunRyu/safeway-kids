from collections.abc import AsyncGenerator

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.redis import get_redis


async def get_session(
    db: AsyncSession = Depends(get_db),
) -> AsyncGenerator[AsyncSession, None]:
    yield db


async def get_redis_client(
    redis: Redis = Depends(get_redis),  # type: ignore[type-arg]
) -> Redis:  # type: ignore[type-arg]
    return redis
