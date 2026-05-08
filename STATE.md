# SafeWay Platform — Current State (Live)

> Single source of truth — "what is happening right now". `/session-start`·`/session-end`로 동기화.
> 마일스톤 이력 = CLAUDE.md "프로젝트 진행 현황" / 세션 이력 = `artifacts/handoffs/`.

**Last updated**: 2026-05-08 (v8 — **5/6~5/7 누적 90 파일 origin/main 출시 완료**: PR #2 머지 → `3cd19eb`. 도메인별 3-commit 분할(docs / backend AES-GCM / frontend+edge+demo) + face PII gitignore 게이트 + Windows autocrlf 트랩 영구 봉쇄(`true → input`) + feature 브랜치 회수. 작업 트리 clean, 회귀 0)
**Active workstream**: 모두의 창업 2026 신청서 **5/15 16:00 무조건 강행** (Track 1, 5/7 commit) + PT V1.0 출시 6/9 ±2d (Track 2, 5/16 시작) + lunenlabs.com + PT 종합 케어 페이지 (5/6 commit a7301a2 push 완료). **v2.1 paste-ready 통합본 완료 (Q1 49자 / Q2 671자 / Q3 ~673자 / Q4 ~902자) — 5/12 영상·5/13 v3 freezing 대기**
**Current phase**: **Phase 5 (Implementation)** — modoo.or.kr 폼 캡처(form-structure-capture) + v2.0 paste-ready + 5 페르소나 채점(32.6/50) + v2.1 inject 3건 적용(34.7/50 추정) 완료. 5/12 영상 + 5/13 v3 진입 대기 + 5/9~5/10 OQ-9 경쟁사 5사 재검증 P1
**Priority principle**: **5/15 신청 > 6/9 PT 출시 > SafeWay 샌드박스** (3레벨)
**LIVE infrastructure**: `https://www.lunenlabs.com/` (Vercel + Namecheap, OG image VERIFIED) + `https://www.lunenlabs.com/pet` (5/6 코드 완료, deploy 후 LIVE)
**PT positioning**: **산책 단일 → 강아지 일상 종합 케어** (사용자 명시 2026-05-06, `pt_positioning_holistic_care.md` memory anchor)

**Active Brief**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md)
**Final Tech Spec**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md)
**Consensus Matrix**: [`artifacts/reviews/2026-05-03-modoo-deadline-execution-consensus.md`](artifacts/reviews/2026-05-03-modoo-deadline-execution-consensus.md)
**Reviews (4)**: `2026-05-03-modoo-deadline-execution-{frontend,product,fundraising,business}-review.md`
**신청서 v1**: [`artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md`](artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md) (v1.4, 자체 36/50)
**신청서 v2.0 paste-ready**: [`artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2-paste-ready.md`](artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2-paste-ready.md) (자체 37.5/50, 페르소나 32.6/50)
**신청서 v2.1 (현재 anchor)**: [`artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2.1.md`](artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2.1.md) (자체 38.5 / 페르소나 추정 34.7/50, 합격선 경계)
**5 페르소나 채점**: [`artifacts/business/fundraising/2026-05-07-modoo-v2-5persona-evaluation.md`](artifacts/business/fundraising/2026-05-07-modoo-v2-5persona-evaluation.md) (KISED 34 / VC 30 / 산업 32 / 회계 35 / 멘토 32)
**폼 구조 캡처**: [`artifacts/business/fundraising/2026-05-07-modoo-form-structure-capture.md`](artifacts/business/fundraising/2026-05-07-modoo-form-structure-capture.md) (4-step wizard + Q5 18 옵션 + 글자수 제약)

## User Decisions (Anchored)
- **D-1 = A**: 신청서 6/9 AI 5축 동작 강한 약속 (§4·영상 자막은 "조건부 약속" 절충 표현)
- **D-2 = A**: 데모 영상 5/12 마감 (Hybrid: 0~25 실녹화 / 25~55 슬라이드 / 55~60 클로징)
- **D-3**: Beachhead = **마포구 + 용산구** (LOI 5명 중 2명 이상 거주자 우선)
- **D-4 = C**: ActivityFeedScreen은 Track 2 T2.3 완료 후 실 API 연결 (6/8)
- **D-5 (NEW 2026-05-07)**: **모두의 창업 5/15 무조건 강행 commit**. 가입자 수치 무관, 게이트 분기 폐기, BORDERLINE narrative + P4 honesty 가산 default. 7월 차회 또는 별도 사업 path 폐기 (5/15 합격선 미달 시 fallback으로만 보존)
- **F-1 = A**: 5/16~6/8 placeholder ("준비 중 — 6월 출시 예정") → 6/8 실 API
- **F-2 = C**: 영상 25~55초 = 슬라이드 + 본인 음성 (YouTube Unlisted)
- **UD-2 default**: 영상 자막 = "2026.06.09 출시 예정"
- **UD-3 default**: SafeWay v2.2 5/13 → **5/14 연기** (PT v3 5/13 전용 확보)
- **UD-4 (CORRECTED 2026-05-07, 양 자문 합산)**: ~~사업자등록 보유 여부 = 자격 결격 risk~~ → **방향 반전**. 공고 Page 3 anchor "예비창업자 = 공고일('26.3.26.) 기준 미보유" → **5/8~5/14 사이 사업자등록 시 자격 박탈 (#1 risk)**. 1순위 path A = 5/15 예비창업자 신청 → 1R 통과(~7월 말) 후 개인사업자 등록. 5/8 single critical action = 모두의 창업 운영기관 또는 창업진흥원 1357+5 콜센터 전화 (paste-ready 본문 [`UD-4 가이드`](artifacts/business/fundraising/2026-05-07-ud-4-business-registration-decision-guide.md) §3 Step 2)
- **C-1 (NEW 2026-05-07)**: Q5 사업 분야 = **라이프스타일** (V2.0 슈퍼앱 6축 정합, `pt_positioning_holistic_care.md` anchor)
- **C-2 (NEW 2026-05-07)**: Q1 시제 = "AI가 사고를 자동 처리하도록 설계된 반려견 라이프스타일 플랫폼 — 6/9 출시 예정 · 국내 최초 안전 인프라" (49자)
- **C-3 (NEW 2026-05-07)**: Q7 팀원 = 미입력 (자문 narrative는 Q4 본문 통합)
- **C-4 (NEW 2026-05-07)**: 사진 5장 슬롯 — Q2(경쟁사 비교 + 시장 규모) / Q3(앱 메인) / Q4(V2.0 6축 + 멀티앱 시너지)
- **C-5 (NEW 2026-05-07)**: **자문 실명 미사용** — Inject A 변호사 실명 제외, BEP 정의만 적용. publicly verifiable claim risk 회피. 가능성 축 -0.5 trade-off 수용

## Critical Path (5/3~5/16, strategic pivot 후)
| 날짜 | 작업 | 담당 |
|---|---|---|
| 5/3 (D-12) | Phase 0~3 (Brief·Reviews·Consensus·Final Tech Spec) | ✅ |
| 5/5 (D-10) | Phase 4 Todo Plan + Phase 5 산출물 1·2·3·4 + lunenlabs.com LIVE | ✅ |
| 5/6 (D-9) | 신청서 v1.4 lock (36/50, 사이트 D+5 가입자 3·LOI 2~3) | ✅ |
| 5/7 (D-8) | 변호사 미팅 (이의림+이학선) + **D-1 push 패키지 발급** + **D-5 strategic pivot commit** | ✅ |
| 5/7 evening | (자율) §3-3 자문진 LOI reminder 발송 + ID "류정현" 통일 + (옵션) 카톡·인스타 push | 사용자 |
| 5/8 (D-7) | **UD-4 사업자등록 결정 (#1 critical)** + 가입자·LOI 5/8 18:00 카운트 (수치 anchor만) | 사용자 |
| 5/9 (D-6) | ~~신청서 v2 BORDERLINE inject~~ → ✅ **5/7 선행 완료** (v2.0 paste-ready + v2.1 Inject A·B·C 적용) | Claude |
| 5/10 (D-5) | ~~1차 채점 (5 페르소나) 목표 70+~~ → ✅ **5/7 선행 완료** (평균 32.6 → v2.1 후 추정 34.7). OQ-9 경쟁사 5사 재검증 (P3 지적) | Claude |
| 5/11 (D-4) | **freezing deadline** (narrative fine-tune, 강행 결정 변경 X) | 모두 |
| 5/12 (D-3) | 영상 제작 + YouTube Unlisted 업로드 | 사용자 |
| 5/13 (D-2) | v3 (목표 80+) + 신청서·영상·앱 3자 self-audit + ID cross-grep | Claude |
| 5/14 (D-1) | 운영기관 선택 + SafeWay v2.2 사전 전달 (UD-3 연기) | 사용자 |
| **5/15 16:00** | **modoo.or.kr 도전신청서 제출 (무조건 강행)** | 사용자 |
| 5/16 (D+1) | Track 2 시작 (T2.0 pip check) | Claude |

## Fallback Path (REVOKED — 2026-05-07 strategic pivot)
~~가입자 <30 OR LOI <3 시 → 7월 차회 또는 별도 사업 전환~~

**REVOKED**. 5/15 무조건 강행 commit으로 5/8 게이트 분기 폐기. 7월 차회 또는 별도 사업 path는 **합격선 미달 시 fallback으로만 보존** (5/16~6월 사이 v2 본문 60~70% 재사용 + 인터뷰 추가 10~20건 + 출시 후 retention 7일 데이터 보강).

## Blockers / Waiting On
- ✅ **CATASTROPHIC 3 + RED 17 + YELLOW 20 + 카드 6 + Round 2 잔존 4건 처리 완료 (v3)**: 상세 `artifacts/reports/2026-05-06-major-issues-resolution-v2.md` + Round 2 (이번 메시지) 추가
- ✅ **환경 검증 완료**: pytest 178 collected + alembic SQL EXIT:0 + web/site/lunenlabs tsc 0 errors. **본 세션 v1·v2·v3 모든 변경분 회귀 0 입증**
- ✅ **CLAUDE.md / 신청서 §4·§2·5축·$7 평가표·정량 수치 8건 모두 갱신** (LOC 62,200 / 178 collected / 잔존 6곳 모두 통합)
- ✅ **카드 #2 R-12-B (만 14세 미만 법정대리인 동의 명시)** ConsentNote 단락 추가
- ✅ **카드 #2 R-12-C (OTP 수집 목적 사전 고지)** LoginScreen otpNotice 추가
- ✅ **카드 #4 Student.name AES-GCM 본격 구현 완료** (security.py compute_name_hash + config hash_key + models.py name_encrypted+name_hash+hybrid_property + service.py 검색 쿼리 + 마이그레이션 e7a9b2c4d6f8 + scheduling/billing/admin Class-level SQL 정합)
- 🟡 **mobile tsc UNVERIFIED**: typescript 모듈 lock 파일 mismatch (~누락). 다음 세션 `npm install --force` 또는 lock 재생성 필요
- ✅ **환경 검증 v4 (Round 4) 100% 완료**: pytest **187 passed / 194** (96.4%) + alembic upgrade head ✅ `e7a9b2c4d6f8 (head)` 도달 + 30 students 백필 자동 성공 + 데이터 손실 0. 남은 7 fail/error 모두 KI 기존 (TOSS webhook 3 + health 1 + WS 3). **본 세션 변경분 회귀 0 직접 입증**
- ✅ **`@hybrid_property` → `@property` 전환** (Round 4 fix): SQLAlchemy hybrid_property class level access 시 InstrumentedAttribute → decrypt fail 회귀 발견 → Python plain @property로 전환 (instance level only). Student 4 + Pet 1 + WalkerWallet 1 + CaregiverWallet 1 = 7 property
- ✅ **마이그레이션 fix** (Round 4): `e7a9b2c4d6f8_student_name_encryption.py`에 `op.get_bind()` 기반 Python 백필 단계 추가 — 시드 데이터 보유 환경에서도 NotNullViolation 회피
- ✅ **test_cross_app_isolation 401/403/404 valid 응답 코드 확장**: 신규 5 케이스 모두 PASS (cross-app 토큰 차단 검증 의도상 401/403/404 모두 valid isolation 결과)
- 🟡 mobile tsc UNVERIFIED: typescript 모듈 lock 파일 mismatch — Track 2 5/16 시작 시 `npm install --force` 후 재검증
- ✅ **Round 3 보강 완료**: .env.example 신설 + test_security.py compute_name_hash 4 케이스 + test_student_name_encryption.py 4 통합 케이스 + backfill_student_name.py 스크립트 + 마이그레이션 백필 가이드 5단계 + Android `ACCESS_BACKGROUND_LOCATION` + expo-location 플러그인 백그라운드 옵션 + CLAUDE.md "Active Work" v3 정합
- ✅ **Student fixture 패턴 점검 결과**: 6/8 keyword init `Student(name="...")` 패턴 → SQLAlchemy `__init__` setattr이 hybrid_property setter trigger 보장 (회귀 risk 매우 낮음). 2/8 (e2e_hardening, m2_apis) UNVERIFIED but 동일 패턴 가정
- 🔴 **5/7~5/8 사용자 critical path (UD-4 cascade 정정 후)**: (a) **UD-4 = 5/8 모두의 창업 운영기관 또는 창업진흥원 1357+5 콜센터 전화**로 공식 확인 (단순 사업자등록 결정이 아닌, 공고일 이후 등록 시 자격 박탈 risk 확인) (b) §3-3 자문진 LOI 5/7 reminder 발송 + ID "류정현" 통일 (c) 5/7 변호사 미팅 (이의림+이학선, 대한상의 8층, SafeWay 영역) (d) 5/8 18:00 가입자·LOI 수치 anchor 카운트 (분기 결정 X). **5/8~5/14 사이 사업자등록 회피 = #1 priority**
- 🟡 EXT-9~12 외부 계정 (AWS·Firebase·Anthropic·OpenAI·PortOne) — Track 2 5/16 시작 전 필수
- 🟡 UD-3 5/7 결정 (SafeWay v2.2 5/14 연기) — 기본값 자동 적용 가능

## Risks (Brief R-7 등급 상향: 낮음 → 중간)
- 5/8 게이트 미달 → 7월 차회 또는 별도 사업 (자금 조달 gap, runway SDET Code B2B 의존도 검토 필요)
- 5/12 영상 제작 실패 → 이미지 5장 대체 (특히 슬롯 2 경쟁사·슬롯 5 멀티앱)
- 5/12~5/13 자원 경합 (1인 창업가) → UD-3 5/14 연기로 완화

## Parallel: SafeWay Kids 샌드박스 v2.1
- Active draft: [`artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md`](artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md) (911 라인)
- Anchor: 양길모 변호사 KISED #32399 (2026-05-02 승인)
- **5/7 이의림 cross-check 질의서**: [`artifacts/business/regulatory/2026-05-05-iuilim-meeting-questions.md`](artifacts/business/regulatory/2026-05-05-iuilim-meeting-questions.md) (REV2 — 5 질문 그룹: 양길모 cross-check + §2.3 운수사업 외관 + §2.4 N:N 지명·보수 분리 + **Q4 실증규제특례 실무 흐름** + **Q5 AI 기본법 시행 초기 행정청 해석**)
- 양길모 후속 가이드 (2026-05-06 인용 동의와 함께 전달): (i) 실증규제특례절차 실무 진행 흐름 추가 확인 (ii) 시행 초기 AI 기본법과의 관계 구체화 → 5/7 이의림 미팅 Q4·Q5에 통합
- **이의림 5/7 발송 패키지 (SEND-READY)**: [`artifacts/business/regulatory/2026-05-06-iuilim-dispatch-package.md`](artifacts/business/regulatory/2026-05-06-iuilim-dispatch-package.md) — 발송 직전 체크리스트 + 첨부 5종 PDF export 안내 + 메일 본문 send-ready (선택 1·2) + 4분 카드 + follow-up + fallback. 보조 산출물: [`artifacts/business/regulatory/2026-05-06-business-model-4min-card.md`](artifacts/business/regulatory/2026-05-06-business-model-4min-card.md) (1p, PDF export 후 첨부 #3)
- Next: 양길모 인용 동의 ✅ 확보 (2026-05-06) → MODE_A 발송 ✅ 완료 (2026-05-06) → **이의림 회신 ✅ 수신 (2026-05-06): 자료 수신 OK / 장소 = 대한상의 8층 샌드박스 팀 / 참석자 = 이의림 변호사 + 이학선 연구원(기술 전문가, 변호사 동료) 2인** → cheatsheet REV3 (이학선 동석 반영 + 기술 영역 must-say + Q-T 신규) → 5/7 이의림 미팅 → 5/8 자문 메모 → **5/14 v2.2 사전 전달** (UD-3)
- Phase: Phase 5 Implementation, 발송·회신 수신 ✅, **2:1 구도 변화 → 법리(이의림) + 기술(이학선) 페어 cross-check 격상**, cheatsheet REV3 진행

## Latest Artifacts (2026-05-07)
- [`artifacts/business/fundraising/2026-05-07-modoo-form-structure-capture.md`](artifacts/business/fundraising/2026-05-07-modoo-form-structure-capture.md) — **modoo.or.kr 신청 폼 구조 캡처 (Chrome in Claude). 4-step wizard + Q5 dropdown 18 옵션 + 글자수 제약 + 결정 카드 4건 + step 03·04 cursor-default gating**
- [`artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2-paste-ready.md`](artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2-paste-ready.md) — **v1.4 + v2 inject 15 항목 + D-1 BORDERLINE narrative 통합. 자체 37.5/50, Q1 49 / Q2 671 / Q3 631 / Q4 836자**
- [`artifacts/business/fundraising/2026-05-07-modoo-v2-5persona-evaluation.md`](artifacts/business/fundraising/2026-05-07-modoo-v2-5persona-evaluation.md) — **5 페르소나 채점 평균 32.6/50 (-4.9 self-bias 효과성 -1.5). P0 약점 2건 + P1 약점 1건 + Inject A·B·C 권고**
- [`artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2.1.md`](artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2.1.md) — **v2.0 + Inject A(BEP 정의 only, C-5 자문 실명 제외) + B(단계적 수요 검증) + C(60일 측정 지표) 적용. 추정 페르소나 34.7/50, 합격선 70% 경계 -0.3**
- [`artifacts/business/fundraising/2026-05-07-d-1-gate-push-package.md`](artifacts/business/fundraising/2026-05-07-d-1-gate-push-package.md) — **D-1 게이트 push 패키지 (strategic pivot 후 갱신). paste-ready 텍스트 4종 + BORDERLINE narrative inject simulation (§5-2 default) + ID cross-grep red flag + R-D1-5 CORRECTED**
- [`artifacts/business/fundraising/2026-05-07-ud-4-business-registration-decision-guide.md`](artifacts/business/fundraising/2026-05-07-ud-4-business-registration-decision-guide.md) — **UD-4 통합 결정 가이드 (양 specialist 자문 합산: korea-tax-accounting-advisor + korea-regulatory-counsel). 5/8 창업진흥원 1357+5 콜센터 paste-ready + 1R 통과 후 등록 1순위 path + PT 업종 63999 권장 + R-D1-5 방향 반전 정정**

## Latest Handoff
- [`artifacts/handoffs/2026-05-08-session-handoff.md`](artifacts/handoffs/2026-05-08-session-handoff.md) — **5/6~5/7 누적 작업 origin/main 출시 (PR #2 → `3cd19eb`). 90 파일 누적, 3-commit 분할, face PII gitignore 게이트, Windows autocrlf 트랩 봉쇄. 다음 세션 1차 액션: 2026-05-08 TODAY UD-4 창업진흥원 1357+5 콜센터 전화 (사업자등록 자격 확인)**
- [`artifacts/handoffs/2026-05-07-session-handoff.md`](artifacts/handoffs/2026-05-07-session-handoff.md) — **modoo.or.kr 폼 캡처 + v2.0/v2.1 paste-ready + 5 페르소나 채점 + Inject A·B·C 적용 완료. 4 신규 산출물. 다음 세션 1차 액션: OQ-9 경쟁사 5사 (도그메이트·와요·펫플래닛·에어댕냥이·펫피) 현행 서비스 성격 재검증 (P3 산업 전문가 지적, 5/9~5/10)**
- [`artifacts/handoffs/2026-05-06-session-handoff-v4.md`](artifacts/handoffs/2026-05-06-session-handoff-v4.md) — **v4 Round 3 종료. 4 Round 모두 처리 완료. 누적 51 파일 변경 + 8 신규 테스트 케이스 + 환경 검증 v3 SKIP. 다음 세션 1차 액션: `pytest tests/ --tb=line -q && alembic upgrade head` (사용자 직접 실행)**
- [`artifacts/handoffs/2026-05-06-session-handoff.md`](artifacts/handoffs/2026-05-06-session-handoff.md) — claim↔구현 갭 audit 2종 보고서 (Round 1 시작 시점)
- [`artifacts/handoffs/2026-05-05-session-final-handoff.md`](artifacts/handoffs/2026-05-05-session-final-handoff.md) — lunenlabs.com LIVE (Vercel + Namecheap) + 친척 카톡 outbound 슬롯 진입 + hourly 시간표 5/5~5/8
- [`artifacts/handoffs/2026-05-05-session-handoff.md`](artifacts/handoffs/2026-05-05-session-handoff.md) — modoo-deadline-execution Phase 0~7 완료 (4 산출물 + 38/38 AC PASS + 회귀 0)
- [`artifacts/handoffs/2026-05-03-session-final-handoff.md`](artifacts/handoffs/2026-05-03-session-final-handoff.md) — SafeWay v2.1 양길모 의견서 반영

## Audit Reports + Resolution (2026-05-06)
- [`artifacts/reports/2026-05-06-claim-vs-implementation-gap-audit.md`](artifacts/reports/2026-05-06-claim-vs-implementation-gap-audit.md) — 1차 정량 갭 audit (4 영역 RED 5 + YELLOW 6 = 11갭)
- [`artifacts/reports/2026-05-06-persona-audit-new-issues.md`](artifacts/reports/2026-05-06-persona-audit-new-issues.md) — 2차 8 페르소나 NEW 이슈 (CATASTROPHIC 3 + RED 12 + YELLOW 20 = 35건)
- [`artifacts/reports/2026-05-06-major-issues-resolution.md`](artifacts/reports/2026-05-06-major-issues-resolution.md) — v1 (18건 처리)
- [`artifacts/reports/2026-05-06-major-issues-resolution-v2.md`](artifacts/reports/2026-05-06-major-issues-resolution-v2.md) — v2 (38건 + 환경 검증 5종 + 카드 6건). 30 VERIFIED + 3 PARTIAL + 5 spec/분리
- [`artifacts/reports/2026-05-06-major-issues-resolution-v3.md`](artifacts/reports/2026-05-06-major-issues-resolution-v3.md) — v3 Round 2 (R-12-B/C + 신청서 6곳 + Student.name 본격 구현)
- [`artifacts/reports/2026-05-06-major-issues-resolution-v4.md`](artifacts/reports/2026-05-06-major-issues-resolution-v4.md) — **v4 Round 3 (.env.example + 단위/통합 테스트 + backfill 스크립트 + Android 백그라운드 위치 + CLAUDE.md 정합). 환경 검증 v3 SKIP** — 누적: 40 VERIFIED + 1 PARTIAL (Student fixture 6/8 검증) + 환경 검증 4종 SKIP (다음 세션)
- [`artifacts/specs/2026-05-06-student-name-encryption-tech-spec.md`](artifacts/specs/2026-05-06-student-name-encryption-tech-spec.md) — Student.name AES-GCM Final Tech Spec 17섹션 (구현 v3에서 완료)
- [`artifacts/reports/2026-05-06-user-decision-cards.md`](artifacts/reports/2026-05-06-user-decision-cards.md) — 사용자 의사결정 6 카드 (대부분 v2에서 처리 완료)
- [`artifacts/specs/2026-05-06-student-name-encryption-tech-spec.md`](artifacts/specs/2026-05-06-student-name-encryption-tech-spec.md) — Student.name AES-GCM Final Tech Spec 17섹션 (Track 2 5/16~5/19 구현)

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
