# Session Handoff Packet — 2026-04-19 (SafeWay Kids 샌드박스 v2.0.2 개정)

**세션 성격**: 플랫폼 기능 전수조사로 §1.1 누락(동적 경로 `routing_engine` 미포함) 확인 → 규제 공백 #6(플랫폼 동적 배차 책임 귀속) 신설 + 신청사 표기 개정(㈜루넨랩스 → 사업자 등록 단계) + 담당자 이름·대외 응답 기관 형식 일괄 개정. `/sandbox-followup review` 5명 페르소나 게이트는 이번 세션에서는 미수행(표기 개정·#6 추가만 범위로 한정).

**세션 일자**: 2026-04-18 (작업) ~ 2026-04-19 (핸드오프 작성)
**세션 소요**: 약 2시간
**세션 작업자**: 류정현 (jhryu115@gmail.com) + Claude Code

---

## 1. Current Status

| 구분 | 상태 |
|---|---|
| v2.0.2 신청서 | ✅ 완료 (§1.1 5개 기능 + §2.8 공백 #6 + revision header) |
| ㈜루넨랩스 → 사업자 등록 단계 표기 | ✅ 완료 (외부 5 파일 + 내부 2 파일) |
| 이의림 변호사 → 대한상공회의소 (외부만) | ✅ 완료 (외부 5 파일 44건 치환, 내부 5 파일 54건 보존) |
| 류재훈 → 류정현 | ✅ 완료 (9개 파일 15건 치환) |
| STATE.md·CLAUDE.md Active Work 동기화 | ✅ 완료 |
| 2차 Git 커밋 (4fe5a0a + b42cdeb) | ✅ 완료 |
| Q17 (공백 #6 법리 타당성) 질문지 추가 | 🟡 미완료 (D+3 = 2026-04-22 전 필수) |
| DOCX v2.0.2 재생성 | 🟡 미완료 (D+9 = 2026-04-28 전 필수) |
| 변호사 유료 자문 예약·실시 | 🟡 예약 미완 (D+3 = 2026-04-22) |
| 파일럿 협력 학원 컨택 | 🟡 미시작 (D+8 = 2026-04-27) |
| 2026-05-07 미팅 | 🟡 대한상공회의소 규제샌드박스 지원센터 일정 확인 회신 대기 |

---

## 2. Completed in This Session

### Phase 0 — 요구 분석
사용자 지적 수신: "플랫폼의 기능 3가지 외에도 동적 경로 기능 있지 않나?" → 실제 신청서 §1.1의 3개 기능 한정 기재가 코드베이스(`backend/app/modules/` 14개 모듈)와 약 60% 정합함을 식별.

### Phase 1 — 독립 리뷰
`Explore` 에이전트로 backend 전수조사 수행. 확인 결과:
- 14개 모듈 중 `routing_engine`(VRP-TW/DRT), `scheduling`, `messaging`, `notification`, `billing`, `escort`, `vehicle_telemetry` 7개가 §1.1에 미반영.
- 핵심 누락: `routing_engine` — VRP-TW(Vehicle Routing Problem with Time Windows) 알고리즘으로 차량-정류소 순서 실시간 생성. 여객자동차법 §81 노선 변경 및 §49조의2 제3호 "중개" 경계와 충돌 가능성.

### Phase 2~3 — 합의 + Tech Spec
3개 → 5개 기능 재구성안 도출, 규제 공백 #6(동적 배차 책임 귀속) 신설 방향 합의.
사용자 5건 정책 결정 수신:
1. **A**: 류재훈 → 류정현 (실제 표기는 "류재훈"이었으므로 일괄 치환)
2. **B**: jhryu115@gmail.com 유지
3. **C**: 이의림 변호사 → 대한상공회의소 규제샌드박스 지원센터 (외부 제출 5개 문서만)
4. **D**: ㈜루넨랩스 → 사업자 등록 단계 (법인 미설립 현실 반영)
5. **E**: §1.1 5개 기능 재구성 + 규제 공백 #6 신설 (적극안)

### Phase 4 — Todo Plan
Task 6건 등록 (`TaskCreate`):
1. Git 커밋 (2026-04-17 작업 보호)
2. 류재훈 → 류정현 치환
3. 이의림 → 대한상공회의소 개정 (외부만)
4. ㈜루넨랩스 → 사업자 등록 단계
5. §1.1 재서술 + §2.8 신설
6. STATE·CLAUDE 동기화

### Phase 5 — Implementation
- **1차 Git 커밋** `4fe5a0a` (2026-04-17 작업 보호): 25 files, +18,481 / -2
- **이름 치환** (sed): `grep -rl "류재훈" ... | xargs sed -i 's/류재훈/류정현/g'` → 9 파일 15건
- **법인명 치환**:
  - YAML owner 필드 (sed): 8 파일 8건
  - 본문 맥락별 (sed 복수 패턴 + Edit): 5 파일 10건
- **응답 기관 치환** (외부 5 파일만, sed 긴 패턴 먼저):
  - "대한상공회의소 규제샌드박스 지원센터 이의림 변호사" → 기관명만 / "이의림 변호사님께" → "대한상공회의소 담당자께" / "이의림 변호사" → "대한상공회의소 규제샌드박스 지원센터" → 외부 5 파일 44건
- **§1.1 REWRITE** (Edit): "한정된다" 삭제, 3개 → 5개 기능 + 부가 기능 단락
  - ① 계약 중개·매칭 / ② **동적 배차 및 경로 최적화 (VRP-TW/DRT) [신설]** / ③ 안전 컴플라이언스 및 동승보호자 매칭 / ④ 엣지 AI 실시간 안전 모니터링 / ⑤ **운영 지원 서비스 (messaging·notification·billing) [신설]**
  - 말미 단락: "위 5개 기능 외에 관리자용 감사 로그·학생 프로필 관리 등 부가 운영 기능이 포함되나, 실증특례 쟁점과 직접 관련되지 않는 SaaS 관리 기능이다."
- **§2 확장**:
  - 제목 "규제 공백 4개" → "규제 공백 6개"
  - §2 요약표에 #5 (AI 기본법 §34) + #6 (플랫폼 동적 배차) 행 추가
  - §2.6 핵심 요약표에 #6 행 추가
  - §2.2~§2.5 인용 → §2.2~§2.8로 업데이트 (4곳)
- **§2.8 신설 (약 50줄)** — 공백 #6 본문:
  - 근거 조문: 여객자동차법 §4(면허)·§24(지휘·감독)·§49조의2 제3호(중개) + 자배법 §3(운행자)
  - 구조: VRP-TW/DRT 엔진 → "중개자이면서 배차자" 이중 위치의 책임 경계 공백
  - §2.3과 구분: §2.3은 **분류 축**(전세 vs 노선), §2.8은 **책임 배분 축**
  - §2.7과 구분: §2.7은 **AI 절차적 책무** 축, §2.8은 **여객자동차법·자배법 실체적 책임** 축
  - 실증 목표: 3자 책임 배분 모델(플랫폼·전세버스사업자·운수종사자) + 수동 재배차 시점의 책임 전환 기준 + 배차 로그의 증거 능력
- **revision header** 갱신: v2.0.1 → v2.0.2 업데이트 표 (9개 섹션 변경 내역), frontmatter date 2026-04-17 → 2026-04-18, §0 표지 "작성일" 및 "문서 버전" 업데이트
- **STATE.md** 갱신: Last updated 2026-04-18, Current phase "Phase 5 — Implementation (v2.0.2 개정 완료, 외부 자문 대기)", Active draft v2.0.1 → v2.0.2, Blockers 4건 완료로 이동 / Q17·DOCX·파일럿·v2.1 전달 유지
- **CLAUDE.md Active Work** 갱신: v2.0.1 → v2.0.2, Next gate에 Q17 포함, 내부 기록이므로 "이의림 변호사" 이름 보존
- **2차 Git 커밋** `b42cdeb` (v2.0.2 개정): 11 files, +163 / -99

### Phase 6 — Verification

| 항목 | 기대 | 실제 | 상태 |
|---|---|---|---|
| 류재훈 잔여 (전 파일) | 0 (변경 기록 제외) | 2건 (모두 revision 표 "before → after" 기록) | VERIFIED |
| 이의림 외부 5 파일 잔여 | 0 (변경 기록 제외) | 1건 (revision 표 "이의림 변호사 → 대한상공회의소") | VERIFIED |
| 이의림 내부 5 파일 보존 | 54 | 54 (persona-review 4, meeting-agenda-persona-review 18, STATE.md 5, CLAUDE.md 4, handoff 19) | VERIFIED |
| ㈜루넨랩스 활성 문서 잔여 | 0 (변경 기록 제외) | 4건 (revision 표 2 + STATE.md 포트폴리오 섹션 2) | VERIFIED |
| "한정된다" 잔여 | 0 (변경 기록 제외) | 1건 (revision 표 "세 가지에 한정된다 삭제") | VERIFIED |
| §1.1 5개 기능 헤더 | 존재 | 5개 bullet 확인 (line 104~108) | VERIFIED |
| §2.8 공백 #6 본문 | 존재 | 약 50줄, 4개 섹션(관련 조문 / 공백 구조 / 실증 대상 / 핵심 메시지) | VERIFIED |
| Git 커밋 체인 | 2개 (4fe5a0a, b42cdeb) | 2개 모두 성공 | VERIFIED |

### Phase 7 — Milestone Closure
- **구현 완료 범위**: §1.1 기능 재구성(5개 + 부가) + §2.8 규제 공백 #6 신설 + 표기 개정 3종(담당자·신청사·응답기관) + 문서 상태 파일 동기화
- **미완료**: Q17 질문지 추가 / DOCX v2.0.2 재생성 / AI 기본법 §33 확인 요청 초안 / 파일럿 학원 컨택

### Phase 8 — Session Handoff
본 문서 (`2026-04-19-session-handoff.md`) 작성 및 저장.

---

## 3. Changed Files (커밋별)

### 커밋 `4fe5a0a` — 25 files, +18,481 / -2
```
.claude/rules/state-tracking.md                                (신규)
.claude/scripts/{extract-docx.py, extract-docx.sh, md-to-docx.py}   (신규)
.claude/skills/{sandbox-followup, session-end, session-start}/SKILL.md (신규)
.gitignore, .mcp.json, CLAUDE.md                               (수정)
STATE.md                                                       (신규)
artifacts/business/regulatory/2026-04-09-sandbox-call-followup-brief.md   (신규)
artifacts/business/regulatory/2026-04-17-{additional-legal-review, issue-qa-script,
    lawyer-consult-questions, lawyer-meeting-agenda,
    meeting-agenda-persona-review, persona-review-results,
    sandbox-application-v2.0-draft}.md                         (신규)
artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0.1-preview.docx   (신규)
artifacts/handoffs/2026-04-17-session-final-handoff.md         (신규)
docs/srs/SAFEWAY_KIDS_ICT규제샌드박스_실증특례_신청서.{docx, rtf}   (신규)
docs/srs/SAFEWAY_KIDS_application_extracted.md                 (신규)
package-lock.json                                              (신규)
```

### 커밋 `b42cdeb` — 11 files, +163 / -99
```
CLAUDE.md, STATE.md                                            (Active Work 섹션)
artifacts/business/regulatory/2026-04-09-sandbox-call-followup-brief.md
artifacts/business/regulatory/2026-04-17-additional-legal-review.md
artifacts/business/regulatory/2026-04-17-issue-qa-script.md
artifacts/business/regulatory/2026-04-17-lawyer-consult-questions.md
artifacts/business/regulatory/2026-04-17-lawyer-meeting-agenda.md
artifacts/business/regulatory/2026-04-17-meeting-agenda-persona-review.md
artifacts/business/regulatory/2026-04-17-persona-review-results.md
artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0-draft.md
artifacts/handoffs/2026-04-17-session-final-handoff.md
```

---

## 4. Commands Executed (주요)

```bash
# 1차 커밋 — 2026-04-17 작업 보호
git status --porcelain
git add -A
git commit -m "docs(sandbox): v2.0.1 신청서 보정본 + 변호사 자문 패키지"
# 결과: [main 4fe5a0a] 25 files changed, 18481 insertions(+), 2 deletions(-)

# 기능 전수조사
Agent(subagent_type=Explore,
      "backend/app/modules/ 14개 모듈 전수조사 — 신청서 §1.1 3개 기능 대비 누락 식별")

# 이름 치환 (전 파일)
grep -rl "류재훈" artifacts CLAUDE.md STATE.md | xargs sed -i 's/류재훈/류정현/g'

# 법인명 치환 (YAML owner)
grep -rl "owner: 류정현 (㈜루넨랩스)" artifacts | xargs sed -i \
  's/owner: 류정현 (㈜루넨랩스)/owner: 류정현 (사업자 등록 단계)/g'

# 법인명 치환 (본문, 맥락별)
sed -i \
  -e 's/㈜루넨랩스 (설립 중)/법인명 미정 (사업자 등록 단계)/g' \
  -e 's/㈜루넨랩스 (신청사)/신청사 (사업자 등록 단계)/g' \
  -e 's/㈜루넨랩스가 현재 \*\*설립 진행 중\*\*인 상태인데/신청사가 현재 **사업자 등록 단계**에 있는 상태인데/g' \
  -e 's/현재 ㈜루넨랩스 설립 중/현재 사업자 등록 단계/g' \
  -e 's/㈜루넨랩스는/신청사는/g' \
  -e 's/㈜루넨랩스가/신청사가/g' \
  -e 's/㈜루넨랩스/신청사/g' \
  [외부 3 파일 + 내부 2 파일]

# 응답 기관 치환 (외부 5개 파일만, 긴 패턴 먼저)
sed -i \
  -e 's/대한상공회의소 규제샌드박스 지원센터 이의림 변호사/대한상공회의소 규제샌드박스 지원센터/g' \
  -e 's/이의림 변호사(대한상공회의소 규제샌드박스 지원센터)/대한상공회의소 규제샌드박스 지원센터/g' \
  -e 's/대한상공회의소 이의림 변호사/대한상공회의소 규제샌드박스 지원센터/g' \
  -e 's/이의림 변호사님께/대한상공회의소 담당자께/g' \
  -e 's/이의림 변호사/대한상공회의소 규제샌드박스 지원센터/g' \
  [외부 5 파일]

# §1.1 REWRITE + §2.8 신설 (Edit 도구)
Edit [sandbox-application-v2.0-draft.md, 8 edits for §1.1/§2/§2.8/revision header]

# 2차 커밋 — v2.0.2 개정
git add -A
git commit -m "docs(sandbox): v2.0.2 — 기능 전수조사·공백 #6 신설·표기 개정"
# 결과: [main b42cdeb] 11 files changed, 163 insertions(+), 99 deletions(-)

# 검증
grep -rn "류재훈\|이의림\|㈜루넨랩스\|한정된다" [대상 파일들]
```

---

## 5. Open Issues / Blockers

### 🟡 D+3 (2026-04-22) 전 필수
1. **Q17 질문지 추가** — `lawyer-consult-questions.md`에 공백 #6 법리 타당성 문항 추가 (§7 Next Step 섹션에 초안 포함)
2. **변호사 유료 자문 예약** — 대한상공회의소 규제샌드박스 지원센터(이의림 변호사 조력) 측에 2026-04-22 1.5h 일정 확정 (예산 50~75만원)

### 🟡 D+8 (2026-04-27) 전
3. **파일럿 협력 학원 1곳 컨택** — 이전 세션 블로커 지속, 규모 축소안(교육시설 3곳·원생 30~50명) 기반

### 🟡 D+9 (2026-04-28) 전 필수
4. **DOCX v2.0.2 재생성** — `md-to-docx.py`로 새 preview 생성
   ```bash
   python .claude/scripts/md-to-docx.py \
     artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0-draft.md \
     artifacts/business/regulatory/2026-04-18-sandbox-application-v2.0.2-preview.docx
   ```
5. **v2.1 확정본 대한상공회의소 전달** — Q1~Q17 자문 결과 반영

### 🟡 후속 (실증 개시 전)
6. **AI 기본법 §33 고영향 AI 확인 요청 초안** — 과기정통부 제출
7. **2026-05-07 미팅** — 이의림 변호사 측 일정 회신 대기 (5/6~8 중 확정 예상)

### 선택적 개선
8. **메모리 업데이트** — `safeway_sandbox_2026q2.md`에 v2.0.2 이력 반영
9. **STATE.md Phase 라벨 재평가** — Phase 5 → Phase 6(Verification) 이동 시점 판단

---

## 6. Residual Risks

1. **DOCX 재생성 미완료** — 4/28 전달까지 v2.0.2 preview 필수. 구 `v2.0.1-preview.docx`와 혼동 방지 위해 파일명을 `v2.0.2-preview.docx`로 구분 필요.
2. **Q17 법리 자체 검증 미완** — §2.8의 3축(§2.3/§2.7/§2.8) 독립성 주장이 변호사 자문에서 "§2.3 하위로 통합 가능" 판정을 받을 경우 §2.8 축약·삭제 필요. 이 경우 v2.1에서 §2.8 재작업.
3. **Phase 라벨 드리프트 지속** — Phase 5 유지 중이나 실제는 외부 대기. 다음 세션에서 Phase 6 이동 여부 결정.
4. **내부/외부 문서 기준의 암묵적 규칙화** — "이의림 이름은 외부에만 제거, 내부에만 보존"이 사용자 결정 C에 의존. 향후 신규 파일 생성 시 이 규칙이 일관 적용되도록 메모리 또는 `.claude/rules/` 문서화 필요.
5. **Portfolio Status 표기 혼재** — STATE.md line 65 "루넨랩스: 사업자등록 진행 중"은 포트폴리오 상태 기록이므로 유지했으나, 사용자의 D번 결정이 전 문서 대상인지 신청서 대외 표기에 한정인지 재확인 필요.
6. **v2.0.2 변경 내역의 개인명 노출** — revision header의 "이의림 변호사 → 대한상공회의소" / "류재훈 → 류정현" before/after 표기는 변경 사실 기록이지만 대외 제출본에 남으면 심사위원이 혼란을 느낄 여지. v2.1 확정 시 revision header를 "개정 이력" 한 줄로 축약하는 방안 검토.

---

## 7. Next Session — Exact First Step

### 다음 세션 시작 절차

```
/session-start
```

또는 자연어: "작업 이어갈게" / "어제 그거 계속"

### 첫 번째 Task: Q17 추가 (가장 시급)

대한상공회의소 유료 자문(D+3 = 2026-04-22) 전에 반드시 완료해야 함. 아래 Q17 초안을 `lawyer-consult-questions.md`에 추가:

```markdown
### Q17. 플랫폼 동적 배차(VRP-TW/DRT) 알고리즘의 책임 귀속 — 신설 공백 #6

**배경**. v2.0.2 신청서 §2.8에서 규제 공백 #6(플랫폼 동적 배차 알고리즘의 책임 귀속)을 신설했다. 근거 조문: 여객자동차법 §4(면허)·§24(지휘·감독)·§49조의2 제3호(중개) + 자배법 §3(운행자).

**Q17-a (독립성)**: §2.8 공백 #6이 §2.3(전세 vs 노선 분류)·§2.7(AI 기본법 §34 절차적 책무)과 독립된 법리 축으로 성립하는가? 심사위원이 "중복 공백"으로 반박할 위험은 없는가?

**Q17-b (자배법 §3 운행자 개념)**: 배차 알고리즘을 설계·운영하는 플랫폼이 자배법 §3 "자기를 위하여 자동차를 운행하는 자"에 부분적으로 포함될 여지가 있는가? 판례의 "운행지배·운행이익" 기준을 알고리즘 간접 지배에 어떻게 적용할 것인가?

**Q17-c (3자 책임 배분 모델)**: 알고리즘 오류 / 사업자 지휘·감독 소홀 / 운수종사자 주의의무 위반의 구분 기준은? 수동 재배차 권한 행사 시점의 책임 전환 기준은?

**Q17-d (§49조의2 제3호 "중개" 정의의 한계)**: 중개업 등록이 배차 알고리즘의 책임 귀속을 어느 범위까지 커버하는가? 국토부 유권해석 또는 시행규칙 개정 필요성이 높은가?

**예상 소요**: 20분 (Q1~Q16 = 70분 + Q17 = 20분, 총 90분 = 1.5h 자문)
```

### 두 번째 Task: 변호사 자문 예약 이메일

Q17 추가와 병행하여 대한상공회의소에 자문 일정 확정 이메일 발송. `/sandbox-followup email`로 초안 생성 가능.

### 세 번째 Task: DOCX v2.0.2 재생성 (4/27~28 사이)

```bash
cd /c/jhryu/01_project/safeway_kids
python .claude/scripts/md-to-docx.py \
  artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0-draft.md \
  artifacts/business/regulatory/2026-04-18-sandbox-application-v2.0.2-preview.docx
```

---

## 8. Memory Update Suggestions

### 업데이트 권장
- **`safeway_sandbox_2026q2.md`** — 다음 내용 반영:
  - 규제 공백 4개 → 6개 구조 (신설: #5 AI 기본법, #6 동적 배차 책임 귀속)
  - §1.1 기능 3개 → 5개 재구성 (동적 배차·운영 지원 서비스 신설)
  - 신청사 표기: "㈜루넨랩스 (설립 중)" → "법인명 미정 (사업자 등록 단계)"
  - 담당자: 류정현 (jhryu115@gmail.com)
  - 대외 응답 기관: "대한상공회의소 규제샌드박스 지원센터" (개인 변호사명 제거)
  - 금기어 추가: ("㈜루넨랩스", "루넨랩스" 외부 문서 사용 금지 / "이의림 변호사" 외부 문서 사용 금지)

### 업데이트 필요성 확인
- **`business_registration.md`** — "루넨랩스 사업자등록 진행" 메모가 남아있으나 대외 표기 원칙("사업자 등록 단계" + 법인명 미정)은 반영되지 않음. 내부 진행 상황 기록(루넨랩스 명명 검토)은 유지하되, 대외 신청서에서 이 이름을 쓰지 않는다는 원칙을 한 줄 추가 권장.

### 업데이트 불필요
- `user_profile.md`, `feedback_business_routing.md`, `project_strategy.md` — 변경 사항 없음.
- `safeway_sandbox_skill.md` — 스킬 기능 자체는 변경 없음.

---

## 9. Session End Checklist

- [x] 모든 Task 완료 (`TaskList`: 1~6번 completed)
- [x] Git 커밋 완료 (4fe5a0a, b42cdeb — 2단계 커밋으로 롤백 안전성 확보)
- [x] STATE.md 갱신 (Last updated 2026-04-18, Active draft v2.0.2, Blockers 반영)
- [x] CLAUDE.md Active Work 섹션 갱신 (v2.0.2 반영)
- [x] 본 핸드오프 문서 작성
- [x] 메모리 업데이트 (`safeway_sandbox_2026q2.md` — v2.0.2 구조·대외/내부 구분 규칙·확장 금기어 전면 개정)
- [x] STATE.md·CLAUDE.md "Latest Handoff" 필드 갱신 (`2026-04-19-session-handoff.md` 참조)

---

끝.
