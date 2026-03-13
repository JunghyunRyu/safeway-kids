from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.modules.auth import service
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    KakaoLoginRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter()


@router.post("/kakao", response_model=TokenResponse)
async def kakao_login(
    request: KakaoLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """카카오 로그인 / 회원가입"""
    user, _is_new = await service.kakao_login(db, request.code, request.redirect_uri)
    return service.create_token_response(user)


@router.post("/otp/send")
async def send_otp(request: OtpSendRequest) -> dict[str, str]:
    """인증번호 발송"""
    await service.send_otp(request.phone)
    return {"message": "인증번호가 발송되었습니다"}


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(
    request: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """인증번호 확인 및 로그인/회원가입"""
    is_valid = await service.verify_otp(request.phone, request.code)
    if not is_valid:
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="인증번호가 올바르지 않습니다")

    user, _is_new = await service.otp_login_or_register(
        db, request.phone, request.name, request.role
    )
    return service.create_token_response(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """토큰 갱신"""
    import uuid as _uuid

    from sqlalchemy import select

    payload = service.decode_token(request.refresh_token)
    if payload.get("type") != "refresh":
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="유효하지 않은 리프레시 토큰입니다")

    user_id = _uuid.UUID(payload["sub"])
    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="사용자를 찾을 수 없습니다")

    return service.create_token_response(user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    """현재 로그인한 사용자 정보"""
    return current_user
