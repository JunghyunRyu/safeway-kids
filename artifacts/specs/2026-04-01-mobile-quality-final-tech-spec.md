# Final Tech Spec: 모바일 앱 품질 개선

**작성일:** 2026-04-01
**Phase:** 3 — Final Tech Spec
**상태:** APPROVED
**입력:** Requirement Brief + Consensus Matrix

---

## 1. Problem Statement

SafeWay Kids 모바일 앱은 기능적으로 완성(18,500+ LOC)되었으나, 접근성 미비(42건), 성능 문제(46건), 거대 파일(7개), 테스트 부족(35건)으로 앱스토어 제출 품질에 미달한다.

## 2. Goals / Non-goals

### Goals
- G1: 전 화면 접근성 속성 완비 (스토어 리젝 방지)
- G2: ScrollView+map → FlatList 전환 (동적 데이터)
- G3: 300줄 이하로 파일 분리 (5개 거대 파일)
- G4: 비즈니스 로직 매직넘버 상수화 + 인라인 스타일 추출
- G5: 리팩토링된 컴포넌트 테스트 작성
- G6: TypeScript 0 errors + 전체 테스트 통과

### Non-goals
- 새 기능 추가
- 백엔드 API 변경
- 디자인 시스템(theme.ts) 변경
- Deprecated Navigator 수정 (오탐 확인됨 — 현재 최신 React Navigation 7 사용 중)

## 3. User Scenarios

| 시나리오 | 개선 전 | 개선 후 |
|---------|--------|--------|
| 시각장애 부모가 스케줄 확인 | 스크린 리더가 버튼 인식 불가 | accessibilityRole/Label로 안내 |
| 기사가 20명 학생 노선 확인 | ScrollView에 20명 전부 마운트 | FlatList로 화면 밖 학생 언마운트 |
| 개발자가 RouteScreen 버그 수정 | 1,367줄에서 원인 파악 어려움 | 200줄 이하 서브컴포넌트에서 빠르게 위치 |

## 4. Architecture & Data Flow

### 4.1 파일 분리 설계

#### RouteScreen.tsx (1,367줄 → 7개 파일)

```
src/screens/driver/
├── RouteScreen.tsx           (≤250줄) — 메인 컨테이너, 상태 관리
├── components/
│   ├── StopCard.tsx          (≤200줄) — 정류장 카드 (기존 memoized)
│   ├── RouteHeader.tsx       (≤80줄)  — 상단 헤더 + 노선 토글
│   ├── RouteBanner.tsx       (≤60줄)  — 배너 영역
│   ├── VehicleClearance.tsx  (≤120줄) — 잔류확인 체크리스트 + 모달
│   ├── MemoModal.tsx         (≤80줄)  — 메모 입력 모달
│   └── BatchBoardingBar.tsx  (≤60줄)  — 일괄 탑승 바
└── hooks/
    └── useRouteActions.ts    (≤150줄) — handleBoard/Alight/NoShow/Undo/Reorder/Memo 콜백
```

**데이터 흐름:**
```
RouteScreen (state owner)
  ├── useRouteActions(schedules, load) → handlers
  ├── RouteHeader(routeActive, onToggle)
  ├── RouteBanner(stats)
  ├── FlatList renderItem={StopCard}
  │     └── StopCard(schedule, handlers)
  ├── BatchBoardingBar(onBatchBoard)
  ├── VehicleClearance(visible, onComplete)
  └── MemoModal(visible, onSave)
```

#### ScheduleScreen.tsx (852줄 → 6개 파일)

```
src/screens/parent/
├── ScheduleScreen.tsx        (≤200줄) — 메인 컨테이너, 뷰 모드 전환
├── components/
│   ├── ScheduleItem.tsx      (≤140줄) — 스케줄 항목 카드 (기존 memoized)
│   ├── DailyView.tsx         (≤150줄) — 일일 스케줄 뷰
│   ├── WeeklyView.tsx        (≤200줄) — 주간 캘린더 뷰
│   ├── MonthlyView.tsx       (≤100줄) — 월간 캘린더 그리드
│   └── CancelModal.tsx       (≤80줄)  — 취소 확인 모달
└── utils/
    └── scheduleHelpers.ts    (≤80줄)  — 날짜 포매팅, 필터링 함수
```

#### ProfileScreen.tsx (604줄 → 5개 파일)

```
src/screens/parent/
├── ProfileScreen.tsx         (≤200줄) — 메인 컨테이너
├── components/
│   ├── ProfileHeader.tsx     (≤80줄)  — 아바타 + 계정 정보
│   ├── SettingsMenu.tsx      (≤100줄) — 메뉴 항목 목록
│   ├── TicketsModal.tsx      (≤100줄) — 내 문의 내역
│   └── SupportFormModal.tsx  (≤120줄) — 문의하기 폼
```

#### ConsentScreen.tsx (566줄 → 3개 파일)

```
src/screens/parent/
├── ConsentScreen.tsx         (≤200줄) — 메인 컨테이너
├── components/
│   ├── ConsentCard.tsx       (≤150줄) — 동의 항목 카드
│   └── ConsentDetail.tsx     (≤200줄) — 상세 내용 + 서명
```

#### BillingScreen.tsx (522줄 → 3개 파일)

```
src/screens/parent/
├── BillingScreen.tsx         (≤200줄) — 메인 컨테이너
├── components/
│   ├── InvoiceCard.tsx       (≤120줄) — 청구서 카드
│   └── PaymentModal.tsx      (≤150줄) — 결제 모달
```

### 4.2 FlatList 전환 대상

| 파일 | 현재 위치 | 데이터 | 전환 여부 |
|------|----------|--------|----------|
| ProfileScreen.tsx:307 | tickets.map() | SupportTicket[] (동적) | **전환** |
| ScheduleScreen.tsx:505 | students.map() (수평) | Student[] (동적) | **전환** |
| ScheduleScreen.tsx:563 | weekDates+filtered 중첩 map | Schedule[] (동적) | **SectionList 검토** |
| HomeScreen.tsx:213 | students.map() (수평) | Student[] (동적) | **전환** |
| ConsentScreen.tsx:242 | unconsentedStudents.map() | Student[] (동적) | **전환** |
| ScheduleScreen.tsx:628 | DAY_NAMES.map() | string[7] (고정) | 유지 |
| ScheduleScreen.tsx:636 | calendarGrid.map() | Date[6][7] (고정) | 유지 |
| ProfileScreen.tsx:341 | 카테고리.map() | string[5] (고정) | 유지 |

### 4.3 접근성 적용 규칙

```typescript
// 모든 Pressable/TouchableOpacity에 적용
<Pressable
  accessibilityRole="button"
  accessibilityLabel={t("descriptive.label")}  // i18n 키 사용
  accessibilityState={{ disabled: isDisabled }}  // 비활성 상태 전달
  onPress={handler}
>

// 모든 Image에 적용
<Image
  accessibilityLabel={t("image.description")}
  // 장식용 이미지는 accessibilityElementsHidden={true}
/>

// TextInput에 적용
<TextInput
  accessibilityLabel={t("input.label")}
  accessibilityHint={t("input.hint")}
/>
```

## 5. Edge Cases

| 케이스 | 처리 |
|--------|------|
| FlatList 전환 시 RefreshControl | FlatList 자체 refreshControl prop 사용 |
| 서브컴포넌트 분리 시 상태 전달 깊이 | Props drilling 2단계까지 허용, 그 이상은 콜백 패턴 |
| 기존 테스트 깨짐 | 리팩토링 전 기존 테스트 통과 확인 → 리팩토링 → 테스트 수정 |
| memoized 컴포넌트 분리 시 성능 | React.memo() 유지, props 비교 함수 필요 시 추가 |

## 6. Testing Strategy

### 리팩토링 안전망
1. 기존 36개 테스트 먼저 실행 → 전체 통과 확인
2. 리팩토링 진행
3. 깨진 테스트 수정 (import 경로 변경 등)
4. 신규 테스트 추가

### 신규 테스트 대상
| 컴포넌트 | 테스트 유형 |
|---------|-----------|
| StopCard | 렌더링 + 접근성 속성 확인 |
| RouteHeader | 토글 상태 변경 |
| VehicleClearance | 체크리스트 완료 플로우 |
| ScheduleItem | 날짜별 렌더링 |
| DailyView / WeeklyView | 데이터 필터링 |
| ProfileHeader | 사용자 정보 표시 |
| InvoiceCard | 금액 포매팅 |

### 검증 명령어
```bash
# TypeScript 검증
cd mobile && npx tsc --noEmit

# 테스트 실행
cd mobile && npx jest --verbose

# 종합 분석 재실행 (MCP)
analyze_codebase_comprehensive(path, ["all"])
```

## 7. Rollback Strategy

- Git branch `feature/mobile-quality-improvement`에서 작업
- 각 마일스톤(A/B/C/D)별 커밋
- 문제 발생 시 마일스톤 단위로 revert 가능

## 8. Acceptance Criteria

### MUST (스토어 제출 필수)
- [ ] 모든 Pressable/TouchableOpacity에 accessibilityRole="button"
- [ ] 모든 Image에 accessibilityLabel
- [ ] 동적 데이터 ScrollView+map → FlatList 전환 (5개 위치)
- [ ] RouteScreen.tsx 분리 (메인 파일 ≤250줄)
- [ ] ScheduleScreen.tsx 분리 (메인 파일 ≤200줄)
- [ ] TypeScript 0 errors
- [ ] 전체 테스트 통과

### SHOULD
- [ ] ProfileScreen, ConsentScreen, BillingScreen 분리
- [ ] 인라인 스타일 → StyleSheet.create()
- [ ] 비즈니스 매직넘버 상수화
- [ ] 신규 컴포넌트 테스트 10개+

### COULD
- [ ] HomeScreen, LoginScreen 분리 (300줄 기준)
- [ ] allowFontScaling 설정
- [ ] app.json API 키 환경변수 분리

## 9. Code Impact Map (Summary)

| 영역 | 파일 수 | 변경 유형 |
|------|--------|----------|
| screens/driver/ | 1 → 8 | 분리 (RouteScreen) |
| screens/parent/ | 5 → 18 | 분리 (Schedule, Profile, Consent, Billing) |
| screens/ (전체) | 22 | 접근성 속성 추가 |
| components/ | 2 | 접근성 속성 추가 |
| __tests__/ | 11 → 21+ | 기존 수정 + 신규 추가 |
| 총 변경 파일 | ~40개 | |
