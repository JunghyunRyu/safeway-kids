# Final Tech Spec (DRAFT) — Mobile + GPS 결함 수정

> **상태**: DRAFT — 작성 진행 중. 4개 도메인 스펙 중 2개(모바일·DB) 병합 완료, 2개(백엔드·보안) 작성 중.
> **승인 전**: 이 스펙이 승인되기 전까지 코드 파일 수정 금지 (charter #3).
> **근거 감사**: `artifacts/reviews/2026-06-03-mobile-gps-hole-audit.md` (검증 verdict §7).
> **코드 기준**: 커밋 `39a70ad`.
> **스펙 작성팀**: backend-dev(spec-backend) · frontend-dev(spec-mobile) · security-expert(spec-security) · db-architect(spec-db). 검토 예정: tech-spec-reviewer.

---

## 1. 문제 정의 (Problem Statement)

2026-06-03 모바일+GPS 감사에서 50건 발견, 메인 에이전트가 25건 직접 검증. VERIFIED 19건 + 조건부 1건을 수정한다. 핵심: GPS 검증 인프라 미연결(G-01), SOS 안전기능 실패(G-05/M-01/M-02), 백그라운드 GPS 중단(G-07/G-08/G-11), 권한/검증 우회(M-03/G-12/G-21), 위치정보법 위험(G-02).

## 2. Goals / Non-goals

**Goals**: 검증된 19건 + G-03(조건부) 수정. 각 수정은 단위/통합 테스트 동반, 회귀 0, alembic 라운드트립 성립.

**Non-goals**: ◐ 미확정 4건(M-06·M-07·M-08·M-09)은 별도 검증 후 결정 — 본 스펙 제외. Med/Low 품질 개선(M-12~M-24, G-14~G-26 일부)은 출시 후. G-04(Low 강등)는 ended_at 가드만 옵션 포함.

## 3. 범위 (Scope) — 수정 대상 19+1건

| ID | 영역 | 한줄 | 담당 섹션 |
|---|---|---|---|
| G-01 | BE | GPS 검증함수 호출 연결 | §6 백엔드 |
| G-02 | FE | 동의 fail-closed | §5 모바일 |
| G-03 | BE | WS dev bypass 제거 | §6 백엔드 |
| G-05+M-01 | FE | SOS 위치캐싱+실패피드백 | §5 모바일 |
| G-06+G-09 | BE/FE | accuracy 검증+전송 | §5/§6 |
| G-07 | FE | SafeWay 백그라운드 GPS | §5 모바일 |
| G-08 | FE | PT 백그라운드 GPS | §5 모바일 |
| G-10 | BE | recorded_at staleness | §6 백엔드 |
| G-11 | FE/BE | 오프라인 큐+배치 | §5/§6 |
| G-12 | BE | rate limit | §6 백엔드 |
| G-13 | BE | 지오펜싱 도착감지 | §6 백엔드 |
| G-21 | BE | PT 세션 소유권 검증 | §6 백엔드 |
| M-02 | FE | PT SOS 구현 | §5 모바일 |
| M-03 | FE | dev login 차단 | §5 모바일 |
| M-04 | FE | PT gpsRef cleanup | §5 모바일 |
| M-10+M-11 | FE | 권한 영구거부 처리 | §5 모바일 |
| (G-04) | BE | PT WS ended_at 가드 (옵션) | §6 백엔드 |

## 4. 아키텍처 / 데이터 흐름 변경

```
[모바일 GPS 캡처]
  expo-location startLocationUpdatesAsync (백그라운드 task)  ← G-07/G-08 (현재: setInterval, 백그라운드 중단)
    → accuracy + recorded_at 포함 페이로드                  ← G-06/G-10 (현재: 미전송)
    → 전송 실패 시 AsyncStorage 큐                          ← G-11 (현재: silent skip)
        → 복구 시 배치 엔드포인트
[백엔드 ingest]
  POST /telemetry/gps  (+rate limit)                        ← G-12 (현재: 없음)
    → validate_gps_speed + validate_gps_accuracy 호출       ← G-01/G-06/G-09 (현재: 미호출)
    → recorded_at staleness ±5분 검증                       ← G-10 (현재: 서버시각 강제)
    → 지오펜싱 도착감지(하버사인 ≤반경) → FCM                ← G-13 (현재: 없음)
  POST /telemetry/gps/batch (신규)                          ← G-11 복구
  WS 인가: dev bypass 제거                                  ← G-03
  PT record_gps: 세션 소유권 검증                            ← G-21
```

---

## 5. 모바일 수정 스펙 (frontend-dev / spec-mobile) — 완료

> 출처: spec-mobile 에이전트(75k 토큰, 24 tool). 직접 읽은 파일: useGpsTracking.ts, SOSButton.tsx, LiveTrackScreen.tsx(PT), WalkScreen.tsx(PT), LoginScreen.tsx, vehicles.ts, compliance.ts, walks.ts(PT), 양쪽 app.json/package.json.

### 5.1 G-02 동의 fail-closed
- 현재: `useGpsTracking.ts:64-70`(저장 실패→true), `:77-79`(체크 실패→true)
- 수정: 두 catch를 fail-closed. createDriverConsent 실패 시 재시도 Alert + `setConsentGranted(false)`. checkDriverConsent 실패도 false. consent check를 `checkConsent()` useCallback 추출해 재시도. `// fail-open for safety` 주석 제거.
- 테스트: `useGpsTracking.test.ts` 신규 — reject 시 consentGranted=false 확인, 정상 flow 회귀.

### 5.2 G-05+M-01 SOS 위치캐싱+실패피드백
- 현재: `SOSButton.tsx:25-26`(0,0 초기), `:36-38`(권한실패 0,0 전송), `:47-49`(API실패 무음)
- 수정: 마운트 시 30초 주기 위치 캐싱(`cachedLocationRef`). SOS 시 캐시+최신시도, 위치없으면 `latitude:null, location_unknown:true` 전송((0,0) 금지). API 실패 시 재시도/112 선택 Alert(즉시 자동 112 안 함), retryCount 최대 2.
- 백엔드 계약: `/notifications/sos` lat/lng nullable + `location_unknown` 필드.
- 테스트: `SOSButton.test.tsx` 신규 — 위치있음→lat≠0, 위치없음→location_unknown, API실패→Alert·112 미즉시.

### 5.3 M-02 PT SOS 구현
- 현재: `LiveTrackScreen.tsx:120-123` TODO stub + "신고 완료" 거짓 Alert
- 수정 선택지 A(권장): 위치획득 후 `POST /pt/sos`(session_id 포함), 실패 시 119 Alert. 선택지 B(fallback): 버튼 비활성+"준비중"+119. **선택지 A는 백엔드 OQ-1(PT SOS 엔드포인트 유무)에 의존** → 없으면 B.
- 테스트: `LiveTrackScreen.test.tsx` — 성공→신고완료, 실패→119, 거짓 "신고완료" 미표시.

### 5.4 M-03 dev login 차단
- 현재: `LoginScreen.tsx:20` `IS_DEV=__DEV__||EXPO_PUBLIC_DEV_MODE==="true"`, `:304` DevLoginScreen, `:292-295` 테스트 자격증명 hint
- 수정: `const IS_DEV = __DEV__;` 단독. hint 텍스트 블록(292-295) 완전 삭제. `.env.*`에서 EXPO_PUBLIC_DEV_MODE 제거. devLogin API의 prod 비활성은 백엔드 책임.
- 테스트: ProductionLoginScreen에 "01033333333" 미노출 확인.

### 5.5 M-04 PT gpsRef cleanup
- 현재: `WalkScreen.tsx:110-126` 이벤트핸들러 setInterval, cleanup은 handleEnd에만
- 수정: 빈 deps useEffect cleanup에서 gpsRef+timerRef 정리. setInterval overwrite 전 clear. **G-08 적용 시 TaskManager로 대체되어 통합.**

### 5.6 G-07 SafeWay 백그라운드 GPS
- 현재: `useGpsTracking.ts:132-146` 백그라운드 clearInterval
- 수정: `mobile/src/tasks/gpsBackgroundTask.ts` 신규(`TaskManager.defineTask`), `startLocationUpdatesAsync`(High, 5s, distanceInterval 10m, foregroundService 알림). `index.ts`에 task import. AppState setInterval 패턴 제거. fg+bg 권한 분리 요청.
- 신규 의존성: `expo-task-manager`(SDK54 호환). AsyncStorage 기존.
- **Expo Go 제약**: 백그라운드 task는 Expo Go 미동작 → EAS Dev Client 빌드 필수 검증.

### 5.7 G-08 PT 백그라운드 GPS
- 수정: `apps/pettracker/mobile/src/tasks/walkGpsTask.ts` 신규(동일 패턴, `WALK_GPS_TASK`). PT `app.json`에 `ACCESS_BACKGROUND_LOCATION`+`isAndroidBackgroundLocationEnabled`+`isAndroidForegroundServiceEnabled`+expo-location 플러그인 always 권한 추가. 기존 setInterval 제거(M-04 통합).
- 신규 의존성: `expo-task-manager` PT package.json.

### 5.8 G-11(모바일) 오프라인 큐
- 현재: `useGpsTracking.ts:103-105` silent skip, `WalkScreen.tsx:123-124` 5초 Alert 스팸
- 수정: `mobile/src/utils/gpsOfflineQueue.ts` 신규(AsyncStorage, MAX 200포인트 FIFO, retryCount≤2). 실패 시 enqueue, 복구 시 `flushQueue`→배치 전송. PT Alert 스팸 제거→enqueue.
- 백엔드 계약: `POST /telemetry/gps/batch`(또는 단건 순차 fallback).

### 5.9 M-10+M-11 권한 영구거부
- 현재: `useGpsTracking.ts:22-34`, `WalkScreen.tsx:91-95` Alert만
- 수정: `canAskAgain` 체크 → false면 "설정 열기"(`Linking.openSettings()`) Alert. `useGpsTracking.ts`에 Linking import 추가. bg 권한에도 적용.

### 5.10 부수 accuracy/recorded_at 전송 (G-06/G-10 연동)
- `vehicles.ts` updateGps 시그니처에 accuracy·recorded_at 추가. `useGpsTracking.ts:102` 전달. **PT walks.ts는 이미 accuracy·recorded_at 전송 중(수정 불요)**.

### 모바일 신규 의존성 요약
- `expo-task-manager` (SafeWay + PT 양쪽 package.json) — `npx expo install`로 SDK54 호환 버전
- AsyncStorage·Linking·expo-location·axios 모두 기존

### 모바일 Open Questions
- OQ-1 PT SOS 엔드포인트 유무(M-02 선택지 결정)
- OQ-2 PT "항상 허용" 권한 UX 수용 가능성 (foreground-only로 충분한가)
- OQ-3 배치 엔드포인트 vs 단건 순차 fallback
- OQ-4 G-07 후 AppState 리스너 축소유지 vs 제거
- OQ-5 CI의 devLogin 통합테스트 IS_DEV 트리거 갱신

---

## 6. 백엔드 수정 스펙 (backend-dev / spec-backend) — 완료

> 출처: spec-backend 에이전트(61k 토큰). 기준 `39a70ad`, 실제 코드 read 기반. spec-mobile·spec-db 계약 정합 확인됨.

### 6.1 G-01 검증 파이프라인 연결
- 현재: `gps_validation.py:25-49` 함수 import/호출 0건, `vehicle_telemetry/service.py:152-185` update_gps 무검증, `pettracker/service.py:430-474` record_gps 무검증
- 수정: update_gps·record_gps 진입부에 `validate_gps_accuracy`+`validate_gps_speed` 호출. 실패 422. prev 포인트: SafeWay는 Redis(`vehicle:{id}:gps`), PT는 DB 마지막 행. 상수 `GPS_ACCURACY_THRESHOLD_VEHICLE_M=50`·`_WALK_M=30` 추가.
- 시그니처 변경: `update_gps(redis, request, db)` +db, `record_gps(db, session_id, point, walker_id)` +walker_id → 라우터 호출부 수정
- 회귀: `test_m4_websocket`류 db 파라미터 주입 확인

### 6.2 G-03 dev bypass 제거
- `vehicle_telemetry/service.py:236-240` 7줄 삭제. PLATFORM_ADMIN 분기는 유지. 개발 시연은 seed VehicleAssignment로 대체(OQ-4).
- 회귀: `test_rbac.py` 시드없이 GPS 접근 테스트 있으면 수정. RG-01(4003 유지) 보존.

### 6.3 G-06/G-09 accuracy
- `validate_gps_accuracy`에 `reject_none` 파라미터(초기 False=구형호환, V1.1 True). `MIN_GPS_ACCURACY_M=100` 제거→50/30 분리.
- `GpsUpdateRequest`에 `accuracy: float|None`, `recorded_at: datetime|None` 추가(nullable=하위호환). `GpsLocationResponse`에 accuracy 추가.

### 6.4 G-10 staleness
- `update_gps`에서 서버시각 강제(159,170) → `recorded_at` 수신, ±5분 초과 422, naive면 UTC 가정. Redis 페이로드 키 `recorded_at`→`client_recorded_at`+`server_recorded_at`. `flush_gps_buffer`는 전환기간 양쪽 키 허용.

### 6.5 G-11 배치 엔드포인트
- 신규: `POST /telemetry/gps/batch`(207 Multi-Status), `POST /pt/walks/{id}/gps/batch`. 스키마 `GpsBatchItem/Request/Result`(max 500). 개별 검증+partial accept, recorded_at ASC 정렬, **배치 staleness 4시간**(단건 5분), Redis rpush+LTRIM. `@limiter.limit("10/minute")`.
- config `gps_buffer_max_size` 추가.

### 6.6 G-12 rate limit
- `/gps`·`/walks/{id}/gps`에 `@limiter.limit(settings.rate_limit_gps)` — **확정 30/min** (검토 확인: `config.py:78` `rate_limit_auth="30/minute"` 패턴 일치, 60/min은 초안 오기로 폐기). `Request` 파라미터 추가(slowapi 필수). `update_gps`에 Redis LTRIM. **config에 `rate_limit_gps="30/minute"` 신규 필드 추가 필수(Ma-4)**.
- ⚠️ 회귀: 통합테스트가 `/gps` 반복 호출 시 TESTING 우회/mock 필요.

### 6.7 G-13 지오펜싱
- 신규 `check_geofence_arrival(db, vehicle_id, lat, lon)`: 오늘 차량 스케줄 하버사인 ≤반경(geofence_radius_m 또는 50m fallback) → FCM. 중복방지 Redis 플래그 TTL 1h. update_gps에 비차단 훅.
- ✅ **컬럼 확정 (검토 C-1)**: `stop_latitude/longitude`는 **코드에 없음**(grep 0건). `scheduling/models.py:74-75`의 **`pickup_latitude/pickup_longitude`(NOT NULL)를 지오펜스 기준점으로 사용**한다 (어린이 통학에서 픽업/하차 지점 = 도착 판정 지점). `check_geofence_arrival` 쿼리를 pickup 컬럼으로 작성.
- ⚠️ 성능: 1초마다 1+2N 쿼리 → OQ-11 캐시 검토(출시 후 부하테스트).

### 6.8 G-21 PT 세션 소유권
- `_get_owned_walk_session(db, session_id, walker_id)` 헬퍼: walker_id 불일치 403, 없으면 404. `record_gps`·`record_gps_batch`에서 사용. 라우터 `walker_id=user.id` 전달.
- 회귀: PT 통합테스트 3인자 호출 시 TypeError → 픽스처 수정.

### 6.9 구현 순서 (의존성 고려, 7단계)
1. 상수/스키마/config (의존성 0) → 2. G-03 bypass 제거 → 3. G-21 소유권 → 4. G-01/06/09/10 검증 통합(db 마이그 후) → 5. G-12 rate limit → 6. G-11 배치(3·4 후) → 7. G-13 지오펜싱(db 컬럼 후)

### 6.10 백엔드 Open Questions (11건, 핵심)
- OQ-1 accuracy None reject 정책(초기 허용 vs 강제) · OQ-3 Redis 키 전환 전략 · OQ-4 G-03 후 dev seed 방법 · OQ-5 배치 staleness 4h 적정성 · OQ-6 배치 중복 ON CONFLICT vs 개별 · OQ-7 종료세션 GPS ingest 정책(G-04 연계) · OQ-8 rate limit key_func IP vs user.id · OQ-9 stop_lat/lon 컬럼 유무 · OQ-11 지오펜싱 쿼리 부하 캐시
- **rate limit 수치 충돌**: 백엔드 60/min vs 보안 30/min → 보안 권고(30) 채택 권장

> **정합 확인**: 백엔드↔모바일 계약(accuracy·recorded_at·배치·SOS nullable) 일치. 백엔드↔DB 계약(accuracy·client_recorded_at·unique·geofence_radius_m·stop_lat/lon) 일치. 단 stop_lat/lon 컬럼 존재는 미확인(OQ-9).

---

## 7. DB 스키마·마이그레이션 스펙 (db-architect / spec-db) — 완료

> 출처: spec-db 에이전트(59k 토큰). 직접 확인: GpsHistory(`vehicle_telemetry/models.py:81-99`), WalkGpsHistory(`pettracker/models.py:209-224` — accuracy 이미 존재), DailyScheduleInstance(`scheduling/models.py`).

### 7.1 스키마 변경
| 테이블 | 변경 | 결함 | NULL | 기본값 |
|---|---|---|---|---|
| gps_history | `accuracy FLOAT` 추가 | G-06 | YES | NULL |
| gps_history | `client_recorded_at TIMESTAMPTZ` 추가 | G-10 | YES | NULL |
| gps_history | `UNIQUE(vehicle_id,recorded_at)` | G-24 | — | — |
| daily_schedule_instances | `geofence_radius_m SMALLINT` 추가 | G-13 | YES | NULL→서비스 50m |
| walk_gps_history | `UNIQUE(session_id,recorded_at)` | G-24 | — | — |

변경 안함: WalkGpsHistory.accuracy(이미 존재), WalkGpsHistory.recorded_at(이미 클라 시각 수신 — G-18은 코드만), ScheduleTemplate.

### 7.2 마이그레이션 (2개, hand-write, autogenerate 금지)
- **M1** `g____gps_history_accuracy_staleness_unique` (down_revision=`f1a3c5b7d9e2`): accuracy+client_recorded_at add_column, uq_gps_history_vehicle_recorded create_unique_constraint. downgrade 역순.
- **M2** `h____geofence_radius_walk_gps_unique` (down_revision=M1): daily_schedule_instances.geofence_radius_m add, walk_gps_history uq_walk_gps_session_recorded.
- alembic upgrade/downgrade 라운드트립 필수.

### 7.3 회귀 위험 (중간)
- **unique constraint 적용 전 기존 중복 확인 SQL 필수** (gps_history·walk_gps_history GROUP BY HAVING COUNT>1). 중복 있으면 upgrade 전 제거. 신규/dev DB 무위험.
- flush_gps_buffer 통합테스트가 동일 recorded_at 2회 삽입 시 실패 가능 → microsecond 차이 또는 ON CONFLICT DO NOTHING.
- 서비스 레이어 ON CONFLICT DO NOTHING 동반 필요.

### 7.4 배포 순서
M1 upgrade → M1 서비스배포(accuracy/client_recorded_at) → 검증 → M2 upgrade → M2 서비스배포(geofence) → 검증. (gps_history 버그수정과 geofence 신규기능 독립 배포)

### DB Open Questions
- OQ client_recorded_at vs device_recorded_at 명명
- OQ unique constraint vs ON CONFLICT만으로 방어 (스케일아웃 collision 빈도 모니터링 후)
- OQ ScheduleTemplate에도 radius 추가 여부(V1.0은 인스턴스만)

---

## 8. 보안·컴플라이언스 요구사항 (security-expert / spec-security) — 완료

> 출처: spec-security 에이전트(53k 토큰). 직접 확인: useGpsTracking.ts, SOSButton.tsx, LoginScreen.tsx, mapHtml.ts, MapScreen.tsx, gps_validation.py, vehicle_telemetry/{service,router,schemas}.py, auth/router.py, config.py.

### 8.1 법규 매핑 (수용 기준)
| 결함 | 법조 | 요구사항 | 수용기준 |
|---|---|---|---|
| G-02 | 위치정보법 §15·§39, 개보법 §15, 아동개보법 | 동의 저장/확인 실패 = 동의없음 처리 | catch 두 곳 `consentGranted(false)` + 재시도 UI, sendLocation guard 단위테스트, fail-open 주석 제거 |
| G-03 | 위치정보법 §18·§26, 개보법 §29 | dev bypass 제거 | `service.py:239-240` 삭제, 미배정 역할 False 단위테스트(environment=development에서도) |
| M-03 | 개보법 §29, 위치정보법 §26 | 인증우회 경로 제거 | `IS_DEV=__DEV__` 단독, 자격증명 hint 제거, 백엔드 `/auth/dev-login` env guard 유지 |
| G-12 | 개보법 §29, 위치정보법 §26 | rate limit | 양 엔드포인트 `@limiter.limit` **30 req/min/token**(정상 12의 2.5배) + Retry-After + Redis LTRIM 720건 |
| G-20 | 위치정보법 §16 (6개월 보관) | HTTP 조회도 건별 기록 | `get_vehicle_location`에 `log_location_access` 추가(WS 패턴 준용) |
| G-14 | 개보법 §29 | WebView 입력검증 | `mapHtml.ts:159` label HTML 엔티티 인코딩, originWhitelist 제한, mixedContentMode "never" |

### 8.2 보안 요구사항 (SR)
- **SR-01 Fail-Closed**: 동의 모든 실패 경로 false. consentGranted null/false 동안 GPS 미시작.
- **SR-02 dev-bypass 격리**: BE bypass 제거 + FE EXPO_PUBLIC_DEV_MODE 제거 + **`config.py:72` `dev_login_secret="change-me-dev"` validator 추가 필요** (AR-02).
- **SR-03 GPS 검증 연결**: validate_gps_speed/accuracy를 update_gps에서 호출, 실패 422, prev 포인트는 Redis에서, `accuracy` 스키마 필드 추가, (0,0) reject.
- **SR-04 SOS 무결성**: 0,0 초기값 제거, 위치없으면 location_unknown, API실패 Alert, tel:112는 항상.
- **SR-05 WebView XSS**: 외부데이터 인코딩, postMessage type 화이트리스트.
- **SR-06 비밀정보**: `_check_production_secrets` validator 약화 금지.

### 8.3 Regression Guard (수정이 깨면 안 되는 것)
- **RG-01** WS `check_vehicle_access` 4003 차단 유지. bypass 제거 후에도 합법 배정 역할 True, PLATFORM_ADMIN True, 기존 RBAC 통합테스트 통과.
- **RG-02** `/auth/dev-login` env guard(`auth/router.py:124-125`) 유지.
- **RG-03** 동의거부 GPS 비활성 guard(`useGpsTracking.ts:109`) 조건 유지.
- **RG-04** 위치정보 180일 자동삭제(`purge_old_gps_data`) 보존.
- **RG-05** WS §16 기록(`router.py:193-206`) 유지, G-20은 독립 추가.

### 8.4 추가 권고 (함께 처리 시 시너지)
- **AR-01** G-20 (같은 파일 수정이라 함께)
- **AR-02** config.py validator에 dev_login_secret 추가 (기본값이면 dev-login secret 검증 무력화)
- **AR-03** G-16 dt==0 & 거리>0 → False
- **AR-04** G-17 (0,0)·한국 bbox (hard reject 말고 soft warn)
- **AR-05** G-19 broadcast throttle (publish 1초 간격 SET NX EX)

### 8.5 변호사 확인 필요 (Open Questions)
- **OQ-01** 동의 저장 일시장애 시 로컬 임시보관이 §15 동의 충족하는지
- **OQ-02** 아동 탑승차량 위치가 아동개보법 법정대리인 동의 추가 적용 대상인지
- **OQ-03** §16 "건별 기록"이 WS 연결단위인지 메시지단위인지 (메시지단위면 재설계)
- **OQ-04** EXPO_PUBLIC_DEV_MODE prod 배포 시 §29/§26 처분 수준
- **OQ-05** G-03 bypass 과거 prod/staging 배포 이력 있으면 §39/§38 신고·사후조치 의무

> ⚠️ OQ-05는 사실 확인 필요: `environment="development"`로 실제 배포된 이력이 있었는지 배포 로그 검토 후 변호사 자문. korea-regulatory-counsel 라우팅 후보.

---

## 9. 테스트 전략 (통합)
- 모바일: jest mock (expo-location/task-manager/AsyncStorage). 신규 테스트 파일 6개.
- 백엔드: 단위(gps_validation 연결, staleness, 소유권) + 통합(rate limit, 배치, WS 인가). 기존 214 회귀 0.
- DB: alembic upgrade/downgrade 라운드트립 + 중복 사전확인 SQL.
- E2E: 백그라운드 GPS는 EAS Dev Client 실기기 (Expo Go 불가).

## 10. 롤백 전략
각 결함별 롤백 명시(§5/§7). 마이그레이션 downgrade 라운드트립. 신규 파일은 삭제, 의존성 제거.

## 11. 수용 기준 (Acceptance Criteria)
**기능**
- [ ] 19건 각각 수정 + 테스트 통과
- [ ] 백엔드 회귀 0 (기존 214 유지, 신규 추가)
- [ ] alembic 라운드트립 PASS (+ unique constraint 전 중복 SQL 확인)
- [ ] GPS 검증함수 실제 호출 (G-01 grep 0→N으로 확인)
**보안·법규 (§8.1 병합)**
- [ ] G-02: 동의 catch 두 곳 false, sendLocation guard 단위테스트
- [ ] G-03: bypass 삭제 + 미배정 역할 False(environment=development에서도) 단위테스트
- [ ] M-03: `IS_DEV=__DEV__` 단독, 자격증명 hint 제거
- [ ] G-12: 양 엔드포인트 30/min + Retry-After + Redis LTRIM
- [ ] G-20: HTTP 조회도 log_location_access (위치정보법 §16)
- [ ] G-14: mapHtml label HTML 인코딩, originWhitelist 제한
- [ ] G-05: SOS (0,0) 미전송, 실패 시 사용자 피드백
**Regression Guard (§8.3)**
- [ ] RG-01 SafeWay WS check_vehicle_access 4003 유지 + 합법 배정 역할 True
- [ ] RG-02 `/auth/dev-login` env guard 유지 / RG-03 동의거부 GPS 비활성 / RG-04 180일 삭제 / RG-05 WS §16 기록

## 12. 코드 영향 맵 (Code Impact Map) — 부분
**모바일 신규**: gpsBackgroundTask.ts, walkGpsTask.ts, gpsOfflineQueue.ts, 테스트 6개
**모바일 변경**: useGpsTracking.ts, SOSButton.tsx, LoginScreen.tsx, vehicles.ts, WalkScreen.tsx(PT), LiveTrackScreen.tsx(PT), 양쪽 index.ts·app.json·package.json
**백엔드 변경**: `core/gps_validation.py`(상수·reject_none), `vehicle_telemetry/{service,router,schemas}.py`, `pettracker/{service,router,schemas}.py`, `notification/schemas.py`(C-2 SOS nullable), `config.py`(rate_limit_gps·gps_buffer_max_size·dev_login_secret validator AR-02)
**백엔드 신규**: 배치 엔드포인트 2개, `check_geofence_arrival`, `_get_owned_walk_session`, `update_gps_batch`/`record_gps_batch`
**백엔드 테스트 수정 필수 (시그니처 파급)**: `test_m4_websocket.py`(update_gps +db), PT GPS 통합테스트(record_gps +walker_id), `test_rbac.py`(G-03 bypass 제거), rate limit 통합테스트(TESTING 우회)
**DB**: gps_history(accuracy·client_recorded_at·unique)·daily_schedule_instances(geofence_radius_m)·walk_gps_history(unique) 모델 + 마이그 M1·M2

## 13. Open Questions (통합)
모바일 OQ-1~5 + DB OQ 3건 + `[보안 OQ 병합 예정]`. **OQ-1(PT SOS 엔드포인트)이 M-02 구현 방식을 가르는 최우선 결정.**

## 14. 작성 진행 상태
- [x] §5 모바일 / §6 백엔드 / §7 DB / §8 보안 4섹션 병합
- [x] tech-spec-reviewer 스트레스 테스트 (§15)
- [x] 확정 사실 수정 반영 (rate limit 30, G-13 pickup 컬럼, §11/§12 채움)
- [ ] §16 사용자 결정 대기 → 승인 → Phase 5 구현

## 15. tech-spec-reviewer 검토 결과 — APPROVE WITH CHANGES

> spec-reviewer 에이전트(69k 토큰) 코드 대조. Critical 3 / Major 7 / Minor 6.

### 확정된 교차섹션 모순 (코드로 검증)
- **(a) rate limit**: 30/min 확정 (`config.py:78` rate_limit_auth=30 패턴, 60은 오기) → §6.6 반영 완료
- **(b) 지오펜싱 컬럼**: `stop_latitude/longitude` 코드에 **없음**(grep 0). `pickup_latitude/longitude`(`scheduling/models.py:74-75`)만 존재 → §6.7 pickup 사용으로 반영 완료

### Critical 갭 (구현 차단)
- **C-1** G-13 stop 컬럼 부재 → ✅ 해소(pickup 사용 확정, §6.7)
- **C-2** `/notifications/sos` 스키마 lat/lng NOT NULL(`notification/schemas.py:14-18`) → §5.2 (0,0)→null 전송이 422로 차단됨. **백엔드 스키마 변경 필요**: SosRequest lat/lng `float|None` + `location_unknown: bool=False` 추가. → **§16 결정-2**
- **C-3** §12 백엔드 영향맵 누락 → ✅ 해소(§12 채움)

### Major 갭 (구현 전 권장)
- Ma-1/Ma-2 update_gps/record_gps 시그니처 파급(test_m4_websocket.py, PT 통합테스트) → ✅ §12 반영
- Ma-3 `/pt/sos` 엔드포인트 **없음 확정** → M-02 선택지 A/B 결정 필요 → **§16 결정-1**
- Ma-4 config `rate_limit_gps` 신규 필드 → ✅ §6.6 반영
- Ma-5 rate limit key_func IP 고정(`rate_limit.py:4`) → IP vs user.id 결정 → **§16 결정-3**
- Ma-6 flush_gps_buffer 키 전환 취약 → §12 반영, 양쪽 키 허용 패턴
- Ma-7 §11 보안 AC 미병합 → ✅ §11 반영

### Minor (구현 중 처리)
Mi-1 배치 staleness 4h 근거 / Mi-2 중복확인 SQL 명문화 / Mi-3 G-04 옵션 명확화 → **§16 결정-4** / Mi-4 AR-02 validator를 §6.2에 / Mi-5 배치 flush 시간 / Mi-6 eas projectId 확인

### 검증 가능성 경고
- G-07/G-08 백그라운드 GPS: **Expo Go 검증 불가 → EAS Dev Client 실기기 수동 확인 필수** (CI 자동검증 불가)
- G-12 rate limit: 통합테스트 TESTING 우회 방법 스펙 보강 필요
- unique constraint: 기존 데이터 중복 SQL 사전확인 필수

## 16. 구현 착수 전 사용자 결정 필요 (5건)

| # | 결정 | 옵션 | 메인 권고 |
|---|---|---|---|
| 결정-1 (Ma-3) | **M-02 PT SOS** (`/pt/sos` 없음 확정) | A) `/pt/sos` 엔드포인트 신규 구축 + 실연동 / B) 버튼 비활성+"준비중"+119 | 출시 차단급이면 A. PT 출시 7월말이면 A 권장 |
| 결정-2 (C-2) | **SOS 스키마 nullable 변경** | SosRequest lat/lng float\|None + location_unknown 추가 | 필수 — G-05 동작 전제. 승인만 필요 |
| 결정-3 (Ma-5) | **rate limit key_func** | IP 기반(현행) / user.id 기반(NAT 안전, 커스텀 필요) | GPS 고빈도라 user.id 권고 |
| 결정-4 (Mi-3) | **G-04 ended_at 가드** | 포함 / 출시 후 별도(Low) | 출시 후 별도(제외) 권고 |
| 결정-5 (OQ-2) | **아동개보법 추가동의** | korea-regulatory-counsel 자문 후 consent 재설계 여부 | 코드 외 — 자문 병행, consent 플로우는 자문 후 확정 |
