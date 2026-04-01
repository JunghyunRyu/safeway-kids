# Phase 2: Consensus Matrix — 모바일 앱 품질 개선

**작성일:** 2026-04-01
**입력:** Security / Performance / UX-A11y / Architecture 4개 독립 리뷰
**상태:** APPROVED

---

## 리뷰어 간 합의 사항

### 오탐 제거 (Original Analysis → Corrected)

| 원래 이슈 | 판정 | 근거 |
|-----------|------|------|
| Deprecated Navigator (2건) | ❌ **오탐** | 실제로 React Navigation 7 + NavigationContainer 사용 중 |
| Event listener cleanup 누락 (1건) | ❌ **오탐** | useGpsTracking.ts의 AppState listener, interval 모두 cleanup 구현됨 |

**수정된 실제 이슈 수: 189 → 186건**

---

## Consensus Matrix

| # | 이슈 카테고리 | 리뷰어 동의 | 우선순위 | 결정 |
|---|-------------|------------|---------|------|
| 1 | 접근성: accessibilityRole 누락 (25+ 위치) | 4/4 | **P0 (필수)** | 전 화면 Pressable/TouchableOpacity에 적용 |
| 2 | 접근성: accessibilityLabel 누락 (Image) | 3/4 | **P0** | RouteScreen 이미지에 우선 적용 |
| 3 | 파일 분리: RouteScreen.tsx 1,367줄 | 4/4 | **P1 (높음)** | 7개 서브컴포넌트로 분리 |
| 4 | 파일 분리: ScheduleScreen.tsx 852줄 | 4/4 | **P1** | 5개 서브컴포넌트로 분리 (뷰 모드별) |
| 5 | 파일 분리: ProfileScreen.tsx 604줄 | 3/4 | **P1** | 5개 서브컴포넌트로 분리 |
| 6 | 파일 분리: ConsentScreen.tsx 566줄 | 3/4 | **P1** | 3개 서브컴포넌트로 분리 |
| 7 | 파일 분리: BillingScreen.tsx 522줄 | 3/4 | **P1** | 3개 서브컴포넌트로 분리 |
| 8 | 파일 분리: HomeScreen.tsx 427줄 | 2/4 | **P2** | 분리 검토 (300줄 기준 초과) |
| 9 | 파일 분리: LoginScreen.tsx 407줄 | 2/4 | **P2** | 분리 검토 |
| 10 | 성능: ScrollView+map → FlatList (8개 위치) | 4/4 | **P1** | FlatList 전환 (단, 소량 데이터는 유지 가능) |
| 11 | 성능: 인라인 스타일 → StyleSheet (3개 파일) | 3/4 | **P2** | StyleSheet.create()로 추출 |
| 12 | 성능: FlatList keyExtractor 누락 | 4/4 | **P1** | ScheduleScreen FlatList에 추가 |
| 13 | 코드품질: 매직넘버 상수화 (20+ 파일) | 3/4 | **P2** | 주요 화면에서 상수 추출 |
| 14 | 코드품질: 중첩 삼항연산자 (18+ 파일) | 2/4 | **P3** | 가독성 심각한 경우만 수정 |
| 15 | 테스트: 주요 화면 테스트 부재 | 4/4 | **P1** | 리팩토링 후 추가 (안전망 확보) |
| 16 | 보안: app.json에 KakaoMap API 키 노출 | 3/4 | **P2** | 환경변수 분리 검토 (빌드 시 주입) |
| 17 | 접근성: allowFontScaling 미설정 | 2/4 | **P3** | 선택 사항 |

---

## 우선순위 정의

| 등급 | 의미 | 조건 |
|------|------|------|
| **P0** | 스토어 리젝 사유 | 반드시 수정 |
| **P1** | 높은 품질 영향 | 이번 마일스톤에 포함 |
| **P2** | 개선 권장 | 시간 허용 시 포함 |
| **P3** | 선택 | 후속 작업으로 분류 |

---

## 의견 충돌 해결

### 충돌 1: ScrollView+map 중 소량 데이터도 FlatList로?
- **Performance Reviewer**: 모두 FlatList로 변환
- **Architecture Reviewer**: DAY_NAMES.map() (7개 고정) 등은 ScrollView 유지해도 무방
- **결정**: 동적 데이터(학생 목록, 스케줄 등)만 FlatList 전환. 고정 배열(7일, 카테고리 등)은 현행 유지

### 충돌 2: LoginScreen/HomeScreen 분리 필요성
- **Architecture Reviewer**: 300줄 기준 적용하면 분리 대상
- **Code Quality Lead**: 407/427줄은 경계선, 분리 시 오히려 파편화
- **결정**: P2로 분류, RouteScreen/ScheduleScreen 등 우선 분리 후 판단

### 충돌 3: 매직넘버 전면 상수화 vs 부분 상수화
- **Code Quality Lead**: 전면 상수화 권장
- **Performance Reviewer**: 스타일 관련 숫자는 theme.ts에 이미 있으므로 중복 방지
- **결정**: theme.ts Spacing/Radius 활용 + 비즈니스 로직 매직넘버만 상수화

---

## 최종 작업 범위 확정

### Milestone A: 접근성 + 성능 (P0 + P1 핵심)
1. 전 화면 accessibilityRole/accessibilityLabel 추가
2. ScrollView+map → FlatList 전환 (동적 데이터 대상)
3. FlatList keyExtractor 추가

### Milestone B: 아키텍처 리팩토링 (P1)
4. RouteScreen.tsx → 7개 서브컴포넌트 분리
5. ScheduleScreen.tsx → 5개 서브컴포넌트 분리
6. ProfileScreen.tsx → 5개 서브컴포넌트 분리
7. ConsentScreen.tsx → 3개 서브컴포넌트 분리
8. BillingScreen.tsx → 3개 서브컴포넌트 분리

### Milestone C: 코드 품질 + 테스트 (P1-P2)
9. 인라인 스타일 → StyleSheet.create()
10. 비즈니스 로직 매직넘버 상수화
11. 리팩토링된 컴포넌트 테스트 작성
12. 기존 테스트 유지 + 통과 확인

### Milestone D: 마무리 검증 (P2)
13. 종합 분석 재실행으로 이슈 수 감소 확인
14. TypeScript 0 errors 확인
15. 전체 테스트 통과
