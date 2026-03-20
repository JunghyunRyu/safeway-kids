# Milestone Report: WebSocket 실시간 추적 연결 수정

**Date:** 2026-03-17
**Milestone:** WS 연결 끊김 수정 (실시간 추적)

---

## What is Complete — VERIFIED

| Item | Status | Evidence |
|------|--------|----------|
| ngrok → proxy → backend WS 경로 정상 | VERIFIED | Python E2E 테스트 통과 |
| GPS E2E (WS + Redis pubsub) | VERIFIED | lat/lng 수신 확인 |
| HTTP 폴링 엔드포인트 | VERIFIED | GET 200 + 위치 반환 |
| /auth/refresh 엔드포인트 | VERIFIED | 200 + 새 토큰 반환 |
| proxy.js WS /api/* 라우팅 | VERIFIED | 코드 수정 + 서비스 재시작 |
| TypeScript 컴파일 | VERIFIED | 에러 없음 |
| Kakao Maps 인라인 HTML | VERIFIED | source={{ html: ... }} 적용 |
| DB 포트 수정 (5432→5433) | VERIFIED | 백엔드 startup 성공 |

## What Remains Unverified

| Item | Risk |
|------|------|
| Expo Go 앱에서 실시간 추적 "연결됨" 표시 | MEDIUM — 앱 수동 테스트 대기 |
| 지도 버스 마커 이동 | MEDIUM — GPS replay 실행 중, 앱 확인 필요 |
| 토큰 만료 시 자동 refresh | LOW — 서버 엔드포인트 확인됨, 앱 로직 구현됨 |
| HTTP 폴링 fallback 전환 | LOW — 코드 구현됨, WS 3회 실패 시나리오 미테스트 |

## Residual Risks

- RR1: 첫 로그인 직후 `connectWs` 진입 타이밍에서 SecureStore 비동기 읽기 완료 전 연결 시도 가능성 — `ensureValidToken()` 내 await으로 처리됨
- RR2: ngrok 무료 터널 세션 2시간 제한 — 앱 테스트 시 터널 만료 가능

## Key Code Changes Summary

```
mobile/src/hooks/useVehicleTracking.ts  — 핵심 수정
  + ensureValidToken(): JWT exp 로컬 검증 + 자동 refresh
  + 4001 close → refreshToken() 1회 재시도 → auth_failed
  + WS 3회 실패 → HTTP polling fallback (3초 간격)
  + ConnectionState enum (idle/connecting/connected/reconnecting/polling/auth_failed/error)

mobile/src/api/client.ts
  + refreshAccessToken() 함수 export

mobile/src/screens/parent/MapScreen.tsx
  + connectionState 기반 UI (연결됨/폴링/연결중/인증만료/운행없음)
  + 녹색/주황/노랑/빨강 도트 색상 구분

mobile/src/constants/mapHtml.ts (신규)
  + Kakao Maps HTML 인라인 — file:// origin 외부 SDK 차단 해결
```

## Next Step

앱에서 실시간 추적 화면 진입 → "연결됨" 확인 → GPS 마커 이동 확인
