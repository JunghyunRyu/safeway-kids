"""WebSocket auth — Tech Spec FR-4 (실시간 산책 추적용).

JWT(SafeWay)와 Firebase ID Token(PT/CC) 두 verifier를 한 모듈에서 노출.
- query param 방식 (`?token=xxx`) — deprecated, 호환 유지
- first-message auth — 권장, `{"token": "..."}` 첫 프레임 송신 후 `{"type": "auth_ok"}` 수신

m4_websocket의 인라인 `_authenticate_token`을 본 모듈로 흡수.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any, Awaitable, Callable

from fastapi import WebSocket
from sqlalchemy import select

from app.modules.auth.models import User
from app.modules.auth.service import decode_token

logger = logging.getLogger(__name__)


def _default_session_factory() -> Any:
    """기본 session factory 지연 import — 호출 측에서 monkeypatch 가능."""
    from app.database import async_session_factory

    return async_session_factory


# ── JWT (SafeWay Kids) ───────────────────────────────────────────

async def authenticate_jwt_token(
    token: str,
    session_factory: Callable[[], Any] | None = None,
) -> User | None:
    """Access JWT를 검증하고 활성 User 레코드를 반환. 실패 시 None.

    session_factory를 명시 전달하면 그 factory(예: test의 patched version)를 사용.
    None이면 `app.database.async_session_factory`를 지연 import 하여 사용.
    """
    factory = session_factory or _default_session_factory()
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        async with factory() as db:
            stmt = select(User).where(
                User.id == uuid.UUID(user_id_str),
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
    except Exception:
        return None


# ── Firebase ID Token (PT / CC) ──────────────────────────────────

async def authenticate_firebase_token(
    token: str,
    session_factory: Callable[[], Any] | None = None,
) -> User | None:
    """Firebase ID Token을 검증하고 활성 User 레코드를 반환. 실패 시 None.

    middleware/firebase_auth.py의 verify 로직을 WS 컨텍스트에서 재사용.
    HTTPBearer 의존 없이 raw token 문자열만 받는다.
    """
    factory = session_factory or _default_session_factory()
    try:
        from app.middleware.firebase_auth import _verify_id_token  # type: ignore[attr-defined]

        decoded = await _verify_id_token(token)
        firebase_uid = decoded.get("uid") or decoded.get("sub")
        if not firebase_uid:
            return None
        async with factory() as db:
            stmt = select(User).where(
                User.firebase_uid == firebase_uid,
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
    except Exception as e:
        logger.debug("Firebase WS auth failed: %s", e)
        return None


# ── First-message auth helper ────────────────────────────────────

AuthFn = Callable[[str], Awaitable["User | None"]]


async def negotiate_ws_auth(
    websocket: WebSocket,
    authenticator: AuthFn,
    timeout: float = 5.0,
) -> User | None:
    """WS 인증 협상 — query param 우선, 없으면 첫 메시지 토큰 수신.

    성공 시 `{"type": "auth_ok"}` 송신 후 User 반환.
    실패 시 `code=4001`로 close 후 None 반환.
    """
    token = websocket.query_params.get("token")

    if token:
        logger.warning("Deprecated: token via query param. Use first-message auth.")
        user = await authenticator(token)
        if not user:
            await websocket.close(code=4001, reason="Unauthorized")
            return None
        await websocket.accept()
        return user

    await websocket.accept()
    try:
        data = await asyncio.wait_for(websocket.receive_json(), timeout=timeout)
        token = data.get("token")
        if not token:
            await websocket.close(code=4001, reason="Missing token")
            return None
        user = await authenticator(token)
        if not user:
            await websocket.close(code=4001, reason="Unauthorized")
            return None
        await websocket.send_json({"type": "auth_ok"})
        return user
    except asyncio.TimeoutError:
        await websocket.close(code=4001, reason="Auth timeout")
        return None
    except Exception:
        await websocket.close(code=4001, reason="Auth error")
        return None
