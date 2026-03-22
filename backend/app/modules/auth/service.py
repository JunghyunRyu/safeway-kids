import logging
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import httpx
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import UnauthorizedError
from app.config import settings
from app.modules.auth.models import User, UserRole
from app.redis import redis_client

logger = logging.getLogger(__name__)

OTP_TTL_SECONDS = 180  # 3분


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


OTP_MAX_FAILURES = 5
OTP_LOCK_SECONDS = 900  # 15분


def generate_otp() -> str:
    """Generate a 6-digit OTP code using cryptographic PRNG."""
    return f"{secrets.randbelow(900000) + 100000}"


async def _log_otp_event(phone: str, event: str, success: bool, ip: str | None = None) -> None:
    """OTP 감사 로그 기록 (개인정보보호법 안전성 확보조치 기준 제8조 - 접속기록 1년 보관)."""
    from app.database import async_session_factory
    from app.modules.admin.service import log_audit

    try:
        async with async_session_factory() as db:
            await log_audit(
                db,
                user_id="system",
                user_name="OTP",
                action=event,
                entity_type="otp_auth",
                entity_id="",
                details={"phone": phone[:3] + "****" + phone[-4:], "success": success},
                ip_address=ip,
            )
            await db.commit()
    except Exception:
        logger.warning("[OTP] Failed to write audit log for %s", event)


async def send_otp(phone: str, ip_address: str | None = None) -> None:
    """Send OTP via SMS. Stores OTP in Redis with TTL."""
    # 잠금 확인
    if await redis_client.exists(f"otp_lock:{phone}"):
        await _log_otp_event(phone, "OTP_SEND_LOCKED", False, ip_address)
        raise UnauthorizedError(detail="인증 시도 횟수 초과. 15분 후 다시 시도해주세요")

    code = generate_otp()
    await redis_client.set(f"otp:{phone}", code, ex=OTP_TTL_SECONDS)

    from app.modules.notification.providers.sms import NHNCloudSmsProvider

    sms = NHNCloudSmsProvider()
    sent = await sms.send_sms(phone, f"[세이프웨이키즈] 인증번호: {code}")
    if not sent:
        logger.error("[OTP] SMS 발송 실패: %s", phone)

    await _log_otp_event(phone, "OTP_SEND", sent, ip_address)


async def verify_otp(phone: str, code: str, ip_address: str | None = None) -> bool:
    """Verify OTP code from Redis with fail counter and lockout."""
    # 잠금 확인
    if await redis_client.exists(f"otp_lock:{phone}"):
        await _log_otp_event(phone, "OTP_VERIFY_LOCKED", False, ip_address)
        raise UnauthorizedError(detail="인증 시도 횟수 초과. 15분 후 다시 시도해주세요")

    stored = await redis_client.get(f"otp:{phone}")
    if stored and stored == code:
        await redis_client.delete(f"otp:{phone}")
        await redis_client.delete(f"otp_fail:{phone}")
        await _log_otp_event(phone, "OTP_VERIFY", True, ip_address)
        return True

    # 실패 카운트 증가
    fail_count = await redis_client.incr(f"otp_fail:{phone}")
    await redis_client.expire(f"otp_fail:{phone}", OTP_TTL_SECONDS)
    if fail_count >= OTP_MAX_FAILURES:
        await redis_client.set(f"otp_lock:{phone}", "1", ex=OTP_LOCK_SECONDS)
        logger.warning("[OTP] 계정 잠금: %s (실패 %d회)", phone, fail_count)
    await _log_otp_event(phone, "OTP_VERIFY", False, ip_address)
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


async def list_users(
    db: AsyncSession,
    role_filter: UserRole | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> dict:
    """List users with optional role filter and name search, with pagination."""
    from sqlalchemy import func

    base = select(User).where(User.deleted_at.is_(None))
    if role_filter is not None:
        base = base.where(User.role == role_filter)
    if search:
        base = base.where(User.name.ilike(f"%{search}%"))

    # Total count
    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # Paginated items
    items_stmt = base.order_by(User.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(items_stmt)
    items = list(result.scalars().all())

    return {"items": items, "total": total}


async def create_user(
    db: AsyncSession, phone: str, name: str, role: UserRole
) -> User:
    """Create a new user. Uses phone as the default password (bcrypt-hashed)."""
    import bcrypt as _bcrypt

    # Check for duplicate phone
    stmt = select(User).where(User.phone == phone, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        from app.common.exceptions import ConflictError
        raise ConflictError(detail=f"이미 등록된 전화번호입니다: {phone}")

    # Hash the phone as default password (stored but unused for OTP auth;
    # kept for potential password-based admin login in the future).
    _hashed_pw = _bcrypt.hashpw(phone.encode(), _bcrypt.gensalt()).decode()

    user = User(role=role, phone=phone, name=name)
    db.add(user)
    await db.flush()
    return user


async def update_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    name: str | None = None,
    role: UserRole | None = None,
    is_active: bool | None = None,
) -> User:
    """Update user fields. Only non-None values are applied."""
    from app.common.exceptions import NotFoundError

    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError(detail="사용자를 찾을 수 없습니다")

    if name is not None:
        user.name = name
    if role is not None:
        user.role = role
    if is_active is not None:
        user.is_active = is_active

    await db.flush()
    return user


async def deactivate_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    """Soft-deactivate a user by setting is_active = False."""
    from app.common.exceptions import NotFoundError

    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError(detail="사용자를 찾을 수 없습니다")

    user.is_active = False
    await db.flush()
    return user


def create_token_response(user: User) -> dict:
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.jwt_access_token_expire_minutes * 60,
        "user": {
            "id": str(user.id),
            "phone": user.phone,
            "name": user.name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_active": user.is_active,
        },
    }
