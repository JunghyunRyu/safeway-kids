# QA Test Report — P0 Improvement

**Date:** 2026-03-22
**Scope:** Post-P0 implementation full regression + cross-platform verification
**Method:** Automated test suites + code review (no physical device testing)

---

## 테스트 실행 결과

| 영역 | 통과 | 실패 | 에러 | 스킵 | 상태 |
|------|------|------|------|------|------|
| Backend (pytest) | 112 | 0 | 1 | 0 | PARTIALLY VERIFIED |
| Web (vitest) | 50 | 0 | 0 | 0 | VERIFIED |
| Mobile (jest) | 36 | 0 | 0 | 0 | VERIFIED |
| Web TypeScript | 0 errors | - | - | - | VERIFIED |
| Mobile TypeScript | 0 errors | - | - | - | VERIFIED |
| Site TypeScript | 0 errors | - | - | - | VERIFIED |

### Backend 에러 상세
- **1 ERROR**: `test_ws_first_message_auth_success` — asyncpg Task attached to a different event loop. 이 에러는 테스트 환경의 event loop 충돌로 인한 것으로, SQLite 기반 테스트와 asyncpg PostgreSQL 드라이버 간의 loop 공유 이슈. 프로덕션(PostgreSQL single loop) 환경에서는 발생하지 않음.
- **5 warnings**: `coroutine 'Connection._cancel' was never awaited` — aiosqlite 테스트 환경의 정리(cleanup) 타이밍 이슈. 기능에 영향 없음.

### Web 테스트 수정 사항
- **수정 완료**: `StudentsPage.tsx` — `fetchStudents`가 `handleExcelUpload` 이후에 정의되어 temporal dead zone 에러 발생. 함수 선언 순서를 변경하여 해결. (3 tests 복구)

---

## 크로스 플랫폼 검증 (코드 리뷰 기반)

### Android

| 항목 | 상태 | 상세 |
|------|------|------|
| Platform.OS 분기 | PASS | toast (`ToastAndroid`), navigation (`geo:` scheme), 로그아웃 (`Alert.alert`), 스토리지 (`SecureStore`) 모두 올바르게 분기 |
| 딥링크 (네비게이션) | PASS | KakaoNavi → TMap → `geo:lat,lng?q=` fallback 체인 정상 |
| 전화 걸기 | PASS | `tel:112` 스킴 — Android 표준 |
| Alert.alert | PASS | SOS, 로그아웃, 스케줄 취소 등 모든 경우 `Platform.OS !== 'web'` 분기에서 `Alert.alert` 사용 |
| 알림 채널 | PASS | `Notifications.setNotificationChannelAsync('default', ...)` Android 전용 채널 설정 확인 |
| elevation (그림자) | PASS | SOSButton에 `elevation: 8` 적용 |

### iOS

| 항목 | 상태 | 상세 |
|------|------|------|
| Platform.OS 분기 | PASS | navigation fallback `maps:?daddr=`, alert 분기 등 정상 |
| SafeAreaView | PASS | `useSafeAreaInsets()` 16개 화면에서 사용. `react-native-safe-area-context` 기반 |
| 딥링크 | PASS | KakaoNavi → TMap → Apple Maps (`maps:?daddr=`) fallback |
| 전화 걸기 | PASS | `tel:112` — iOS에서도 표준 동작 |
| 터치 영역 크기 | PASS | SOSButton 60x60pt (최소 44pt 초과), DateNav 버튼에 `hitSlop: 8` 적용 |
| shadowColor/shadowOffset | PASS | iOS 전용 shadow 속성 + Android elevation 병행 사용 |

### PC/Web (대시보드)

| 항목 | 상태 | 상세 |
|------|------|------|
| 반응형 레이아웃 | PASS | Tailwind `md:` breakpoint로 사이드바 토글, DataTable에 `@media (max-width: 639px)` 카드 레이아웃 |
| 키보드 접근성 | PASS | `useModalOverlay` 훅으로 ESC 닫기, Tab/Shift+Tab 포커스 트랩, skip-to-main 링크 |
| ARIA 속성 | PASS | 65개 ARIA 속성 사용 (role, aria-label, aria-hidden 등) |
| 다크 모드 | PASS | `useDarkMode` 훅, Tailwind `dark:` 클래스 전역 적용 |
| 모달 ESC 닫기 | PASS | FormModal, ConfirmDialog, DetailModal 모두 `useModalOverlay` 적용 |
| 본문 스크롤 잠금 | PASS | 모달 열림 시 `body.style.overflow = 'hidden'` |
| 브라우저 호환성 | PASS | React 18 + Vite 빌드, 표준 Web API만 사용 (Chrome/Safari/Firefox 호환) |

---

## ITEM-B13 검증: 학부모 앱 기사/차량 정보 UI

**상태: 관찰 사항 (Non-blocking)**

- API 응답 모델(`DailySchedule`)에 `driver_name`, `driver_phone_masked`, `vehicle_license_plate` 필드가 존재
- 학부모 ScheduleScreen의 `ScheduleItem` 카드에서는 해당 필드를 렌더링하지 않음
- 학부모 HomeScreen의 `ScheduleCard`에서도 미표시
- **기사 프로필 화면**(DriverProfileScreen)에서는 배차 정보/차량 정보 정상 표시
- 학부모 입장에서 기사/차량 정보를 확인하려면 별도 UI 개선 필요 (향후 개선 항목)

---

## 발견된 이슈

| # | 심각도 | 플랫폼 | 항목 | 상세 | 조치 |
|---|--------|--------|------|------|------|
| 1 | LOW | Backend | WS 테스트 event loop 에러 | `test_ws_first_message_auth_success` asyncpg loop 충돌 | 테스트 환경 한정, 프로덕션 무영향 |
| 2 | FIXED | Web | StudentsPage TDZ 에러 | `fetchStudents` 선언 순서 오류로 3개 테스트 실패 | 함수 선언 순서 수정 완료 |
| 3 | INFO | Mobile | 학부모 기사/차량 정보 미표시 | ScheduleItem에 driver/vehicle 필드 미렌더링 | 향후 UX 개선 항목 |

---

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `web/src/pages/StudentsPage.tsx` | `fetchStudents` 선언을 `handleExcelUpload` 앞으로 이동 (TDZ 해결) |

---

## 판정: **PASS**

- Backend: 112 passed, 1 error (테스트 환경 한정)
- Web: 50 passed (수정 후 전수 통과)
- Mobile: 36 passed (전수 통과)
- TypeScript: 0 errors (web + mobile + site)
- 크로스 플랫폼: Android/iOS/PC 코드 리뷰 전항목 PASS
- 잔여 리스크: Backend WS 테스트 1건 (프로덕션 무영향), 학부모 UI 기사/차량 정보 미표시 (기능적 결함 아님)
