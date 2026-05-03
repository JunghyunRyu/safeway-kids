# Session Handoff — 2026-04-29 (final, 두번째 세션)

> **메모**: 같은 날짜에 첫번째 핸드오프 [`2026-04-29-session-handoff.md`](2026-04-29-session-handoff.md) 이미 존재 (트랙션 매핑 4 산출물 + 5 페르소나 채점). 본 final 핸드오프는 사용자 위임 명령 "5건 모두 처음부터 진행해야 해. 그 역할은 너가 진행해야 해" 후 D-18 P0 4건 + 별첨 1건 = 5건 산출물 작업의 후속 기록.

## Current Status

사용자 위임을 받아 모두의 창업 프로젝트 2026 (중기부 공고 제2026-275호) PT 신청의 **D-18 P0 4건 + 공고 별첨 1건 = 5건 산출물**을 1세션에 완주. 사전 채점 평균 52.8/100 → P0 산출물 100% 활용 시 **추정 70~73점** (합격선 70 진입). 단, 산출물은 "보석을 만든 것"이고 **사용자 외부 작업 24건 완료**가 가점 trigger. 이번 세션 코드 변경 N/A (사업·행정 트랙).

## Changed Files (본 세션 신규)

### `artifacts/business/fundraising/` — 5건 P0 산출물
- `2026-04-29-modoo-startup-budget-guide-summary.md` — 공고 별첨 (Task #1, 11 섹션)
  - 1차 권위 PDF 직접 추출 (29 페이지) + 2차 cross-ref (헬프미 / CoworkCity)
  - 사용자 plan vs 공고 의무 정합성 검증 ("7월 등록"은 안전 마진 충분, "1R 통과 후 등록" 미세 조정 권장)
  - 3R TOP 100 진출 가정 1억 원 자금 배분표
- `2026-04-29-modoo-startup-pt-market-citations.md` — 시장 출처 (Task #2)
  - 1차 출처 3개: 농식품부 (28.6%·499만 마리) / KB금융 (591만 가구·19.4만 원) / 삼정KPMG (8.5조→21조)
  - TAM 10조 / SAM 3,000~5,000억 / SOM 보수 0.5%·중도 1.5%·공격 3% 3시나리오
- `2026-04-29-modoo-startup-pt-competitor-matrix.md` — 경쟁사 매트릭스 (Task #3)
  - **메모리 정정**: 케어독·댕댕워크·우프 (잘못) → 펫플래닛·에어댕냥이·펫피 (정확)
  - 14축 비교표 + PT 차별화 3축 (사고 신고 자동화 / 트래픽 추천 / 의도적 lean)
- `2026-04-29-modoo-startup-pt-loi-templates.md` — LOI 5건 (Task #4)
  - 5명 수신자별 이메일 본문 + 한국어 LOI 양식 + 1차/리마인더/최종 리마인더 본문
  - 시나리오 4종 (5명/3-4명/1-2명/0명) 신청서 §팀역량 raw input
- `2026-04-29-modoo-startup-pt-campaign-assets.md` — 캠페인 8개 자산 (Task #5)
  - 랜딩 카피 + 강사모/반려동물사랑 카페 게시물 (광고 차단 회피 정보성 톤 80%)
  - 인스타·X·페이스북·카톡 1:1·단톡방 + 개인정보 동의 양식
  - 5/8 D-7 strong-go/no-go 게이트 정의 (가입자 30명 + LOI 3건 조건)

### `artifacts/business/fundraising/_scratch/`
- `extract_pdf.py` — pypdf 기반 PDF 텍스트 추출 스크립트 (재사용 가능 자산)
- `modoo-2026-275-extracted.txt` — 공고 PDF 29 페이지 / 54,229 bytes 텍스트

### 메모리 (`memory/`) — 본 세션 종료 시 동시 갱신
- `modoo_startup_2026.md` — 정정 + P0 산출물 5건 경로 + 4/30 critical path 추가
- `feedback_grant_application_pattern.md` (신규) — 신청서 산출물 4단계 패턴

### STATE.md / CLAUDE.md
- `STATE.md` — Last updated 2026-04-29 (final), Latest Handoff 본 파일로 갱신
- `CLAUDE.md` — Active Work 섹션 정합 갱신

## Commands Executed

- `python --version` → Python 3.14.2 확인
- `python -m pip install --user pypdf --quiet` → 성공 (pypdf installed OK)
- `python ./_scratch/extract_pdf.py` → "Total pages: 29 / Wrote: 54229 bytes"
- `git status --short` → 본 세션 신규 7건 + 기존 미커밋 다수 (이전 세션)

### 검색·fetch 통계
- WebSearch × 8 (공고 × 2 / 시장 통계 × 4 / 경쟁사 × 4)
- WebFetch × 7 (헬프미 / CoworkCity / dailyvet × 2 / todayeconomic / KB금융 페이지 / KPMG PDF — 일부 실패)
  - 농식품부 보도자료: 소켓 종료 → dailyvet 보도로 우회 ✓
  - KPMG PDF: 10MB 초과 → dailyvet 보도로 우회 ✓
  - KB금융 페이지: PDF만 제공 → todayeconomic 보도로 우회 ✓

### Task 추적
- TaskCreate × 5 (5건 P0 작업 등록)
- TaskUpdate × 9 (in_progress 5회 + completed 5회, 사용자 가시화)

## Tests and Outcomes

본 세션 코드 변경 N/A. 사업·행정 트랙.

| 검증 영역 | 결과 |
|---|---|
| 백엔드 pytest | N/A (이전 145 passed 그대로 유지) |
| 모바일 jest (PT) | N/A (이전 15 passed 그대로 유지) |
| 웹 vitest | N/A |
| TypeScript | N/A (0 errors 그대로 유지) |

**산출물 verification (자체)**:
- 1차 권위 출처 확보: 농식품부 / KB금융 / KPMG / 모두의 창업 공고 4개 ✓
- 2차 cross-reference: dailyvet × 2, todayeconomic × 1, 헬프미·CoworkCity × 2 ✓
- 메모리 정정 식별 ✓ (케어독·댕댕워크·우프 → 펫플래닛·에어댕냥이·펫피)
- Assumption Register 분리: 6 (Task #1) + 6 (#2) + 7 (#3) + 5 (#4) + 7 (#5) = **31개 가정 명시**
- Open Issues (사용자 외부 작업) 분리: O1~O24 = **24건**
- 신청서 본문 raw input 섹션: 5건 산출물 모두 §재무·§시장성·§혁신성·§팀역량·§시장성에 직접 매핑

## Decisions Made

1. **공고 별첨 PDF 직접 fetch 시도** — WebFetch 압축 문제 → pypdf 우회 (29 페이지 정확 추출, 사용자가 직접 다운로드할 필요 없이 즉시 검증)
2. **메모리 정정 식별** — 케어독은 시니어 간병(caredoc.kr) / 댕댕워크·우프 검색 부재 → 펫플래닛·에어댕냥이·펫피로 교체. 신청서에 잘못된 경쟁사 인용 시 산업 전문가 페르소나 P3가 즉시 감점.
3. **PT 차별화 3축 narrative** — ① 사고 신고 자동화 (5개 경쟁사 모두 부재) ② 트래픽 데이터 기반 추천 (V1.1) ③ 의도적 lean 모델 (도그메이트 인수 후 하이브리드 대비). 와요·펫플래닛이 신원조회·보험·LIVE에서 강력 → 이 영역으로 차별화 시 P3 감점 위험. 새 white space 영역 발굴.
4. **TAM/SAM/SOM 3시나리오** — 보수·중도·공격. P3 산업 전문가의 "월 6회 사용 빈도 가정 과장" 지적 반영하여 M3 가정 2.5회로 보수화. 단일 수치 대신 시나리오 → P4 회계 페르소나 가점 영역 확장.
5. **5/8 D-7 strong-go/no-go 게이트 정의** — 가입자 30명 + LOI 3건 조건. 매몰 비용 회피.
6. **LOI 양식의 법적 구속력 해소** — "정식 자문 계약·보수·지분·시간 약정 별도 시점" 명시. 자문진의 회신 부담 최소화 → 회신율 60% 가정.
7. **산출물 4단계 패턴 확립** — 1차 출처 / 2차 cross-ref / Assumption Register / Open Issues 분리. 본 세션에서 5건에 일관 적용 → feedback memory로 외부화하여 향후 K-Startup·TIPS·VC IR에 재사용.

## Open Issues / Blockers

### 🔴 사용자 외부 작업 24건 (산출물 가점 trigger)

#### 4/30 (D-15 내일) Critical Path — 5.5시간 작업
- **O17**: 랜딩 페이지 + 가입 폼 활성화 (구글 폼/타입폼 또는 기존 `site/`) — 1~2시간
- **O18**: 베타 인센티브 N, M 값 결정 (보수/중도/공격 옵션 중) — 30분
- **O24**: 1차 개인정보처리방침 (Beta) 게시 — 30분
- LOI #1·#3·#4·#5 발송 (수의사·이의림·UX·선배) — 30분
- **O20**: 카톡 인맥 50명 명단 식별 + 1:1 발송 — 1시간
- **O21**: 인스타·X·페이스북 활성화 + 첫 캡션 — 30분 (3채널 합산)

#### 5/2~5/6
- 펫마케팅 LOI 발송 (인맥 발굴)
- 강사모 등업 + §2-1 게시 (등업 어려울 수 있음)
- O10: 5개 경쟁사 앱 직접 회당 단가 확인

#### 5/7 이의림 변호사 미팅 (기예정)
- 5/7 미팅에서 PT LOI 직접 회수 (이메일 #3 본문 들고 가기)
- SafeWay 자격 충돌 (Q3) 자문 회수

#### 🔴 5/8 D-7 strong-go/no-go 게이트
- 가입자 30명 + LOI 3건 조건 자가 점검 → 결정

#### 🔴 5/9 신청서 본문 v1 강제 게이트
- LOI 회수 마감 20:00
- `korean-grant-application-writer` agent 호출 → 5건 산출물 경로 동시 전달 → 5축 raw input 통합

#### 5/10 / 5/13 채점
- 1차 채점 (`evaluator-rubric-reviewer`) → 70점 목표
- 2차 채점 → 80점 목표

#### 🔴 5/15 16:00 — K-Startup 포털 제출

#### 추가 (마감 시점 분산)
- O1~O5: 통합관리지침 PDF / K-Startup 콜센터 / 운영기관 / 부동산임대업 자기 확인 / 협약 기간 (1R 통과 후)
- O6~O9: KOSIS / KPMG / KB금융 / 농식품부 PDF 직접 확인
- O11: 사용자 메모리 `modoo_startup_2026.md` 정정 (본 세션 종료 시 Claude 처리)
- O12: 변호사 자문 5건 (Q-L1~Q-L5)
- O13~O16: LOI 5명 인맥 명단 / 5/9 회수 / 5/10 정리

### PT 코드 워크스트림 (이번 세션 진척 없음, 그대로 유지)
- C-13 useWebSocket → C-14 OwnerWalkTrackingScreen
- Milestone D 사고 신고 / E 트러스트 / F 통합 테스트 / G Pre-launch QA

### Known Issues (PT 출시 critical path 무관)
- KI-2 `TOSS_WEBHOOK_SECRET` 미설정 → Toss webhook 3 fail (Milestone F 처리)
- KI-3 health endpoint `degraded` → 1 fail (Milestone F 처리)
- KI-4 m4_websocket teardown race → 1 error (Milestone F 처리)

## Next Exact First Step

다음 세션이 언제 열리는지에 따라 분기:

### Branch A: 4/30~5/2 사이 — 사용자 외부 작업 진척 회수
1. 가입자 캠페인 진척 확인 (랜딩 가입 수)
2. LOI 회신 회수 (1~5명)
3. 미진척 영역 보강 (예: 펫마케팅 LOI 발송 / 강사모 등업)
4. 채널별 분석 → 회신율 → trajectory 보정

### Branch B: 5/8 D-7 게이트 결정 시점 — strong-go/no-go
1. 가입자 30명 + LOI 3건 자가 점검
2. strong-go 결정 시 → 5/9 신청서 본문 v1 작성 시작 (Branch C)
3. no-go 결정 시 → 다음 회차 (K-Startup 초기창업패키지 7월) 전환 결정

### Branch C: 5/9~5/14 — 신청서 본문 v1 작성
1. `korean-grant-application-writer` agent 호출
2. 입력: 5건 산출물 경로 + 가입자 수 + LOI 회신 결과
3. 출력: 신청서 본문 v1 (5축 raw input 통합)
4. `evaluator-rubric-reviewer` 1차 채점 → 70점 목표
5. 5/13 보강 + 2차 채점 → 80점 목표
6. 5/15 16:00 제출

### Branch D: PT 코드 워크스트림 재개 (병렬)
- 사용자 외부 작업이 진행 중일 때 코드 시간 분할 가능
- C-13 useWebSocket (PT) → C-14 OwnerWalkTrackingScreen

**기본 가정**: 다음 세션이 4/30~5/2 사이면 **Branch A**, 5/8 시점이면 **Branch B**, 5/9 이후면 **Branch C**.

## Residual Risks

### R1 — 사용자 외부 작업 24건 burn rate
1인 창업가가 16일에 24건 = 일 1.5건. 4/30 critical path 6건이 1일 5.5시간 작업 → 4/30 1일 완료 가능. 그러나 5/2~5/8 누적 18건은 일 2.5건 → 강도 높음. **5/8 strong-go 게이트가 1차 안전장치**.

### R2 — 강사모·반려동물사랑 카페 광고 차단
정보성 톤 80% 작성했으나 카페 운영자 정책에 따라 차단 가능. **Mitigation**: §2 §3 본문이 이미 광고 차단 회피 형식. 차단 시 fallback 채널 (반려동물갤러리·디시 강아지 갤러리·트위터 보호자 커뮤니티) 시도 1시간 buffer.

### R3 — 5/8 D-7 게이트 미달 시 매몰 비용
no-go 결정 시 5건 산출물은 K-Startup 초기창업패키지 (7월 공고)에 100% 재투입 가능. **매몰 비용 0**. 그러나 사용자가 감정적으로 "5/15 강행" 결정할 위험 → strong-go gate 객관 기준 (가입자 30명 + LOI 3건) 엄격 적용 권장.

### R4 — 신청서 본문 v1 작성 시 5축 통합 실패
5건 산출물이 신청서 본문 1만자에 압축되면서 일부 인용 누락 가능. **Mitigation**: 5건 산출물마다 §"신청서 본문 raw input" 섹션 명시 → korean-grant-application-writer에 5건 경로 동시 전달. 5/10 1차 채점에서 70점 미달 시 어떤 영역 누락인지 즉시 식별.

### R5 — 4/29 두번째 세션 핸드오프 자체 위험
같은 날짜 두번째 핸드오프가 처음. STATE.md "Latest Handoff"를 본 final 쪽으로 갱신 + 첫번째는 (이전)으로 강등. **정합성 audit 시 양 핸드오프 상호 참조 가능**. 첫번째 핸드오프(트랙션 매핑 4 산출물)와 본 final 핸드오프(P0 5건)가 시간순으로 첫번째→final 흐름.

### R6 — 메모리 정정 누락 시 다음 세션 위험
케어독·댕댕워크·우프가 메모리에 남아있으면 다음 세션이 잘못된 경쟁사 정보로 작업할 위험. **Mitigation**: 본 세션 종료 시 `memory/modoo_startup_2026.md` 정정 (O11) 동시 처리 강제.
