import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import UnauthorizedError
from app.database import get_db
from app.modules.auth.models import User
from app.modules.auth.service import decode_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and verify current user from JWT token."""
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise UnauthorizedError(detail="유효하지 않은 액세스 토큰입니다")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError(detail="토큰에 사용자 정보가 없습니다")

    user_id = uuid.UUID(user_id_str)
    stmt = select(User).where(
        User.id == user_id, User.deleted_at.is_(None), User.is_active.is_(True)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedError(detail="사용자를 찾을 수 없습니다")

    return user
