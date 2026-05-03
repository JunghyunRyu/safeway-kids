---
name: session-start
description: >
  새 세션 시작 시 SafeWay Kids 프로젝트의 현재 상태를 0초에 복원하는 부트스트랩 스킬.
  STATE.md, CLAUDE.md Active Work, 최신 핸드오프, active brief, 관련 메모리를 순차적으로
  읽어 현재 진행 중인 작업·페이즈·블로커·다음 게이트를 요약한다. 사용자가 "어제 뭐 했지?"
  라고 물을 필요가 없게 만드는 것이 목표.

  사용 시점:
  - 새 세션 첫 호출: "/session-start" 또는 "작업 이어갈게", "어디까지 했지"
  - 오랜만에 repo에 돌아왔을 때
  - 컨텍스트가 흐려졌다고 느낄 때
  - 다른 사람에게 프로젝트 상태를 설명해야 할 때 (요약 생성)
---

# Session Start — 0초 컨텍스트 복원

## 목적
새 세션이 스스로 현재 맥락을 파악하도록 자동화. 사용자의 "다음 세션 첫 10분" 비용을 0으로.

## 실행 순서

### Step 1 — 상태 파일 읽기 (순서대로)
다음 파일들을 **순서대로** 읽는다:

1. **`STATE.md`** (repo root) — 현재 phase, active workstream, next gate, blockers
2. **`CLAUDE.md`** "Active Work (Live)" 섹션 — STATE.md와 정합성 검증용
3. **`memory/MEMORY.md`** — 메모리 인덱스 (이미 auto-load 되지만 명시적 확인)
4. **최신 핸드오프** — `artifacts/handoffs/` 디렉토리에서 가장 최근 날짜 파일 (Glob으로 발견)
5. **Active brief** — STATE.md의 `Active brief` 필드가 가리키는 파일 전체 읽기
6. **관련 memory** — STATE.md의 workstream과 관련된 memory 파일 (예: `safeway_sandbox_2026q2.md`)

### Step 2 — 정합성 체크 (Audit)
다음 항목을 검증:

- [ ] STATE.md의 `Last updated` 날짜가 **7일 이상 stale**이면 ⚠️ 경고 출력
- [ ] STATE.md의 **모든 경로**가 실제로 존재하는지 확인 (없으면 ❌ 알림)
- [ ] 최신 handoff의 "next exact first step"이 STATE.md의 `Next gate`와 **일치**하는지 확인
- [ ] CLAUDE.md "Active Work" 섹션이 STATE.md와 **정합**하는지 확인
- [ ] 불일치 발견 시: 사용자에게 명시적으로 질문하고 STATE.md 업데이트 여부 확인

### Step 3 — 상태 요약 출력 (400자 이내)
다음 포맷으로 출력:

```
## 📍 현재 상태

**진행 중**: [active workstream]
**Phase**: [current phase] — [phase name]
**Next gate**: [next gate 한 줄]
**마지막 세션**: [last handoff 날짜] — [한 줄 요약]
**현재 blockers**: [count]개
  - [주요 blocker 1]
  - [주요 blocker 2]
**오늘의 첫 액션**: [latest handoff의 next step]

⚠️ 경고 (있다면): [stale/missing path/inconsistency]
```

### Step 4 — 3개 옵션 제시
사용자가 선택할 수 있는 다음 작업 3개를 제안:

**(a)** 마지막 핸드오프의 "next exact first step" 그대로 진행
**(b)** 다른 workstream으로 전환 (STATE.md 변경 필요)
**(c)** 단순 탐색/질문 (state 변경 없음)

사용자가 선택하면 해당 경로로 진입. 사용자가 다른 요청을 하면 즉시 그 요청으로 전환 (옵션 강요 금지).

## 원칙

1. **파일을 실제로 읽어라** — 시스템 메시지의 컨텍스트만 믿지 말고 STATE.md를 반드시 Read.
2. **Stale 경고 누락 금지** — 7일 이상 업데이트 안 된 STATE.md는 반드시 경고.
3. **사용자 확인 없이 STATE.md 수정 금지** — 정합성 문제 발견 시 질문 먼저.
4. **400자 요약 준수** — 길게 늘어지면 사용자가 읽지 않는다. 핵심만.
5. **세션이 쿼리 목적이면 옵션 제시 skip 가능** — 사용자가 단순 질문 중이면 상태 요약만 하고 옵션은 제시하지 않아도 됨.

## 실패 모드 대응

| 상황 | 대응 |
|------|------|
| STATE.md 자체가 없음 | `.claude/rules/state-tracking.md` 참조 후 STATE.md 생성 제안 |
| Active brief 파일이 삭제됨 | 사용자에게 알리고 다음 active brief 지정 요청 |
| Latest handoff와 STATE.md 불일치 | 사용자에게 어느 쪽을 신뢰할지 질문 |
| 7일 이상 stale | 상태 요약과 함께 "오래된 정보" 경고 |

## 관련 스킬
- `/session-end` — 세션 종료 시 STATE.md + handoff 업데이트 (이 스킬과 쌍)
- `/sandbox-followup` — 샌드박스 관련 상세 작업 (session-start 이후 호출)
