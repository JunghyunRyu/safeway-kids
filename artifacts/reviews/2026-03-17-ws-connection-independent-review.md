# Independent Review: 실시간 추적 WebSocket 연결 끊김

**Date:** 2026-03-17
**Phase:** 1 — Independent Review

---

## Critical Finding

서버 측 End-to-End 테스트(Python websockets 클라이언트)로 ngrok → proxy → backend → Redis pubsub → GPS 데이터 수신 전체 경로가 **정상 동작 확인됨**. 따라서 문제는 **React Native/Expo Go 앱 내부**에 한정됨.

## Revised Root Cause Ranking (확률순)

| Rank | Cause | Evidence |
|------|-------|----------|
| **1 (최유력)** | Token 경쟁 조건: `connectWs`에서 token이 null → 서버가 4001로 닫음 → NO_RETRY_CODES에 해당 → 영구 재시도 중단 | `useVehicleTracking.ts:36-39,65-68` 코드 경로 확인 |
| **2** | Token 만료: JWT 1시간 만료 후 WS 연결 시도 → 4001 → 영구 중단. HTTP에는 refresh 로직 있으나 WS에는 없음 | `client.ts:62-84` (HTTP만 refresh), `config.py:15` (60분) |
| **3** | ngrok 인터스티셜: RN WebSocket도 브라우저 User-Agent를 보낼 가능성 | Python 테스트에서는 미발생, RN에서만 발생 가능 |
| **4** | vehicleIds 빈 배열: 오늘 스케줄 없으면 WS 자체가 미시작 | `MapScreen.tsx:94` — enabled: vehicleIds.length > 0 |

## Top 5 Required Fixes

1. **WS 연결 전 토큰 유효성 검증** — null/만료 체크, 필요 시 refresh
2. **4001 close 시 토큰 refresh 후 재시도** — NO_RETRY_CODES에서 즉시 포기하지 않고 1회 refresh 시도
3. **HTTP 폴링 fallback** — WS 실패 시 REST 엔드포인트로 자동 전환
4. **상태 세분화** — "연결 끊김"을 "인증 실패"/"재시도 중"/"운행 없음"으로 구분
5. **디버그 로그** — close code 및 reason을 Metro 콘솔에 출력 (이미 추가됨)

## Missing Acceptance Criteria (추가 필요)

- AC5: 토큰 만료 시 자동 refresh 후 WS 재연결
- AC6: 오늘 운행 스케줄 없으면 "운행 없음" 표시 (연결 끊김 아님)
- AC7: 테스트 전 ngrok URL이 현재 활성 터널인지 확인
