# SafeWay Platform — Current State (Live)

> Single source of truth — "what is happening right now". `/session-start`·`/session-end`로 동기화.
> 마일스톤 이력 = `artifacts/reports/` / 세션 이력 = `artifacts/handoffs/` / **6/4 이전 상세(D-1~D-10, GPS·UX 조치, Critical Path)는 git `96bf792`의 STATE.md v16 참조.**

**Last updated**: 2026-10-05 (v18 — 발표 시점 확인, 협회 인용 blocker 해제, 브랜치 정리. 9/17~10/4 구간은 커밋·산출물 없음) · v17 2026-09-16 = 2차 제출 완료 20:19
**Active workstream**: **모두의 창업 2차 결과 대기** (PetTracker → 동물보호소 대상으로 전환해 재도전)
**Current phase**: **Phase 7 (Milestone Closure 대기)** — 제출 완료, 검증은 외부 심사(멘토 3인 다면심사)로 위임된 상태
**Priority principle**: 2차 결과 대기 > (통과 시) 보호소 1곳 시범 운영 준비 > SafeWay 동결 유지 > CareConnect 보류

**Active Brief**: [`artifacts/business/fundraising/2026-09-14-modoo-2nd-shelter-first-rewrite.md`](artifacts/business/fundraising/2026-09-14-modoo-2nd-shelter-first-rewrite.md) — 2차 방향 문서. ⚠️ 정식 Requirement Brief·Tech Spec은 만들지 않았다. **제출 원문 = [`2026-09-16-modoo-2nd-submitted-snapshot.md`](artifacts/business/fundraising/2026-09-16-modoo-2nd-submitted-snapshot.md)** (10/5 modoo.or.kr에서 수집, 이미지 제외). 9/13~9/14 초안들은 이보다 낡았다
**Next gate**: 2차 1라운드(예선) 결과 발표 — **"10월 중"** (중기부 계획, 언론 보도 기준. 공고문·사이트 공지에도 일자 없음 — 10/5 확인: 최신 공지는 9/22 「접수 결과 안내」(통계 인포그래픽)뿐, 결과 공지 아직 없음). 접수 약 9만 명 · 경쟁률 9.3:1 · 일반/기술 8,000명 선발. 통과 시 사업자등록 → 보호소 1곳 확보
**대기 중 작업**: 보호소 시범 운영 기능 차이 분석 — 계획 [`artifacts/plans/2026-10-05-shelter-pilot-gap-analysis-plan.md`](artifacts/plans/2026-10-05-shelter-pilot-gap-analysis-plan.md) (사용자 승인 대기)
**Plan (전략·채점)**: `~/.claude/plans/memoized-wondering-bear.md` (저장소 밖)

## 1차 결과
- 2026-05-15 제출(v2.6-tight, 개인 보호자 대상) → **탈락**. 탈락 통보만 받았고 보완 피드백·재도전 멘토링은 없었다 (사용자 보고)
- 1차에서 약속한 **6/9 출시는 이행하지 않았다**. D-6 reschedule(7월 말~8월 초)도 이행 기록이 없다

## 2차 제출본 요지 (2026-09-16 20:19)
- **구분**: 일반/기술 · 예비창업자 · 재도전자(Q8 보완사항 작성) · 멘토 기관 = 서울 · **서강대학교** · 사업 분야 = 임팩트 · 팀원 없음
- **첫 고객**: 전국 236개 동물보호센터. 근거 = Feuerbacher & Gunter(*Animals*, 2023) 외출 → 입양 확률 5배 (**미국 사례** — 국내 적용은 1단계 핵심 가설로 명시)
- **해결 순서**: ① 사고 대응·기록 → ② 산책 파트너 기록 기반 배정 → ③ AI 캡션·감정 톤 리포트(입양 공고 초안)
- **수익**: 1단계 보호소 무상 → 2단계 **지자체 연간 이용료**(첫 매출) → 3단계 개인 과금(유상 산책·노령견 구독)과 병원·숙박·커머스 연계. **손익분기점은 "아직 계산하지 못함"으로 명시**
- **첨부**: 영상 `https://youtu.be/QdWUensg4lY` · 다이어그램 4장(Q2 1 · Q3-1 2 · Q3-2 1)
- **외부 검증**: 동물보호단체 7곳 문의(9/13·9/14) → 1곳 회신(9/15, "한 사람 동행") → 인력 병목 확인. **단체명은 인용 허락을 못 받아 쓰지 않았다**

## 신청서에 적은 약속 (통과 시 추적 대상)
| 단계 | 진입 조건 | 확인할 것 |
|---|---|---|
| 1 | 보호소 1곳 확보 | 산책 30건 운영 · 공고 초안 품질 · 파트너 앱 사용 여부 · **다음 달 재사용 의사** · 사고 발생률·보험 견적 · 지자체 1곳 이용료 협의 |
| 2 | 1단계 재사용 의사 | 수도권 보호소 5곳 · 지자체 연간 이용료 → 첫 매출 |
| 3 | 누적 산책 데이터 | 유상 산책 · 노령견 구독 → 병원 연계 |

지원금 1억 원 계획: 시범 운영 2,000 · 서버/AI 2,000 · 외주 2,700 · 인건비 2,000(고객 접점 1인) · 법무/예비비 1,300 (만 원)

## Blockers / Waiting On
- 🟡 **2차 결과 발표 대기** — 외부 의존. "10월 중" (10/5 Gmail 확인: 결과 메일 없음)
- 🟡 **origin/main 병합 미실행** — ahead 25 / behind 23. 해결안은 아래 Repo 상태 참조. 사용자 판단 대기
- ~~협회 인용 허락 회신 대기~~ — **해제(10/5)**. 후속 메일 2건(9/15·9/16)에 19일째 무응답(Gmail 확인) → 단체명 없이 유지로 확정
- ⚪ 「선배 창업가 인사이트 강연」(10/6~10/14, 2차 도전자 대상) — 선착순 **접수 마감으로 미참여** (사용자 확인 10/5)
- ⚪ **6/4 이후 갱신 없음, 현재 상태 미확인**: OpenAI 결제 보류 · PortOne 사업자 계정 · D-7 SafeWay 동결(D-9로 부분 해제 후 재동결 여부 미결)

## Risks
- **R-5 (HIGH)** 수요 검증 근거가 회신 1건뿐. 신청서 [한계]에 "해법이 문제를 푸는지는 아무도 확인하지 않았다"고 명시했다
- **R-6 (MED)** 지자체 이용료는 **전부 가정**(예시: 월 고정비 500만 원 ÷ 곳당 연 300만 원 = 20곳). 1단계에서 실측 필요
- **R-7 (MED)** 핵심 근거 연구가 미국 사례 — 국내 보호소에서 같은 효과가 나는지 미확인
- **R-3 (MED, 유지)** 1인 운영 burnout — 신청서에 "고객 접점 담당 1인 우선 채용" 계획
- ~~R-1 (6/9 출시 약속 시차)~~ — 1차 탈락으로 소멸. 2차 Q4-1에 미이행 사실을 직접 밝혔다

## Portfolio Status (9/16)
- **PetTracker**: 2차 제출·결과 대기. **미출시** — 신청서 기준 내부 QA로 동작 확인, 실사용자 테스트 전
- **SafeWay Kids**: 동결(D-7) — 마지막 확인 6/4
- **CareConnect**: 보류 — 마지막 확인 5/22
- **SDET Code**: sunset 방향 결정(2026-06-05, 메모리 기록) → 후속 **nightward**(구 tripwire)는 독립 저장소
- **루넨랩스 사이트**: 6/8 독립 저장소 `lunenlabs`로 분리(`24c97a0`). lunenlabs.com LIVE 여부는 9/16 미확인

## Repo 상태 (10/5 확인)
- ✅ `docs/modoo-2nd-submission` → `main` **fast-forward 완료**(`023323e`). 이제 main에서 작업한다
- ⚠️ `main` = origin 대비 **ahead 25 / behind 23** (10/5 fetch). origin 쪽 23커밋 = 6/6~6/7 lunenlabs tripwire PR 3건 + 연어의 여행 게임(추가 후 별도 리포로 이전, 순변화 0) + LF 정규화(`c278e45`). 공백 무시 실변경은 `lunenlabs/`(로컬에선 6/8 분리 삭제됨)와 리뷰 문서 1건뿐
- 병합 미리보기(`git merge-tree`): 충돌 7건 = `lunenlabs/` modify/delete 6건 + `backend/app/modules/notification/schemas.py` 1건(origin은 줄바꿈만, 로컬은 `61b03aa` 실변경). 해결안 = lunenlabs 삭제 유지 + schemas.py 로컬본. **origin 병합·push는 권한 단계에서 막혀 미실행 → 사용자 판단 대기**
- **의도적으로 미커밋**: `docs/references/` (17MB — 샌드박스 신청서 docx·자문의견서 PDF·공고 hwp 원본)
- ⚠️ **낡은 초안**(제출본과 다름, 붙여넣기 금지): `2026-09-13-modoo-2nd-form-final-copy.md` · `-q2-draft-v1.0` · `-q3-draft-v1.0` · `-supplement-narrative-v1.0`. `-shelter-first-rewrite.md`는 상단에 차이표가 있다

## 2차 산출물
- 발송·회신 기록: [`...-shelter-outreach-log.md`](artifacts/business/fundraising/2026-09-13-modoo-2nd-shelter-outreach-log.md)
- 다이어그램: [`modoo-2nd-images/`](artifacts/business/fundraising/modoo-2nd-images/) (`05-revenue-stages.png` = v2 제출본, `-v1-stale`은 보관용) · 이미지 계획 [`...-image-prompts.md`](artifacts/business/fundraising/2026-09-13-modoo-2nd-image-prompts.md)
- 영상: [`modoo-2nd-video/`](artifacts/business/fundraising/modoo-2nd-video/) (`pettracker-modoo.mp4`, 70.7초)

## Latest Handoff
- [`artifacts/handoffs/2026-06-04-session-handoff.md`](artifacts/handoffs/2026-06-04-session-handoff.md) — PT UX 86/86 완료. ⚠️ **2차 준비 세션(9/13~9/16)의 handoff는 작성하지 않았다** — 이 STATE.md가 그 공백을 대신한다

## Open Gap Notes (6/3 이후 미갱신)
- [`2026-05-22-walkphoto-migration-sequencing.md`](artifacts/gap-notes/2026-05-22-walkphoto-migration-sequencing.md) · [`2026-06-03-gps-speed-validation-log-only.md`](artifacts/gap-notes/2026-06-03-gps-speed-validation-log-only.md)

## Available Skills / Agents
- `/session-start` · `/session-end` · `/sandbox-followup` (동결 중)
- `business-operations-manager` · `korea-{regulatory-counsel,tax-accounting-advisor,fundraising-strategist}` · `korean-grant-application-writer` · `evaluator-rubric-reviewer` · `traction-data-builder` · `tech-spec-reviewer` · `requirement-analyst` · `verification-auditor`
