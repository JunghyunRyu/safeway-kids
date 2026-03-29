"""Edge AI Gateway 인증 의존성.

Edge AI 디바이스는 Authorization: Bearer <api_key> 헤더로 인증한다.
개발 환경에서 edge_api_key가 미설정이면 인증을 건너뛴다.
"""

import hmac
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

logger = logging.getLogger(__name__)

_edge_bearer = HTTPBearer(auto_error=False)


async def verify_edge_api_key(
    credentials: HTTPAuthorizationCredentials | None = Depends(_edge_bearer),
) -> str:
    """Edge AI 디바이스의 API 키를 검증한다.

    Returns:
        디바이스 식별자 문자열 ("edge_device" 또는 "edge_device_dev")
    """
    # 개발 환경 + 키 미설정 → 바이패스
    if settings.environment == "development" and not settings.edge_api_key:
        return "edge_device_dev"

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Edge API 키가 필요합니다",
            headers={"WWW-Authenticate": 'Bearer realm="edge"'},
        )

    if not hmac.compare_digest(credentials.credentials, settings.edge_api_key):
        logger.warning("[EDGE AUTH] Invalid API key attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 Edge API 키입니다",
            headers={"WWW-Authenticate": 'Bearer realm="edge"'},
        )

    return "edge_device"
