# Phase 1 Independent Review — 모두의 창업 5/15 실행 패키지 (Product Manager)

**Date**: 2026-05-03
**Reviewer role**: Product Manager
**Domain**: 4 산출물 전체 scope·우선순위, 특히 산출물 2 MOCK_FEED placeholder UX
**Source brief**: `artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`

---

## 1. Requirement Restatement

이 패키지는 5/15 신청서 제출 단일 외부 데드라인에 역산된 위험 차단 묶음. 4개 산출물 공통 목적은 평가위원이 신청서·영상·앱을 교차 검토할 때 내러티브 일관성이 깨지지 않도록 하는 것.

- **산출물 1 (STATE)**: 5/3 이후 세션이 잘못된 prior state에서 출발하지 않도록 ground truth 갱신
- **산출물 2 (ActivityFeedScreen)**: 평가위원 앱 직접 설치 시 MOCK 데이터 노출 차단 + 보호자 빈 화면 온보딩
- **산출물 3 (inject 가이드)**: D-3·F-2 결정을 5/9 한 세션에서 수술적 편집으로 v2 완성
- **산출물 4 (영상 시나리오)**: F-2=C와 25~55초 AI 씬 구조 5/12 단독 제작 가능 수준 구체화

---

## 2. Missing Requirements

### 2-A. STATE 갱신 캡처 범위

**누락 1 (HIGH)**: SafeWay Kids 샌드박스 우선순위 관계. STATE에 "5/15 신청 > PT 출시 > SafeWay 샌드박스" 3레벨 우선화 명시되지 않으면, 다음 세션 우선순위 충돌 자동 감지 불가. SafeWay 5/7 이의림 변호사 미팅이 PT 신청 critical path와 겹침.

**누락 2 (MEDIUM)**: 5/8 게이트 미달 시 fallback 경로. R-7 "K-Startup 7월 전환" 위험에 대한 fallback path STATE 미기재 → 게이트 미달 당일 혼선. "가입자 <30 OR LOI <3 시 K-Startup 초기창업패키지 7월 전환, 산출물 3·4 작업 중단" 1줄 필요.

### 2-B. placeholder 인지 모델

평가위원: "준비 중"이 "정직한 UI" 또는 "미완성 앱" 분기 — tone에 좌우. 단순 "준비 중"은 후자로 읽힘. "활성 산책 세션이 시작되면 실시간 업데이트를 여기서 받아보세요" 수준 조건부 설명 필요.

실 보호자: 빈 화면 → 앱 결함 인식. CTA 필수.

**Brief 누락**: placeholder 텍스트가 조건(산책 예약 없음)을 설명해야 한다는 명시적 요구사항 부재.

### 2-C. 산출물 3·4 정합성

Brief FR-8은 25~55초 슬라이드+음성 명시. 그러나 신청서 §1("AI가 사고 자동 처리")이 약속하는 기능이 영상에 어떻게 등장하는지 명시적 연결 부재. 산출물 3·4 내러티브 anchor 동일성 요구사항 누락. 5/12 영상 촬영 후 불일치 표면화 위험.

---

## 3. Conflicts

### 3-A. F-1(MOCK_FEED 즉시 제거) vs D-4(Track 2 T2.3 후 실 API)

placeholder가 5/16~6/8 6주 지속. 이 기간 앱이 신청서 약속한 "실시간 활동 피드" 미제공. 평가위원 재확인 또는 LOI 제출자 설치 시 gap 노출. placeholder에 "베타 출시 예정 6월" 같은 구체적 기대치 문구 포함 여부 Brief에 없음.

### 3-B. D-1=A 톤 vs placeholder

D-1=A는 §1 "AI가 사고 자동 처리·산책 리포트" 약속. 평가위원이 앱 열면 ActivityFeed는 "준비 중". cognitive dissonance vs 정직한 상태 표시 — 분기점은 placeholder 문구. "AI 기능 개발 중" 또는 "실시간 리포트 — Track 2 구현 예정 (6월)" 로드맵 기반 문구가 dissonance ↓.

---

## 4. Technical Risks (Product 관점)

| ID | 위험 | 수준 |
|---|---|---|
| R-A | 평가위원 앱 직접 다운로드 시 ActivityFeed 외 다른 화면 (HomeScreen·SearchScreen) MOCK 데이터 잔존 | scope 밖 known risk |
| R-B | Beachhead 마포·용산 사용자 거주지·인맥·SNS 분포 정합성 미검증 | "왜 그 지역?" 질문 시 근거 약함 |
| R-C | 5/8 게이트 미달 시 inject 60~70% 재사용 가능하다지만 어느 10~40%인지 미명시 | 7일 재작업 가능 여부 불명 |

---

## 5. Alternative Designs

### 5-A. 산출물 2 — placeholder 교체가 최선

OwnerTabNavigator 4 탭 = Home/Search/Bookings/Profile. ActivityFeed 탭 미등록, stack 진입. **placeholder 교체가 가장 직접적·최소 변경**. HomeScreen "6월 오픈" 배지는 NFR-1 위반 가능.

### 5-B. STATE — 압축 우선

185행 중 완료 마일스톤 이력(M0~M9)은 CLAUDE.md "프로젝트 진행 현황"에 중복 기재 → 삭제해도 정보 손실 없음. archive-*.md 신설은 불필요. 80줄 이내 압축 목표.

### 5-C. 산출물 3 — 박스 형식 유지

diff 형식은 줄 번호 기반 → v1 구조 변경 시 오정렬. 7개 항목 독립 편집 단위로 박스 형식 더 실용적.

---

## 6. Testing Concerns

### 6-A. 산출물 2 smoke test

수동 3건: (1) OwnerTabNavigator 4 탭 진입 (2) ActivityFeed 진입 후 CTA → Bookings (3) 헤더 뒤로가기.

### 6-B. 접근성 — 명암비

- `Colors.textDisabled('#B8A890')` on `Colors.background('#FFF8F0')` ≈ 2.5:1 → **WCAG AA 미달**. `Colors.textSecondary('#7A6A52')` 사용.
- CTA 버튼 `Colors.primary('#F4A22D')` + 흰색 텍스트 ≈ 2.8:1 → **WCAG AA 미달**. CTA 텍스트 `Colors.textPrimary('#2E1E0A')` 또는 배경 `Colors.primaryDark('#C47D10')` 강화.

### 6-C. 신청서·영상·앱 3자 일관성 self-audit

5/13 v3 작업 전 "신청서 §1·§3 약속 — 영상 씬 — 앱 화면" 3열 매핑 표 작성 권고. 표 1개, 15분 작업으로 3자 불일치 사전 차단.

---

## 7. Confidence

**7/10**

Brief 충실. FR/NFR/AC 구조 명확, readiness verdict 타당. **감점 2건**:
1. placeholder tone D-1=A 충돌 미해소 → 5/9 v2 후 표면화 시 코드 재수정
2. 산출물 3·4 정합성 명시 부재 → 5/12 영상 후 불일치 위험

---

## 8. OQ 결정 권고

**OQ-1 Lottie**: **Ionicons 기본값 유지**. 단일 화면 위해 의존성·EAS Build 네이티브 설정 추가는 12일 데드라인에서 비율 안 맞음. Track 2 T2.3 실 피드와 함께 도입 자연스러움.

**OQ-4 CTA 대상**: **Bookings**. 활동 피드 mental model = "예약 있고 그 상태 보고 싶다". Search는 맥락 어긋남. Bookings = "예약 현황 확인" + 빈 Bookings에서 Search로 자연스러운 흐름. 탭명 "예약" mental model 일치.

**OQ-6 STATE 80줄**: **압축 우선**. 185행 중 과거 마일스톤 이력은 CLAUDE.md 중복 → 삭제 가능. 80줄 이내 압축.

---

## Summary Table

| 항목 | 심각도 | 권고 |
|---|---|---|
| placeholder tone — D-1=A 충돌 | 높음 | 조건부 설명 + 로드맵 기반 ("6월 오픈") |
| 산출물 3-4 정합성 누락 | 중간 | 5/13 v3 전 3열 self-audit |
| STATE fallback path 미기재 | 중간 | 5/8 게이트 미달 조건 1줄 |
| SafeWay 우선순위 미명시 | 중간 | STATE 3레벨 우선순위 1줄 |
| CTA 버튼 명암비 미달 | 낮음 | primaryDark or textPrimary |
| 설명 텍스트 명암비 미달 | 낮음 | textSecondary |
| Beachhead 사용자 검증 부재 | 낮음 | inject 시 근거 확보 |
| OQ-1·4·6 | 결정 완료 | Ionicons / Bookings / 압축 |

---

참조: Brief / ActivityFeedScreen.tsx / OwnerTabNavigator.tsx / theme.ts
