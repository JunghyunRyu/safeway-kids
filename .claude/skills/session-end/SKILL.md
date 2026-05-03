---
name: session-end
description: >
  세션 종료 전 STATE.md 업데이트, 핸드오프 패킷 생성, 메모리 반영 체크리스트를
  강제하는 스킬. "다음 세션이 이 세션 상태를 0초에 복원"할 수 있는 아티팩트를
  보장한다. session-start 스킬과 쌍으로 사용.

  사용 시점:
  - 세션 종료 직전: "/session-end" 또는 "마무리하자", "세션 정리"
  - 중요한 작업 단락에서 중간 저장 목적
  - 다른 사람에게 작업을 넘기기 전
  - 밀레스톤 클로저 직전
---

# Session End — 핸드오프 강제

## 목적
세션이 수확 없이 종료되는 것을 방지. 다음 세션 부트스트랩 비용을 0으로 유지.
CLAUDE.md Phase 8 (Session Handoff)의 규격을 강제한다.

## 실행 순서

### Step 1 — 이번 세션 변화 수집
사용자에게 다음을 묻거나 자동으로 파악:

1. **변경된 파일** (`git status`, `git diff --stat` 활용)
2. **실행된 주요 명령** (세션 대화의 bash 호출에서 추출)
3. **내린 의사결정** (세션 대화에서 추출, 사용자에게 확인)
4. **새로 발생한 blocker** (있다면)
5. **해소된 blocker** (있다면)

### Step 2 — Handoff Packet 생성
`artifacts/handoffs/YYYY-MM-DD-session-handoff.md` 파일 생성.

같은 날짜 파일이 이미 있으면 `YYYY-MM-DD-session-final-handoff.md`로 저장 (사용자는 관례적으로 이렇게 두 번 저장함).

**필수 섹션** (CLAUDE.md의 Phase 8 handoff 규격):

```markdown
# Session Handoff — YYYY-MM-DD

## Current Status
[한 문단: 오늘 어디까지 왔는가]

## Changed Files
- path/to/file1.md — [무엇을 바꿨나]
- path/to/file2.py — [무엇을 바꿨나]

## Commands Executed
- [bash command 1] — [결과]
- [bash command 2] — [결과]

## Tests and Outcomes
- [test suite]: PASS/FAIL/N/A
- [verification]: PASS/FAIL/N/A

## Decisions Made
- [decision 1]: [근거]
- [decision 2]: [근거]

## Open Issues / Blockers
- [blocker 1]: [상태]
- [blocker 2]: [상태]

## Next Exact First Step
[다음 세션이 첫 번째로 해야 할 단 한 가지]

## Residual Risks
- [risk 1] — [mitigation]
```

### Step 3 — STATE.md 업데이트
다음 필드를 갱신:

- [ ] `Last updated`: 오늘 날짜
- [ ] `Current phase`: 변경되었다면 업데이트
- [ ] `Active workstream`: 변경되었다면 업데이트
- [ ] `Next gate`: handoff의 "next step"과 일치시킴
- [ ] `Blockers`: 새로 생긴 것 추가, 해소된 것 제거
- [ ] `Latest Handoff`: 방금 생성한 handoff 파일 경로로 갱신

**정합성 체크**: CLAUDE.md "Active Work (Live)" 섹션도 동일하게 업데이트 필요 여부 확인.

### Step 4 — 메모리 업데이트 체크리스트
다음 중 해당하는 것이 있으면 사용자에게 메모리 업데이트 권고:

- [ ] 사용자 역할·선호·지식에 대한 **새로운 사실** → user memory
- [ ] 반복되어야 할 **방식·접근** (성공 또는 실패 경험) → feedback memory
- [ ] 프로젝트 상태·의사결정·스테이크홀더 **변화** → project memory
- [ ] 외부 시스템 위치·참조 **추가** → reference memory

해당 없으면 "메모리 업데이트 불필요" 명시.

권고 시 구체적 memory 파일 이름과 frontmatter를 제안 (사용자가 "그렇게 해"라고 하면 작성).

### Step 5 — 최종 확인 체크리스트
사용자에게 다음 5가지가 준비되었음을 확인:

```
🛬 세션 핸드오프 체크리스트

1. ✅ Handoff packet 작성됨
   → [파일 경로]

2. ✅ STATE.md 업데이트됨
   → Last updated: [날짜]
   → Next gate: [한 줄]

3. ✅ CLAUDE.md Active Work 섹션 정합
   → [업데이트됨 / 변경 불필요]

4. ✅ 메모리 업데이트
   → [완료: 파일명 / 불필요]

5. ✅ 다음 세션 첫 액션
   → [next step 한 줄]

🛬 Session safely handed off. 다음 세션에서 /session-start로 복원 가능.
```

## 원칙

1. **한 섹션도 건너뛰지 마라** — 모든 필수 섹션이 채워져야 한다.
2. **공백 허용** — 특정 섹션에 내용이 없으면 "N/A" 또는 "없음"을 명시 (skip 금지).
3. **Evidence 우선** — 테스트/명령 실행 결과가 있다면 그대로 기록. 없는 척 금지. 실패도 그대로.
4. **Stale하게 두지 마라** — 빼먹으면 다음 세션이 실패한다.
5. **사용자가 거부하면 명시적으로 기록** — 사용자가 "핸드오프 건너뛰자"고 하면 STATE.md에 "session ended without handoff" 기록 후 종료.
6. **Single-writer discipline** — STATE.md는 이 스킬만 쓴다. 다른 곳에서 건드리지 않는다.

## 실패 모드 대응

| 상황 | 대응 |
|------|------|
| `artifacts/handoffs/` 디렉토리 없음 | 생성 후 진행 |
| 같은 날짜에 이미 handoff 존재 | `-final-handoff.md` suffix로 저장 |
| git이 설치 안 됨 | changed files를 사용자에게 직접 묻기 |
| 사용자가 handoff 거부 | STATE.md에 명시적 기록 후 종료 |

## 관련 스킬
- `/session-start` — 다음 세션에서 이 핸드오프를 읽고 복원 (이 스킬과 쌍)
