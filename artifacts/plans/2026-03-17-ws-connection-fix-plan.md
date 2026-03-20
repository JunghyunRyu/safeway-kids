# Implementation Plan: WebSocket 연결 수정

**Date:** 2026-03-17
**Phase:** 4 — Todo Plan

---

## Milestone 1: Token Validation + 4001 Retry (Primary Fix)

### Task 1.1: client.ts — refreshAccessToken 함수 export
- 기존 interceptor 내부의 refresh 로직을 독립 함수로 추출
- `export async function refreshAccessToken(): Promise<string | null>`

### Task 1.2: useVehicleTracking.ts — ensureValidToken 구현
- JWT exp 클레임 로컬 디코딩 (검증 불필요, 만료만 확인)
- null/만료 시 refreshAccessToken() 호출
- 실패 시 null 반환

### Task 1.3: useVehicleTracking.ts — 4001 close 핸들링 변경
- NO_RETRY_CODES에서 4001 제거
- onclose(4001) → refreshAccessToken() → 1회 재시도
- 재시도도 4001이면 auth_failed 상태

### Task 1.4: ConnectionState enum 도입
- boolean connected → ConnectionState enum
- backward compat을 위해 connected getter 유지

## Milestone 2: HTTP Polling Fallback

### Task 2.1: vehicles API에 getVehicleLocation 확인/추가
- `GET /telemetry/vehicles/{id}/location` 클라이언트 함수

### Task 2.2: useVehicleTracking.ts — polling fallback 구현
- WS 3회 연속 실패 시 setInterval 기반 폴링 전환
- 30초마다 WS 재시도, 성공 시 폴링 중단

## Milestone 3: UI 업데이트

### Task 3.1: MapScreen.tsx — connectionState 반영
- idle → "오늘 운행 스케줄이 없습니다"
- connecting/reconnecting → "연결 중..." (로딩 인디케이터)
- connected → "연결됨" (녹색)
- polling → "폴링 모드" (주황)
- auth_failed → "인증 만료 — 다시 로그인해주세요"
- error → "연결 오류"

## Milestone 4: Verification

### Task 4.1: 서버 WS 직접 테스트 재확인
### Task 4.2: Expo Go에서 실시간 추적 테스트
### Task 4.3: GPS 시뮬레이션 + 마커 이동 확인
