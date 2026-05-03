# Session Handoff — 2026-04-29

## Current Status

모두의 창업 프로젝트 2026 (중기부 공고 제2026-275호) PT 신청 트랙의 트랙션 매핑 + 사전 채점 사이클을 1세션에 완주. 4개 specialist agent (`traction-data-builder` / `business-operations-manager` / `korea-fundraising-strategist` / `evaluator-rubric-reviewer`) 병렬 호출 → 4개 산출물 작성 → 5 페르소나 사전 채점 결과 평균 52.8/100 (합격선 70 / 차이 -17.2) 도출. PT V1.0 코드 워크스트림(Milestone C 모바일 통합 트랙)은 이번 세션에서 진척 없음 — 다음 세션 첫 액션 그대로 유지.

## Changed Files

본 세션에서 신규 생성·수정한 파일만 기록 (이전 세션 잔여 미커밋 변경사항은 별도).

### 신규 작성
- `artifacts/business/traction/2026-04-27-pt-traction-inventory.md` — Raw 트랙션 인벤토리 50개 데이터 포인트 + Gap 13개 + 신뢰도 라벨링 가이드 (재사용 자산: TIPS·VC IR 등 향후 신청서에 재투입)
- `artifacts/business/fundraising/2026-04-27-modoo-startup-pt-traction-mapping.md` — 5축 평가표 매핑 (필요성/혁신성/시장성/실현가능성/팀역량) + 자금 사용 계획 1억원 배분표 + 8 페르소나 답변 + D-18 일정
- `artifacts/business/fundraising/2026-04-27-modoo-startup-pt-multiapp-narrative.md` — 멀티앱 시너지 정량화 (백엔드 PT→CC 87% 재사용, 모바일 50~55%, 인프라 marginal cost +3,000~5,000원/월) + 회계 페르소나 7 답변
- `artifacts/business/fundraising/2026-04-27-modoo-startup-pt-rubric-review.md` — 5 페르소나 사전 채점 결과 (KISED 52.3 / VC 40.0 / 산업전문가 55.0 / 회계 66.7 / 1인 멘토 50.0) + Top 10 약점 + Top 5 강점 + D-18 P0~P2 액션 + 제출 판정

### 신규 디렉토리
- `artifacts/business/traction/` — traction raw 인벤토리 전용 (재사용 자산 영역)

### 메모리 갱신 (사용자 메모리)
- `memory/modoo_startup_2026.md` — 4개 산출물 경로 + 5 페르소나 채점 결과 + D-18 P0 4건 액션 + 5/8 D-7 strong-go/no-go 게이트 추가

## Commands Executed

### 코드베이스 트랙션 신호 측정
- `find backend mobile web site packages -name "*.py" -o ... | wc -l` — 전체 50,417 LOC
- 디렉토리별 LOC 측정: backend 24,379 / mobile 12,665 / web 10,827 / site 1,361 / packages 1,185
- 테스트 파일 카운트: backend 20 / mobile 17 / web 12
- `ls backend/app/apps/` — 멀티앱 분리 확인 (pettracker + careconnect)

### 산출물 생성
- `mkdir -p artifacts/business/traction` — traction 디렉토리 신규 생성
- Write × 4 — 4개 산출물 파일
- Edit × 1 — 메모리 갱신

### Agent 호출
- `Agent(traction-data-builder)` × 2회 (1차 컨텍스트 과다로 결과 불완전 → 2차 좁은 scope 재호출 성공)
- `Agent(business-operations-manager)` × 1회 — 사전 가입자 3 시나리오 + Unit Economics + 멀티앱 시너지
- `Agent(korea-fundraising-strategist)` × 1회 — 5축 매핑 + 자금 계획 + 페르소나 답변 + D-18 우선순위
- `Agent(evaluator-rubric-reviewer)` × 1회 — 5 페르소나 사전 채점

## Tests and Outcomes

본 세션은 코드 변경 없음. 사업·행정 트랙 작업이므로 테스트 N/A.

- 백엔드 pytest: N/A (이번 세션 코드 변경 없음, STATE.md 145 passed 그대로 유지)
- 모바일 jest: N/A (15 passed 그대로 유지)
- 웹 vitest: N/A
- TypeScript: N/A (0 errors 그대로 유지)

**산출물 검증** (5 페르소나 사전 채점):
- KISED 평가위원: 52.3/100 (합격선 70, -17.7)
- VC 심사역: 40.0/100 (시드 미팅 기준 60, -20)
- 산업 전문가 (전 도그메이트·와요 임원 가정): 55.0/100 (C 등급 경계)
- 회계·세무 검토관: 66.7/100 (-3.3, 합격선 근접)
- 1인 창업가 멘토: 50.0/100 (-20)
- **5 페르소나 평균: 52.8/100 (합격선 -17.2)**

## Decisions Made

1. **모두의 창업 신청 트랙 산출물 4개 묶음으로 구조화 결정** — raw 인벤토리 (재사용) + 5축 매핑 (신청서 raw input) + 멀티앱 narrative (1인 페널티 보강) + 사전 채점 (red team)의 4파일 구조. 향후 TIPS·K-Startup 초기창업패키지·VC IR에 1번 산출물(raw 인벤토리)을 재투입하는 자산 구조 확립.

2. **5/8 D-7 strong-go/no-go 게이트 정의** — P0 4건 (가입자 50명 / LOI 5건 / 시장 출처 / 경쟁사 비교표) 중 가입자 30명 + LOI 3건 이상 5/8 확보 시 5/15 제출 강행, 미달 시 다음 회차(K-Startup 초기창업패키지) 전환. 근거: 5 페르소나 채점 결과 P0 완료 시 68~73점으로 합격 분기점 진입.

3. **신청서 본문에서 멀티앱 narrative 비중 축소 결정** — VC 페르소나(P2)가 "집중도 부족"으로 감점한 결과 반영. PT 100% 집중 메시지 강화 + CC·SafeWay는 "확장성 근거"로만 1문단 압축. VC IR 준비 시에는 반대로 멀티앱 시너지 전면 배치 (별도 트랙).

4. **Unit Economics 추정 투명화 + 검증 마일스톤 명시 결정** — Lifetime 14개월 / CAC 15,000원 / LTV 52,500원이 전량 베타 추정임을 숨기지 않고 Assumption Register로 공개 + "2026-10 3개월 검증 마일스톤" 명시. 회계 페르소나(P4)의 "추정의 추정 구조" 지적 대응.

## Open Issues / Blockers

### 본 세션에서 새로 식별된 외부 작업 (사용자 직접)
- 🟡 **D-18 P0-1**: 사전 가입자 50명 캠페인 시작 (랜딩 가입 폼 동작 확인 + 강사모·반려동물 사랑 카페 정보성 게시물 1개씩) — 5/15 마감, 시장성 +8~10점 회복 예상
- 🟡 **D-18 P0-2**: 자문진 LOI 5건 이메일 발송 (수의사 / 펫 마케팅 / 이의림 변호사 (기확보) / UX 디자이너 / 도메인 선배 창업가) — 5/9 마감, 팀역량 +7~9점
- 🟡 **D-18 P0-3**: KB금융 + 농식품부 + KOSIS 3개 출처 인용 + TAM/SAM/SOM 외부 근거 — 5/3 마감, 시장성 +5~7점
- 🟡 **D-18 P0-4**: 경쟁사 비교표 (도그메이트·와요·케어독·댕댕워크 vs PT) — 5/6 마감, 혁신성 +3~5점
- 🟡 **공고 별첨 사업비 집행 지침 확인** (예비비 5% 한도 여부 + 본인 인건비 가부) — 4/28 D-Day 지났음, 즉시 확인 필요

### PT 코드 워크스트림 (이번 세션 진척 없음, 그대로 유지)
- 🟡 **Milestone C-13 useWebSocket** (PT) — 다음 세션 첫 단계
- 🟡 Milestone C-14 OwnerWalkTrackingScreen
- 🟡 Milestone D 사고 신고 / E 트러스트 / F 통합 테스트 / G Pre-launch QA

### SafeWay 샌드박스 트랙 (병렬, 이번 세션 진척 없음)
- 🟡 K-Startup 일반상담 Q1~Q16 회신 대기
- 🟡 이의림 변호사 5/7 미팅 (Q3 SafeWay-PT 자격 충돌 자문)

### Known Issues (PT 출시 critical path 무관, 그대로)
- KI-2 `TOSS_WEBHOOK_SECRET` 미설정
- KI-3 health endpoint `degraded`
- KI-4 m4_websocket teardown race

## Next Exact First Step

**다음 세션 분기 (사용자 결정 필요):**

### Branch A: 모두의 창업 트랙 진행 (사용자 외부 작업 결과 회수)
사용자가 D-18 P0 4건 중 일부를 진행했다면, 결과를 받아 신청서 본문 작성 단계로 진입:
1. P0-3 (시장 출처 인용) 완료 시 → KOSIS·KB금융 자료 받아 신청서 §시장성 raw input 강화
2. P0-2 (LOI) 진척 시 → 회신 받은 자문진을 신청서 §팀역량 + 별첨에 통합
3. P0-4 (경쟁사 비교) 진척 시 → korea-fundraising-strategist 호출하여 비교표 작성
4. **5/9 강제 게이트**: korean-grant-application-writer 호출 → 신청서 본문 v1 초안

### Branch B: PT 코드 워크스트림 재개 (Milestone C 잔여)
사용자가 모두의 창업 트랙은 외부 작업 진행 중이라고 답하면, 코드 진척으로 전환:
1. **C-13 useWebSocket (PT)** — packages/core-mobile에 WebSocket 훅 추가, JWT/Firebase 토큰 자동 첨부, 재연결·하트비트 처리
2. C-14 OwnerWalkTrackingScreen — 보호자 산책 실시간 추적 UI
3. 검증 게이트: 백엔드 145 passed + PT jest 15 passed + TS 0 errors 유지

**기본 가정**: 사용자가 "이어가자"로 진입 시 Branch A 우선 (5/15 마감 임박, P0 진척 회수가 critical path).

## Residual Risks

### 모두의 창업 트랙 리스크
- **R1: D-18 내 P0 4건 동시 진행 부담** — 사용자가 1인 창업가로서 가입자 캠페인 + LOI 발송 + 시장 조사 + 경쟁사 비교를 동시에 할 때 번아웃 가능. 우선순위는 P0-2 (LOI, 가장 시간 소요) → P0-1 (가입자, 누적 효과) → P0-3 (시장 출처, 반일) → P0-4 (경쟁사 비교, 2일).
- **R2: 사전 가입자 캠페인 0~10명 정체 시** — 5/8 D-7 게이트 미달 → 다음 회차 전환 결정. 매몰 비용 회피 필요.
- **R3: 산업 전문가 페르소나 지적 ("월 6회 사용 빈도 가정 과장")** — 실제 시장 데이터 기준 1.8~2.3회 가능성. Realistic MRR 시나리오가 절반(110K)으로 하락 시 신청서 §재무 재설계 필요. 검증은 출시 후 3개월 (2026-10 마일스톤).
- **R4: 모두의 창업 공고 평가표 별첨 미확인 상태** — 5축 가중치가 추정에서 벗어날 가능성. 4/28 사용자 직접 확인 D-Day 지났으므로 즉시 확인 필요.

### PT 코드 워크스트림 리스크
- **R5: Milestone C 모바일 통합 트랙 잔여 진척 없음** — 6/4 출시 타깃 대비 5주 가속 필요. 모두의 창업 트랙 D-18 P0 작업으로 코드 시간 분할 발생.

### SafeWay 샌드박스 트랙 리스크
- **R6: 이의림 변호사 5/7 미팅 → SafeWay-PT 자격 충돌 자문 결과** — 모두의 창업 예비창업자 자격 vs 샌드박스 신청 충돌 시 옵션 선택 필요. 5/15 모두의 창업 제출 전 결정 게이트.

### Mitigation
- R1·R2·R5: 사용자가 D-18 P0 진척 점검을 매일 자가 점검 (자율). Claude는 5/3·5/6·5/8 마일스톤마다 진척 회수 리포트 생성.
- R3: 신청서 §재무에 시나리오 3개 (Conservative/Realistic/Aggressive) 모두 기재 + Assumption Register 별첨.
- R4: 다음 세션 첫 액션이 "공고 별첨 평가표 확인"이 될 수 있음.
- R6: 5/7 미팅 결과 즉시 STATE.md / 메모리 반영 + 5/15 제출 분기 결정 게이트 추가.
