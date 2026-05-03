# C-13 useWebSocket — Verification Report

- **Date**: 2026-04-30
- **Phase**: Phase 6 — Verification
- **Workstream**: Milestone C — PT 모바일 통합 트랙
- **Spec ref**: [`artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md`](../specs/2026-04-24-pt-quality-uplift-final-tech-spec.md) FR-4.x
- **Plan ref**: [`artifacts/plans/2026-04-24-pt-quality-uplift-todo-plan.md`](../plans/2026-04-24-pt-quality-uplift-todo-plan.md) C-13

## Implementation Summary

| Item | Path | Status |
|---|---|---|
| Hook source | `packages/core-mobile/hooks/useWebSocket.ts` | NEW (~210 LOC) |
| Re-export | `packages/core-mobile/index.ts` | UPDATED (+8 lines) |
| Test suite | `apps/pettracker/mobile/src/__tests__/useWebSocket.test.ts` | NEW (~210 LOC, 5 tests) |

## Design Decisions

1. **First-message auth (preferred)** — Server `negotiate_ws_auth` (`backend/app/middleware/ws_auth.py:101`) supports two flows; client uses first-message `{token}` to avoid leaking JWT in URL/access logs.
2. **Permanent close codes** — `4003` (forbidden) and `4404` (not found) immediately transition to `failed` (no reconnect). `4001` triggers one refreshAccessToken retry.
3. **Backoff cap** — `1s, 2s, 4s, 8s, 16s` capped at `30s`. After `maxReconnectAttempts` (default 5, per Todo Plan C-14 fallback policy) status becomes `failed`.
4. **Server ping ignored** — Server pings (`{"type":"ping"}`) are keep-alives; protocol-level pong is automatic. No app-level pong needed.
5. **Token refresh** — `refreshAccessToken()` invoked once before connect if no token, and once on close-code 4001.

## Test Evidence

### Unit tests (Jest)
```
PASS src/__tests__/useWebSocket.test.ts
  useWebSocket — first-message auth + reconnect
    √ connects, sends token, transitions to open after auth_ok
    √ forwards subsequent messages and ignores ping
    √ reconnects with exponential backoff on close
    √ reaches failed state after maxReconnectAttempts exhausted
    √ does not reconnect on permanent close codes (4003 forbidden)

Tests: 5 passed, 5 total
Time:  1.388 s
```

### Regression — full PT jest
```
Test Suites: 9 passed, 9 total  (was 8 passed)
Tests:       20 passed, 20 total (was 15 passed)
```
**Diff**: +1 suite (`useWebSocket.test.ts`), +5 tests, regression 0.

### TypeScript
- `packages/core-mobile`: `npx tsc --noEmit` → **0 errors**
- `apps/pettracker/mobile`: `npx tsc --noEmit` → **0 errors**

## Acceptance Criteria — Todo Plan C-13

- [x] 신규 파일 `packages/core-mobile/hooks/useWebSocket.ts`
- [x] 인증된 WS 연결 (first-message token 협상)
- [x] reconnect (지수 백오프 1s → 30s cap)
- [x] ping 처리 (서버 ping 무시, lastMessage에 미반영)
- [x] DoD: 단위 테스트 pass (5/5)

## Residual Risks

| Risk | 영향 | 완화 |
|---|---|---|
| RN runtime의 WebSocket 객체가 jest 환경과 동작 차이 | 실기기에서 reconnect 타이밍 차이 가능 | C-14 통합 테스트 + 실기기 manual 시연 (다음 단계) |
| `refreshAccessToken` 동시성 (다중 hook 인스턴스가 동시에 401 close 시) | 토큰 race condition | 핸들러 내 `refreshTriedRef` flag로 일회성 가드. 다중 hook은 V1.1 race-free 처리 후보. |
| WebSocket constructor throw가 RN/web에서 다른 error shape | `onErrorRef` 전달되는 메시지 비표준 | 호출 측은 status로 판단, error 메시지는 로그용으로만 사용 |

## Next Step

**C-14 — PT 모바일 LiveTrackScreen WS 통합** (`apps/pettracker/mobile/src/screens/owner/LiveTrackScreen.tsx`):
- 현재 5초 polling을 `useWebSocket`로 대체
- `pt:walk:{session_id}:updates` 토픽 구독 → polyline 실시간 업데이트
- `status === 'failed'` 시 HTTP polling fallback 자동 활성화
- DoD: manual 시연 (Metro bundle + 실기기 또는 Expo Go)

## Status

**VERIFIED** — C-13 완료. C-14 진입 가능.
