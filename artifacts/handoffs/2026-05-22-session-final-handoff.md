# Session Handoff — 2026-05-22 (final)

> P1-1 mobile tsc 검증 + P1-2 ai 모듈 스켈레톤 구현 세션.
> 같은 날 1차 핸드오프: [`2026-05-22-session-handoff.md`](2026-05-22-session-handoff.md) (12일 갭 cleanup + 3대 결정 anchor).
> 본 세션은 그 핸드오프의 "Next Exact First Step"(P1-1)을 실행하고 P1-2까지 진행.

## Current Status

`/session-start` → 사용자 옵션 (a) "핸드오프 next step 진행" 선택 → **P1-1 완료** → 옵션 (a) "P1-2 착수" 선택 → **P1-2 완료** → 옵션 (b) "여기서 종료" 선택. 6/15까지 슬라이스 트랙 P1-1·P1-2 두 건이 한 세션에 완료됐고, 남은 슬라이스는 P1-3(WalkPhoto 마이그 + PortOne v2 mock) 하나. Phase는 여전히 Phase 7(Milestone Closure 대기) — 1R 결과 외부 위임 상태 변화 없음. 코드 회귀 0, 비용 0(외부 SDK·API 호출 0), burnout 0 원칙 준수.

## Changed Files

### 신규 (P1-2 ai 모듈 — 7 파일)
- `backend/app/modules/ai/__init__.py` — 모듈 마커 + Tech Spec 포인터
- `backend/app/modules/ai/base.py` — `AbstractLlmClient` ABC, `LlmResponse`/`LlmCost` dataclass, 에러 계층(`LlmError`/`LlmClientNotProvisioned`/`LlmCostExceeded`), `Tier` Literal, 순수 함수 `decide_tier()`
- `backend/app/modules/ai/stub.py` — `StubLlmClient` (invoke/invoke_vision 호출 시 `LlmClientNotProvisioned` raise, P2-2 안내 메시지 포함)
- `backend/app/modules/ai/factory.py` — `get_llm_client()` FastAPI 의존성, `pt_llm_use_stub` 게이트 + belt-and-suspenders
- `backend/app/modules/ai/cost/__init__.py` — cost 서브패키지 마커
- `backend/app/modules/ai/cost/redis_cost_counter.py` — `RedisCostCounter` (월별 `pt:llm:cost:{YYYY-MM}` 키 + 32일 TTL, **production-ready 실 구현**, stub 아님)
- `backend/tests/unit/test_ai_stub_and_cost.py` — 단위 테스트 19건

### 변경
- `backend/app/config.py` — AI env 8개 추가 (anthropic/openai key, primary_provider, monthly_cost_cap_krw=2,000,000, haiku_threshold_pct=80, pt_llm_use_stub=true, fallback/vision timeout). production validator gate는 의도적으로 미추가 (키는 P2-2까지 optional)
- `STATE.md` — v9 → v11 (P1-1 PASS / P1-2 PASS anchor, blocker 해소, Critical Path 갱신)
- `CLAUDE.md` — Active Work mirror 동기화 (mobile tsc blocker 해소, 슬라이스 진척, 검증 수치 207 passed 갱신)

### Memory (repo 외부, ~/.claude/...)
- `feedback_npm_workspace_hoisting_diagnosis.md` (신규) + `MEMORY.md` 인덱스 1줄

## Commands Executed

| 명령 | 결과 |
|---|---|
| `cd mobile && npm install` | ✅ "up to date, audited 956 packages" |
| `npx tsc --noEmit` (from `mobile/`) | ✅ **0 errors** (typescript 5.9.3, 루트 node_modules 호이스팅) |
| `pytest tests/unit/test_ai_stub_and_cost.py -v` | ✅ **19/19 passed** (5.05s) |
| `pytest --tb=line -q` (전체 백엔드) | **207 passed / 3 failed** (247.95s) — 3 fail = KI-2 Toss webhook 기존 |
| `git status` / `git config core.autocrlf` | `main` 브랜치, HEAD 35fe44b, autocrlf=input (trap 복구 유지) |

## Tests and Outcomes

- P1-1 mobile tsc (`npx tsc --noEmit`): **PASS** (0 errors)
- P1-2 신규 단위 테스트 19건: **PASS** (19/19)
- 백엔드 전체 회귀: **PASS** (회귀 0). 207 passed / 3 failed.
  - 3 failed = `TestTossWebhook::{test_webhook_updates_payment_status, test_webhook_empty_payload_ignored, test_webhook_unknown_payment_key_ignored}` — 전부 **KI-2** (TOSS_WEBHOOK_SECRET 미설정). P1-2 변경분과 무관.
  - KI-3 (health degraded) / KI-4 (WS teardown race) 이번 run 미발현 (flaky).
- baseline 산수: 207 − 19(신규) = 188 ≈ 직전 핸드오프 187 (±1 표류). **회귀 0 확정**.

## Decisions Made

- **SD-1 — P1-1 "lock mismatch" 진단은 오진으로 판명**: 핸드오프가 "mobile tsc 환경 lock mismatch (30분 복구)"라 했으나, 실제로는 npm workspace hoisting 정상 동작. `mobile/node_modules/typescript`는 부재가 정상이고 루트 `node_modules/typescript@5.9.3`에 호이스팅됨. `npx tsc --noEmit` 0 errors PASS. 30분 예상 작업이 실질 0분. `--force`/`npm ci` 같은 destructive 복구 명령을 돌리기 전 1차 증거 확인이 정답이었음 → memory `feedback_npm_workspace_hoisting_diagnosis.md`에 박음.
- **SD-2 — P1-2는 인터페이스 골격 + cost counter 실 구현으로 분리**: LLM client는 stub(`LlmClientNotProvisioned` raise), cost counter는 Redis만 필요하므로 production-ready 실 구현. 근거: cost counter는 P2-2가 와도 그대로 호출되는 코드 → 지금 짜도 버려지지 않음(burnout 0 원칙).
- **SD-3 — 외부 SDK(anthropic/openai/tenacity) pyproject.toml 미추가**: stub은 SDK 불요. ABC가 freeze돼 있어 P2-2에서 `AnthropicLlmClient` 파일 1개 + factory 2줄로 plug-in 가능. 지금 SDK를 추가하면 OpenAI 결제 미해결 상태에서 의미 없는 의존성 부피만 증가.
- **SD-4 — config production validator gate 미추가**: anthropic/openai 키는 P2-2까지 optional 유지. P2-2가 실 endpoint를 wire할 때 validator gate 추가 예정.
- **사용자 결정 — 세션 종료 (옵션 b)**: P1-3는 다음 세션. P1-1·P1-2를 한 커밋으로 묶어 종료.

## Open Issues / Blockers

### 해소됨 (이번 세션)
- ✅ ~~mobile tsc 환경 lock mismatch~~ — 오진. P1-1 검증 PASS.

### 유지 (외부 의존, action 불가)
- 🟡 1R 결과 안내 대기 (~7월 말, 프라이머/운영기관)
- 🟡 OpenAI 결제 보류 — Track 2 LLM 실 호출 unblock 의존. 6/15 본업 종료 후 (P2-1)
- 🟡 PortOne 사업자 계정 — 1R 통과 후 사업자등록 → 계약 순서

### 유지 (기술 부채, 6/15까지 슬라이스)
- 🟡 P1-3 — WalkPhoto 마이그레이션 + PortOne v2 인터페이스(mock). 유일하게 남은 슬라이스.

### 동결
- ⏸ SafeWay 샌드박스 v2.2 (D-7) / CareConnect 차회 사이클

### 의사결정 대기
- 🔴 #33 (P3-별도) SDET Code 외국인 prospect 재가동 vs 운영비 trade-off

### Known Issues (출시 critical path 무관)
- KI-2 TOSS_WEBHOOK_SECRET 미설정 → Toss webhook 3 fail (이번 run 재현)
- KI-3 health degraded / KI-4 WS teardown race — 이번 run 미발현, flaky 카테고리

## Next Exact First Step

P1-3 착수 — WalkPhoto 모델 + Alembic 마이그레이션 (사진 캡션 축 B 인프라) + PortOne v2 인터페이스(mock).

```
1. Tech Spec 재독: artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md
   §4.2 FR-B2 (WalkPhoto 모델) + §16 Migration Plan
2. backend/app/apps/pettracker/models.py 에 WalkPhoto 모델 추가
   (id, session_id FK, s3_key, caption, caption_status enum, condition, created_at)
3. alembic revision --autogenerate → drop 검토 (feedback_alembic_autogenerate_review.md 룰 준수)
4. PortOne v2 인터페이스 스켈레톤 (mock) — 사업자 계정 발급 전이므로 호출부 없는 인터페이스만
5. 단위 테스트 + alembic upgrade head 검증
```

P1-3 완료 시 6/15까지 슬라이스 트랙 전체 완주 → 6/15 이후 P2 (OpenAI 결제 → Track 2 LLM 실 구현 → PT V1.0 출시).

## Residual Risks

- **R-1 (HIGH)** 신청서 §4 "6/9 출시" 약속 vs 실제 7월 말~8월 초 → 1R 통과 후 멘토링 단계 setback 사유 설명 필요. (변화 없음)
- **R-2 (MED)** 1R 미통과 시 자금 lag 4~6개월 → 7월 modoo 차회 fallback. (변화 없음)
- **R-3 (MED)** 1인 burnout signal → 6/15까지 슬라이스가 본업 압박 가중 시 즉시 중단·이월. P1-3는 1.5~2시간 단위라 한 슬롯에 끝남.
- **R-4 (LOW, NEW)** P1-2 factory belt-and-suspenders(`PT_LLM_USE_STUB=false`여도 stub 반환)를 P2-2에서 제거해야 함. 코드 주석·본 핸드오프에 명시됨 → 망각 위험 낮음.
- **R-5 (LOW, NEW)** `decide_tier`가 `cap_krw<=0`을 "cap 없음"으로 해석 → P2-2에서 settings validator로 cap>0 강제 권장. 현재 stub이라 노출 위험 0.

## Bootstrap on next session

다음 세션 `/session-start` 입력 시:
1. STATE.md (v11) 자동 로드 → P1-1·P1-2 ✅ 확인
2. 본 핸드오프(`-final-handoff.md`) 자동 로드 → "Next Exact First Step"(P1-3) 실행
3. 사용자 본업 압박 self-report 후 P1-3 슬라이스 슬롯 가능 여부 판단
