# Mobile + GPS 구현 허점 감사 — 2026-06-03

> **성격**: 2개 전문 sub-agent(frontend-dev "mobile-auditor", backend-dev "gps-auditor")의 **정적 분석(static analysis)** 결과 통합.
> **중요**: 아래 발견은 코드(file:line) 근거가 있으나 **대부분 런타임 미검증**이다. 일부는 false positive일 수 있다. Critical 4건은 본 세션에서 메인 에이전트가 직접 코드로 교차 검증(아래 §4) 했다.
> **범위**: `mobile/**` (SafeWay Kids), `apps/pettracker/mobile/**` (PetTracker), `backend/app/**` GPS/location 파이프라인.
> **코드 기준**: 커밋 `39a70ad` (working tree). 코드 수정 0건 (read-only 감사).

---

## 0. 요약

| 영역 | 발견 수 | Critical | High | Med | Low | 읽은 파일 |
|---|---|---|---|---|---|---|
| 모바일 (M-xx) | 24 | 4 | 7 | 9 | 4 | 42 |
| GPS 파이프라인 (G-xx) | 26 | 5 | 9 | 8 | 4 | 22 |
| **합계** | **50** | **9** | **16** | **17** | **8** | — |

**교차 검증된 핵심 테마** (두 에이전트가 독립적으로 같은 문제를 다른 각도로 지적 → 신뢰도 ↑):
- **SOS 안전기능 실패**: M-01(무음 실패) + M-02(PT SOS 미구현 stub) + G-05(SOS가 (0,0) 전송)
- **백그라운드 GPS 중단**: M-04/M-15(인터벌 누수·중복) + G-07/G-08(백그라운드 task 부재) + G-26(이중 폴링)
- **위치 권한 영구거부 미처리**: M-10/M-11 + G-23
- **GPS 검증 무효화**: G-01(검증 함수 미호출) + G-06/G-09/G-16(검증 로직 결함)

---

## 4. 메인 에이전트 직접 교차 검증 (VERIFIED)

sub-agent 결과를 그대로 신뢰하지 않고, 가장 위험한 4건을 file:line으로 직접 확인함:

| 발견 | 검증 결과 | 근거 |
|---|---|---|
| **G-01** GPS 검증 함수 미호출 | ✅ **진짜 (VERIFIED)** | `grep`으로 `validate_gps_speed`·`validate_gps_accuracy`가 `gps_validation.py` 정의 외 backend 전체에서 import/호출 **0건** 확인 |
| **G-05** SOS가 (0,0) 전송 | ✅ **진짜 (VERIFIED)** | `SOSButton.tsx:25-26` `lat=0,lng=0` 초기화 → 권한 실패 시(36-38행 silent catch) 그대로 유지 → (0,0) 전송(40-46행). `SOS_ENABLED=true`(17행) |
| **M-01** SOS API 실패 무음 | ✅ **진짜 (VERIFIED)** | `SOSButton.tsx:47-49` catch 블록이 빈 주석만, 사용자 피드백 없이 `tel:112`(51행)만 실행 |
| **G-03** WS 권한 dev bypass | ⚠️ **코드는 진짜, 심각도 조건부** | `service.py:239-240` `if settings.environment == "development": return True` 실재. 단 prod 노출은 `environment` 오설정 시에만 → **코드 VERIFIED / 익스플로잇 가능성 UNVERIFIED**. 주석은 "production 영향 없음" 주장 |

→ 표본 4건 전부 코드 사실로 확인됨(hallucination 0). 나머지 46건도 file:line이 명시돼 있어 신뢰도 높으나 개별 런타임 검증은 미실시.

---

## 1. 모바일 감사 (frontend-dev) — 24건

읽은 파일 42 / Critical 4 · High 7 · Med 9 · Low 4

| ID | 심각도 | 카테고리 | 파일:라인 | 결함 | 사용자 영향 | 수정 방향 |
|---|---|---|---|---|---|---|
| M-01 | Critical | SOS/안전 | `mobile/src/components/SOSButton.tsx:41-48` | API 실패를 빈 catch로 삼키고 피드백 없이 `tel:112`만 실행. 관리자 SOS 미전달인데 사용자는 전송됐다고 인식 | 긴급 시 관리자 미통보, 대응 지연 | 실패 재시도 큐 또는 실패 토스트. 성공/실패 분리 |
| M-02 | Critical | SOS/안전 | `apps/pettracker/mobile/src/screens/owner/LiveTrackScreen.tsx:111-127` | `handleSOS`가 "신고 완료" Alert만 띄우고 실제 API 호출 없음(`// TODO`) | PT 긴급신고 시스템 미도달. 안전기능 완전 무력화 | API 연결 또는 미완성 시 버튼 비활성+"준비중" |
| M-03 | Critical | 보안 | `mobile/src/screens/LoginScreen.tsx:290-295` | 테스트 계정 평문 하드코딩 + `EXPO_PUBLIC_DEV_MODE=true` 시 프로덕션 빌드도 Dev 로그인 노출 | 프로덕션 인증 우회, 임의 역할 로그인 | `__DEV__` 단독 분기, 테스트 자격증명 제거 |
| M-04 | Critical | 메모리누수 | `apps/pettracker/mobile/src/screens/walker/WalkScreen.tsx:110-126` | `gpsRef` setInterval cleanup이 `handleEnd` 내부에만 있음. 언마운트 시 인터벌 잔존 | GPS 인터벌 누수, 백그라운드 API 지속 호출, 배터리 소모 | useEffect cleanup에서 `gpsRef`도 정리 |
| M-05 | High | 네트워크 | `mobile/src/api/client.ts:73-110` | refresh 실패(refresh 토큰 만료) 시 catch가 `Promise.reject` 없이 return → 호출자 무한 대기 | refresh 만료 시 로딩에서 멈춤, 로그아웃 미이동 | catch 끝에 `return Promise.reject(error)` + 인증 초기화 이벤트 |
| M-06 | High | WebSocket | `mobile/src/hooks/useVehicleTracking.ts:256-267` | 폴링→WS 재시도 timeout 콜백에 mounted 가드 없음 → 언마운트 후 dangling socket | 자원 낭비, 수신 처리 중 크래시 가능 | timeout 콜백 첫 줄 `if (!mountedRef.current) return` |
| M-07 | High | 라이프사이클 | `apps/pettracker/mobile/src/screens/owner/LiveTrackScreen.tsx:70-81` | `fetchLocation` stale closure(`deps:[]` + exhaustive-deps 억제). `startedAt`이 항상 null로 캡처 | 경과시간 매 poll 초기화 오작동 | useCallback/ref로 분리 |
| M-08 | High | 성능 | `mobile/src/screens/driver/MapScreen.tsx:177-188` | `mapReady` 시 픽업 마커 forEach push만, 초기화 없음(`mapHtml.ts:217`). 재초기화 시 마커 중복 | 마커 중복 표시, 누적 렌더 저하 | `clearPickupMarkers` 핸들러 추가 |
| M-09 | High | 성능 | `mobile/src/screens/driver/MapScreen.tsx:143-159` | `sendToMap` 인라인 함수 매 렌더 재생성 → 의존 useEffect 6개 불필요 재실행 | WebView inject 반복, 지도 깜빡임/마커 중복 | useCallback 또는 외부 이동 |
| M-10 | High | 권한 | `mobile/src/hooks/useGpsTracking.ts:22-34` | 위치 거부 시 Alert만. `canAskAgain`(영구거부) 미구분, `openSettings()` 없음. GPS 비활성 상태 UI 불명확 | 영구거부 시 복구법 모름, GPS 없이 운행 시작 | `canAskAgain:false`면 `openSettings()` |
| M-11 | High | 권한 | `apps/pettracker/mobile/src/screens/walker/WalkScreen.tsx:91-95,259` | 위치/카메라 거부 시 Alert만, 영구거부 분기·설정유도 없음 | 산책사 복구법 모름, GPS 기록 불가 | `canAskAgain:false` → `openSettings()` |
| M-12 | Med | 푸시 | `mobile/src/hooks/useNotifications.ts:27-49` | FCM 토큰 갱신(rotate) 미처리, 알림 탭 리스너가 `data.screen` 로그만 찍고 네비게이션 안 함 | 알림 탭 시 화면이동 안됨, 토큰만료 후 미수신 | responseListener에서 navigate, AppState active 시 토큰 갱신 |
| M-13 | Med | 네비게이션 | `mobile/src/navigation/RootNavigator.tsx:104-121,84-88` | ConsentScreen이 NavigationContainer 밖 렌더, LoginScreen 자체 컨테이너 → 중첩 컨테이너로 딥링크 깨짐 가능 | navigation 훅 사용 시 크래시, 딥링크 미동작 | 단일 최상위 NavigationContainer로 통합 |
| M-14 | Med | 상태관리 | `mobile/src/screens/parent/NotificationSettingsScreen.tsx:52-74` | `handleToggle`이 `prefs` 직접 참조 + 낙관적 업데이트. 빠른 연속 토글 시 stale closure로 덮어쓰기 | 빠른 토글 시 설정 소실, 서버 잘못 저장 | 함수형 업데이트로 통일 |
| M-15 | Med | 라이프사이클 | `mobile/src/hooks/useGpsTracking.ts:132-146` | AppState active 복귀 시 기존 interval 확인 없이 새 interval 생성 → 중복 | GPS 2배 전송, 배터리·데이터 소모 | setInterval 전 null 체크 |
| M-16 | Med | 보안 | `apps/pettracker/mobile/src/screens/owner/LiveTrackScreen.tsx:104-108` | 산책사 연락이 하드코딩 `tel:010-0000-0000` | 긴급 연락 불가 | 실제 walker 번호 API 조회 |
| M-17 | Med | WebSocket | `apps/pettracker/mobile/src/screens/shared/ChatScreen.tsx:20-28` | 채팅이 로컬 state만, API 전송·WS 수신 없음(`// TODO`). 하드코딩 메시지 2개 | 채팅 완전 미동작 | API/WS 연동 또는 비활성 |
| M-18 | Med | 에러경계 | `mobile/App.tsx:1-17` | 앱 전체 ErrorBoundary 없음 (PT도 동일) | 런타임 예외 시 전체 흰화면 크래시 | 최상위 ErrorBoundary + 크래시 리포팅 |
| M-19 | Med | 성능 | `mobile/src/screens/driver/RouteScreen.tsx:97-113` | `renderItem` deps에 매 렌더 새 `actions` 객체(`useRouteActions` useMemo 없음) → FlatList 전체 재렌더 | 60+ 목록 프레임 드롭 | `useRouteActions` useMemo |
| M-20 | Med | 플랫폼 | `apps/pettracker/.../LiveTrackScreen.tsx:248`, `ChatScreen.tsx:75` | `paddingTop:60` 하드코딩, `useSafeAreaInsets` 미사용 | 노치/Dynamic Island 기기 헤더 잘림/겹침 | `useSafeAreaInsets().top` 동적 계산 |
| M-21 | Med | i18n/접근성 | `apps/pettracker/.../OwnerHomeScreen.tsx:39,50,59` | 한국어 하드코딩, i18n 미경유, accessibilityLabel 없음 | 다국어 불가, 스크린리더 불가 | i18n 키 교체 + a11y 속성 |
| M-22 | Low | 성능 | `mobile/src/constants/mapHtml.ts:169,243` | 마커 업데이트마다 `panTo` → 다차량 시 지도 튐 | 다차량 추적 시 지도 점프 | 선택 차량만 panTo |
| M-23 | Low | 네비게이션 | `mobile/src/navigation/RootNavigator.tsx:90` | `role ?? "parent"` fallback → 미매핑 역할이 학부모 화면 진입 | 권한외 화면 노출 | 알수없는 role 에러/로그아웃 |
| M-24 | Low | i18n | `mobile/src/screens/parent/MapScreen.tsx:219,226-227` | 일부 상태 텍스트 `t()` 미경유 하드코딩(같은 파일 내 불일치) | i18n 일관성 깨짐 | 전 문자열 i18n 키화 |

**모바일 Top 3**: M-02(PT SOS 미구현) > M-01(SafeWay SOS 무음실패) > M-05(refresh 만료 시 무한대기)

---

## 2. GPS 파이프라인 감사 (backend-dev) — 26건

읽은 파일 22 / Critical 5 · High 9 · Med 8 · Low 4

| ID | 심각도 | 카테고리 | 파일:라인 | 결함 | 영향 | 수정 방향 |
|---|---|---|---|---|---|---|
| G-01 | Critical | 검증무효 | `gps_validation.py` 전체 + `vehicle_telemetry/service.py:152-186` + `pettracker/service.py:430-474` | 검증 함수가 어떤 수신 경로에서도 호출 안됨. 텔레포트·저정밀·스푸핑 좌표가 무검증 영속 | 허위 GPS 주입으로 학부모에 잘못된 위치 방송. 아동안전 실패 | `update_gps`/`record_gps` 진입부에 검증 호출 |
| G-02 | Critical | 위치정보법 | `mobile/src/hooks/useGpsTracking.ts:63-79` | 동의 저장 API 실패해도 `consentGranted(true)` fail-open(69행). 동의 없이 수집 시작 | 위치정보법 §15·§39 위반, 아동개보법 교차위반 과태료/형사 | 실패 시 `consentGranted(false)` + 재시도. fail-open 제거 |
| G-03 | Critical | 권한격리 | `vehicle_telemetry/service.py:227-294` | `environment=="development"`면 전 역할 무조건 True(239-240). env 오설정/잘못된 이미지 배포 시 임의 인증자가 전 차량 위치 수신 | 학부모가 무관한 아이들 차량 위치 열람. 아동위치 오노출 | env bypass 코드 제거, 개발은 시드 의무화 |
| G-04 | Critical | 권한격리 | `vehicle_telemetry/router.py:170-239` + `pettracker/router.py:576-651` | PT WS가 종료 세션(`ended_at`) 미검증. 종료 후에도 walker가 listen 시 잔여 GPS 수신 | 반려인 위치 이력 오노출 | WS 연결 시 `ended_at is None` 검증, 종료면 4403 |
| G-05 | Critical | 안전기능 | `mobile/src/components/SOSButton.tsx:25-36` | SOS 시 권한 없으면 `(0,0)`(null island) 전송. 서버가 유효위치로 저장, 관제에 대서양 해상 표시 | 실제 사고위치 미표시, 응급대응 불가. 생명안전 직결 | 위치 사전캐싱, (0,0) 미전송 후 위치미확인 플래그 |
| G-06 | High | 좌표유효성 | `gps_validation.py:45-49` | `validate_gps_accuracy(None)→True`. 모바일이 accuracy 미전송(schema에 필드 없음) → accuracy 검증 항상 무효 | 터널·실내 수백m 오차 무필터 저장·방송 | schema에 accuracy 추가, 임계 초과 reject |
| G-07 | High | 백그라운드 | `mobile/src/hooks/useGpsTracking.ts:132-146` | AppState non-active 시 clearInterval(134). background task 미사용. 백그라운드 전환 시 GPS 즉시 중단 | 학부모 지도 위치 정지, ETA 불가, 모니터링 단절 | `startLocationUpdatesAsync`+TaskManager, 권한 분리 |
| G-08 | High | 백그라운드 | `apps/pettracker/.../walker/WalkScreen.tsx:110-126` | 산책 GPS도 setInterval+getCurrentPosition, 백그라운드 미동작, AppState 리스너조차 없음 | 경로 공백, 거리오류, 마커 정지, 리포트 불완전 | background task 적용 |
| G-09 | High | 정확도 | `gps_validation.py:21-22` | `MIN_GPS_ACCURACY_M=100` 미사용(G-01) + 100m는 차량용으로 과대관대 | 도착판정 오류, 지오펜싱 오탐 | 차량 50m/도보 30m 분리 + 호출 추가 |
| G-10 | High | Staleness | `vehicle_telemetry/service.py:152-186` | `recorded_at`을 서버시각 강제(159). 단말시각 무시. 오프라인 복구 전송 시 시간순서 왜곡. schema에 `recorded_at` 없음 | 사고시각 재구성 불가, 속도 스푸핑탐지 오판 | schema에 `recorded_at` + ±5분 staleness 검증 |
| G-11 | High | 전송신뢰성 | `mobile/src/hooks/useGpsTracking.ts:103-105` | 전송 실패 시 silent skip. 오프라인 큐/버퍼/재전송 없음. 터널 구간 GPS 전체 유실 | 사고구간 공백, 사후 재구성 불가 | 로컬 버퍼링+배치 전송, AsyncStorage 큐 |
| G-12 | High | DoS | `vehicle_telemetry/router.py:139-152` + `pettracker/router.py:258-267` | GPS ingest 엔드포인트에 rate limit 없음. 탈취 토큰으로 초당 수천건 → Redis buffer 무한증가→DB I/O 폭발 | 단일 탈취 토큰으로 Redis/PG DoS | `@limiter.limit` + Redis `LTRIM` |
| G-13 | High | 지오펜싱 | `vehicle_telemetry/service.py` 전체 | 도착감지·지오펜싱·경로이탈 전무. ETA는 잔여건수×3분 산술(`parent/MapScreen.tsx:142-153`) | 도착알림 없음, 경로이탈 미감지, 이상감지 실패 | 하버사인 반경(≤50m) 도달 시 FCM |
| G-14 | Med | XSS | `mobile/src/constants/mapHtml.ts:155-165,258-260` | label(차량번호판·정류장명)을 innerHTML concat. 악성 DB 데이터 시 WebView XSS | postMessage 조작 → 앱상태 변조 | HTML 인코딩/이스케이프 |
| G-15 | Med | API키 | `mobile/src/constants/mapHtml.ts:104` | Kakao SDK URL에 appkey 평문. 번들 평문 포함 + 네트워크 스니핑 노출 | 키 탈취→과금, 키블록 시 지도중단 | 백엔드 프록시 또는 콘솔 도메인 화이트리스트 |
| G-16 | Med | 좌표유효성 | `gps_validation.py:36-37` | `dt<1`이면 `(True,0.0)`. 동일 타임스탬프 2점이면 거리 무관 통과 | 타임스탬프 복제 스푸핑으로 임의위치 주입 | dt=0 & 거리>0이면 무효/drop |
| G-17 | Med | 좌표유효성 | `vehicle_telemetry/schemas.py:7-13` | 위경도 글로벌 범위만 검증, 한국 bbox·(0,0)·NaN 미검증 | 한국외/null island 좌표 저장 | 한국 bbox soft-warn |
| G-18 | Med | Staleness | `pettracker/service.py:437-444` | 클라이언트 `recorded_at` 그대로 저장, staleness 미검증. 1시간 전 좌표도 수용 | 워커가 과거 GPS 재전송으로 경로/거리 위조 | ±5분 초과 시 422 |
| G-19 | Med | 브로드캐스트 | `vehicle_telemetry/router.py:210-232` | GPS publish throttle 없음. G-12 악용 시 초당 수천 메시지 전 구독자 fan-out | WS 서버 CPU 폭발, 스트림 다운 | per-vehicle 최소 publish 간격(1s) |
| G-20 | Med | 위치정보법 | `vehicle_telemetry/router.py:193-206,155-167` | `log_location_access`가 WS 연결시 1회만. HTTP 폴백 조회엔 호출 없음 | 위치정보법 §16 건별 기록 결함 | `get_vehicle_location`에도 로그 추가 |
| G-21 | Med | 권한격리 | `pettracker/router.py:258-267` + `service.py:430-474` | `record_gps`가 session_id가 로그인 워커 것인지 미검증. 워커 토큰이면 타인 세션에 GPS 주입 | 타 워커 세션 경로 오염 | `WalkSession.walker_id==walker_id` 검증 |
| G-22 | Med | 좌표계 | `common/map_provider/kakao.py:18-50,62-63` | x/y(경도/위도) 순서 주석 없음(잠재 뇌관) + 실패 시 silent `return None` | 좌표 역전 시 경로 오안내 | 명시 주석 + 실패 로깅 |
| G-23 | Low | 권한 | `mobile/src/hooks/useGpsTracking.ts:22-34` | background 권한 미요청(iOS Always 없으면 백그라운드 불가), 영구거부 시 openSettings 없음 | 영구거부 시 복구법 미제공 | `requestBackgroundPermissionsAsync` + openSettings |
| G-24 | Low | 중복 | `vehicle_telemetry/service.py:197-224` | GpsHistory 유니크 제약 없음. 스케일아웃 시 동일포인트 중복 insert 가능 | 거리계산 2배 부풀림 | `(vehicle_id,recorded_at)` unique + ON CONFLICT |
| G-25 | Low | 정합 | `pettracker/service.py:449-453` | polyline append + GPS history 저장 간 Redis publish 실패 정합 테스트 없음 | 극단 장애 시 polyline/history 불일치 | publish 실패 정합 테스트 추가 |
| G-26 | Low | 배터리 | `mobile/src/screens/driver/MapScreen.tsx:140-159` | useGpsTracking(High, 서버) + 지도용(Balanced) GPS 이중 폴링 | 배터리 2배 소모, 방전 시 GPS 전체 중단 | 서버 전송 위치를 지도에 재사용 |

**GPS Top 3**: G-05((0,0) SOS) > G-01+G-03 복합(스푸핑무효+dev bypass) > G-07+G-11 복합(백그라운드 중단+오프라인 유실)

---

## 3. gps_validation.py 커버리지 매트릭스

| 검증 항목 | 구현 | 실제 호출 | 비고 |
|---|---|---|---|
| 위/경도 글로벌 범위 | ✅ (Pydantic) | ✅ | schema validation |
| null island (0,0) 거부 | ❌ | ❌ | 없음 |
| NaN/Inf 필터 | ❌ | ❌ | Pydantic float 통과 후 미검증 |
| 한국 bounding box | ❌ | ❌ | 없음 |
| GPS accuracy 임계 | ✅ | ❌ **미호출** | 함수만 존재 |
| 속도 텔레포트 탐지 | ✅ | ❌ **미호출** | 함수만 존재 |
| mock location 탐지 | ❌ | ❌ | 모바일·서버 양쪽 없음 |
| 동일 타임스탬프 스푸핑 | △ (dt<1→True) | ❌ + 로직결함 | dt=0 & 거리>0 텔레포트 허용 |
| 타임스탬프 중복 거부 | ❌ | ❌ | GpsHistory 유니크 없음 |
| 오래된 좌표 거부(SafeWay) | ❌ | ❌ | 서버시각 강제 |
| 오래된 좌표 거부(PT) | ❌ | ❌ | 클라 시각 무검증 수용 |
| Out-of-order 좌표 | ❌ | ❌ | order_by 정렬만 |
| 서버-단말 시각 편차 | ❌ | ❌ | 없음 |

→ **핵심 결론**: 검증 인프라(`gps_validation.py`)는 작성됐으나 **파이프라인에 연결되지 않아 실질 커버리지는 Pydantic 글로벌 범위 검증뿐**.

---

## 5. 검증 못한 것 (사실 vs 가정)

**사실 (코드 직접 확인)**: G-01·G-05·M-01 (메인 에이전트 직접), 그리고 두 에이전트가 file:line 명시한 정적 사실(TODO stub, 하드코딩, cleanup 누락, fail-open 등).

**가정 (런타임/배포 미검증)**:
- G-03 prod 익스플로잇 가능성 — `.env.production`의 `environment` 값 미열람
- G-12 DoS 실제 임계 — Redis `maxmemory`·서버 스펙 미열람
- G-15 Kakao 콘솔 도메인 화이트리스트 설정 — 코드로 확인 불가
- G-24 스케일아웃 레이스 — 배포 구성 미열람
- M-06/M-14 타이밍 경쟁조건 — 발현 빈도 런타임 측정 필요
- 백그라운드 task(G-07/G-08) — Expo Go vs standalone 빌드 설정 미열람
- 나머지 46건 개별 런타임 재현 미실시

---

## 6. 권장 처리 우선순위 (메인 에이전트 종합)

> ⚠️ 단, 현재 STATE.md상 PT 출시는 7월 말~8월 초로 reschedule, SafeWay는 D-7 동결 상태. 아래는 출시 전 critical path 기준 권고이며, **착수 여부·시점은 사용자 결정**.

1. **출시 차단급 (PT V1.0 출시 전 필수)** — PT 앱 한정:
   - M-02 (PT SOS 미구현) — 안전기능 stub
   - G-05 (SOS (0,0)) — SafeWay SOSButton, 단 PT LiveTrack에도 동일 패턴 확인 필요
   - G-01 (GPS 검증 미연결) — PT record_gps에 검증 연결
   - G-21 (PT 세션 소유권 미검증) — 권한 우회
   - G-08/G-11 (PT 백그라운드 GPS 중단+유실) — 핵심 산책 기능
   - M-04 (PT GPS 인터벌 누수)
2. **보안/법규 (출시 전 강력 권고)**: M-03(dev 로그인), G-02(동의 fail-open), G-12(rate limit), G-04(종료세션 WS), G-14(XSS)
3. **SafeWay 영역 (D-7 동결 — 재진입 시)**: G-03, G-07, G-13, M-01 등
4. **품질 개선 (출시 후)**: 나머지 Med/Low

---

## 7. 메인 에이전트 전체 검증 verdict (2026-06-03, 사용자 옵션 A)

Critical 9 + High 16 중 코드 직접 확인. 범례: ✅ VERIFIED(코드 사실 확인) / ⚠️ 조건부(코드 사실, 영향은 배포설정 의존) / ◐ PLAUSIBLE(패턴은 맞으나 일부 미확인) / ❌ FALSE POSITIVE(반증됨).

| ID | verdict | 근거 / 정정 |
|---|---|---|
| G-01 | ✅ VERIFIED | `grep` 결과 검증함수 호출 0건. `service.py:152-185` update_gps에 검증 없음 |
| G-02 | ✅ VERIFIED | `useGpsTracking.ts:68-70`(저장 실패 fail-open), `77-79`(체크 실패 fail-open) |
| G-03 | ⚠️ 조건부 | `service.py:239-240` bypass 코드 실재. prod 노출은 `environment` 오설정 시만 → 익스플로잇 가능성 UNVERIFIED |
| G-04 | ❌→Low | `pettracker/router.py:609`가 제3자 4003 차단. "제3자 오노출" 반증. `ended_at` 가드 부재(정당 당사자 재연결)만 잔존 → Low로 강등 |
| G-05 | ✅ VERIFIED | `SOSButton.tsx:25-26` (0,0) 초기값 → 권한 실패 시 전송 |
| G-06 | ✅ VERIFIED | `gps_validation.py:47-48` None→True + `useGpsTracking.ts:102` accuracy 미전송 |
| G-07 | ✅ VERIFIED | `useGpsTracking.ts:134` 백그라운드 clearInterval, background task 없음 |
| G-08 | ✅ VERIFIED | `WalkScreen.tsx:110-126` setInterval, AppState 리스너 없음 |
| G-09 | ✅ VERIFIED | `gps_validation.py:22` =100, 미사용(G-01) |
| G-10 | ✅ VERIFIED | `service.py:159,170` 서버시각 강제 |
| G-11 | ✅ VERIFIED | `useGpsTracking.ts:103-105` silent skip, 큐 없음 |
| G-12 | ✅ VERIFIED | `vehicle_telemetry/router.py:139-152` + `pettracker/router.py:258-264` 둘 다 rate limit 없음 |
| G-13 | ✅ VERIFIED | `grep geofenc\|arrival\|haversine` → vehicle_telemetry 0 매치 |
| G-21 | ✅ VERIFIED (bonus) | `pettracker/router.py:265`가 `user.id`를 service에 안 넘겨 세션 소유권 미검증 |
| M-01 | ✅ VERIFIED | `SOSButton.tsx:47-49` 빈 catch, 피드백 없이 tel:112 |
| M-02 | ✅ VERIFIED | `LiveTrackScreen.tsx:120-123` `// TODO` 후 "신고 완료"만 |
| M-03 | ✅ VERIFIED | `LoginScreen.tsx:20,304,198` IS_DEV(EXPO_PUBLIC_DEV_MODE) → DevLoginScreen 임의역할 로그인. (첫 부분읽기 과소평가 정정) |
| M-04 | ✅ VERIFIED | `WalkScreen.tsx:110` 이벤트핸들러 setInterval, unmount cleanup 없음 |
| M-05 | ❌ FALSE POSITIVE | `client.ts:87-90` catch가 return 안 하고 `:109 return Promise.reject(error)`로 흘러내림. "무한 대기" 반증. "자동 로그아웃 이벤트 부재"만 일부 타당 → Low |
| M-06 | ◐ PLAUSIBLE | `useVehicleTracking.ts:259-266,273` timeout 콜백에 mounted 가드 없음 사실. dangling 여부는 connectWs 내부 의존(미확인) |
| M-07 | ◐ DOUBTED | `LiveTrackScreen.tsx:70-81`은 elapsedSeconds 타이머(함수형, 안전), 폴링은 별도 effect(84-95) deps 정상. startedAt stale 메커니즘 미확인 → 강등 후보 |
| M-08 | ◐ 미확인 | `mapHtml.ts:217` push 패턴 직접 미독. 플로지블 |
| M-09 | ◐ 미확인 | sendToMap 정의 미독, 라인참조 불확실 |
| M-10 | ✅ VERIFIED | `useGpsTracking.ts:27-32` 거부 시 Alert만, canAskAgain/openSettings 없음 |
| M-11 | ✅ VERIFIED | `WalkScreen.tsx:91-95` 거부 시 Alert만 |

**검증 통계**: 확인 25건 중 ✅ VERIFIED **19** / ⚠️ 조건부 1(G-03) / ◐ 미확정 4(M-06·M-07·M-08·M-09) / ❌ FALSE POSITIVE **1**(M-05) + 1 강등(G-04).
→ sub-agent 정확도: 직접 검증 표본에서 명백 오탐 1건(M-05), 과장 1건(G-04), 과소 1건(M-03 — 오히려 에이전트가 옳고 메인 첫 읽기가 틀림). 나머지는 코드 사실로 확정.

**추가 발견(검증 중 메인이 포착)**:
- `MapScreen.tsx:183-184` WebView `originWhitelist={["*"]}` + `mixedContentMode="always"` → G-14 XSS 위험 가중
- `WalkScreen.tsx:123-124` PT GPS 실패 시 5초마다 Alert 스팸 (SafeWay는 silent — 비일관)
- `useGpsTracking.ts:138-141` AppState active 재개 시 기존 interval null 체크 없이 setInterval (M-15 뒷받침)

## 부록 — 원시 결과
- 모바일 sub-agent: frontend-dev "mobile-auditor" (42파일, 90k 토큰)
- GPS sub-agent: backend-dev "gps-auditor" (22파일, 105k 토큰)
- 메인 교차검증(2026-06-03): `useGpsTracking.ts`·`gps_validation.py`·`SOSButton.tsx`·`client.ts`·`LiveTrackScreen.tsx`·`WalkScreen.tsx`·`MapScreen.tsx`·`vehicle_telemetry/{service,router}.py`·`pettracker/router.py` 직접 read + `grep IS_DEV`·`grep geofenc`·`grep gps_validation`
