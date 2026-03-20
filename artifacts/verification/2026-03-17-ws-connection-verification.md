# Verification Report: WebSocket 연결 수정

**Date:** 2026-03-17
**Phase:** 6 — Verification

---

## Server-Side Tests (VERIFIED)

| Test | Result | Evidence |
|------|--------|----------|
| WS 직접(backend) 연결 | PASS | Python websockets 연결 성공 |
| WS proxy 경유 연결 | PASS | localhost:9000 경유 연결 성공 |
| WS ngrok 경유 연결 | PASS | wss://kinematical-carole-bursate.ngrok-free.dev 연결 성공 |
| GPS E2E (ngrok → WS → Redis pubsub → 수신) | PASS | lat=37.501, lng=127.035 수신 확인 |
| HTTP 폴링 엔드포인트 | PASS | GET /telemetry/vehicles/{id}/location → 200 + 위치 반환 |
| 잘못된 토큰 → 거부 | PASS | HTTP 403 (WS accept 전 거부) |
| 토큰 없음 → 거부 | PASS | HTTP 403 |

## TypeScript Check (VERIFIED)

```
npx tsc --noEmit → 에러 없음
```

## Changed Files

| File | Change |
|------|--------|
| `mobile/src/api/client.ts` | `refreshAccessToken()` 함수 export 추가 |
| `mobile/src/hooks/useVehicleTracking.ts` | 전면 재작성 — 토큰 검증, 4001 refresh 재시도, HTTP 폴링 fallback, ConnectionState enum |
| `mobile/src/screens/parent/MapScreen.tsx` | connectionState 기반 UI 세분화 |
| `mobile/src/constants/mapHtml.ts` | (이전 단계) 인라인 HTML — Kakao Maps SDK 로딩 수정 |
| `mobile/proxy.js` | (이전 단계) WS upgrade /api/* → backend 라우팅 수정 |
| `backend/scripts/gps_replay.py` | dev-login 방식으로 인증 수정 |
| `backend/app/config.py` | DB 포트 5432 → 5433 수정 |

## Mobile E2E (UNVERIFIED — 앱 테스트 대기)

| Test | Status | Notes |
|------|--------|-------|
| 실시간 추적 "연결됨" 표시 | UNVERIFIED | Expo Go 수동 확인 필요 |
| 지도 버스 마커 이동 | UNVERIFIED | GPS replay 실행 중 확인 필요 |
| 화면 이탈→복귀 재연결 | UNVERIFIED | |
| 인증 만료 UI | UNVERIFIED | |

## Residual Risks

- RR1: 백엔드 `/auth/refresh` 엔드포인트 존재 여부 미확인 (dev-login 환경에서는 refresh_token 만료 처리 경로 미테스트)
- RR2: Expo Go / Hermes 엔진에서 `atob()` 지원 여부 (`isTokenValid` 함수 사용) — React Native에서 일부 버전 미지원 가능
