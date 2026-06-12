"""Firebase Auth dependency for PetTracker / CareConnect routes.

Tech Spec FR-2 (artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md)
+ FR-F4/FR-F5 (artifacts/specs/2026-06-11-pt-payment-signup-final-tech-spec.md).

SafeWay Kids 라우터는 기존 `get_current_user`(JWT)를 그대로 유지한다.
PT/CC 라우터는 `get_current_user_dual` — 로컬 JWT 검증을 먼저 시도하고
(결정적·무네트워크), 실패 시에만 Firebase ID token 검증으로 넘어간다.
각 경로가 독립적으로 완전한 인증을 수행하므로 다운그레이드 공격면이 없다.

예외 정책 (Consensus #11, security MUST):
  - Firebase 토큰 자체가 무효 (Invalid/Expired/Revoked) → 401
  - SDK 미설치·초기화 실패·타임아웃 등 인프라 오류 → 503 (401로 위장 금지)

Firebase 프로젝트 설정:
  - 환경 변수 FIREBASE_CREDENTIALS_PATH 또는 GOOGLE_APPLICATION_CREDENTIALS 로
    service account JSON 경로 지정.
  - 처음 호출 시 firebase_admin app 자동 초기화 (idempotent).

Kakao OAuth는 Firebase Custom Token 발급 방식으로 통합 (FR-F1).
"""

from __future__ import annotations

import asyncio
import os
import uuid
from concurrent.futures import ThreadPoolExecutor

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, UnauthorizedError
from app.database import get_db
from app.middleware.auth import get_current_user
from app.modules.auth.models import User

_security = HTTPBearer()
_initialized = False

# Firebase Admin SDK는 동기 — 기본 풀 고갈 방지용 전용 bounded executor (R-2)
_FB_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="firebase")
_FB_TIMEOUT_SECONDS = 5.0


class FirebaseUnavailableError(HTTPException):
    """Firebase 인프라 오류 — 인증 실패(401)와 구분되는 503."""

    def __init__(self, detail: str = "인증 서버를 일시적으로 사용할 수 없습니다") -> None:
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


def _ensure_firebase_initialized() -> None:
    """firebase_admin app 1회 초기화 (idempotent)."""
    global _initialized
    if _initialized:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError as e:
        # SDK 미설치는 배포 문제 — 클라이언트에 401로 위장하지 않는다 (FR-F4)
        raise FirebaseUnavailableError(detail="Firebase SDK가 설치되지 않았습니다") from e

    if firebase_admin._apps:
        _initialized = True
        return

    cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH") or os.environ.get(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()
    _initialized = True


async def _run_firebase(func, *args):  # noqa: ANN001, ANN201 — passthrough wrapper
    """동기 firebase_admin 호출을 bounded executor + 타임아웃으로 wrap."""
    loop = asyncio.get_running_loop()
    return await asyncio.wait_for(
        loop.run_in_executor(_FB_EXECUTOR, func, *args),
        timeout=_FB_TIMEOUT_SECONDS,
    )


async def _verify_id_token(token: str) -> dict:
    """Firebase ID token 검증 — 토큰 무효는 401, 인프라 오류는 503."""
    _ensure_firebase_initialized()
    from firebase_admin import auth as fb_auth

    try:
        return await _run_firebase(fb_auth.verify_id_token, token)
    except (
        fb_auth.InvalidIdTokenError,
        fb_auth.ExpiredIdTokenError,
        fb_auth.RevokedIdTokenError,
        fb_auth.UserDisabledError,
        fb_auth.CertificateFetchError,
        ValueError,  # malformed token string
    ) as e:
        if isinstance(e, fb_auth.CertificateFetchError):
            raise FirebaseUnavailableError() from e
        raise UnauthorizedError(detail="Firebase ID 토큰 검증 실패") from e
    except TimeoutError as e:
        raise FirebaseUnavailableError(detail="Firebase 인증 응답 시간 초과") from e
    except Exception as e:  # 네트워크 등 잔여 인프라 오류 — fail-closed but 503
        raise FirebaseUnavailableError() from e


async def create_custom_token_async(firebase_uid: str) -> str:
    """Firebase Custom Token 발급 (FR-F1). uid는 호출 측이 서버 레코드에서 유래시킬 것."""
    _ensure_firebase_initialized()
    from firebase_admin import auth as fb_auth

    try:
        token = await _run_firebase(fb_auth.create_custom_token, firebase_uid)
    except TimeoutError as e:
        raise FirebaseUnavailableError(detail="Firebase 토큰 발급 시간 초과") from e
    except Exception as e:
        raise FirebaseUnavailableError() from e
    return token.decode("utf-8") if isinstance(token, bytes) else token


async def _user_from_firebase_token(token: str, db: AsyncSession) -> User:
    decoded = await _verify_id_token(token)
    firebase_uid = decoded.get("uid") or decoded.get("sub")
    if not firebase_uid:
        raise UnauthorizedError(detail="Firebase 토큰에 uid가 없습니다")

    stmt = select(User).where(
        User.firebase_uid == firebase_uid,
        User.deleted_at.is_(None),
        User.is_active.is_(True),
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedError(detail="등록되지 않은 Firebase 사용자 — 회원가입 필요")

    user._jwt_app_context = user.app_context  # type: ignore[attr-defined]
    return user


async def get_current_user_firebase(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """순수 Firebase ID Token 인증 (Firebase-only 라우트용)."""
    return await _user_from_firebase_token(credentials.credentials, db)


async def get_current_user_dual(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """PT/CC 듀얼 인증 (FR-F5): 로컬 JWT 우선 → 실패 시 Firebase.

    JWT 검증은 로컬 시크릿으로 결정적이므로 네트워크 비용 없이 먼저
    시도한다. 401 계열(UnauthorizedError)일 때만 Firebase 경로로 넘어가고,
    Firebase 인프라 오류(503)는 그대로 전파한다.
    """
    try:
        return await get_current_user(credentials, db)
    except UnauthorizedError:
        return await _user_from_firebase_token(credentials.credentials, db)


async def link_firebase_uid(
    db: AsyncSession,
    user_id: uuid.UUID,
    firebase_uid: str,
) -> User:
    """User.firebase_uid 연결 (FR-F2) — 멱등, 충돌 시 409.

    동일 사용자가 같은 uid로 재호출하면 no-op. 다른 사용자가 이미
    해당 uid를 점유 중이면 ConflictError (unique 제약 위반을 raw DB
    에러로 흘리지 않는다 — Consensus M-3).
    """
    user = await db.get(User, user_id)
    if not user:
        raise UnauthorizedError(detail="사용자를 찾을 수 없습니다")
    if user.firebase_uid == firebase_uid:
        return user

    stmt = select(User).where(
        User.firebase_uid == firebase_uid, User.id != user_id
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is not None:
        raise ConflictError(detail="이미 다른 계정에 연결된 Firebase 사용자입니다")

    user.firebase_uid = firebase_uid
    await db.flush()
    return user
