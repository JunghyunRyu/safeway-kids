import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_platform_admin
from app.modules.auth import service
from app.modules.auth.models import User, UserRole
from app.modules.auth.schemas import (
    KakaoLoginRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    PaginatedUserListResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserCreateRequest,
    UserListResponse,
    UserUpdateRequest,
    UserResponse,
)
from app.rate_limit import limiter

router = APIRouter()


@router.post("/kakao", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
async def kakao_login(
    request: Request,
    body: KakaoLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """카카오 로그인 / 회원가입"""
    user, _is_new = await service.kakao_login(db, body.code, body.redirect_uri)
    return service.create_token_response(user)


@router.post("/otp/send")
@limiter.limit(settings.rate_limit_auth)
async def send_otp(request: Request, body: OtpSendRequest) -> dict[str, str]:
    """인증번호 발송"""
    await service.send_otp(body.phone)
    return {"message": "인증번호가 발송되었습니다"}


@router.post("/otp/verify", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
async def verify_otp(
    request: Request,
    body: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """인증번호 확인 및 로그인/회원가입"""
    is_valid = await service.verify_otp(body.phone, body.code)
    if not is_valid:
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="인증번호가 올바르지 않습니다")

    user, _is_new = await service.otp_login_or_register(
        db, body.phone, body.name, body.role
    )
    return service.create_token_response(user)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
async def refresh_token(
    request: Request,
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """토큰 갱신"""
    import uuid as _uuid

    from sqlalchemy import select

    payload = service.decode_token(body.refresh_token)
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


@router.post("/dev-login", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
async def dev_login(
    request: Request,
    body: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """개발용 바로 로그인 (OTP 검증 생략) — production에서는 비활성화"""
    from app.config import settings as _settings
    if _settings.environment == "production":
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="Not available in production")

    user, _is_new = await service.otp_login_or_register(
        db, body.phone, body.name, body.role
    )
    return service.create_token_response(user)


@router.get("/users", response_model=PaginatedUserListResponse)
async def list_users(
    role: UserRole | None = Query(None, description="역할 필터"),
    search: str | None = Query(None, description="이름 검색"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> dict:
    """사용자 목록 조회 (플랫폼 관리자 전용, 페이지네이션)"""
    skip = (page - 1) * page_size
    return await service.list_users(db, role_filter=role, search=search, skip=skip, limit=page_size)


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    request: Request,
    body: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> User:
    """사용자 생성 (플랫폼 관리자 전용)"""
    from app.modules.admin.service import log_audit

    user = await service.create_user(db, body.phone, body.name, body.role)
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="CREATE",
        entity_type="user",
        entity_id=str(user.id),
        details={"phone": body.phone, "name": body.name, "role": body.role.value},
        ip_address=request.client.host if request.client else None,
    )
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> User:
    """사용자 정보 수정 (플랫폼 관리자 전용)"""
    from app.modules.admin.service import log_audit

    user = await service.update_user(
        db, user_id, name=body.name, role=body.role, is_active=body.is_active,
    )
    changes = {}
    if body.name is not None:
        changes["name"] = body.name
    if body.role is not None:
        changes["role"] = body.role.value
    if body.is_active is not None:
        changes["is_active"] = body.is_active
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="UPDATE",
        entity_type="user",
        entity_id=str(user_id),
        details=changes,
        ip_address=request.client.host if request.client else None,
    )
    return user


@router.delete("/users/{user_id}", response_model=UserResponse)
async def deactivate_user(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> User:
    """사용자 비활성화 (플랫폼 관리자 전용)"""
    from app.modules.admin.service import log_audit

    user = await service.deactivate_user(db, user_id)
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="DELETE",
        entity_type="user",
        entity_id=str(user_id),
        ip_address=request.client.host if request.client else None,
    )
    return user
