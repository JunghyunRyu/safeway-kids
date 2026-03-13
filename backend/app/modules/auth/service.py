import random
import uuid
from datetime import UTC, datetime, timedelta

import httpx
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import UnauthorizedError
from app.config import settings
from app.modules.auth.models import User, UserRole

# OTP store: in production, use Redis with TTL
_otp_store: dict[str, str] = {}


async def get_kakao_user_info(code: str, redirect_uri: str | None = None) -> dict:
    """Exchange Kakao auth code for user info."""
    token_url = "https://kauth.kakao.com/oauth/token"
    user_info_url = "https://kapi.kakao.com/v2/user/me"

    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_resp = await client.post(
            token_url,
            data={
                "grant_type": "authorization_code",
                "client_id": settings.kakao_client_id,
                "client_secret": settings.kakao_client_secret,
                "redirect_uri": redirect_uri or settings.kakao_redirect_uri,
                "code": code,
            },
        )
        token_resp.raise_for_status()
        token_data = token_resp.json()

        # Get user info
        user_resp = await client.get(
            user_info_url,
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        user_resp.raise_for_status()
        return user_resp.json()


async def kakao_login(
    db: AsyncSession, code: str, redirect_uri: str | None = None
) -> tuple[User, bool]:
    """Login or register via Kakao. Returns (user, is_new)."""
    kakao_info = await get_kakao_user_info(code, redirect_uri)
    kakao_id = str(kakao_info["id"])
    kakao_account = kakao_info.get("kakao_account", {})
    profile = kakao_account.get("profile", {})

    # Check if user exists
    stmt = select(User).where(User.kakao_id == kakao_id, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user:
        return user, False

    # Create new user (phone will be linked via OTP later)
    user = User(
        role=UserRole.PARENT,
        phone=f"kakao_{kakao_id}",  # placeholder until phone OTP verification
        name=profile.get("nickname", "사용자"),
        kakao_id=kakao_id,
        email=kakao_account.get("email"),
    )
    db.add(user)
    await db.flush()
    return user, True


def generate_otp() -> str:
    """Generate a 6-digit OTP code."""
    return f"{random.randint(100000, 999999)}"


async def send_otp(phone: str) -> None:
    """Send OTP via SMS. In development, stores in memory."""
    code = generate_otp()
    _otp_store[phone] = code

    if settings.environment == "production":
        # TODO: integrate NHN Cloud SMS API
        pass
    else:
        # Development: log the OTP
        print(f"[DEV OTP] {phone}: {code}")


async def verify_otp(phone: str, code: str) -> bool:
    """Verify OTP code."""
    stored = _otp_store.get(phone)
    if stored and stored == code:
        del _otp_store[phone]
        return True
    return False


async def otp_login_or_register(
    db: AsyncSession, phone: str, name: str, role: UserRole
) -> tuple[User, bool]:
    """Login or register via Phone OTP. Returns (user, is_new)."""
    stmt = select(User).where(User.phone == phone, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user:
        # Update name if changed (e.g., dev-login with different name)
        if name and user.name != name:
            user.name = name
            await db.flush()
        return user, False

    user = User(role=role, phone=phone, name=name)
    db.add(user)
    await db.flush()
    return user, True


def create_access_token(user_id: uuid.UUID, role: UserRole) -> str:
    expire = datetime.now(UTC) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(UTC) + timedelta(
        days=settings.jwt_refresh_token_expire_days
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        raise UnauthorizedError(detail="유효하지 않은 토큰입니다") from e


def create_token_response(user: User) -> dict:
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.jwt_access_token_expire_minutes * 60,
    }
