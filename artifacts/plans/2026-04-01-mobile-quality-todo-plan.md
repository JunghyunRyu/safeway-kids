# Todo Plan: 모바일 앱 품질 개선

**작성일:** 2026-04-01
**Phase:** 4 — Todo Plan
**입력:** Final Tech Spec

---

## Milestone A: 접근성 + 성능 (P0 + P1 핵심)

**담당:** Accessibility Specialist + Performance Engineer

| # | Task | 파일 | 담당 |
|---|------|------|------|
| A1 | 전 화면 Pressable/TouchableOpacity에 accessibilityRole="button" 추가 | 22개 화면 | A11y |
| A2 | 전 Image에 accessibilityLabel 추가 | RouteScreen 등 | A11y |
| A3 | TextInput에 accessibilityLabel/Hint 추가 | LoginScreen, ProfileScreen 등 | A11y |
| A4 | ProfileScreen tickets.map() → FlatList | ProfileScreen.tsx:307 | Perf |
| A5 | ScheduleScreen students.map() → FlatList (수평) | ScheduleScreen.tsx:505 | Perf |
| A6 | HomeScreen students.map() → FlatList (수평) | HomeScreen.tsx:213 | Perf |
| A7 | ConsentScreen unconsentedStudents.map() → FlatList | ConsentScreen.tsx:242 | Perf |
| A8 | ScheduleScreen FlatList keyExtractor 추가 | ScheduleScreen.tsx | Perf |
| A9 | 기존 36개 테스트 통과 확인 | __tests__/ | Perf |

## Milestone B: 아키텍처 리팩토링 (P1)

**담당:** Architecture Lead

| # | Task | 원본 파일 | 산출물 |
|---|------|----------|--------|
| B1 | RouteScreen.tsx 분리 — useRouteActions 훅 추출 | RouteScreen.tsx | hooks/useRouteActions.ts |
| B2 | RouteScreen.tsx 분리 — StopCard 별도 파일 이동 | RouteScreen.tsx | components/StopCard.tsx |
| B3 | RouteScreen.tsx 분리 — RouteHeader 추출 | RouteScreen.tsx | components/RouteHeader.tsx |
| B4 | RouteScreen.tsx 분리 — VehicleClearance 추출 | RouteScreen.tsx | components/VehicleClearance.tsx |
| B5 | RouteScreen.tsx 분리 — MemoModal 추출 | RouteScreen.tsx | components/MemoModal.tsx |
| B6 | RouteScreen.tsx 분리 — BatchBoardingBar 추출 | RouteScreen.tsx | components/BatchBoardingBar.tsx |
| B7 | RouteScreen.tsx 메인 파일 정리 (≤250줄) | RouteScreen.tsx | RouteScreen.tsx |
| B8 | ScheduleScreen.tsx 분리 — scheduleHelpers 추출 | ScheduleScreen.tsx | utils/scheduleHelpers.ts |
| B9 | ScheduleScreen.tsx 분리 — DailyView 추출 | ScheduleScreen.tsx | components/DailyView.tsx |
| B10 | ScheduleScreen.tsx 분리 — WeeklyView 추출 | ScheduleScreen.tsx | components/WeeklyView.tsx |
| B11 | ScheduleScreen.tsx 분리 — MonthlyView 추출 | ScheduleScreen.tsx | components/MonthlyView.tsx |
| B12 | ScheduleScreen.tsx 분리 — CancelModal 추출 | ScheduleScreen.tsx | components/CancelModal.tsx |
| B13 | ProfileScreen.tsx 분리 — ProfileHeader 추출 | ProfileScreen.tsx | components/ProfileHeader.tsx |
| B14 | ProfileScreen.tsx 분리 — SettingsMenu 추출 | ProfileScreen.tsx | components/SettingsMenu.tsx |
| B15 | ProfileScreen.tsx 분리 — TicketsModal 추출 | ProfileScreen.tsx | components/TicketsModal.tsx |
| B16 | ProfileScreen.tsx 분리 — SupportFormModal 추출 | ProfileScreen.tsx | components/SupportFormModal.tsx |
| B17 | ConsentScreen.tsx 분리 — ConsentCard + ConsentDetail | ConsentScreen.tsx | components/ |
| B18 | BillingScreen.tsx 분리 — InvoiceCard + PaymentModal | BillingScreen.tsx | components/ |
| B19 | 기존 테스트 import 경로 수정 + 통과 확인 | __tests__/ | |

## Milestone C: 코드 품질 + 테스트 (P1-P2)

**담당:** Code Quality Lead + Test Engineer

| # | Task | 범위 |
|---|------|------|
| C1 | 인라인 스타일 → StyleSheet.create() | BillingScreen, ChildProfileScreen, ProfileScreen |
| C2 | 비즈니스 로직 매직넘버 상수화 | 주요 화면 (timeout, interval, 상수값) |
| C3 | StopCard 컴포넌트 테스트 작성 | 렌더링 + 접근성 |
| C4 | RouteHeader 컴포넌트 테스트 작성 | 토글 동작 |
| C5 | VehicleClearance 컴포넌트 테스트 작성 | 체크리스트 플로우 |
| C6 | DailyView 컴포넌트 테스트 작성 | 데이터 필터링 |
| C7 | WeeklyView 컴포넌트 테스트 작성 | 주간 렌더링 |
| C8 | ProfileHeader 컴포넌트 테스트 작성 | 사용자 정보 |
| C9 | InvoiceCard 컴포넌트 테스트 작성 | 금액 포매팅 |
| C10 | SettingsMenu 컴포넌트 테스트 작성 | 메뉴 탭 동작 |

## Milestone D: 검증 + 마무리 (P2)

**담당:** Release Manager + 전원

| # | Task |
|---|------|
| D1 | TypeScript 컴파일 검증 (npx tsc --noEmit) |
| D2 | 전체 테스트 실행 (npx jest --verbose) |
| D3 | MCP 종합 분석 재실행 (이슈 수 비교) |
| D4 | 최종 커밋 + PR 준비 |

---

## 실행 순서

```
A9 (기존 테스트 확인)
  → A1-A3 (접근성) + A4-A8 (성능)  [병렬]
    → B1-B7 (RouteScreen 분리)
    → B8-B12 (ScheduleScreen 분리)  [병렬 with B1-B7]
    → B13-B16 (ProfileScreen 분리)
    → B17-B18 (Consent + Billing 분리)
    → B19 (테스트 수정)
      → C1-C2 (코드 품질)
      → C3-C10 (신규 테스트)  [병렬 with C1-C2]
        → D1-D4 (검증)
```

## 팀 배정

| 역할 | 마일스톤 | 주요 작업 |
|------|---------|----------|
| Accessibility Specialist | A | A1-A3 |
| Performance Engineer | A | A4-A9 |
| Architecture Lead | B | B1-B19 |
| Code Quality Lead | C | C1-C2 |
| Test Engineer | C | C3-C10 |
| Release Manager | D | D1-D4 |
