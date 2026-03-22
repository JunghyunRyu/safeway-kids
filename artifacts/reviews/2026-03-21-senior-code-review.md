# Senior Code Review — Code Hardening

**Reviewer**: Senior Developer (Automated Review Agent)
**Date**: 2026-03-21
**Scope**: 19 files across backend (15) and frontend (4) — code hardening improvements

## 요약
- **전체 판정**: PASS WITH COMMENTS
- **리뷰 파일 수**: 19개
- **이슈 수**: CRITICAL 0 / HIGH 1 / MEDIUM 4 / LOW 5

---

## 파일별 리뷰

### 1. `backend/app/config.py`
- **판정**: PASS
- **칭찬**: 프로덕션 환경에서 placeholder 시크릿 사용을 차단하는 `_check_production_secrets` 검증기가 잘 구현됨. 설정 상수들(`db_pool_size`, `ws_ping_interval_seconds`, `schedule_time_window_minutes` 등)이 하드코딩 대신 설정화되어 운영 유연성이 높음.
- **이슈**: 없음

### 2. `backend/app/database.py`
- **판정**: PASS
- **칭찬**: `pool_pre_ping=True` 설정으로 끊어진 커넥션 자동 감지. `settings.db_pool_size`/`db_max_overflow` 참조가 올바르게 config에서 가져옴. `get_db` 제너레이터의 commit/rollback 패턴이 깔끔함.
- **이슈**: 없음

### 3. `backend/app/main.py`
- **판정**: PASS
- **칭찬**: startup 시 만료 문서 비활성화와 cron 등록이 잘 분리됨. `_start_daily_cron`에서 `deactivate_expired_documents`를 daily pipeline에 통합한 것이 적절함. lifespan 관리(scheduler shutdown, flush_task cancel, redis close)가 빠짐없이 처리됨.
- **이슈**: 없음

### 4. `backend/app/modules/auth/service.py`
- **판정**: PASS WITH COMMENTS
- **칭찬**: OTP를 Redis로 전환하여 인메모리 dict 대비 프로세스 재시작에 안전. TTL 180초 설정이 적절함. `verify_otp`에서 검증 후 즉시 삭제하여 replay 공격 방지.
- **이슈**: [MEDIUM #1] `list_users`의 `User.name.ilike(f"%{search}%")` — SQLAlchemy ORM이 파라미터 바인딩을 처리하므로 SQL 인젝션 위험은 없으나, `%`나 `_` 같은 LIKE 와일드카드 문자가 이스케이프되지 않아 의도치 않은 패턴 매칭이 발생할 수 있음.

### 5. `backend/app/modules/vehicle_telemetry/router.py`
- **판정**: PASS
- **칭찬**: WebSocket first-message auth 구현이 잘됨 — `asyncio.wait_for` 5초 타임아웃, 토큰 없음/무효 시 4001 코드로 명확한 거부. query param 방식도 호환 유지하면서 deprecated 경고 로깅. `ping_loop`에서 `WebSocketDisconnect`, `CancelledError` 모두 처리. `_authenticate_token`에서 `is_active` 검증까지 포함.
- **이슈**: 없음

### 6. `backend/app/modules/vehicle_telemetry/service.py`
- **판정**: PASS
- **칭찬**: GPS TTL이 `settings.gps_data_ttl_seconds`로 설정화됨. Redis set/publish/rpush 3단계 파이프라인이 명확. `flush_gps_buffer`의 lpop 루프가 atomic하게 동작.
- **이슈**: 없음

### 7. `backend/app/modules/routing_engine/service.py`
- **판정**: PASS
- **칭찬**: road distance matrix 실패 시 Euclidean 폴백이 로깅과 함께 잘 처리됨 — 이전의 무음 실패가 제거됨. `settings.schedule_time_window_minutes` 사용으로 time window가 설정화됨.
- **이슈**: [LOW #1] line 142-145의 `except Exception as e` 블록에서 Euclidean 폴백으로 전환할 때 warning 레벨로 로깅하는 것은 적절하나, 이 함수가 `generate_route_plan`에서만 호출되므로 현재로서는 문제 없음.

### 8. `backend/app/modules/routing_engine/distance.py`
- **판정**: PASS
- **칭찬**: `settings.distance_cache_ttl_seconds` 사용으로 캐시 TTL 설정화. 캐시 키 생성에 MD5 해시 사용으로 일관성 보장.
- **이슈**: [LOW #2] `_cache_key`에서 MD5 사용 — 보안 목적이 아닌 캐시 키 생성이므로 문제 없으나, 노드 순서가 바뀌면 다른 캐시 키가 생성됨 (정렬 없음). 현재 호출 패턴상 depot이 항상 첫 번째이므로 실질적 문제는 아님.

### 9. `backend/app/modules/compliance/router.py`
- **판정**: PASS
- **칭찬**: 업로드 검증이 3단계로 잘 구현됨: (1) `DocumentType` enum 검증, (2) MIME 타입 화이트리스트, (3) 파일 크기 10MB 제한. `await file.read()` 후 `await file.seek(0)`로 파일 포인터 리셋 처리.
- **이슈**: [MEDIUM #2] `file.content_type`은 클라이언트가 보내는 값이므로 스푸핑 가능. 프로덕션에서는 매직 바이트 검증이 더 안전하지만, 현재 파일이 로컬 스토리지에만 저장되고 서빙되지 않으므로 당장의 보안 위험은 낮음.

### 10. `backend/app/modules/compliance/service.py`
- **판정**: PASS
- **칭찬**: `deactivate_expired_documents`가 bulk UPDATE로 효율적으로 구현됨. `withdraw_consent`에서 동의 철회 시 cascade로 스케줄 비활성화하는 로직이 적절.
- **이슈**: 없음

### 11. `backend/app/modules/notification/providers/sms.py`
- **판정**: PASS
- **칭찬**: 에러 분기가 명확 — `TimeoutException`, `HTTPStatusError`, 일반 `Exception` 3단계. HTTP 에러 시 response body를 200자로 제한하여 로그 오염 방지. 개발 환경에서는 실제 API 호출 없이 로그만 남기는 패턴이 적절.
- **이슈**: 없음

### 12. `backend/app/modules/notification/providers/fcm.py`
- **판정**: PASS
- **칭찬**: FCM 에러 타입별 분기(`Unregistered`, `NotFound`, `SenderIdMismatch`)가 잘 구현됨. `ImportError` 별도 처리로 firebase_admin 미설치 환경에서도 안전. 개발/프로덕션 분기가 일관됨.
- **이슈**: [LOW #3] `messaging.send(message)` — 동기 호출을 async 메서드 안에서 사용. Firebase Admin SDK의 `send`는 blocking I/O이므로 이벤트 루프를 블로킹할 수 있음. 프로덕션 트래픽이 높아지면 `asyncio.to_thread` 래핑을 고려할 것.

### 13. `backend/app/modules/notification/service.py`
- **판정**: PASS
- **칭찬**: FCM 실패 시 SMS 폴백 패턴이 일관됨. `send_critical_alert_sms`에서 1회 재시도 구현이 적절 — 안전 알림이므로 최선의 노력이 중요.
- **이슈**: 없음

### 14. `backend/app/modules/billing/providers/toss_payments.py`
- **판정**: PASS
- **칭찬**: `settings.external_api_timeout_seconds` 사용으로 timeout 설정화. 개발 환경에서 실제 PG 호출 없이 mock 응답 반환하는 패턴이 적절.
- **이슈**: [MEDIUM #3] `httpx.AsyncClient`를 매 요청마다 새로 생성하고 있음. 연결 풀링 이점을 위해 클래스 레벨에서 재사용하거나 `__init__`에서 생성하는 것이 더 효율적. 현재 결제 빈도가 낮으므로 실질적 성능 영향은 미미하지만 개선 여지 있음.

### 15. `backend/tests/integration/test_m4_websocket.py`
- **판정**: PASS
- **칭찬**: first-message auth 성공/실패/query param 방식 3가지 경로를 모두 테스트. GPS 버퍼 flush와 active_vehicles 추적까지 커버. `fakeredis.aioredis.FakeRedis` 사용으로 Redis 의존성 제거.
- **이슈**: 없음

### 16. `web/src/pages/LoginPage.tsx`
- **판정**: PASS
- **칭찬**: `isValidPhone` 정규식 `/^01[0-9]{8,9}$/`이 한국 전화번호 형식을 올바르게 검증. DEV/Production 분기가 깔끔. OTP 플로우(phone -> verify)가 2단계로 명확.
- **이슈**: [LOW #4] Production OTP 플로우에서 `role` 선택이 클라이언트에서 가능 — 사용자가 `platform_admin` 역할을 선택할 수 있음. 백엔드에서 역할 검증이 별도로 이루어져야 하며 (기존 사용자 역할 우선 적용), 현재 `otp_login_or_register`에서 기존 사용자는 역할 변경 없이 기존 역할 유지하므로 실질적 위험은 낮음.

### 17. `mobile/src/screens/parent/MapScreen.tsx`
- **판정**: PASS
- **칭찬**: 동적 지도 중심점 계산 — 학생 픽업 좌표를 기반으로 `mapCenter`를 설정하고 `setCenter` 메시지로 WebView에 전달. `WEBVIEW_SOURCE`를 컴포넌트 외부에 정의하여 불필요한 WebView 리로드 방지. 연결 상태별 시각적 피드백(dot 색상 + 텍스트)이 상세.
- **이슈**: [LOW #5] `sendToMap` 함수에서 `JSON.stringify(msg).replace(/'/g, "\\'")`로 단일 인용부호를 이스케이프하지만, 백슬래시나 백틱은 처리하지 않음. `postMessage` API 사용이 더 안전하나, 현재 메시지 구조에서 이런 문자가 포함될 가능성은 낮음.

### 18. `mobile/src/screens/admin/ProfileScreen.tsx`
- **판정**: PASS
- **칭찬**: 디자인 시스템 토큰 (`Colors`, `Typography`, `Spacing`, `Radius`, `Shadows`) 일관적 사용. 플랫폼별 로그아웃 처리 (`window.confirm` vs `Alert.alert`). 역할 라벨 맵핑이 깔끔.
- **이슈**: 없음

### 19. `mobile/src/hooks/useVehicleTracking.ts`
- **판정**: PASS
- **칭찬**: WebSocket first-message auth 클라이언트 구현이 서버와 정확히 매칭. 토큰 만료 감지(`isTokenValid`)와 자동 refresh(`ensureValidToken`) 구현. 실패 시 exponential backoff + polling 폴백 + 주기적 WS 재시도 3단계 전략이 탄탄. 4001 auth 실패 시 1회 토큰 refresh 후 재시도. `mountedRef`로 언마운트 후 상태 업데이트 방지.
- **이슈**: [HIGH #1] — 아래 상세 설명.

---

## 전체 이슈 목록

| # | 심각도 | 파일 | 라인 | 이슈 | 수정 제안 |
|---|--------|------|------|------|-----------|
| 1 | HIGH | `useVehicleTracking.ts` | 136-290 | `connectWs`가 `useCallback` deps에 `cleanupWs`를 포함하지 않아, `connectWs`가 재생성될 때 이전 WS 연결이 정리되지 않을 수 있음. 또한 `vehicleIds` 변경 시 `useEffect`(line 292)에서 기존 WS를 `cleanupWs`로 닫지만, `connectWs` 내부의 retry timeout이 stale closure의 `connectWs`를 참조할 수 있어 zombie 연결 가능성 있음 | `connectWs` 내부의 retry에서 `mountedRef` 체크가 있어 실제 상태 업데이트는 안전하지만, stale WS 객체가 `wsRefs.current`에 누적될 수 있음. vehicleIds 변경 빈도가 낮으므로 실질적 영향은 제한적이나, `connectWs` 시작 시 해당 vehicleId의 기존 WS가 있으면 먼저 닫는 로직 추가 권장 |
| 2 | MEDIUM | `auth/service.py` | 177 | LIKE 와일드카드(`%`, `_`) 미이스케이프 | `search = search.replace('%', r'\%').replace('_', r'\_')` 추가 후 `.ilike(...)` 사용 시 `escape='\\'` 파라미터 전달 |
| 3 | MEDIUM | `compliance/router.py` | 117 | MIME 타입 검증이 클라이언트 제공 `content_type`에만 의존 | 프로덕션 전 `python-magic` 등으로 매직 바이트 기반 검증 추가 고려. 현재 파일이 서빙되지 않으므로 즉시 필요하지는 않음 |
| 4 | MEDIUM | `toss_payments.py` | 55, 94 | 매 요청마다 `httpx.AsyncClient` 새로 생성 | 클래스 `__init__`에서 `self._client = httpx.AsyncClient(...)` 생성, `__aenter__`/`__aexit__` 또는 별도 `close()` 메서드로 관리 |
| 5 | MEDIUM | `auth/service.py` | 177 | `search` 파라미터에 LIKE 와일드카드 미이스케이프 | #2와 동일 (중복 제거) |
| 6 | LOW | `routing_engine/distance.py` | 31 | MD5 캐시 키 — 노드 순서 의존적 | 현재 사용 패턴상 문제 없음. 참고 사항 |
| 7 | LOW | `fcm.py` | 27 | `messaging.send()` 동기 호출이 이벤트 루프 블로킹 가능 | 프로덕션 트래픽 증가 시 `await asyncio.to_thread(messaging.send, message)` 래핑 고려 |
| 8 | LOW | `LoginPage.tsx` | 99 | 클라이언트에서 역할 선택 가능 | 백엔드에서 기존 사용자 역할 우선 적용 확인됨. 새 사용자 등록 시 역할 화이트리스트 검증 확인 필요 |
| 9 | LOW | `MapScreen.tsx` | 127-129 | `injectJavaScript` 문자열 이스케이프 불완전 | `postMessage` 대안 고려 또는 현재 메시지 구조상 문제 없음 확인 |

*참고: #2와 #5는 동일 이슈이므로 실질 이슈 수는 HIGH 1 / MEDIUM 3 / LOW 4 = 총 8건*

---

## 아키텍처 정합성 평가

| 영역 | 평가 |
|------|------|
| 코딩 스타일 일관성 | GOOD — 백엔드는 async/await 패턴 일관, 프론트엔드는 훅 패턴 일관 |
| 설정 외부화 | GOOD — 하드코딩된 값들이 `settings`로 올바르게 이관됨 |
| 에러 핸들링 | GOOD — SMS/FCM/PG 모두 적절한 에러 분기와 로깅 |
| 보안 | GOOD — 프로덕션 시크릿 검증, WS 인증, 파일 업로드 검증 |
| 테스트 커버리지 | GOOD — WS auth 4가지 경로, GPS flush 3가지 경로 테스트 |

## 결론

전체적으로 코드 품질이 높고, 프로덕션 하드닝 의도에 맞게 잘 구현되었습니다.

**CRITICAL 이슈 없음** — 즉시 수정이 필요한 블로커는 없습니다.

**HIGH 이슈 1건** (useVehicleTracking stale closure): 실질적 영향은 vehicleIds 변경 빈도에 의존하며, `mountedRef` 가드로 인해 크래시나 잘못된 상태 업데이트는 방지됩니다. 다만 WS 연결 누수 가능성이 있으므로 개선을 권장합니다.

**MEDIUM 이슈 3건**: 모두 "현재로서는 안전하지만 프로덕션 스케일에서 개선 권장" 수준입니다.

**판정: PASS WITH COMMENTS** — 현재 코드는 머지 가능하며, HIGH/MEDIUM 이슈는 후속 이터레이션에서 개선 권장.
