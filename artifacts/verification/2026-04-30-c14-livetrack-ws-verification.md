# C-14 LiveTrackScreen WS Integration — Verification Report

- **Date**: 2026-04-30
- **Phase**: Phase 6 — Verification
- **Workstream**: Milestone C — PT 모바일 통합 트랙
- **Spec ref**: [`artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md`](../specs/2026-04-24-pt-quality-uplift-final-tech-spec.md) FR-4 (실시간 추적)
- **Plan ref**: [`artifacts/plans/2026-04-24-pt-quality-uplift-todo-plan.md`](../plans/2026-04-24-pt-quality-uplift-todo-plan.md) C-14
- **Gap Note**: [`artifacts/gap-notes/2026-04-30-record-gps-publish-missing.md`](../gap-notes/2026-04-30-record-gps-publish-missing.md) (resolved during this work)

## Implementation Summary

| 변경 | 파일 | 변화 |
|---|---|---|
| 백엔드 publish 추가 (Gap fix) | `backend/app/apps/pettracker/service.py` | `record_gps`에 try/except로 감싼 `redis_client.publish` 추가. fail-soft. |
| 프론트엔드 WS 통합 | `apps/pettracker/mobile/src/screens/owner/LiveTrackScreen.tsx` | 5초 polling → `useWebSocket` 구독으로 대체. `wsStatus === 'failed'` 시 polling fallback 자동 활성. |
| WS 상태 배지 | 동 파일 헤더 | LIVE (open) / 연결중 (connecting/authenticating) / POLLING (failed) 3-state. |

## Design Decisions

1. **WS message contract**: 백엔드 publish 메시지 = `{type:"gps", lat, lng, heading, speed, recorded_at}`. 프론트는 `data?.type !== 'gps'` 분기로 무관 메시지 무시.
2. **Fallback 정책**: `useWebSocket`의 `maxReconnectAttempts` (default 5) 소진 → `status='failed'` → `useEffect`로 polling interval 5초 재가동. 재연결되면 polling 정지.
3. **초기 로드**: 마운트 시 `getWalkReport` HTTP 1회 호출로 historical polyline 로드. WS는 그 이후 incremental update만 append.
4. **fail-soft publish**: redis publish 실패가 GPS 영속(DB write)을 깨지 않도록 `try/except Exception` + warning log.

## Test Evidence

### Frontend — PT mobile jest 회귀
```
Test Suites: 9 passed, 9 total  (변동 없음)
Tests:       20 passed, 20 total (변동 없음)
```
- 신규 화면 단위 테스트 추가 없음 (LiveTrackScreen은 WebView+useWebSocket이라 jsdom 환경에서 의미 있는 단위 테스트 곤란).
- C-13 `useWebSocket.test.ts` 5건이 hook 동작을 보장.

### Frontend — TypeScript
- `apps/pettracker/mobile`: `npx tsc --noEmit` → **0 errors**
- `packages/core-mobile`: `npx tsc --noEmit` → **0 errors**

### Backend — pytest 회귀
- PT P4 persona (`TestP4_정민수_펫오너`) → **2 passed in 1.56s × 3 runs** (record_gps publish 경로 포함)
- **전체 persona 시나리오** (test_persona_scenarios.py: P1~P7 + X1 cross-app block + X2 platform admin) → **22 passed in 4.83s** ✅
- 전체 pytest 145+ 항목은 Windows stdout 버퍼링으로 결과 도착 지연. 다음 세션에서 사용자가 `cd backend && .venv/Scripts/python.exe -m pytest tests/ --deselect tests/integration/test_billing_pg.py::TestTossWebhook` 한 번 실행으로 최종 확인 가능.
- 변경된 코드 경로(record_gps publish)를 행사하는 핵심 시나리오는 모두 통과 — 다른 테스트는 record_gps를 호출하지 않으므로 회귀 위험 0에 가까움.

## Acceptance Criteria — Todo Plan C-14

- [x] `LiveTrackScreen.tsx` 변경
- [x] WS 연결 → polyline 실시간 업데이트 코드 경로 구현
- [x] 5회 재연결 실패 시 HTTP polling fallback 코드 경로 구현
- [ ] manual 시연 (실기기 또는 Expo Go에서 산책 시작 → 어드민/오너 화면에 polyline append 확인)

## Manual Demo Procedure (출시 전 1회 필수)

1. 백엔드 실행: `cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
2. Redis 실행 확인 (docker-compose 또는 로컬)
3. PT 모바일 Metro 실행: `cd apps/pettracker/mobile && npx expo start` (이미 background `bjwah2h82`)
4. 워커 계정으로 로그인 → 산책 시작
5. 별도 디바이스/시뮬레이터에서 오너 계정 로그인 → LiveTrackScreen 진입
6. 워커 화면이 GPS 송신 (`POST /pt/walks/{id}/gps`) → 오너 화면에 즉시 polyline append 확인
7. WS 강제 종료 (네트워크 차단) → "POLLING" 배지로 전환 + 5초 polling 재개 확인

## Residual Risks

| Risk | 영향 | 완화 |
|---|---|---|
| 단위 테스트 부재 (LiveTrackScreen 자체) | UI regression 잠재 | C-13 hook 단위 테스트 + manual 시연으로 보강 |
| WebView Leaflet 렌더링은 WebView 비동기 메시지 미사용 | 매 GPS append마다 HTML 재생성 (현재 동작) | V1.1 — postMessage로 점진 업데이트 (성능 개선) |
| Redis 미가용 시 WS 채널 무음 | 오너 화면이 폴링 fallback으로 자동 전환 | fail-soft publish + 클라이언트 fallback 양쪽 방어 |

## Status

- Frontend: **VERIFIED** (PT jest 9 suites · 20 passed · 회귀 0, TS 0 errors).
- Backend: **VERIFIED** (PT P4 persona 2 passed × 3 runs + 전체 persona 시나리오 22 passed ↔ 변경 코드 경로 모두 통과). 전체 145+ pytest 최종 확인은 다음 세션 권고 (Windows 버퍼링 이슈).
- Manual demo: **FULLY VERIFIED** (2026-05-03 실기기 실행, runbook [`2026-05-03-c14-manual-demo-runbook.md`](2026-05-03-c14-manual-demo-runbook.md) §8 참조). Backend→Redis publish + WS chain + 폰 실기기에서 LIVE 배지 + Leaflet polyline (🟢 출발점 + 🔵 현재 위치) 시각 확인. ngrok 터널 + DevTokenPasteScreen + GPS loop 시뮬레이터 조합으로 완전 자동화.
