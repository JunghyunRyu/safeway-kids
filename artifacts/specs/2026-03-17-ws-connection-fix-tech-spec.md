# Final Tech Spec: 실시간 추적 WebSocket 연결 수정

**Date:** 2026-03-17
**Phase:** 3 — Final Tech Spec
**Status:** APPROVED

---

## 1. Problem Statement

학부모 앱(Expo Go / iPhone)에서 실시간 추적 화면 진입 시 WebSocket 연결이 4001(인증실패) close code로 즉시 닫히고, NO_RETRY_CODES에 의해 재시도가 영구 중단되어 "연결 끊김"이 지속된다.

## 2. Goals / Non-Goals

**Goals:**
- G1: WS 연결 전 토큰 유효성 보장 (null/만료 검사 + refresh)
- G2: 4001 close 시 토큰 refresh 후 1회 재시도
- G3: WS 완전 실패 시 HTTP 폴링 fallback 자동 전환
- G4: 연결 상태 UI 세분화

**Non-Goals:**
- 백그라운드 GPS 추적
- 프로덕션 배포
- SSE 전환

## 3. User Scenarios

**S1: 정상 연결**
학부모 로그인 → 추적 탭 → 토큰 유효 확인 → WS 연결 → "연결됨" → GPS 마커 이동

**S2: 토큰 만료**
학부모 추적 탭 → 토큰 만료 감지 → 자동 refresh → 새 토큰으로 WS 연결 → "연결됨"

**S3: WS 연결 불가**
학부모 추적 탭 → WS 3회 실패 → 자동 HTTP 폴링 전환 → "폴링 모드" → GPS 마커 이동 (3초 간격)

**S4: 운행 없음**
학부모 추적 탭 → 스케줄 조회 → 차량 없음 → "오늘 운행 스케줄이 없습니다" 표시

## 4. Architecture / Data Flow

```
[Expo Go App]
  ├── MapScreen.tsx
  │     └── useVehicleTracking(vehicleIds, enabled)
  │           ├── [1] ensureValidToken()
  │           │     ├── tokenStorage.getItem("access_token")
  │           │     ├── JWT exp 검사 (로컬 디코딩)
  │           │     └── 만료 시 → refreshToken() via HTTP
  │           ├── [2] new WebSocket(wss://ngrok/api/v1/telemetry/ws/...)
  │           │     ├── onopen → connected: true
  │           │     ├── onmessage → location 업데이트
  │           │     └── onclose(4001) → refreshToken() → 1회 재시도
  │           └── [3] Fallback: HTTP polling (3회 WS 실패 후)
  │                 └── GET /telemetry/vehicles/{id}/location (3초 간격)
  │
  ├── proxy.js (port 9000)
  │     └── /api/* WS upgrade → backend:8000
  │
  └── ngrok tunnel → proxy:9000
```

## 5. Functional Requirements

### FR1: Token Validation Before WS Connection
- `connectWs()` 진입 시 `ensureValidToken()` 호출
- token이 null이면 연결 시도하지 않고 "로그인 필요" 상태
- token이 만료(exp < now)이면 refresh 시도
- refresh 성공 시 새 token으로 WS URL 생성
- refresh 실패 시 "인증 만료" 상태 표시

### FR2: 4001 Close Code Token Refresh Retry
- onclose(4001) 수신 시:
  1. refreshToken() 호출
  2. 성공 시 새 token으로 1회 재연결 시도
  3. 재연결도 4001이면 영구 중단 + "인증 만료" UI
- 기존 NO_RETRY_CODES에서 4001 제거, 별도 핸들링

### FR3: HTTP Polling Fallback
- WS 연결 3회 연속 실패 시 자동 전환
- `GET /api/v1/telemetry/vehicles/{id}/location` 3초 간격 폴링
- 폴링 모드에서도 location 업데이트 + connected: true
- 주기적(30초)으로 WS 재시도, 성공 시 폴링 중단

### FR4: Connection State Enum
```typescript
type ConnectionState =
  | "idle"           // 초기 / 차량 없음
  | "connecting"     // WS 연결 시도 중
  | "connected"      // WS 연결됨
  | "reconnecting"   // WS 재연결 시도 중
  | "polling"        // HTTP 폴링 모드
  | "auth_failed"    // 인증 실패 (refresh도 실패)
  | "error";         // 기타 오류
```

## 6. Interfaces

### Modified: useVehicleTracking return type
```typescript
interface VehicleTrackingResult {
  locations: Map<string, GpsLocation>;
  connectionState: ConnectionState;  // boolean connected → enum
  connected: boolean;                // backward compat (derived)
}
```

### New: ensureValidToken()
```typescript
async function ensureValidToken(): Promise<string | null>
// Returns valid token or null if refresh fails
```

### New: pollVehicleLocation()
```typescript
async function pollVehicleLocation(vehicleId: string): Promise<GpsLocation | null>
// GET /telemetry/vehicles/{vehicleId}/location
```

## 7. Edge Cases

| Case | Handling |
|------|----------|
| Token null (never logged in) | connectionState = "auth_failed", 재시도 없음 |
| Token 만료, refresh 성공 | 새 token으로 WS 연결 |
| Token 만료, refresh 실패 | connectionState = "auth_failed" |
| WS 4001 첫 번째 | refresh → 1회 재시도 |
| WS 4001 두 번째 | connectionState = "auth_failed" |
| WS 비인증 close (1006 등) | exponential backoff 재시도 (기존) |
| 3회 연속 WS 실패 | HTTP 폴링 전환 |
| ngrok 터널 끊김 | WS + HTTP 모두 실패, 재시도 계속 |
| vehicleIds 빈 배열 | connectionState = "idle", WS 미시작 |
| 다수 차량 중 일부만 연결 | 개별 차량 상태 관리 (최소 1개 연결 = connected) |

## 8. Testing Strategy

| Test | Type | Method |
|------|------|--------|
| Token null 시 WS 미시도 | Unit | Mock tokenStorage → null |
| Token 만료 시 refresh 호출 | Unit | Mock expired JWT |
| 4001 시 refresh + 재시도 | Unit | Mock WS close(4001) |
| HTTP 폴링 전환 | Unit | Mock WS 3회 실패 |
| E2E GPS 수신 | Manual | Expo Go + gps_replay.py |
| 서버 직접 WS 테스트 | Integration | Python websockets |

## 9. Code Impact Map

| File | Change |
|------|--------|
| `mobile/src/hooks/useVehicleTracking.ts` | Token 검증, 4001 핸들링, 폴링 fallback, 상태 enum |
| `mobile/src/screens/parent/MapScreen.tsx` | connectionState UI 반영 |
| `mobile/src/api/client.ts` | `refreshAccessToken()` 함수 export |
| `mobile/src/api/vehicles.ts` | `getVehicleLocation()` API 함수 추가 (있으면 확인) |

## 10. Rollback Strategy

모든 변경이 모바일 클라이언트에 한정되어 서버 변경 없음.
문제 발생 시 `useVehicleTracking.ts`를 기존 코드로 rollback.

## 11. Acceptance Criteria

- AC1: 유효 토큰 + 활성 ngrok + 스케줄 존재 시 10초 내 "연결됨"
- AC2: gps_replay.py 실행 시 5초 내 지도 마커 업데이트
- AC3: 화면 이탈 → 복귀 시 10초 내 재연결
- AC4: 4001 close 시 토큰 refresh 후 자동 재연결
- AC5: 토큰 만료 시 refresh 후 WS 연결 (앱 재시작 불필요)
- AC6: WS 3회 실패 시 HTTP 폴링 자동 전환 + GPS 데이터 수신
- AC7: 차량 스케줄 없으면 "운행 없음" 표시 (연결 끊김 아님)
