# Requirement Brief: 모바일 앱 품질 개선

**작성일:** 2026-04-01
**Phase:** 0 — Intake
**상태:** DRAFT

---

## 1. Problem Statement

SafeWay Kids 모바일 앱(Expo SDK 54, React Native 0.81.5)은 기능적으로 완성되어 있으나,
코드 품질/성능/접근성/테스트 커버리지가 **스토어 제출 기준에 미달**하는 상태이다.

종합 분석 결과 **189개 이슈**가 발견됨:
- 성능 문제: 46건
- 코드 품질: 48건
- 접근성: 42건
- 테스트 부재: 35건
- 리팩토링 필요: 16건
- Deprecated API: 2건

## 2. Goals

| # | Goal | 측정 기준 |
|---|------|-----------|
| G1 | Deprecated Navigator 제거 | deprecated API 0건 |
| G2 | 접근성 완비 | accessibilityRole, accessibilityLabel 전 화면 적용 |
| G3 | 성능 최적화 | ScrollView+map → FlatList 전환, 인라인 스타일 제거 |
| G4 | 거대 파일 분리 | 단일 파일 최대 300줄 이하 |
| G5 | 코드 품질 향상 | 매직넘버 상수화, 중첩 삼항 제거 |
| G6 | 테스트 커버리지 확대 | 주요 화면/훅 테스트 커버리지 80% 이상 |
| G7 | 스토어 제출 준비 완료 | TypeScript 0 errors, 전체 테스트 통과 |

## 3. Non-goals

- 새로운 기능 추가
- 백엔드 API 변경
- 디자인 시스템(theme.ts) 변경
- 네비게이션 구조 변경 (탭 기반 유지)
- 국제화 확장 (한글만 유지)

## 4. Assumption Register

| # | Assumption | Risk if wrong |
|---|-----------|---------------|
| A1 | React Navigation 7.x가 이미 설치되어 있음 | Navigator 교체 범위 확대 |
| A2 | 기존 테스트 36건이 모두 통과 | 리팩토링 시 기존 테스트 깨질 수 있음 |
| A3 | API 응답 구조는 변경 불필요 | 화면 리팩토링 시 API 호출 변경 최소화 |
| A4 | app.json의 EAS projectId가 유효함 | EAS 빌드 실패 가능 |
| A5 | 5개 역할(부모/기사/도우미/관리자/학생) 모두 개선 대상 | 특정 역할 제외 시 범위 조정 필요 |

## 5. Open Questions

| # | Question | Impact |
|---|----------|--------|
| Q1 | RouteScreen.tsx(1,368줄) 분리 시 어떤 단위로 나눌 것인가? | 아키텍처 설계 |
| Q2 | 테스트 우선순위 — 화면 테스트 vs 훅 테스트? | 테스트 전략 |
| Q3 | EscortRouteScreen.tsx(10줄 스텁), ProfileScreen(2줄 스텁) 구현 여부? | 범위 |
| Q4 | 접근성 테스트 자동화 도구 사용 여부? | 검증 전략 |
| Q5 | FlatList 전환 시 기존 RefreshControl 패턴 유지 여부? | 구현 방식 |

## 6. Acceptance Criteria (Draft)

### 필수 (MUST)
- [ ] Deprecated Navigator 경고 0건
- [ ] 모든 TouchableOpacity/Pressable에 accessibilityRole 설정
- [ ] 모든 Image에 accessibilityLabel 설정
- [ ] ScrollView+.map() → FlatList 전환 (7개 화면)
- [ ] 단일 파일 300줄 이하 (RouteScreen, ScheduleScreen, ProfileScreen, ConsentScreen, BillingScreen, HomeScreen)
- [ ] TypeScript 에러 0건
- [ ] 기존 36개 테스트 + 신규 테스트 전체 통과
- [ ] 이벤트 리스너 cleanup 완료 (useGpsTracking)

### 권장 (SHOULD)
- [ ] StyleSheet.create()로 인라인 스타일 추출
- [ ] 매직넘버 상수화 (최소 High priority 화면)
- [ ] 중첩 삼항연산자 → 조건부 렌더링 또는 함수 추출
- [ ] FlatList keyExtractor 전체 적용
- [ ] 주요 화면 테스트 커버리지 80%+

### 선택 (COULD)
- [ ] allowFontScaling 설정
- [ ] PropTypes 런타임 검증 (개발 모드)
- [ ] 컴포넌트별 Storybook 또는 스냅샷 테스트

## 7. Code Impact Map

### 화면 파일 (수정 대상)
```
src/screens/
├── parent/     (8 files, 3,794줄) — 가장 큰 개선 대상
├── driver/     (4 files, 2,045줄) — RouteScreen 1,368줄 분리 필수
├── escort/     (3 files, 659줄)
├── admin/      (4 files, 1,168줄)
├── student/    (3 files, 588줄)
└── shared/     (2 files, 630줄)
```

### 핵심 파일 (영향 범위 큼)
- `src/navigation/RootNavigator.tsx` — Navigator 교체
- `App.tsx` — Navigator 교체
- `src/hooks/useGpsTracking.ts` — 이벤트 리스너 cleanup

### 테스트 파일 (신규 생성 + 기존 수정)
- `src/__tests__/` — 기존 11파일 유지 + 신규 20+ 파일

## 8. Team Assignment

### Product Operations (6명)
1. **Performance Engineer** — G3 (FlatList, 인라인 스타일, 렌더링)
2. **Accessibility Specialist** — G2 (a11y 속성, 폰트 스케일링)
3. **Code Quality Lead** — G5 (매직넘버, 삼항, 코드 정리)
4. **Architecture Lead** — G4 (파일 분리, 컴포넌트 설계)
5. **Test Engineer** — G6 (테스트 전략, 커버리지)
6. **Release Manager** — G7 (빌드, 배포, 스토어)

### Reviewers (4명)
1. **Security Reviewer** — 보안 취약점
2. **Performance Reviewer** — 성능 병목
3. **UX/A11y Reviewer** — 접근성 + UX
4. **Architecture Reviewer** — 설계 구조
