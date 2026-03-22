# Code Hardening Tech Spec

**Date**: 2026-03-21
**Phase**: 0-3 (Intake → Final Tech Spec)
**Status**: APPROVED

---

## 1. Requirement Brief

### 목표
프로덕션 배포 전 코드 품질, 보안, 안정성을 강화한다. 14개 개선 항목을 CRITICAL / HIGH / MEDIUM 우선순위로 분류하여 체계적으로 구현한다.

### Goals
- 서버 재시작/다중 인스턴스 환경에서 OTP 유지 (Redis 전환)
- 프로덕션 환경 필수 키 누락 시 서버 기동 차단
- WebSocket 인증 토큰 보안 강화
- 외부 서비스(SMS/FCM) 에러 분류 및 구조화된 핸들링
- 라우팅 엔진, WebSocket ping 등 무음 실패 제거
- 파일 업로드 보안 검증 (MIME/크기/타입)
- 입력값 포맷 검증 강화 (전화번호)
- 매직 넘버 상수화 및 config화
- 컴플라이언스 문서 만료 자동 체크
- 알림 실패 재시도/폴백 메커니즘
- 지도 기본 위치 동적 로딩
- 학생/관리자 프로필 화면 독립 구현

### Non-goals
- 아키텍처 변경이나 새 기능 추가
- 데이터 마이그레이션 (스키마 변경 없음)
- 프론트엔드 디자인 변경
- 테스트 커버리지 목표 변경

---

## 2. Assumption Register

| ID | 가정 | 근거 |
|----|------|------|
| A1 | Redis가 이미 인프라에 존재하고 `app.redis.redis_client`로 접근 가능 | `backend/app/redis.py` 확인: `settings.redis_url` 사용 중 |
| A2 | `DocumentType` enum이 `compliance/models.py`에 이미 정의됨 | `models.py:11-16` 확인 |
| A3 | 백엔드 테스트 환경에서 Redis 접근 가능 | 기존 vehicle_telemetry 테스트에서 Redis 사용 중 |
| A4 | Kakao 알림 프로바이더 파일이 아직 존재하지 않음 | glob 결과 비어 있음 — 기획에서 제외 |
| A5 | 학부모/기사 프로필 화면은 이미 독립 구현됨 | `parent/ProfileScreen.tsx`(187줄), `driver/ProfileScreen.tsx`(208줄) 확인 |
| A6 | `OtpSendRequest`/`OtpVerifyRequest` schema에 이미 전화번호 패턴 검증 있음 | `schemas.py:15,19` — `pattern=r"^01[0-9]{8,9}$"` |
| A7 | 웹 LoginPage의 전화번호 검증은 프론트엔드 레벨에서만 필요 | 백엔드 schema 검증이 이미 존재 |

---

## 3. 항목별 상세 스펙

---

### ITEM-01: OTP 저장소 Redis 전환 [CRITICAL]

**현재 문제**
- `backend/app/modules/auth/service.py:18` — `_otp_store: dict[str, str] = {}` (인메모리)
- 서버 재시작 시 모든 OTP 소멸
- 다중 인스턴스에서 OTP 공유 불가
- TTL 미적용 — OTP 영구 잔존

**목표 상태**
- Redis 기반 OTP 저장/조회/삭제
- 3분 TTL 자동 만료
- 다중 인스턴스 환경 지원

**구현 방안**

`backend/app/modules/auth/service.py` 변경:

```python
from app.redis import redis_client

OTP_TTL_SECONDS = 180  # 3분

async def send_otp(phone: str) -> None:
    code = generate_otp()
    await redis_client.set(f"otp:{phone}", code, ex=OTP_TTL_SECONDS)
    # ... SMS 발송 로직 유지

async def verify_otp(phone: str, code: str) -> bool:
    stored = await redis_client.get(f"otp:{phone}")
    if stored and stored == code:
        await redis_client.delete(f"otp:{phone}")
        return True
    return False
```

**변경 파일**
- `backend/app/modules/auth/service.py`

**수락 기준**
- `_otp_store` dict 완전 제거
- OTP가 Redis에 `otp:{phone}` 키로 저장되며 TTL 180초 설정
- 검증 성공 시 Redis에서 삭제
- 기존 테스트 통과
- 새 테스트: TTL 만료 후 검증 실패 확인

---

### ITEM-02: 프로덕션 필수 키 startup 검증 [CRITICAL]

**현재 문제**
- `backend/app/config.py:62-75` — `_check_production_secrets` validator가 `jwt_secret_key`와 `aes_encryption_key`만 검증
- NHN SMS, Firebase, Toss Payments 키가 빈 문자열이어도 서버 기동 가능
- 프로덕션에서 런타임 시점에야 실패 발견

**목표 상태**
- `environment == "production"`일 때 외부 서비스 필수 키도 검증
- 누락 시 서버 기동 실패 (ValueError)

**구현 방안**

`backend/app/config.py`의 `_check_production_secrets` 확장:

```python
@model_validator(mode="after")
def _check_production_secrets(self) -> "Settings":
    if self.environment == "production":
        # 기존 검증
        if self.jwt_secret_key == "change-me-in-production":
            raise ValueError("jwt_secret_key must be changed ...")
        if "change-me" in self.aes_encryption_key:
            raise ValueError("aes_encryption_key must be changed ...")
        # 추가 검증
        missing = []
        if not self.nhn_sms_app_key:
            missing.append("nhn_sms_app_key")
        if not self.nhn_sms_secret_key:
            missing.append("nhn_sms_secret_key")
        if not self.nhn_sms_sender_number:
            missing.append("nhn_sms_sender_number")
        if not self.toss_payments_secret_key:
            missing.append("toss_payments_secret_key")
        if not self.toss_payments_client_key:
            missing.append("toss_payments_client_key")
        if missing:
            raise ValueError(
                f"Production environment requires these keys: {', '.join(missing)}"
            )
    return self
```

**변경 파일**
- `backend/app/config.py`

**수락 기준**
- `environment=production` + 빈 SMS/Toss 키 → `ValueError` 발생
- `environment=development` → 기존과 동일하게 기동 성공
- Firebase는 credentials file 경로 기반이므로 별도 파일 존재 검증은 범위 외

---

### ITEM-03: WebSocket 토큰 보안 [CRITICAL]

**현재 문제**
- `backend/app/modules/vehicle_telemetry/router.py:161` — JWT가 `?token=<JWT>`로 query param 전달
- 브라우저 히스토리, 서버 액세스 로그, 프록시/CDN 로그에 토큰 노출 위험
- WebSocket은 HTTP 핸드셰이크 후 프로토콜 업그레이드이므로, 첫 메시지로 토큰을 보내는 방식이 더 안전

**목표 상태**
- 연결 수립 후 첫 메시지로 JWT를 전송하는 방식 지원
- 기존 query param 방식도 호환 유지 (deprecation 경고 로깅)
- 일정 시간(5초) 내 인증 메시지 미수신 시 연결 종료

**구현 방안**

`backend/app/modules/vehicle_telemetry/router.py` 변경:

```python
@router.websocket("/ws/vehicles/{vehicle_id}")
async def vehicle_location_ws(websocket: WebSocket, vehicle_id: uuid.UUID) -> None:
    # 1) query param 방식 (deprecated, 호환 유지)
    token = websocket.query_params.get("token")

    if token:
        logger.warning("Deprecated: JWT via query param. Use first-message auth.")
        user = await _authenticate_token(token)
        if not user:
            await websocket.close(code=4001, reason="Unauthorized")
            return
        await websocket.accept()
    else:
        # 2) first-message auth
        await websocket.accept()
        try:
            data = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
            token = data.get("token")
            if not token:
                await websocket.close(code=4001, reason="Missing token")
                return
            user = await _authenticate_token(token)
            if not user:
                await websocket.close(code=4001, reason="Unauthorized")
                return
            await websocket.send_json({"type": "auth_ok"})
        except (asyncio.TimeoutError, Exception):
            await websocket.close(code=4001, reason="Auth timeout")
            return

    # ... 이후 로직 동일
```

인증 로직을 `_authenticate_token(token) -> User | None` 헬퍼로 추출.

**모바일 클라이언트 변경**: `mobile/src/hooks/useVehicleTracking.ts` (또는 해당 WebSocket 연결 코드)에서 연결 후 첫 메시지로 `{"token": jwt}` 전송하도록 변경.

**변경 파일**
- `backend/app/modules/vehicle_telemetry/router.py`
- `mobile/src/hooks/useVehicleTracking.ts` (또는 WebSocket 연결부)

**수락 기준**
- first-message 방식으로 인증 성공/실패 테스트
- query param 방식 여전히 동작 (deprecation 로그 출력)
- 5초 타임아웃 내 인증 미수신 시 4001 close
- 기존 테스트 통과

---

### ITEM-04: SMS/FCM 에러 핸들링 구조화 [HIGH]

**현재 문제**
- `backend/app/modules/notification/providers/sms.py:37` — `except Exception as e` 단일 catch
- `backend/app/modules/notification/providers/fcm.py:29,50` — 동일 패턴
- 네트워크 에러, 인증 실패, 레이트 리밋, 잘못된 토큰 등이 모두 동일하게 처리됨
- 운영 시 장애 원인 파악 불가

**목표 상태**
- `httpx.TimeoutException`, `httpx.HTTPStatusError` (401/403/429) 등 에러 유형별 구분 로깅
- FCM의 `messaging.UnregisteredError` 등 특정 예외 구분
- 에러 유형에 따른 반환값 또는 로그 레벨 차등화

**구현 방안**

`sms.py`:
```python
try:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return True
except httpx.TimeoutException:
    logger.error("[SMS TIMEOUT] phone=%s", phone)
    return False
except httpx.HTTPStatusError as e:
    logger.error("[SMS HTTP %d] phone=%s detail=%s", e.response.status_code, phone, e.response.text[:200])
    return False
except Exception as e:
    logger.error("[SMS UNEXPECTED] phone=%s error=%s", phone, e)
    return False
```

`fcm.py`:
```python
try:
    messaging.send(message)
    return True
except messaging.UnregisteredError:
    logger.warning("[FCM UNREGISTERED] token=%s...", device_token[:20])
    return False
except messaging.SenderIdMismatchError:
    logger.error("[FCM SENDER_MISMATCH] token=%s...", device_token[:20])
    return False
except Exception as e:
    logger.error("[FCM ERROR] token=%s... error=%s", device_token[:20], e)
    return False
```

**변경 파일**
- `backend/app/modules/notification/providers/sms.py`
- `backend/app/modules/notification/providers/fcm.py`

**수락 기준**
- bare `except Exception` 제거, 에러 유형별 분기
- 각 에러 유형에 대한 로그 메시지에 에러 유형 식별 가능한 접두어 포함
- 기존 테스트 통과

---

### ITEM-05: 라우팅 엔진 무음 실패 제거 [HIGH]

**현재 문제**
- `backend/app/modules/routing_engine/service.py:137-138`:
  ```python
  except Exception:
      pass  # Fall back to Euclidean inside solver
  ```
- 카카오맵 API 호출 실패, Redis 연결 실패, 코드 버그 등이 모두 무음 처리
- 운영 중 거리 계산 품질 저하 감지 불가

**목표 상태**
- 폴백 발생 시 warning 로그 출력 (에러 원인 포함)
- 폴백 사용 여부를 응답에 표시하거나 로그에 기록

**구현 방안**

```python
import logging
logger = logging.getLogger(__name__)

# ...

try:
    from app.common.map_provider.kakao import KakaoMapsProvider
    from app.modules.routing_engine.distance import build_road_distance_matrix
    from app.redis import redis_client

    map_provider = KakaoMapsProvider()
    precomputed_dist, precomputed_time = await build_road_distance_matrix(
        depot, stops, map_provider, redis_client
    )
except Exception as e:
    logger.warning(
        "[ROUTING] Road distance matrix failed, falling back to Euclidean: %s", e
    )
```

**변경 파일**
- `backend/app/modules/routing_engine/service.py`

**수락 기준**
- `except Exception: pass` 제거
- 폴백 시 WARNING 레벨 로그에 에러 원인 출력
- 폴백 후 유클리디안 거리 기반 라우팅 정상 동작 (기존 동작 유지)
- 기존 테스트 통과

---

### ITEM-06: WebSocket ping 무음 에러 제거 [HIGH]

**현재 문제**
- `backend/app/modules/vehicle_telemetry/router.py:207-208`:
  ```python
  except Exception:
      pass
  ```
- ping 전송 실패 시 아무 로그 없이 루프 종료
- 연결 끊김 감지 불가 → 리소스 누수

- `router.py:216-217`:
  ```python
  except (WebSocketDisconnect, asyncio.CancelledError):
      pass
  ```
  이 부분은 정상 (disconnect/cancel은 예상되는 이벤트)

**목표 상태**
- ping 실패 시 로그 출력 후 루프 종료 (연결 정리 트리거)
- `WebSocketDisconnect`는 정상 처리, 그 외 예외는 로깅

**구현 방안**

```python
async def ping_loop() -> None:
    try:
        while True:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        logger.debug("WebSocket ping loop: client disconnected, vehicle=%s", vehicle_id)
    except asyncio.CancelledError:
        pass  # Task cancelled normally
    except Exception as e:
        logger.warning("WebSocket ping loop error: vehicle=%s error=%s", vehicle_id, e)
```

**변경 파일**
- `backend/app/modules/vehicle_telemetry/router.py`

**수락 기준**
- `except Exception: pass` → 예외 유형별 분기 처리
- ping 실패 시 WARNING 로그 출력
- 기존 테스트 통과

---

### ITEM-07: 파일 업로드 검증 [HIGH]

**현재 문제**
- `backend/app/modules/compliance/router.py:84-100` — `upload_document` 엔드포인트
- MIME 타입 검증 없음 (실행 파일 업로드 가능)
- 파일 크기 제한 없음 (대용량 파일로 디스크 포화 가능)
- `document_type`은 `str`로 수신 — service에서 DocumentType enum 변환은 하지만, router에서 선행 검증 없음

**목표 상태**
- 허용 MIME 타입: PDF, 이미지(JPEG/PNG), HWP, DOCX
- 최대 파일 크기: 10MB
- `document_type`을 router에서 enum 검증

**구현 방안**

`backend/app/modules/compliance/router.py`:
```python
from app.modules.compliance.models import DocumentType

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/haansofthwp",
    "application/x-hwp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

@router.post("/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    academy_id: uuid.UUID = Form(...),
    document_type: str = Form(...),
    expires_at: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> DocumentResponse:
    from app.common.exceptions import ValidationError

    # document_type 검증
    try:
        DocumentType(document_type)
    except ValueError:
        raise ValidationError(
            detail=f"유효하지 않은 문서 유형: {document_type}. "
                   f"허용: {[e.value for e in DocumentType]}"
        )

    # MIME 타입 검증
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(
            detail=f"허용되지 않는 파일 형식: {file.content_type}"
        )

    # 파일 크기 검증
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ValidationError(
            detail=f"파일 크기가 {MAX_FILE_SIZE_BYTES // (1024*1024)}MB를 초과합니다"
        )
    await file.seek(0)  # rewind for downstream

    # ... 기존 로직
```

**변경 파일**
- `backend/app/modules/compliance/router.py`

**수락 기준**
- 허용되지 않은 MIME 타입 업로드 시 400 에러
- 10MB 초과 파일 업로드 시 400 에러
- 잘못된 document_type 시 400 에러
- 정상 파일(PDF, JPEG, PNG) 업로드 성공
- 기존 테스트 통과

---

### ITEM-08: 전화번호 포맷 검증 (웹 프론트엔드) [HIGH]

**현재 문제**
- `web/src/pages/LoginPage.tsx` — `<input type="tel">` 사용하지만 한국 번호 형식 클라이언트 검증 없음
- 백엔드 `OtpSendRequest`에는 `pattern=r"^01[0-9]{8,9}$"` 검증이 이미 있음 (`auth/schemas.py:15`)
- 프론트엔드에서 잘못된 형식 전송 시 불친절한 500 에러

**목표 상태**
- 웹 LoginPage에서 전화번호 `input`에 `pattern` 속성 추가
- 잘못된 형식 입력 시 즉시 에러 메시지 표시

**구현 방안**

`web/src/pages/LoginPage.tsx` — 전화번호 input에 pattern 추가 + submit 시 검증:

```tsx
// 전화번호 패턴 검증 함수
const isValidPhone = (p: string) => /^01[0-9]{8,9}$/.test(p);

// handleSendOtp 내부
const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
        setError('올바른 전화번호 형식이 아닙니다 (예: 01012345678)');
        return;
    }
    // ... 기존 로직
};
```

두 곳의 `<input type="tel">` 모두에 `pattern="01[0-9]{8,9}"` 속성 추가.

**변경 파일**
- `web/src/pages/LoginPage.tsx`

**수락 기준**
- `01012345678` 형식만 OTP 전송 가능
- 잘못된 형식 입력 시 사용자 친화적 에러 메시지 표시
- 기존 테스트 통과

---

### ITEM-09: 매직 넘버 상수화 [MEDIUM]

**현재 문제**
여러 파일에 매직 넘버가 산재:

| 값 | 위치 | 의미 |
|----|------|------|
| `pool_size=20` | `database.py:11` | DB 커넥션 풀 |
| `max_overflow=10` | `database.py:12` | DB 커넥션 오버플로 |
| `30` (sleep) | `vehicle_telemetry/router.py:205` | WS ping 간격 |
| `±15` | `routing_engine/service.py:79-80` | 스케줄링 시간 윈도우 |
| `86400` | `routing_engine/distance.py:25` | 거리 캐시 TTL |
| `300` | `vehicle_telemetry/service.py:136` | GPS 데이터 TTL |
| `30.0` | `billing/providers/toss_payments.py:67,102` | HTTP 타임아웃 |

**목표 상태**
- 각 값을 의미 있는 상수명으로 정의
- 가능한 경우 `config.py`의 Settings로 이동

**구현 방안**

1. `config.py`에 추가:
```python
# Database pool
db_pool_size: int = 20
db_max_overflow: int = 10

# WebSocket
ws_ping_interval_seconds: int = 30

# Routing
schedule_time_window_minutes: int = 15
distance_cache_ttl_seconds: int = 86400

# GPS
gps_data_ttl_seconds: int = 300

# External API
external_api_timeout_seconds: float = 30.0
```

2. 각 파일에서 `settings.xxx` 참조로 변경.

**변경 파일**
- `backend/app/config.py`
- `backend/app/database.py`
- `backend/app/modules/vehicle_telemetry/router.py`
- `backend/app/modules/vehicle_telemetry/service.py`
- `backend/app/modules/routing_engine/service.py`
- `backend/app/modules/routing_engine/distance.py`
- `backend/app/modules/billing/providers/toss_payments.py`

**수락 기준**
- 나열된 매직 넘버 모두 상수 또는 config 참조로 대체
- 기존 테스트 통과 (동작 변경 없음)

---

### ITEM-10: DB pool 설정 config화 [MEDIUM]

**현재 문제**
- `backend/app/database.py:11-12` — `pool_size=20, max_overflow=10` 하드코딩
- 환경별로 다른 풀 크기 필요 시 코드 수정 필요

**목표 상태**
- `config.py`의 Settings에서 읽어 `create_async_engine`에 전달

**구현 방안**

ITEM-09에서 `config.py`에 `db_pool_size`, `db_max_overflow` 추가 시 함께 처리.

`database.py`:
```python
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_pre_ping=True,
)
```

**변경 파일**
- `backend/app/config.py` (ITEM-09와 합산)
- `backend/app/database.py`

**수락 기준**
- 환경 변수 `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`로 제어 가능
- 기본값은 기존과 동일 (20, 10)
- 기존 테스트 통과

---

### ITEM-11: 컴플라이언스 문서 만료 체크 [MEDIUM]

**현재 문제**
- `compliance/models.py:48` — `expires_at` 필드 존재
- `compliance/service.py:185-203` — `list_expiring_documents` 쿼리 존재
- 하지만 만료된 문서를 자동으로 `is_active=False`로 설정하는 스케줄/로직 없음
- 만료 후에도 문서가 유효한 것처럼 조회됨

**목표 상태**
- 만료된 문서 자동 비활성화 함수 추가
- 기존 스케줄링 파이프라인 또는 startup에서 호출 가능하도록 설계
- 즉시 사용: API 호출 시 만료 체크 필터 추가

**구현 방안**

`compliance/service.py`에 추가:

```python
async def deactivate_expired_documents(db: AsyncSession) -> int:
    """만료일이 지난 활성 문서를 비활성화. 처리 건수 반환."""
    now = datetime.now(UTC)
    stmt = (
        update(ComplianceDocument)
        .where(
            ComplianceDocument.is_active.is_(True),
            ComplianceDocument.expires_at.isnot(None),
            ComplianceDocument.expires_at <= now,
        )
        .values(is_active=False)
    )
    result = await db.execute(stmt)
    return result.rowcount
```

`main.py`의 `@app.on_event("startup")` 또는 기존 스케줄러에서 호출:

```python
# startup에서 한번 실행
async with async_session_factory() as db:
    count = await deactivate_expired_documents(db)
    await db.commit()
    if count:
        logger.info("[COMPLIANCE] Deactivated %d expired documents", count)
```

**변경 파일**
- `backend/app/modules/compliance/service.py`
- `backend/main.py` (startup hook)

**수락 기준**
- `expires_at < now`인 활성 문서가 비활성화됨
- startup 시 자동 실행
- 처리 건수 로깅
- 기존 테스트 통과

---

### ITEM-12: 알림 실패 시 재시도/폴백 [MEDIUM]

**현재 문제**
- `backend/app/modules/notification/service.py` — FCM 실패 시 `False` 반환만 하고 종료
- `send_critical_alert_sms` — SMS 실패 시에도 재시도 없음
- 안전 관련 알림이 단일 실패로 유실 가능

**목표 상태**
- 탑승/하차/취소 알림: FCM 실패 시 SMS 폴백 (학부모 전화번호 필요)
- 긴급 알림: SMS 실패 시 1회 재시도
- 재시도/폴백 결과 로깅

**구현 방안**

`notification/service.py`:

```python
import logging
logger = logging.getLogger(__name__)

async def send_boarding_notification(
    device_token: str, student_name: str, vehicle_plate: str,
    parent_phone: str | None = None,
) -> bool:
    success = await _push_provider.send_push(
        device_token=device_token,
        title="탑승 완료",
        body=f"{student_name} 학생이 차량({vehicle_plate})에 탑승했습니다.",
        data={"type": "boarding", "student_name": student_name},
    )
    if not success and parent_phone:
        logger.warning("[NOTIFICATION] FCM failed, falling back to SMS: %s", parent_phone)
        success = await _sms_provider.send_sms(
            parent_phone,
            f"[세이프웨이키즈] {student_name} 학생이 차량({vehicle_plate})에 탑승했습니다."
        )
    return success

# 동일 패턴을 send_alighting_notification, send_schedule_cancelled_notification에 적용

async def send_critical_alert_sms(phone: str, message: str) -> bool:
    success = await _sms_provider.send_sms(phone, message)
    if not success:
        logger.warning("[NOTIFICATION] SMS failed, retrying once: %s", phone)
        success = await _sms_provider.send_sms(phone, message)
    return success
```

**주의**: 호출부에서 `parent_phone` 파라미터를 전달해야 하므로, 호출부 시그니처 확인 필요. 없으면 FCM-only 폴백.

**변경 파일**
- `backend/app/modules/notification/service.py`
- (호출부에서 phone 전달이 필요할 경우) `backend/app/modules/scheduling/service.py` 등

**수락 기준**
- FCM 실패 시 SMS 폴백 시도 (phone 있을 때)
- SMS 긴급 알림 실패 시 1회 재시도
- 폴백/재시도 시 WARNING 로그 출력
- 기존 테스트 통과

---

### ITEM-13: 지도 기본 위치 동적 로딩 [MEDIUM]

**현재 문제**
- `mobile/src/screens/parent/MapScreen.tsx:20` — `DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 }` (강남구 고정)
- `mobile/src/screens/driver/MapScreen.tsx:16` — 동일
- 학원 소재지와 무관하게 항상 강남구가 기본 중심

**목표 상태**
- 학원 좌표 또는 학생 픽업 위치를 기본 중심으로 사용
- 데이터 로드 전에는 현재 기기 위치 또는 기존 강남구 좌표를 폴백으로 사용

**구현 방안**

`parent/MapScreen.tsx`:
```tsx
// 기존 DEFAULT_CENTER는 폴백으로 유지
const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };

// 스케줄 로드 후 첫 번째 스케줄의 픽업 위치로 센터 변경
useEffect(() => {
    if (!mapReady || schedules.length === 0) return;
    const firstActive = schedules.find(s => s.status !== 'cancelled' && s.pickup_latitude && s.pickup_longitude);
    if (firstActive) {
        sendToMap({
            type: "setCenter",
            lat: firstActive.pickup_latitude,
            lng: firstActive.pickup_longitude,
        });
    }
}, [schedules, mapReady]);
```

`driver/MapScreen.tsx`: 유사하게 첫 번째 정류장 좌표로 센터 설정.

**변경 파일**
- `mobile/src/screens/parent/MapScreen.tsx`
- `mobile/src/screens/driver/MapScreen.tsx`

**수락 기준**
- 스케줄 데이터 로드 후 지도 중심이 실제 경로 위치로 이동
- 스케줄 없을 때 기존 DEFAULT_CENTER 사용 (폴백)
- 기존 테스트 통과

---

### ITEM-14: 학생/관리자 프로필 화면 독립 구현 [MEDIUM]

**현재 문제**
- `mobile/src/screens/student/ProfileScreen.tsx` — `export { default } from "../parent/ProfileScreen"` (re-export만)
- `mobile/src/screens/admin/ProfileScreen.tsx` — 동일

**현재 상태 분석 (가정 수정)**:
- `parent/ProfileScreen.tsx` (187줄) — 계정 정보 + 앱 정보 + 로그아웃 표시. 공통 프로필로 적절.
- `driver/ProfileScreen.tsx` (208줄) — 오늘 배차 정보 포함, 이미 독립 구현됨.
- 학생 프로필: 학생은 직접 앱을 사용하지 않으므로, 부모 프로필 재사용이 적절. **변경 불필요**.
- 관리자 프로필: 관리자 역할 정보(학원명 등)를 표시하면 유용.

**목표 상태**
- 관리자 프로필: 관리자 전용 정보(관리 학원, 역할) 표시
- 학생 프로필: 현재 re-export 유지 (학생 역할은 부모가 대리 사용하므로 변경 불필요)

**구현 방안**

`mobile/src/screens/admin/ProfileScreen.tsx` — 독립 구현:
- 부모 프로필과 동일한 레이아웃 베이스
- 관리 학원 정보 카드 추가 (academy API 연동)
- 시스템 관리 메뉴 링크 (웹 대시보드 연결)

**변경 파일**
- `mobile/src/screens/admin/ProfileScreen.tsx`

**수락 기준**
- 관리자 프로필에 역할별 차별화된 정보 표시
- 기존 parent ProfileScreen 불변
- TypeScript 컴파일 에러 없음
- 기존 테스트 통과

---

## 4. Acceptance Criteria (전체)

| # | 기준 | 검증 방법 |
|---|------|-----------|
| AC-1 | 백엔드 테스트 전체 통과 (0 failures) | `pytest` 실행 |
| AC-2 | 모바일 테스트 전체 통과 | `cd mobile && npx jest` |
| AC-3 | 웹 테스트 전체 통과 | `cd web && npx vitest run` |
| AC-4 | TypeScript 컴파일 에러 0 | `npx tsc --noEmit` (mobile, web) |
| AC-5 | OTP가 Redis에 저장되고 TTL 동작 | 테스트에서 Redis 키 확인 |
| AC-6 | production 환경에서 빈 키 시 서버 기동 실패 | 유닛 테스트 |
| AC-7 | WS 첫 메시지 인증 동작 | 통합 테스트 |
| AC-8 | 파일 업로드 검증 (MIME/크기/타입) 동작 | 유닛 테스트 |
| AC-9 | bare `except Exception: pass` 패턴 0건 | grep 검증 |
| AC-10 | 매직 넘버 → 상수/config 전환 완료 | 코드 리뷰 |
| AC-11 | 만료 문서 자동 비활성화 동작 | 유닛 테스트 |

---

## 5. Testing Strategy

### Unit Tests (백엔드)
- ITEM-01: `test_otp_redis.py` — Redis OTP 저장/조회/삭제/TTL 만료
- ITEM-02: `test_config_production.py` — production 환경 필수 키 검증
- ITEM-04: `test_sms_error_handling.py`, `test_fcm_error_handling.py`
- ITEM-07: `test_document_upload_validation.py` — MIME/크기/타입 검증
- ITEM-11: `test_compliance_expiry.py` — 만료 문서 비활성화

### Integration Tests (백엔드)
- ITEM-03: WebSocket 첫 메시지 인증 / query param 호환 / 타임아웃
- ITEM-05: 라우팅 엔진 폴백 시 로그 확인
- ITEM-12: FCM 실패 → SMS 폴백 통합 테스트

### Frontend Tests
- ITEM-08: LoginPage 전화번호 검증 (vitest)
- ITEM-13: MapScreen 동적 센터 (jest)
- ITEM-14: AdminProfileScreen 렌더링 (jest)

### Regression
- 기존 95개 백엔드 테스트 전체 통과
- 기존 36개 모바일 테스트 전체 통과
- 기존 50개 웹 테스트 전체 통과

---

## 6. Code Impact Map

| 파일 | 변경 항목 |
|------|-----------|
| `backend/app/config.py` | ITEM-02, ITEM-09, ITEM-10 |
| `backend/app/database.py` | ITEM-10 |
| `backend/app/modules/auth/service.py` | ITEM-01 |
| `backend/app/modules/vehicle_telemetry/router.py` | ITEM-03, ITEM-06, ITEM-09 |
| `backend/app/modules/notification/providers/sms.py` | ITEM-04 |
| `backend/app/modules/notification/providers/fcm.py` | ITEM-04 |
| `backend/app/modules/notification/service.py` | ITEM-12 |
| `backend/app/modules/routing_engine/service.py` | ITEM-05, ITEM-09 |
| `backend/app/modules/routing_engine/distance.py` | ITEM-09 |
| `backend/app/modules/compliance/router.py` | ITEM-07 |
| `backend/app/modules/compliance/service.py` | ITEM-11 |
| `backend/app/modules/billing/providers/toss_payments.py` | ITEM-09 |
| `backend/main.py` | ITEM-11 |
| `web/src/pages/LoginPage.tsx` | ITEM-08 |
| `mobile/src/screens/parent/MapScreen.tsx` | ITEM-13 |
| `mobile/src/screens/driver/MapScreen.tsx` | ITEM-13 |
| `mobile/src/screens/admin/ProfileScreen.tsx` | ITEM-14 |
| `mobile/src/hooks/useVehicleTracking.ts` | ITEM-03 |

---

## 7. Open Questions

| ID | 질문 | 상태 |
|----|------|------|
| OQ-1 | Kakao 알림 프로바이더 파일이 존재하지 않음 — 기획에서 제외함. 맞는지? | RESOLVED: 파일 미존재 확인, 제외 |
| OQ-2 | ITEM-14에서 학생 프로필도 독립 구현 필요한지? | RESOLVED: 학생 역할은 부모 대리 사용, 재사용 유지 |
| OQ-3 | ITEM-12에서 SMS 폴백 시 parent_phone을 어디서 조회할지? | 호출부에서 조회하여 전달. 조회 불가 시 FCM-only |

---

## 8. Out of Scope

- Redis 클러스터 설정 (단일 인스턴스 기준)
- Firebase credentials 파일 존재 여부 검증 (파일 시스템 의존)
- WebSocket query param 인증 완전 제거 (deprecation만)
- Kakao 알림 프로바이더 (파일 미존재)
- 학생 프로필 독립 구현 (부모 프로필 재사용 유지)
- 모바일 앱 지도 HTML 내 `setCenter` 메시지 핸들러 (이미 존재할 경우 변경 불필요)

---

## 9. Rollback Strategy

모든 변경은 기존 동작을 보존하는 방향:
- ITEM-01: 롤백 시 in-memory dict 복원 (git revert)
- ITEM-03: query param 방식 호환 유지 → 롤백 불필요
- ITEM-09/10: 기본값이 기존 하드코딩 값과 동일 → 동작 변경 없음
- 전체: feature branch에서 작업 후 squash merge
