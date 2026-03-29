# Consensus Matrix: WebSocket 연결 끊김 수정

**Date:** 2026-03-17
**Phase:** 2 — Consensus

---

## Issue Agreement

| Item | E2E Test | Requirement Analyst | Consensus |
|------|----------|---------------------|-----------|
| ngrok 경로 정상 | CONFIRMED (Python WS 성공) | 동의 — 인터스티셜 가설 하향 | ngrok은 원인 아님 |
| proxy.js WS 라우팅 | CONFIRMED (직접 테스트 통과) | — | proxy 수정 완료, 정상 |
| Token 경쟁 조건이 최유력 원인 | 코드 경로 확인 | **강력 동의** — 4001+NO_RETRY가 가장 위험 | **주 원인으로 채택** |
| Token 만료 미처리 | HTTP만 refresh | **동의** — WS에 refresh 없음 | 수정 필요 |
| HTTP 폴링 fallback | — | **권장** — 진단 도구 겸 대안 | 구현 |

## Solution Selection

| Solution | Decision | Rationale |
|----------|----------|-----------|
| A: ngrok 인터스티셜 우회 | REJECT | E2E 테스트로 원인 아님 확인 |
| B: User-Agent 변경 | REJECT | 불필요 |
| **C: HTTP 폴링 fallback** | **ADOPT** | WS 실패 시 자동 전환, 안정성 보장 |
| D: 직접 IP 연결 | REJECT | 네트워크 제약 |
| E: SSE 대체 | DEFER | 과잉 변경 |
| **F: Token 검증 + 4001 refresh 재시도** | **ADOPT (PRIMARY)** | 근본 원인 직접 해결 |

## Final Approach

1. **Primary Fix**: WS 연결 전 토큰 유효성 검증 + 4001 시 refresh 후 1회 재시도
2. **Secondary Fix**: HTTP 폴링 fallback (WS 3회 실패 시 자동 전환)
3. **UX Fix**: 연결 상태 세분화 (인증 실패 / 재시도 중 / 운행 없음 / 연결됨)
