# Phase 2 Consensus Matrix — 모두의 창업 5/15 실행 패키지

**Date**: 2026-05-03
**Phase**: 2 (Consensus)
**Source Brief**: `artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`
**Reviewers (4)**:
1. frontend-dev — `2026-05-03-modoo-deadline-execution-frontend-review.md` (Confidence 8/10)
2. product-manager — `2026-05-03-modoo-deadline-execution-product-review.md` (Confidence 7/10)
3. korea-fundraising-strategist — `2026-05-03-modoo-deadline-execution-fundraising-review.md` (Confidence 7/10)
4. business-operations-manager — `2026-05-03-modoo-deadline-execution-business-review.md` (Confidence 7/10)

**평균 Confidence**: 7.25/10

---

## 1. OQ 합의 (자동 반영)

| OQ | 결정 | 합의 reviewer | 근거 |
|---|---|---|---|
| OQ-1 Lottie | **Ionicons + View 사용 (Lottie 미설치)** | frontend·product | package.json 직접 확인 — Lottie 미설치. 12일 데드라인에 의존성 추가 비율 안 맞음. Ionicons `paw` 64px 충분 |
| OQ-2 영상 내레이션 | **본인 녹음** | fundraising | 평가위원 신뢰도 ↑ ("실제 창업자" 체감). TTS는 AI 스타트업 신청서에 아이러니. iOS Voice Memo 1회 + CapCut 충분 |
| OQ-3 60일 가설 검증 | **추가하되 §4(실행 계획)에만 배치** | fundraising | "2026-08-09 60일 실측 마일스톤" 구체 날짜 = 구체성 점수 ↑. §3 배치 시 효과성 약점 강조 역효과 |
| OQ-4 ActivityFeed CTA | **Bookings 탭** | frontend·product·fundraising | 활동 피드 mental model = "예약 있고 그 상태 보고 싶다". 빈 Bookings → Search 자연스러운 흐름 |
| OQ-5 영상 업로드 | **YouTube Unlisted** | fundraising | K-Startup 포털 심사관 정부망 접속 → Vimeo 방화벽 차단 사례. YouTube Unlisted = URL 접근 + 검색 비노출 |
| OQ-6 STATE 80줄 | **압축 우선, 80줄 이내 목표** | product·fundraising | 185행 중 완료 마일스톤 이력은 CLAUDE.md 중복 → 삭제 가능. archive-*.md 신설 불필요 |

---

## 2. 합의 사항 (Final Tech Spec 자동 반영)

### A. 산출물 1 (STATE) 추가 요구사항

| ID | 추가 사항 | 출처 |
|---|---|---|
| A-1 | "5/15 신청 > PT 출시 > SafeWay 샌드박스" 3레벨 우선순위 1줄 명시 | product·business |
| A-2 | 5/8 게이트 미달 시 fallback path 1줄 ("가입자 <30 OR LOI <3 시 K-Startup 초기창업패키지 7월 전환, 산출물 3·4 작업 중단") | product·business |
| A-3 | Brief R-7 영향 등급 "낮음" → "중간" 재분류 | business |
| A-4 | SafeWay 5/7 변호사 미팅·5/13~5/14 일정 STATE Critical Path에 병기 | business |

### B. 산출물 2 (ActivityFeedScreen) 추가 요구사항

| ID | 추가 사항 | 출처 |
|---|---|---|
| B-1 | placeholder 텍스트에 **로드맵 기반 phasing** 포함 ("실시간 산책 업데이트 — 6월 정식 출시 예정") — D-1=A 톤 충돌 완화 | product |
| B-2 | `testID="activity-feed-placeholder"` 삽입 (V1.1 21번째 테스트 커버 사전) | frontend |
| B-3 | WCAG AA 명암비 정정: 설명 텍스트 = `Colors.textSecondary` (textDisabled 금지) / CTA 버튼 텍스트 = `Colors.textPrimary` 또는 배경 = `Colors.primaryDark` | product |
| B-4 | 코드 주석에 "navigator 미등록 → CTA non-operational, V1.1 stack 등록 시 자동 동작" 명시 | frontend |

### C. 산출물 3 (inject 가이드) 추가 요구사항

| ID | 추가 사항 | 출처 |
|---|---|---|
| C-1 | **§1 시제 정합 수정** 명시: §1 한 줄 소개 → "AI가 사고를 자동 처리하도록 설계된 반려견 산책 매칭 플랫폼 — 6/9 출시 예정" 또는 §4 phasing 톤을 "V1.0 출시 6/9 포함 AI 5축 완성 예정"으로 시제 정합 | fundraising |
| C-2 | D-1=A 톤 표현 절충: "강한 약속" → "**조건부 약속**" — "V1.0 출시 6/9 ±2d — Track 2 AI 5축(T2.0~T2.6) 완료 조건부" | fundraising |
| C-3 | §6 영상 계획 inject 항목 추가 (F-2=C 결정 반영) | fundraising |
| C-4 | 60일 가설 검증은 §4에만 배치, §3 "2026.10 실측 마일스톤"은 그대로 + "(상세 일정 §4 참조)" 교차 참조 | fundraising |
| C-5 | Track 2 phasing 문장 inject 시 타임라인 정합 한 줄 명시: "Track 2 완료 시점(6/9)은 결과 발표(6월 예상) 이전이므로 1라운드 멘토링(7월) 진입 시 AI 5축 완성 상태" | fundraising |
| C-6 | 5축 inject 점수 영향 추정표 포함 (가능성 +0.5~1 / 구체성 +1~1.5 / 기대효과 0~-0.5 / 차별성 0~+0.5 / 효과성 +1.5~2 (게이트 통과 시)) | fundraising |
| C-7 | 루넨랩스 사업자등록 vs 신청 자격 점검 항목 포함 (5/15 전 완료 시 "예비창업자" → "창업 3년 이내" 수정) | business |

### D. 산출물 4 (영상 시나리오) 추가 요구사항

| ID | 추가 사항 | 출처 |
|---|---|---|
| D-1 | **Hybrid 구조 명시**: 0~25초 = 실녹화 (앱 + GPS), 25~55초 = 슬라이드+음성 (AI 씬), 55~60초 = 클로징 슬라이드. F-2=C 결정 범위 내 | fundraising |
| D-2 | **30초 체크포인트 "AI" 단어 등장 필수**: 자막 또는 음성으로 30초 이내 "AI" 등장 — 차별성 30초 통과 보장 | fundraising |
| D-3 | "Activity 탭 진입 금지" 주의 1줄 (영상 녹화 중 placeholder 화면 노출 방지) | business |
| D-4 | 60초 종료 자막 출시일 표현 = **사용자 결정 필요 (UD-2 참조)** | business |
| D-5 | 영상 미제출 시 이미지 5장 대체 가능성 명시 (특히 슬롯 2 경쟁사 매트릭스·슬롯 5 멀티앱 시너지) | fundraising |

### E. 신청서·영상·앱 3자 일관성 self-audit (5/13 v3 전 추가 작업)

| 항목 | 앱 | 신청서 §1·§3·§4 | 영상 |
|---|---|---|---|
| GPS 실시간 추적 | LiveTrackScreen ✅ | §4 WS 명시 | 25초 시점 지도 (실녹화) |
| AI 캡션 | Track 2 미구현 | §4 phasing | 25~55초 슬라이드 |
| 사고 신고 1탭 | 구현 사전 확인 필요 | §3·§4 "1탭 자동" | 40~55초 슬라이드 |
| ActivityFeed | "준비 중" placeholder | 미언급 | 미노출 |

**작업**: 산출물 3·4 작성 후 5/13 v3 전 표 1개 작성 (15분 작업), 3자 불일치 사전 차단.

---

## 3. 신규 발견 (Brief 미반영, Final Tech Spec 추가)

| ID | 발견 | 출처 | 처리 |
|---|---|---|---|
| N-1 | **SafeWay 5/13 v2.2 vs PT v3 자원 경합** — 1인 창업가 일 6~8h vs 5/13 10~14h 집중 | business | UD-3 (사용자 결정 필요) |
| N-2 | **LOI 5명 지역 기준** — 마포·용산 거주자 최소 2명 우선 추가 | business | 5/3~5/7 외부 작업 즉시 반영 |
| N-3 | **루넨랩스 사업자등록 타이밍** vs 신청 자격 정합성 | business | UD-4 (5/8 게이트 시 확인) |
| N-4 | **5/11 freezing deadline** 설정 — 그 이후 신규 작업 추가 금지 | business | 자동 반영 (Critical Path 갱신) |
| N-5 | **신청서 §1 vs §4 시제 충돌** — 현재 시제 "AI 자동 처리" vs 미래 시제 "5/16~6/9 AI 구현" | fundraising | C-1 inject 가이드에 명시 |
| N-6 | **30초 체크포인트 "AI" 등장 필수** — 차별성 통과 보장 | fundraising | D-2 영상 시나리오 |
| N-7 | **WCAG AA 명암비 미달** (textDisabled 2.5:1, primary CTA 2.8:1) | product | B-3 자동 반영 |
| N-8 | **testID 삽입** — V1.1 21번째 테스트 커버 사전 | frontend | B-2 자동 반영 |
| N-9 | **ActivityFeed 외 화면 MOCK 데이터 잔존 가능성** (HomeScreen·SearchScreen) | product | scope 밖 known risk, V1.0 출시 전 audit 별도 작업 |

---

## 4. 충돌 (사용자 결정 필요)

### UD-1. D-1=A 톤 조정 (fundraising 권고 vs 사용자 기존 결정)

- **fundraising**: D-1=A 톤을 "강한 약속"에서 "**조건부 약속**"으로 절충 — "V1.0 출시 6/9 ±2d — Track 2 AI 5축(T2.0~T2.6) 완료 조건부"
- **business**: 6/9 타깃 유지가 D-1=A 사후 위험 최선 완화. 톤 조정은 영상 자막에서만 검토 권고
- **product**: placeholder 텍스트도 D-1=A 톤과의 cognitive dissonance 해소 위해 phasing 표현 필요 (B-1 자동 반영)
- **사용자 기존 결정 (D-1=A)**: 6/9 동작 약속 유지

**제안 절충**: D-1=A 톤은 신청서 §1에서 강하게 유지하되, §4 phasing 문장과 영상 자막에는 "조건부 약속" 표현으로 fundraising 권고를 부분 반영. **사용자 명시 결정 필요**.

### UD-2. 영상 60초 종료 자막 출시일 표현

- **business**: "2026.06.09 출시 예정" → "2026 상반기 출시 예정" 검토. 영상이 출시일 가장 구체 고정 매체 → slip 시 신뢰도 문제 직접
- **fundraising**: 60초 종료 시 "구체성" 인식 메시지 필요 → 구체 날짜 권고

**충돌**: 사용자 결정 필요. 보수적("상반기") vs 구체적("06.09") 사이.

### UD-3. SafeWay v2.2 일정 — 5/13 → 5/14 연기

- **business**: 1일 연기로 5/13을 PT v3 전용 확보. SafeWay 타임라인에서 5/14 = "운영기관 사전 전달" 전날 → v2.2 확정 + 사전 전달 같은 날 처리 가능
- **조건**: 5/8~5/13 SafeWay v2.1 페르소나 검토 정상 진행

**사용자 결정 필요** (5/7 이전).

### UD-4. 루넨랩스 사업자등록 완료 예상일

- **business**: 5/15 전 완료 시 신청서 자격란 "예비창업자" → "창업 3년 이내" 수정 필요할 수 있음
- **사용자 결정 필요** (5/8 게이트 시 확인).

---

## 5. Confidence 종합

| Reviewer | Confidence | 핵심 우려 |
|---|---|---|
| frontend-dev | 8/10 | navigator 미등록 → CTA 기기 검증 불가, AC-2.3 jest 자동 회귀 감지 밖. 모두 허용 제약, 블로커 아님 |
| product-manager | 7/10 | placeholder tone D-1=A 충돌 미해소, 산출물 3-4 정합성 명시 부재 |
| fundraising | 7/10 | §1 시제 충돌, D-1=A vs 외부 계정 미확보 조합. 5/8 게이트 통과 + §1 시제 정합 = 두 필수 조건 |
| business | 7/10 | 5/8 게이트 충족 불확실, SafeWay 5/13 자원 경합 |

**평균 7.25/10** — 합리적 출발점. 4건의 사용자 결정(UD-1~UD-4) 해소 시 Phase 3 Final Tech Spec 작성 → Phase 4 Implementation 진입 가능.

---

## 6. Phase 3 Final Tech Spec 작성 시 반영 항목

1. **OQ 합의 6건** (자동 반영) — Ionicons / 본인 녹음 / 60일 §4만 / Bookings / YouTube Unlisted / STATE 압축
2. **합의 사항 A·B·C·D·E** — 17건 (산출물별 추가 요구사항)
3. **신규 발견 N-1·N-2·N-4·N-5·N-6·N-7·N-8** — 자동 반영
4. **N-9 (ActivityFeed 외 MOCK 데이터)** — scope 밖 known risk, Out-of-Scope에 명시
5. **사용자 결정 (UD-1~UD-4)** — Phase 3 작성 전 또는 Phase 5 진입 전 해소

---

## 7. 권고 진행 방식

Phase 3 Final Tech Spec 즉시 작성. UD-1~UD-4 해소 사항은:
- **UD-1·UD-2**: Phase 3 spec에 "사용자 결정 게이트"로 표시, 기본값 = 사용자 D-1=A 유지 + 영상 자막 "06.09" (가장 구체적)
- **UD-3**: Phase 4 Todo Plan에 "5/7 사용자 결정 게이트" 항목 명시
- **UD-4**: Phase 4 Todo Plan에 "5/8 게이트 시 확인" 항목 명시

**Phase 3 진입 가능**.

---

**서명**: Claude Code (Phase 2 Consensus) | 2026-05-03
