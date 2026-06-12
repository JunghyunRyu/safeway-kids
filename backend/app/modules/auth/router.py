import logging
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
    ConsentListResponse,
    ConsentUpdateRequest,
    DriverQualificationRequest,
    DriverQualificationResponse,
    FirebaseCustomTokenResponse,
    FirebaseLinkRequest,
    FirebaseRegisterRequest,
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

logger = logging.getLogger(__name__)

router = APIRouter()


def _validate_kakao_redirect_uri(redirect_uri: str | None) -> None:
    """redirect_uri allowlist 검증 (FR-F6) — 미지정은 서버 기본값이라 안전."""
    if redirect_uri is None:
        return
    allowed = {
        u.strip()
        for u in (settings.kakao_allowed_redirect_uris or "").split(",")
        if u.strip()
    }
    allowed.add(settings.kakao_redirect_uri)
    if redirect_uri not in allowed:
        from app.common.exceptions import ValidationError
        raise ValidationError(detail="허용되지 않은 redirect_uri입니다")


@router.post("/kakao", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
async def kakao_login(
    request: Request,
    body: KakaoLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """카카오 로그인 / 회원가입 (PT/CC는 app_context·role 지정 + 동의 유도)"""
    _validate_kakao_redirect_uri(body.redirect_uri)

    from app.modules.auth.consent_docs import CONSENT_GATED_APP_CONTEXTS
    from app.modules.auth.models import APP_SAFEWAY_KIDS

    app_context = body.app_context or APP_SAFEWAY_KIDS
    role = body.role or UserRole.PARENT
    user, _is_new = await service.kakao_login(
        db, body.code, body.redirect_uri, app_context=app_context, role=role
    )
    response = service.create_token_response(user)
    if app_context in CONSENT_GATED_APP_CONTEXTS:
        # 소셜 가입은 동의를 사후 수집 (FR-C3) — 클라이언트가 동의 화면으로 유도
        missing = await service.missing_required_consents(db, user)
        if missing:
            response["required_consents"] = missing
    return response


@router.post("/otp/send")
@limiter.limit(settings.rate_limit_otp)
async def send_otp(request: Request, body: OtpSendRequest) -> dict[str, str]:
    """인증번호 발송"""
    await service.send_otp(body.phone, ip_address=request.client.host if request.client else None)
    return {"message": "인증번호가 발송되었습니다"}


@router.post("/otp/verify", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_otp)
async def verify_otp(
    request: Request,
    body: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """인증번호 확인 및 로그인/회원가입"""
    is_valid = await service.verify_otp(body.phone, body.code, ip_address=request.client.host if request.client else None)
    if not is_valid:
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="인증번호가 올바르지 않습니다")

    from app.modules.auth.models import ROLE_APP_MAP
    app_context = body.app_context or ROLE_APP_MAP.get(body.role, "safeway_kids")

    client_ip = request.client.host if request.client else None
    consents = [c.model_dump() for c in body.consents] if body.consents else None

    # 동의 게이트 (FR-C3) — PT/CC 신규 가입만. SafeWay 동작 불변.
    from app.modules.auth.consent_docs import CONSENT_GATED_APP_CONTEXTS

    gated = app_context in CONSENT_GATED_APP_CONTEXTS
    existing_user = await service.find_user_by_phone(db, body.phone, app_context)
    if gated and existing_user is None:
        from app.common.exceptions import ValidationError

        if not body.name:
            raise ValidationError(detail="신규 가입에는 이름이 필요합니다")
        missing = service.missing_required_for_new(body.role, consents)
        if missing:
            raise ValidationError(
                detail={"message": "필수 동의 항목이 누락되었습니다", "missing_consents": missing}
            )

    user, is_new = await service.otp_login_or_register(
        db, body.phone, body.name, body.role, app_context=app_context
    )

    response = None
    if gated:
        if consents:
            await service.record_consents(db, user.id, consents, ip_address=client_ip)
        still_missing = await service.missing_required_consents(db, user)
        response = service.create_token_response(user)
        if still_missing:
            # 기존 사용자(동의 도입 전 가입)는 로그인은 허용하되 재동의 유도 (FR-C3)
            response["required_consents"] = still_missing
    return response or service.create_token_response(user)


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

    # Verify app_context from refresh token matches user (S-08)
    jwt_app_ctx = payload.get("app_context")
    if jwt_app_ctx and user.app_context != jwt_app_ctx:
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="앱 컨텍스트가 일치하지 않습니다")

    return service.create_token_response(user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    """현재 로그인한 사용자 정보"""
    return current_user


# ── Consents (Tech Spec FR-C4, 2026-06-11) ───────────────────────


@router.get("/consents", response_model=ConsentListResponse)
async def get_my_consents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """내 동의 현황 + 필수 동의 누락 목록"""
    consents = await service.list_user_consents(db, current_user.id)
    missing = await service.missing_required_consents(db, current_user)
    return {"consents": consents, "missing_required": missing}


@router.post("/consents", response_model=ConsentListResponse)
async def update_my_consents(
    request: Request,
    body: ConsentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """동의 추가(grant) / 철회(withdraw) — 마케팅 동의·재동의 플로우용"""
    client_ip = request.client.host if request.client else None
    if body.grant:
        await service.record_consents(
            db, current_user.id, [c.model_dump() for c in body.grant], ip_address=client_ip
        )
    if body.withdraw:
        for doc_type in body.withdraw:
            await service.withdraw_consent(db, current_user.id, doc_type)
    await db.commit()
    consents = await service.list_user_consents(db, current_user.id)
    missing = await service.missing_required_consents(db, current_user)
    return {"consents": consents, "missing_required": missing}


# ── Firebase bridge (Tech Spec FR-F1~F3, 2026-06-11) ─────────────


@router.post("/firebase/custom-token", response_model=FirebaseCustomTokenResponse)
@limiter.limit(settings.rate_limit_otp)
async def firebase_custom_token(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """기존 JWT 사용자(OTP/Kakao)를 Firebase 세션으로 연결하는 custom token 발급.

    uid는 서버 레코드에서만 유래 — 요청 본문으로 uid를 받지 않는다 (security MUST).
    """
    token = await service.issue_firebase_custom_token(db, current_user)
    await db.commit()
    logger.info(
        "firebase custom token issued: user=%s ip=%s",
        current_user.id,
        request.client.host if request.client else None,
    )
    return {"custom_token": token, "firebase_uid": current_user.firebase_uid}


@router.post("/firebase/link", response_model=UserResponse)
async def firebase_link(
    body: FirebaseLinkRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Firebase sign-in 직후 ID token의 uid를 현재 사용자에 연결 (멱등, 충돌 409)"""
    from app.middleware.firebase_auth import _verify_id_token, link_firebase_uid

    decoded = await _verify_id_token(body.id_token)
    firebase_uid = decoded.get("uid") or decoded.get("sub")
    if not firebase_uid:
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="Firebase 토큰에 uid가 없습니다")
    user = await link_firebase_uid(db, current_user.id, firebase_uid)
    await db.commit()
    return user


@router.post("/firebase/register", response_model=TokenResponse, status_code=201)
@limiter.limit(settings.rate_limit_auth)
async def firebase_register(
    request: Request,
    body: FirebaseRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """소셜-first 가입 (FR-F3): Firebase ID token + 프로필 + 동의 → 사용자 생성/연결.

    phone은 필수 (users.phone NOT NULL + 본인확인 관행 유지 — Consensus #4).
    """
    from app.common.exceptions import ValidationError
    from app.middleware.firebase_auth import _verify_id_token, link_firebase_uid
    from app.modules.auth.consent_docs import CONSENT_GATED_APP_CONTEXTS
    from app.modules.auth.models import ROLE_APP_MAP

    decoded = await _verify_id_token(body.id_token)
    firebase_uid = decoded.get("uid") or decoded.get("sub")
    if not firebase_uid:
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="Firebase 토큰에 uid가 없습니다")

    client_ip_otp = request.client.host if request.client else None
    otp_ok = await service.verify_otp(body.phone, body.otp_code, ip_address=client_ip_otp)
    if not otp_ok:
        from app.common.exceptions import UnauthorizedError
        raise UnauthorizedError(detail="인증번호가 올바르지 않습니다")

    app_context = body.app_context or ROLE_APP_MAP.get(body.role, "safeway_kids")
    consents = [c.model_dump() for c in body.consents]
    client_ip = request.client.host if request.client else None

    existing = await service.find_user_by_phone(db, body.phone, app_context)
    if existing is None and app_context in CONSENT_GATED_APP_CONTEXTS:
        missing = service.missing_required_for_new(body.role, consents)
        if missing:
            raise ValidationError(
                detail={"message": "필수 동의 항목이 누락되었습니다", "missing_consents": missing}
            )

    user, _is_new = await service.otp_login_or_register(
        db, body.phone, body.name, body.role, app_context=app_context
    )
    user = await link_firebase_uid(db, user.id, firebase_uid)
    if consents:
        await service.record_consents(db, user.id, consents, ip_address=client_ip)
    await db.commit()
    return service.create_token_response(user)


@router.post("/dev-login", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
async def dev_login(
    request: Request,
    body: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """개발용 바로 로그인 (OTP 검증 생략) — development 환경에서만 동작"""
    from app.common.exceptions import ForbiddenError, UnauthorizedError
    from app.config import settings as _settings

    if _settings.environment != "development":
        raise UnauthorizedError(detail="Not available outside development")

    # dev-secret 헤더 검증 (설정된 경우에만)
    if _settings.dev_login_secret != "change-me-dev":
        dev_secret = request.headers.get("X-Dev-Secret")
        if dev_secret != _settings.dev_login_secret:
            raise UnauthorizedError(detail="Invalid dev secret")

    # 명시적 app_context 우선, 없으면 역할에서 자동 추론
    from app.modules.auth.models import ROLE_APP_MAP
    app_context = body.app_context or ROLE_APP_MAP.get(body.role, "safeway_kids")

    user, _is_new = await service.otp_login_or_register(
        db, body.phone, body.name, body.role, app_context=app_context
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


# --- Driver Qualification CRUD ---


@router.get("/users/{user_id}/qualification", response_model=DriverQualificationResponse)
async def get_qualification(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> DriverQualificationResponse:
    """운전자 자격 정보 조회"""
    from sqlalchemy import select as _select

    from app.modules.auth.models import DriverQualification

    stmt = _select(DriverQualification).where(DriverQualification.user_id == user_id)
    result = await db.execute(stmt)
    qual = result.scalar_one_or_none()
    if not qual:
        from app.common.exceptions import NotFoundError
        raise NotFoundError(detail="자격 정보를 찾을 수 없습니다")
    return DriverQualificationResponse.model_validate(qual)


@router.post("/users/{user_id}/qualification", response_model=DriverQualificationResponse, status_code=201)
async def create_qualification(
    user_id: uuid.UUID,
    body: DriverQualificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> DriverQualificationResponse:
    """운전자 자격 정보 등록"""
    from datetime import date as _date

    from sqlalchemy import select as _select

    from app.modules.auth.models import DriverQualification

    # Check if already exists
    existing_stmt = _select(DriverQualification).where(DriverQualification.user_id == user_id)
    existing = await db.execute(existing_stmt)
    if existing.scalar_one_or_none():
        from app.common.exceptions import ConflictError
        raise ConflictError(detail="이미 자격 정보가 등록되어 있습니다")

    # Determine is_qualified
    is_qualified = (
        body.license_expiry > _date.today()
        and body.criminal_check_clear
        and (body.safety_training_expiry is None or body.safety_training_expiry > _date.today())
    )

    from app.common.security import encrypt_value

    qual = DriverQualification(
        user_id=user_id,
        license_number=encrypt_value(body.license_number),
        license_type=body.license_type,
        license_expiry=body.license_expiry,
        criminal_check_date=body.criminal_check_date,
        criminal_check_clear=body.criminal_check_clear,
        safety_training_date=body.safety_training_date,
        safety_training_expiry=body.safety_training_expiry,
        is_qualified=is_qualified,
    )
    db.add(qual)
    await db.flush()
    return DriverQualificationResponse.model_validate(qual)


@router.patch("/users/{user_id}/qualification", response_model=DriverQualificationResponse)
async def update_qualification(
    user_id: uuid.UUID,
    body: DriverQualificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> DriverQualificationResponse:
    """운전자 자격 정보 수정"""
    from datetime import date as _date

    from sqlalchemy import select as _select

    from app.modules.auth.models import DriverQualification

    stmt = _select(DriverQualification).where(DriverQualification.user_id == user_id)
    result = await db.execute(stmt)
    qual = result.scalar_one_or_none()
    if not qual:
        from app.common.exceptions import NotFoundError
        raise NotFoundError(detail="자격 정보를 찾을 수 없습니다")

    from app.common.security import encrypt_value

    qual.license_number = encrypt_value(body.license_number)
    qual.license_type = body.license_type
    qual.license_expiry = body.license_expiry
    qual.criminal_check_date = body.criminal_check_date
    qual.criminal_check_clear = body.criminal_check_clear
    qual.safety_training_date = body.safety_training_date
    qual.safety_training_expiry = body.safety_training_expiry
    qual.is_qualified = (
        body.license_expiry > _date.today()
        and body.criminal_check_clear
        and (body.safety_training_expiry is None or body.safety_training_expiry > _date.today())
    )

    await db.flush()
    return DriverQualificationResponse.model_validate(qual)
