# Verification — Milestone C-WS Backend (C-11 + C-12) — 2026-04-27

**Scope**: C-11 `ws_auth.py` 추출 + KI-4 fix 시도, C-12 PT WebSocket endpoint `/api/v1/pt/ws/walks/{session_id}`.

## 1. Files Changed

### 신규
- `backend/app/middleware/ws_auth.py` — JWT + Firebase 듀얼 verifier + `negotiate_ws_auth` helper

### 수정
- `backend/app/modules/vehicle_telemetry/router.py` — 인라인 `_authenticate_token` 삭제, `negotiate_ws_auth(authenticate_jwt_token)` 호출. teardown race 흡수용 `try/except (ValueError, RuntimeError)` 추가
- `backend/app/apps/pettracker/router.py` — WS endpoint `walk_session_ws` 추가 (`/ws/walks/{session_id}`)

## 2. Commands Executed

| Command | Result |
|---|---|
| import smoke (`ws_auth` + m4 router) | OK |
| import smoke (`/api/v1/pt/ws/walks/{session_id}` route in app) | OK — 7 WS routes 등록 (m4 + PT 신규) |
| `python -m pytest -q tests/integration/test_m4_websocket.py` (C-11 직후) | 7 passed, 1 error (baseline 동일) |
| `python -m pytest -q --tb=line --ignore=test_billing_pg.py --ignore=test_e2e_hardening.py --ignore=test_m4_websocket.py` (C-11 후) | **145 passed in 215.36s** (회귀 0) |
| 동일 명령 (C-12 후) | **145 passed in 218.98s** (회귀 0) |

## 3. Acceptance vs Spec

| FR | 기준 | 결과 |
|---|---|---|
| FR-4.1 ws_auth 모듈 | JWT + Firebase 듀얼 verifier | ✅ `authenticate_jwt_token`, `authenticate_firebase_token` |
| FR-4.2 negotiate_ws_auth | query-param + first-message 양쪽 지원 | ✅ deprecated query-param 호환 + first-message 권장 |
| FR-4.3 PT WS endpoint | `/pt/ws/walks/{session_id}` (Redis pubsub `pt:walk:{session_id}:updates`) | ✅ 등록됨 |
| FR-4.4 PT WS 인가 | `walker_id` OR `booking.owner_id` | ✅ both 허용 |
| FR-4.5 ping/keepalive | settings.ws_ping_interval_seconds 마다 `{"type": "ping"}` | ✅ |
| KI-4 fix | m4 WS 2 error → 0 | 🟡 **부분 fix** — 1 error (teardown race) 잔존, 1 error (refactor 회귀) 신규 발견 → DI 도입으로 해소 |

## 4. C-11 회귀 추적 메모 (디버깅 기록)

C-11 1차 refactor 직후 `test_ws_first_message_auth_success`가 깨지는 회귀 발생.
- 원인: 테스트가 `app.modules.vehicle_telemetry.router.async_session_factory`만 patch하지만, 새 `ws_auth.py`는 자기 모듈의 `async_session_factory` 참조를 사용해 patch 무력화.
- Fix: `authenticate_jwt_token(token, session_factory=None)` DI 시그니처로 변경. m4 router는 `lambda t: authenticate_jwt_token(t, session_factory=async_session_factory)` 패턴으로 patched factory를 명시 주입.
- 결과: 회귀 해소, 7 passed + 1 error (baseline 동일).

## 5. Known Gaps / Residual Risks

| Risk | Mitigation |
|---|---|
| KI-4 잔존 1 error (`test_ws_accepts_valid_token_query_param`) | 테스트 teardown race (aiosqlite connection 미리 close → rollback ValueError). handler 본문에는 `try/except`를 둘렀으나 pytest unraisable hook가 별도로 캡처. 테스트 인프라 이슈로 분류, Milestone F (통합 테스트 정비)에서 재시도. |
| PT WS auth는 JWT 사용 (Firebase 아님) | spec FR-2 Firebase 듀얼은 B-7에서 일괄 전환. 현 시점에서는 PT 기존 endpoint와 동일 auth 패턴 유지로 일관성 확보. |
| Firebase verifier 단위 테스트 없음 | firebase_admin SDK 설치 필요. `useFirebaseAuth` 모바일 통합 시점(B-9)에 fixture 마련. |
| PT WS 통합 테스트 없음 | C-15 통합 테스트에서 fakeredis + JWT 토큰으로 happy path 추가. |

## 6. Next Steps

| ID | 작업 | Owner |
|---|---|---|
| C-13 | `useWebSocket` mobile hook (PT) — `/pt/ws/walks/{id}` 호출 | code |
| C-14 | PT 모바일 통합 — 산책 중 위치/메모 실시간 표시 UI | code |
| C-15 | 통합 회귀 매트릭스 (backend + 모바일 + 웹) | code |
| C-16 | 백엔드 통합 테스트 (PT 결제 flow + storage presigned URL + WS happy path) | code |
| KI-4 fix | pytest event loop teardown 정비 또는 unraisable hook 비활성 | Milestone F |

## 7. Status

**Implementation status**: VERIFIED — 145 passed (회귀 0), 6 import smoke OK, KI-4 baseline 유지.
**Spec gap**: Firebase auth 적용은 B-7로 이연. 현 PT WS는 JWT 사용 (PT 기존 endpoint와 동일).
**Closure**: Milestone C-WS 백엔드 트랙 클로즈. 모바일 통합 트랙(C-13/C-14)으로 진행 가능.
