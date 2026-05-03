# Gap Note — PT Owner Navigation Stack 미등록

- **Date**: 2026-05-03
- **Discovered during**: C-14 Manual UI Demo (SearchScreen → WalkerProfile 클릭 시 navigation 무동작)
- **Severity**: BLOCKER for end-to-end UI demo + V1.0 출시 (사용자가 워커 검색은 가능하지만 예약·실시간추적 화면 진입 불가)

## 갭 내용

`OwnerTabNavigator.tsx`에는 4개 탭(Home, Search, Bookings, Profile)만 등록. 그러나 다음 7개 화면들이 SearchScreen / OwnerHomeScreen / BookingsScreen에서 `navigation.navigate('XXX')`로 호출되지만 navigator에 미등록:

| 호출 위치 | 호출되는 route | 실제 컴포넌트 (파일 존재) | navigator 등록 |
|---|---|---|---|
| `SearchScreen.tsx:56` | `WalkerProfile` | `screens/owner/WalkerProfileDetailScreen.tsx` | ❌ |
| `OwnerHomeScreen.tsx` (추정) | `BookingCreate` | `screens/owner/BookingCreateScreen.tsx` | ❌ |
| `BookingsScreen.tsx` (추정) | `BookingDetail` | `screens/owner/BookingDetailScreen.tsx` | ❌ |
| `BookingDetailScreen.tsx` (추정) | `LiveTrack` | `screens/owner/LiveTrackScreen.tsx` (**C-14 결과물**) | ❌ |
| `BookingDetailScreen.tsx` (추정) | `WalkReport` | `screens/owner/WalkReportScreen.tsx` | ❌ |
| `WalkReportScreen.tsx` (추정) | `Review` | `screens/owner/ReviewScreen.tsx` | ❌ |
| `OwnerHomeScreen.tsx` (추정) | `PetRegistration` | `screens/owner/PetRegistrationScreen.tsx` | ❌ |

WalkerTabNavigator도 동일 — `WalkerProfile`(자기 프로필) 외에 `WalkScreen`, `Schedule` 등 일부만 등록.

## 영향

- **C-14 Manual demo 차단**: SearchScreen에서 워커 카드 클릭 → 무반응. LiveTrackScreen에 UI로 도달 불가.
- **PT V1.0 출시 위험**: 견주가 워커 프로필을 볼 수 없어 예약 흐름 자체가 막힘. Track 2 critical path (T2.6 Pre-launch QA)에서 반드시 발견될 결함.
- **C-14 자체와 무관**: useWebSocket hook + LiveTrackScreen WS 통합은 backend chain 검증으로 PASS. UI 라우팅이 별도 결함.

## Resolution

`OwnerStackNavigator.tsx` 신규 작성으로 OwnerTabNavigator를 감싸는 stack 구성:

```
OwnerStackNavigator (Stack)
├── Tabs (OwnerTabNavigator)        ← 기본 진입
├── WalkerProfile                    ← from SearchScreen
├── PetRegistration                  ← from OwnerHomeScreen
├── BookingCreate                    ← from WalkerProfile
├── BookingDetail                    ← from BookingsScreen
├── LiveTrack                        ← from BookingDetail
├── WalkReport                       ← from BookingDetail
└── Review                           ← from WalkReport
```

App.tsx 변경: `<OwnerTabNavigator/>` → `<OwnerStackNavigator/>`.

WalkerStackNavigator도 동일 패턴으로 추가하나, 이번 demo 범위는 owner 측. WalkerStack은 후속 작업.

## Impact on Spec

Tech Spec FR-* 의도와 일치 (각 화면이 spec에 정의됨). **스펙 변경 없음**. 단지 navigation wiring 누락 fix.

## Test Coverage

- TS check: PT mobile `npx tsc --noEmit` 통과 필요
- jest 회귀: 9 suites · 20 passed 유지 필요
- E2E: SearchScreen → WalkerProfile → BookingCreate → ... → LiveTrack 시각 검증

## 추가 발견 (Same demo, 2026-05-03)

원래 navigation stack 갭 외에 **3건의 부가 결함**이 demo 진행 중 발견·해소:

1. **`BookingsScreen.tsx:30` onPress가 빈 함수** — 카드 클릭 무동작. `navigation.navigate('BookingDetail', { booking: item })`로 변경.
2. **`BookingDetailScreen.tsx:76` sessionId='todo' 하드코딩** — LiveTrack 버튼이 가짜 sessionId로 navigate. `booking.session_id` 사용으로 변경 + 활성 세션 없을 때 alert.
3. **`BookingResponse` schema에 session_id 필드 부재** — backend에서 in_progress booking에 join된 WalkSession.id 노출 불가. `session_id: uuid.UUID | None` 필드 추가 + `list_bookings`에서 in_progress 일괄 lookup (1 query).

추가 발견 (CORS):
4. **CORS 8081 미허용** — Metro web preview에서 backend 호출 차단. `cors_origins`에 `http://localhost:8081` + `http://192.168.44.128:8081` 추가.

## Sign-off

- [x] Gap 식별 (2026-05-03 demo)
- [x] OwnerStackNavigator 추가 (`apps/pettracker/mobile/src/navigation/OwnerStackNavigator.tsx`, 7 화면 등록)
- [x] App.tsx 업데이트 (`OwnerStackNavigator` 사용)
- [x] @react-navigation/native-stack 설치
- [x] BookingsScreen onPress + BookingDetailScreen sessionId + BookingResponse session_id 모두 fix
- [x] CORS 8081 추가
- [x] PT mobile jest 9 suites · 20 passed (회귀 0)
- [x] PT mobile TS 0 errors
- [x] UI demo SearchScreen → WalkerProfile → BookingCreate → 예약 → BookingDetail → LiveTrack 전체 흐름 통과
- [x] LiveTrack에서 LIVE 배지 + 8 GPS routePoints 정확히 캡쳐 (React fiber 검증)
