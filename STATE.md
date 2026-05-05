# SafeWay Platform — Current State (Live)

> Single source of truth — "what is happening right now". `/session-start`·`/session-end`로 동기화.
> 마일스톤 이력 = CLAUDE.md "프로젝트 진행 현황" / 세션 이력 = `artifacts/handoffs/`.

**Last updated**: 2026-05-06 (lunenlabs.com/pet PT 전용 페이지 추가)
**Active workstream**: 모두의 창업 2026 신청서 5/15 16:00 마감 critical path (Track 1) + PT V1.0 출시 6/9 ±2d (Track 2, 5/16 시작) + lunenlabs.com + **PT 종합 케어 페이지 LIVE 대기** (5/6 코드 완료, deploy 대기)
**Current phase**: Phase 5 (Implementation) — modoo-deadline-execution 패키지 + 친척·친구 outbound + 사이트 친근 톤·PT 분리 5가지 후속 작업 진입
**Priority principle**: **5/15 신청 > 6/9 PT 출시 > SafeWay 샌드박스** (3레벨)
**LIVE infrastructure**: `https://www.lunenlabs.com/` (Vercel + Namecheap, OG image VERIFIED) + `https://www.lunenlabs.com/pet` (5/6 코드 완료, deploy 후 LIVE)
**PT positioning**: **산책 단일 → 강아지 일상 종합 케어** (사용자 명시 2026-05-06, `pt_positioning_holistic_care.md` memory anchor)

**Active Brief**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md)
**Final Tech Spec**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md)
**Consensus Matrix**: [`artifacts/reviews/2026-05-03-modoo-deadline-execution-consensus.md`](artifacts/reviews/2026-05-03-modoo-deadline-execution-consensus.md)
**Reviews (4)**: `2026-05-03-modoo-deadline-execution-{frontend,product,fundraising,business}-review.md`
**신청서 v1**: [`artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md`](artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md) (36/50, 72%)

## User Decisions (Anchored)
- **D-1 = A**: 신청서 6/9 AI 5축 동작 강한 약속 (§4·영상 자막은 "조건부 약속" 절충 표현)
- **D-2 = A**: 데모 영상 5/12 마감 (Hybrid: 0~25 실녹화 / 25~55 슬라이드 / 55~60 클로징)
- **D-3**: Beachhead = **마포구 + 용산구** (LOI 5명 중 2명 이상 거주자 우선)
- **D-4 = C**: ActivityFeedScreen은 Track 2 T2.3 완료 후 실 API 연결 (6/8)
- **F-1 = A**: 5/16~6/8 placeholder ("준비 중 — 6월 출시 예정") → 6/8 실 API
- **F-2 = C**: 영상 25~55초 = 슬라이드 + 본인 음성 (YouTube Unlisted)
- **UD-2 default**: 영상 자막 = "2026.06.09 출시 예정"
- **UD-3 default**: SafeWay v2.2 5/13 → **5/14 연기** (PT v3 5/13 전용 확보)

## Critical Path (5/3~5/16)
| 날짜 | 작업 | 담당 |
|---|---|---|
| 5/3 (D-12) | Phase 0~3 (Brief·Reviews·Consensus·Final Tech Spec) | ✅ |
| 5/5 (D-10) | Phase 4 Todo Plan + Phase 5 산출물 1·2·3·4 + **lunenlabs.com LIVE** | 진행 |
| 5/5 17~18시 | **친척 강아지 보호자 카톡 발송** (LOI 1건 첫 회수 path) | 사용자 |
| 5/7 (D-8) | 변호사 미팅 + UD-3·UD-4 확정 | 사용자 |
| **5/8 (D-7)** | **strong-go 게이트 (가입자 ≥30 + LOI ≥3)** | 사용자 |
| 5/9 (D-6) | 신청서 v2 inject (placeholder 6 + 약점 Top 3) | Claude |
| 5/10 (D-5) | 1차 채점 (운영기관 책임멘토 5 페르소나) | Claude |
| 5/11 (D-4) | **freezing deadline** (신규 작업 추가 금지) | 모두 |
| 5/12 (D-3) | 영상 제작 + YouTube Unlisted 업로드 | 사용자 |
| 5/13 (D-2) | v3 (목표 80+) + 신청서·영상·앱 3자 self-audit | Claude |
| 5/14 (D-1) | 운영기관 선택 + SafeWay v2.2 사전 전달 (UD-3 연기) | 사용자 |
| **5/15 16:00** | **K-Startup 포털 제출** | 사용자 |
| 5/16 (D+1) | Track 2 시작 (T2.0 pip check) | Claude |

## Fallback Path (5/8 게이트 FAIL)
가입자 <30 OR LOI <3 시 → K-Startup 초기창업패키지 7월 전환, 산출물 3·4 작업 중단, 6월 신청서 재작성. 산출물 1·2는 그대로 진행.

## Blockers / Waiting On
- 🔴 **5/5~5/7 사용자 critical path**: 가입자 30+·LOI 3+ 회수·LOI 마포/용산 거주자 2명 우선·카톡 50명·SNS·5/7 변호사 미팅
- 🟡 EXT-9~12 외부 계정 (AWS·Firebase·Anthropic·OpenAI·PortOne) — Track 2 5/16 시작 전 필수, 본 패키지 영향 0
- 🟡 UD-3 5/7 결정 (SafeWay v2.2 5/14 연기) — 기본값 자동 적용 가능
- 🟡 UD-4 5/8 게이트 시 확인 (루넨랩스 사업자등록 5/15 전 완료 가능 여부 → 자격란 수정 영향)

## Risks (Brief R-7 등급 상향: 낮음 → 중간)
- 5/8 게이트 미달 → K-Startup 7월 전환 (자금 조달 gap, runway SDET Code B2B 의존도 검토 필요)
- 5/12 영상 제작 실패 → 이미지 5장 대체 (특히 슬롯 2 경쟁사·슬롯 5 멀티앱)
- 5/12~5/13 자원 경합 (1인 창업가) → UD-3 5/14 연기로 완화

## Parallel: SafeWay Kids 샌드박스 v2.1
- Active draft: [`artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md`](artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md) (911 라인)
- Anchor: 양길모 변호사 KISED #32399 (2026-05-02 승인)
- **5/7 이의림 cross-check 질의서**: [`artifacts/business/regulatory/2026-05-05-iuilim-meeting-questions.md`](artifacts/business/regulatory/2026-05-05-iuilim-meeting-questions.md) (3 질문 그룹: 양길모 cross-check + §2.3 운수사업 외관 + §2.4 N:N 지명·보수 분리)
- Next: 양길모 인용 사전 동의 (5/3~5/4) → 5/6 17:00 사용자 검토 → 5/7 09:00 전 발송 → 5/7 이의림 cross-check → 5/8 자문 메모 → **5/14 v2.2 사전 전달** (UD-3)
- Phase: Phase 5 Implementation, cross-check 질의서 작성 완료, 미팅 대기

## Latest Handoff
- [`artifacts/handoffs/2026-05-05-session-final-handoff.md`](artifacts/handoffs/2026-05-05-session-final-handoff.md) — **lunenlabs.com LIVE (Vercel + Namecheap) + 친척 카톡 outbound 슬롯 진입 + hourly 시간표 5/5~5/8**
- [`artifacts/handoffs/2026-05-05-session-handoff.md`](artifacts/handoffs/2026-05-05-session-handoff.md) — modoo-deadline-execution Phase 0~7 완료 (4 산출물 + 38/38 AC PASS + 회귀 0)
- [`artifacts/handoffs/2026-05-03-session-final-handoff.md`](artifacts/handoffs/2026-05-03-session-final-handoff.md) — SafeWay v2.1 양길모 의견서 반영

## Portfolio Status
- **PetTracker**: 6/9 ±2d 출시 (Track 2 5/16 시작) — modoo-deadline-execution 패키지 진행 중
- **SafeWay Kids**: 샌드박스 v2.1 cross-check 대기 (병렬, 5/7·5/14)
- **CareConnect**: PT 안정화 후 사이클 (PT +30d)
- **SDET Code**: 운영 중 (B2B 해외) — 5/15까지 신규 작업 중단
- **루넨랩스**: 사업자등록 진행 중 (UD-4 5/8 확인) + **lunenlabs.com 사이트 LIVE (5/5)** — Vercel 배포, OG 이미지 검증, 5/6 PT 전용 페이지·이메일·인스타 추가 예정

## Available Skills
- `/session-start` · `/session-end` · `/sandbox-followup [email|prep|status|review]`

## Available Agents
- `business-operations-manager` · `korea-{regulatory-counsel,tax-accounting-advisor,fundraising-strategist}`
- `backend-dev` · `frontend-dev` · `db-architect` · `security-expert` · `product-manager` · `qa-lead` · `ux-advocate`
- `tech-spec-reviewer` · `requirement-analyst` · `verification-auditor`
