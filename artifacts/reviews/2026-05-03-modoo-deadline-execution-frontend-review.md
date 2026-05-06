# Frontend Review: ActivityFeedScreen MOCK_FEED → Placeholder 전환

**Date**: 2026-05-03
**Reviewer**: frontend-dev (Senior Frontend / core-mobile)
**Phase**: 1 — Independent Review
**대상**: `apps/pettracker/mobile/src/screens/owner/ActivityFeedScreen.tsx`
**참조 Brief**: `artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`

---

## 1. Requirement Restatement

FR-3 / FR-4 / FR-5가 이 작업의 실질적 경계다.

현재 ActivityFeedScreen은 하드코딩된 5건의 `MOCK_FEED` 배열을 FlatList의 `data` prop으로 직접 전달한다. 평가위원이 PT 앱을 실제로 빌드하거나 Expo Go로 실행할 경우 이 데이터가 화면에 렌더링되며, "실제 서비스처럼 보이지만 실제가 아닌" 상태로 노출된다. 이는 신뢰도 리스크다.

작업 목표는 이 배열과 FlatList 렌더링 로직을 제거하고, "이 기능은 준비 중"임을 보호자(오너) 페르소나에게 명확히 전달하는 정적 placeholder 화면으로 교체하는 것이다. CTA Pressable 1개를 추가해 사용자를 현재 작동하는 화면으로 연결한다. TypeScript 0 errors, jest 20 pass 유지가 완료 조건이다.

중요한 전제 사실: `OwnerStackNavigator.tsx`를 직접 확인한 결과 ActivityFeedScreen은 해당 파일에 등록되어 있지 않다. 즉 현재 앱에서 이 화면에 진입하는 경로가 없다. 코드 내 `navigation.goBack()`과 `navigation.navigate(...)` 호출은 런타임에서 실행되지 않는 dead code다. 변경은 `ActivityFeedScreen.tsx` 단일 파일에만 한정된다.

---

## 2. Missing Requirements

**2-a. React Navigation 타입 안전성**: `@react-navigation/native ^7.1.33`. 현재 `{ route, navigation }: any`. NFR-1 준수상 `any` 유지가 적합. 타입 정리는 V1.1 별도.

**2-b. SafeAreaView**: `paddingTop: 60` 하드코딩 유지. SafeAreaView 도입은 NFR-1 충돌, out-of-scope.

**2-c. 접근성**: `accessibilityRole="button"`, `accessibilityLabel`, `hitSlop={8}` 추가 권장 (브리프 미명시지만 App Store 검수 영향).

**2-d. 마운트 시점 동작**: 정적 placeholder, side effect 없음. React 19 Strict Mode 안전.

---

## 3. Conflicts

**C-1: NFR-3(Lottie 미사용) vs AC-2.3(시각 요소)** — OQ-1 해소: `package.json` 직접 확인 결과 `lottie-react-native`, `react-native-lottie` 모두 없음. Ionicons `paw` size 64 + `Colors.primary(#F4A22D)`로 시각 임팩트 충분.

**C-2: navigator 미등록 + CTA navigate** — `navigation.navigate('Bookings')` 코드는 컴파일·tsc 통과하나 런타임에서 실행 안 됨. 이 사실을 코드 주석에 명시. V1.1에서 stack 등록 시 CTA 자동 동작.

---

## 4. Technical Risks

| ID | 위험 | 수준 | 근거 |
|---|---|---|---|
| TR-1 | navigation any 타입 → route 오타 미검출 | 낮음 | navigate('Bookings') 1건만 사용 |
| TR-2 | 타 파일에서 ActivityFeedScreen import | 없음 | grep 전수 — 0건 |
| TR-3 | jest 회귀 | 없음 | 10 test files 전수 — `ActivityFeed` 문자열 0건 |
| TR-4 | back 버튼 dead code | 낮음 | 제거 권장 또는 optional chaining |

---

## 5. Alternative Designs

- **Option A** (권장 안 함): `data={[]}` + ListEmptyComponent. FlatList·ActivityItem 인터페이스 잔류. 번들 손해.
- **Option B** (권장): 화면 전체를 정적 View 교체. 97 → 65줄. 모든 AC 충족. NFR-1과 정합.
- **Option C**: 탭 제거 — 이미 탭에 없음. 해당 없음.

---

## 6. Testing Concerns

**TC-1 AC-2.1 검증**: `grep "MOCK_FEED" apps/pettracker/mobile/src/screens/owner/ActivityFeedScreen.tsx` → 출력 없음 = PASS

**TC-2 AC-2.5**: `cd apps/pettracker/mobile && npx tsc --noEmit`

**TC-3 AC-2.6**: `npm test` → 기대 20 passed, 0 failed

**TC-4 텍스트 자동 검증 부재**: `testID="activity-feed-placeholder"` 삽입 권장 (1줄 비용, V1.1 21번째 테스트 커버 가능)

**TC-5 시뮬레이터 smoke**: 화면 navigator 미등록 → 시뮬레이터 진입 불가. jest render() 수준만 가능.

---

## 7. 제안 Placeholder 컴포넌트 구조

설계 결정:
- FlatList / renderItem / ActivityItem 인터페이스 / MOCK_FEED / timeline 스타일 전부 제거
- `navigation?.navigate?.('Bookings')` optional chaining (stack 미등록 런타임 에러 방지)
- OQ-4 기본값 = Bookings (활동 피드는 산책 완료 맥락 — Search보다 가까움)
- `testID="activity-feed-placeholder"` 삽입
- `route` prop 제거, `Shadows` import 제거, back 버튼 제거

```tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

// NOTE: This screen is not registered in OwnerStackNavigator as of V1.0.
// The CTA navigate call is non-operational until V1.1 stack registration.
export default function ActivityFeedScreen({ navigation }: any) {
  return (
    <View style={styles.container} testID="activity-feed-placeholder">
      <View style={styles.iconWrap}>
        <Ionicons name="paw" size={64} color={Colors.primary} />
      </View>
      <Text style={styles.title}>활동 피드</Text>
      <Text style={styles.body}>
        {'실시간 산책 업데이트 기능이\n곧 출시됩니다.'}
      </Text>
      <Pressable
        style={styles.cta}
        onPress={() => navigation?.navigate?.('Bookings')}
        accessibilityRole="button"
        accessibilityLabel="예약 확인하기"
        hitSlop={8}
      >
        <Text style={styles.ctaText}>예약 확인하기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: { marginBottom: Spacing.lg },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  cta: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    minWidth: 160,
    alignItems: 'center',
  },
  ctaText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
});
```

---

## 8. OQ 결정 권고

**OQ-1 Lottie 설치 여부**: `package.json` 직접 확인 — `lottie-react-native`, `react-native-lottie` 모두 없음. NFR-3 준수, Ionicons `paw` size 64, `Colors.primary` 사용.

**OQ-4 CTA 이동 대상 — Search vs Bookings**: **Bookings 권고**. 이유: 활동 피드는 진행 중·완료 산책 맥락이므로 "예약 확인하기"가 보호자 다음 행동에 자연스럽다. Search는 신규 워커 탐색이라 맥락 약함. 단, 이 화면 자체 stack 미등록으로 어느 쪽이든 런타임 실행 없음.

---

## 9. Confidence

**8 / 10**

파일 1개, 97줄, 외부 의존성 0건, 테스트 영향 0건. 구현 1시간 이내. 감점 2개:
1. navigator 미등록 → CTA 기기 검증 불가, 코드 리뷰 수준만
2. AC-2.3 jest 테스트 없음 → 텍스트 변경 자동 회귀 감지 밖

두 항목 모두 이번 범위 허용 제약, 블로커 아님. Phase 5 진행 가능.

---

## 부록: 확인된 사실

| 항목 | 결과 |
|---|---|
| Lottie 설치 여부 | 미설치 |
| ActivityFeedScreen import (타 파일) | 0건 |
| ActivityFeedScreen 전용 jest | 0건 |
| OwnerStackNavigator 등록 | 미등록 |
| OwnerTabNavigator 탭 | Home / Search / Bookings / Profile |
| `navigation.navigate('Bookings')` 안정성 | 탭 등록 확인, 기술적 안정 |
| React Navigation 버전 | v7 (`^7.1.33`) |
| React 버전 | 19.1.0 |
| 현재 jest pass count | 20 |

---

**관련 파일**

- `apps/pettracker/mobile/src/screens/owner/ActivityFeedScreen.tsx`
- `apps/pettracker/mobile/src/navigation/OwnerStackNavigator.tsx`
- `apps/pettracker/mobile/src/navigation/OwnerTabNavigator.tsx`
- `apps/pettracker/mobile/src/constants/theme.ts`
- `apps/pettracker/mobile/package.json`
