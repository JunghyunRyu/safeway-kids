"""Firebase Auth dependency for PetTracker / CareConnect routes.

Tech Spec FR-2 (artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md).

SafeWay Kids 라우터는 기존 `get_current_user`(JWT)를 그대로 유지한다.
PT/CC 라우터만 본 `get_current_user_firebase` dependency로 교체한다.
혼용 미들웨어를 만들지 않고 dependency 주입으로 분리한다 (Consensus 1.2 참조).

Firebase 프로젝트 설정:
  - 환경 변수 FIREBASE_CREDENTIALS_PATH 또는 GOOGLE_APPLICATION_CREDENTIALS 로
    service account JSON 경로 지정.
  - 처음 호출 시 firebase_admin app 자동 초기화 (idempotent).

Kakao OAuth는 Firebase Custom Token 발급 방식으로 통합 (B-7 참조).
"""

from __future__ import annotations

import asyncio
import os
import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import UnauthorizedError
from app.database import get_db
from app.modules.auth.models import User

_security = HTTPBearer()
_initialized = False


def _ensure_firebase_initialized() -> None:
    """firebase_admin app 1회 초기화 (idempotent)."""
    global _initialized
    if _initialized:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError as e:
        raise UnauthorizedError(
            detail="Firebase SDK 미설치 — pip install firebase-admin",
        ) from e

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


async def _verify_id_token(token: str) -> dict:
    """비동기 wrap — firebase_admin은 동기 SDK."""
    _ensure_firebase_initialized()
    from firebase_admin import auth as fb_auth

    loop = asyncio.get_event_loop()
    try:
        decoded = await loop.run_in_executor(None, fb_auth.verify_id_token, token)
        return decoded
    except Exception as e:
        raise UnauthorizedError(detail=f"Firebase ID 토큰 검증 실패: {e}") from e


async def get_current_user_firebase(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Firebase ID Token에서 사용자 추출 + DB 조회.

    Token payload에서 `uid` 또는 `sub` (Firebase는 `uid`)을 사용해
    User.firebase_uid 컬럼으로 매핑한다. 첫 로그인이면 firebase_uid를
    채우지 못한 상태일 수 있으므로 호출 측에서 별도 onboarding 처리.
    """
    decoded = await _verify_id_token(credentials.credentials)
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
        raise UnauthorizedError(
            detail="등록되지 않은 Firebase 사용자 — 회원가입 필요",
        )

    # PT/CC app_context tagging — Firebase token의 custom claim 또는 user 레코드 기준
    user._jwt_app_context = user.app_context  # type: ignore[attr-defined]
    return user


async def link_firebase_uid(
    db: AsyncSession,
    user_id: uuid.UUID,
    firebase_uid: str,
) -> None:
    """Kakao 또는 OTP 첫 로그인 후 발급한 Firebase Custom Token으로
    Firebase에 첫 sign-in 한 직후, 모바일 클라이언트가 호출해
    User.firebase_uid를 채우는 헬퍼.

    실제 endpoint 등록은 Milestone B-7 (auth router 변경) 시점.
    """
    user = await db.get(User, user_id)
    if not user:
        raise UnauthorizedError(detail="사용자를 찾을 수 없습니다")
    user.firebase_uid = firebase_uid  # type: ignore[attr-defined]
    await db.flush()
