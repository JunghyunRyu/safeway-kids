# Final Tech Spec: Push Notification ID Fix + Edge Gateway Auth

**Date:** 2026-03-29
**Status:** APPROVED (리뷰어 피드백 반영)

---

## Problem Statement
1. 모바일 푸시 알림이 프로덕션에서 동작하지 않음 (플레이스홀더 프로젝트 ID)
2. Edge Gateway에 인증이 없어 누구나 가짜 AI 이벤트 주입 가능

---

## Implementation Plan

### REQ-A: Expo Push Notification Project ID

**변경 파일:**
- `mobile/src/hooks/useNotifications.ts` — projectId를 Constants에서 동적 참조
- `mobile/src/__tests__/setup.ts` — 테스트 mock에 eas.projectId 추가

**구현:**
```typescript
import Constants from "expo-constants";

const projectId = Constants.expoConfig?.extra?.eas?.projectId;
if (!projectId) {
  debugLog("[Notifications] Missing Expo project ID in app config");
  return null;
}
const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
```

**expo-constants 의존성:**
- `mobile/src/api/client.ts:1`에서 이미 import 중 → 이미 설치되어 있음 확인 필요
- 없으면 `npx expo install expo-constants` 실행

---

### REQ-B: Edge Gateway API Key Authentication

**변경 파일:**
- `backend/app/config.py` — `edge_api_key` 설정 추가 + 프로덕션 validator
- `backend/app/modules/edge_gateway/router.py` — POST에 API키 인증, GET에 JWT 인증
- `backend/app/modules/edge_gateway/dependencies.py` — (신규) `verify_edge_api_key` 의존성
- `backend/tests/integration/test_edge_gateway.py` — 인증 헤더 추가

**인증 의존성 구현:**
```python
import hmac
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

_edge_bearer = HTTPBearer(auto_error=False)

async def verify_edge_api_key(
    credentials: HTTPAuthorizationCredentials | None = Depends(_edge_bearer),
) -> str:
    # 개발 환경 + 키 미설정 → 바이패스
    if settings.environment == "development" and not settings.edge_api_key:
        return "edge_device_dev"

    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API 키가 필요합니다")

    if not hmac.compare_digest(credentials.credentials, settings.edge_api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 API 키입니다")

    return "edge_device"
```

**config.py 추가:**
```python
edge_api_key: str = ""  # env: EDGE_API_KEY
```

**프로덕션 validator 추가:**
```python
if not self.edge_api_key:
    missing.append("edge_api_key")
```

**라우터 변경:**
- `POST /events`: `Depends(verify_edge_api_key)` 추가
- `GET /events`: `Depends(get_current_user)` + `Depends(require_platform_admin)` 추가

---

## Acceptance Criteria

| ID | 기준 | 검증 방법 |
|----|------|----------|
| AC-A1 | 플레이스홀더 문자열 제거 | grep "your-expo-project-id" 결과 없음 |
| AC-A2 | Constants에서 동적 참조 | 코드 확인 |
| AC-A3 | 모바일 테스트 통과 | `cd mobile && npx jest` |
| AC-B1 | 인증 없는 POST → 401 | 백엔드 테스트 |
| AC-B2 | 유효 키 POST → 201 | 백엔드 테스트 |
| AC-B3 | dev 환경 키 없이 → 허용 | 백엔드 테스트 |
| AC-B4 | GET에 JWT 인증 적용 | 백엔드 테스트 |
| AC-B5 | config에 edge_api_key 추가 | 코드 확인 |
| AC-B6 | BackendBridge 호환 | Bearer 헤더 사용 확인 |
| AC-B7 | 백엔드 테스트 통과 | `cd backend && pytest` |
