# 기획 리뷰 -- 기획 의도 대비 구현 검증 (최종)

**Reviewer**: planner
**Date**: 2026-03-21
**Spec**: `artifacts/specs/2026-03-21-code-hardening-spec.md`
**Senior Review**: `artifacts/reviews/2026-03-21-senior-code-review.md` (PASS WITH COMMENTS)

---

## 항목별 수락 기준 검증

### ITEM-01: OTP 저장소 Redis 전환 [CRITICAL]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| `_otp_store` dict 완전 제거 | `auth/service.py` -- dict 없음 | PASS |
| Redis `otp:{phone}` 키, TTL 180초 | `service.py:88` `redis_client.set(f"otp:{phone}", code, ex=OTP_TTL_SECONDS)` | PASS |
| 검증 성공 시 Redis에서 삭제 | `service.py:102` `redis_client.delete(f"otp:{phone}")` | PASS |
| `OTP_TTL_SECONDS = 180` 상수 | `service.py:18` | PASS |

**항목 판정: PASS**

---

### ITEM-02: 프로덕션 필수 키 startup 검증 [CRITICAL]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| production + 빈 SMS 키 -> ValueError | `config.py:93-98` 3개 키 검증 | PASS |
| production + 빈 Toss 키 -> ValueError | `config.py:99-102` 2개 키 검증 | PASS |
| development -> 기존대로 기동 | `config.py:81` `if self.environment == "production"` 내부 | PASS |

**항목 판정: PASS**

---

### ITEM-03: WebSocket 토큰 보안 [CRITICAL]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| first-message 인증 | `router.py:194-213` accept 후 `receive_json` | PASS |
| query param 호환 + deprecation 로그 | `router.py:187-188` `logger.warning("Deprecated: ...")` | PASS |
| 5초 타임아웃 | `router.py:198` `asyncio.wait_for(..., timeout=5.0)` | PASS |
| `_authenticate_token` 헬퍼 | `router.py:158-178` | PASS |
| `auth_ok` 응답 | `router.py:207` | PASS |
| 클라이언트 first-message 구현 | `useVehicleTracking.ts:171-172` `ws.send(JSON.stringify({ token }))` | PASS |

**항목 판정: PASS**

---

### ITEM-04: SMS/FCM 에러 핸들링 구조화 [HIGH]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| SMS: bare except 제거, 유형별 분기 | `sms.py:37-48` 3단계 분기 | PASS |
| FCM: 에러 유형별 분기 | `fcm.py:29-40,59-70` ImportError/Unregistered/SenderIdMismatch/기타 | PASS |
| 에러 접두어 포함 로그 | `[SMS TIMEOUT]`, `[FCM UNREGISTERED]` 등 | PASS |

**항목 판정: PASS**

---

### ITEM-05: 라우팅 엔진 무음 실패 제거 [HIGH]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| `except Exception: pass` 제거 | `routing_engine/service.py:142` `except Exception as e:` | PASS |
| WARNING 로그 + 에러 원인 | `service.py:143-145` `logger.warning("[ROUTING] ... %s", e)` | PASS |
| 유클리디안 폴백 유지 | `precomputed_dist/time` None -> solver 자체 폴백 | PASS |

**항목 판정: PASS**

---

### ITEM-06: WebSocket ping 무음 에러 제거 [HIGH]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| `except Exception: pass` -> 유형별 분기 | `router.py:227-232` 3단계 | PASS |
| ping 간격 config 참조 | `router.py:225` `settings.ws_ping_interval_seconds` | PASS |
| 실패 시 WARNING 로그 | `router.py:232` `logger.warning(...)` | PASS |

**항목 판정: PASS**

---

### ITEM-07: 파일 업로드 검증 [HIGH]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| MIME 타입 검증 | `compliance/router.py:117-120` | PASS |
| 10MB 크기 제한 | `router.py:123-127` | PASS |
| document_type enum 검증 | `router.py:108-114` | PASS |
| 허용 MIME (PDF/JPEG/PNG/HWP/DOCX) | `router.py:22-29` | PASS |
| `file.seek(0)` rewind | `router.py:128` | PASS |

**항목 판정: PASS**

---

### ITEM-08: 전화번호 포맷 검증 (웹) [HIGH]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| `isValidPhone` 함수 | `LoginPage.tsx:11` | PASS |
| Dev 로그인 시 검증 | `LoginPage.tsx:48` | PASS |
| Production OTP 전송 시 검증 | `LoginPage.tsx:73` | PASS |
| HTML `pattern` 속성 | `LoginPage.tsx:138,205` | PASS |
| 에러 메시지 한국어 | "올바른 전화번호 형식이 아닙니다" | PASS |

**항목 판정: PASS**

---

### ITEM-09: 매직 넘버 상수화 [MEDIUM]

| 매직 넘버 | config 설정 | 사용 위치 | 결과 |
|-----------|-------------|-----------|------|
| pool_size=20 | `config.py:61` `db_pool_size` | `database.py:11` | PASS |
| max_overflow=10 | `config.py:62` `db_max_overflow` | `database.py:12` | PASS |
| WS ping 30s | `config.py:65` `ws_ping_interval_seconds` | `router.py:225` | PASS |
| 스케줄링 +-15분 | `config.py:68` `schedule_time_window_minutes` | `routing/service.py:79` | PASS |
| 캐시 TTL 86400 | `config.py:69` `distance_cache_ttl_seconds` | `distance.py:25` | PASS |
| GPS TTL 300 | `config.py:72` `gps_data_ttl_seconds` | `telemetry/service.py:137` | PASS |
| HTTP timeout 30s | `config.py:75` `external_api_timeout_seconds` | `sms.py:33`, `toss.py:67,102` | PASS |

**항목 판정: PASS**

---

### ITEM-10: DB pool 설정 config화 [MEDIUM]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| `settings.db_pool_size` 참조 | `database.py:11` | PASS |
| `settings.db_max_overflow` 참조 | `database.py:12` | PASS |
| 기본값 20, 10 유지 | `config.py:61-62` | PASS |

**항목 판정: PASS**

---

### ITEM-11: 컴플라이언스 문서 만료 체크 [MEDIUM]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| `deactivate_expired_documents` 함수 | `compliance/service.py:206-219` | PASS |
| startup 시 자동 실행 | `main.py:117-127` lifespan 내 | PASS |
| daily cron에서도 실행 | `main.py:75-85` | PASS |
| 처리 건수 로깅 | `main.py:84-85,124-125` | PASS |

**항목 판정: PASS**

---

### ITEM-12: 알림 실패 시 재시도/폴백 [MEDIUM]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| FCM 실패 -> SMS 폴백 (탑승) | `notification/service.py:25-30` | PASS |
| FCM 실패 -> SMS 폴백 (하차) | `service.py:45-50` | PASS |
| FCM 실패 -> SMS 폴백 (취소) | `service.py:65-70` | PASS |
| SMS 긴급 1회 재시도 | `service.py:77-79` | PASS |
| `parent_phone` optional 파라미터 | 3개 함수 모두 | PASS |
| WARNING 로그 | 4곳 모두 `logger.warning` | PASS |

**항목 판정: PASS**

---

### ITEM-13: 지도 기본 위치 동적 로딩 [MEDIUM]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| parent: 동적 센터 로드 | `parent/MapScreen.tsx:37,60-69` | PASS |
| parent: `setCenter` 전송 | `MapScreen.tsx:142-147` | PASS |
| parent: DEFAULT_CENTER 폴백 | `MapScreen.tsx:21` 유지 | PASS |
| driver: 첫 정류장 센터 | `driver/MapScreen.tsx:87-98` | PASS |

**항목 판정: PASS**

---

### ITEM-14: 관리자 프로필 화면 독립 구현 [MEDIUM]

| 수락 기준 | 코드 위치 | 결과 |
|-----------|-----------|------|
| re-export 제거, 독립 구현 | `admin/ProfileScreen.tsx` 199줄 | PASS |
| 역할별 차별화된 정보 | ROLE_LABELS, 역할 InfoRow, 웹 대시보드 링크 | PASS |
| 디자인 시스템 일관성 | Colors/Typography/Spacing/Radius/Shadows 사용 | PASS |
| parent ProfileScreen 불변 | `parent/ProfileScreen.tsx` 변경 없음 | PASS |

**항목 판정: PASS**

---

## 시니어 리뷰 이슈 대응 분석

시니어 리뷰(PASS WITH COMMENTS)에서 제기된 이슈가 기획서의 수락 기준 범위 내인지 평가합니다.

| # | 심각도 | 이슈 | 기획서 범위 | 판단 |
|---|--------|------|-------------|------|
| 1 | HIGH | `useVehicleTracking` stale closure로 zombie WS 가능 | 기획서 ITEM-03 범위 외 (기존 코드의 훅 구조 문제) | **후속 개선** -- 기획 수락 기준은 "first-message auth 동작"이며 충족됨. vehicleIds 변경 빈도가 낮아 실질적 영향 제한적 |
| 2 | MEDIUM | LIKE 와일드카드 미이스케이프 | 기획서 범위 외 (이번 스펙에 해당 항목 없음) | **후속 개선** -- 기존 코드 이슈, 이번 변경과 무관 |
| 3 | MEDIUM | MIME 검증이 클라이언트 content_type에 의존 | ITEM-07 관련 | **후속 개선 권장** -- 기획서에서 "MIME 타입 검증"을 수락 기준으로 했고, 클라이언트 제공 content_type 검증으로 구현됨. 매직 바이트 검증은 추가 보안 강화이나 현재 파일이 서빙되지 않으므로 즉시 필요하지 않음 |
| 4 | MEDIUM | toss_payments httpx.AsyncClient 매 요청 생성 | 기획서 범위 외 (ITEM-09는 매직 넘버 상수화만) | **후속 개선** -- 결제 빈도 낮아 현재 영향 미미 |
| 5 | LOW | FCM `messaging.send()` 동기 호출 | 기획서 범위 외 | **후속 개선** |
| 6-9 | LOW | 기타 (MD5 캐시, 역할 선택, injectJS 이스케이프) | 기획서 범위 외 | **참고 사항** |

**결론**: 시니어 리뷰의 모든 이슈는 블로커가 아니며, 기획서 수락 기준 충족에 영향을 주지 않습니다. HIGH #1은 기존 코드 구조의 이슈로 이번 변경 범위 밖이나, 후속 이터레이션에서 개선을 권장합니다.

---

## 전체 판정

| 항목 | 판정 |
|------|------|
| ITEM-01 OTP Redis | PASS |
| ITEM-02 프로덕션 키 검증 | PASS |
| ITEM-03 WS 토큰 보안 | PASS |
| ITEM-04 SMS/FCM 에러 핸들링 | PASS |
| ITEM-05 라우팅 무음 실패 | PASS |
| ITEM-06 WS ping 무음 에러 | PASS |
| ITEM-07 파일 업로드 검증 | PASS |
| ITEM-08 전화번호 검증 | PASS |
| ITEM-09 매직 넘버 상수화 | PASS |
| ITEM-10 DB pool config화 | PASS |
| ITEM-11 문서 만료 체크 | PASS |
| ITEM-12 알림 폴백 | PASS |
| ITEM-13 지도 동적 위치 | PASS |
| ITEM-14 관리자 프로필 | PASS |

### **전체 판정: PASS**

14개 항목 전체가 기획서 수락 기준을 충족합니다. 개발 리턴 항목 없음.

테스트 단계(Phase 6c)로 진행 가능합니다.

---

## 후속 개선 권장 (다음 이터레이션)

1. `useVehicleTracking` stale closure 정리 (HIGH)
2. 파일 업로드 매직 바이트 검증 (MEDIUM)
3. LIKE 와일드카드 이스케이프 (MEDIUM)
4. toss_payments httpx.AsyncClient 재사용 (MEDIUM)
5. FCM `messaging.send` async 래핑 (LOW)
