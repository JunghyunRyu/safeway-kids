# Verification Report — P1-3 (WalkPhoto 마이그레이션 + PortOne 테스트 보강)

**Date**: 2026-06-11
**Scope**: P1-3 슬라이스 — Gap Note에 따라 재정의된 범위
([`artifacts/gap-notes/2026-06-11-p1-3-portone-already-implemented.md`](../gap-notes/2026-06-11-p1-3-portone-already-implemented.md))
**Environment**: Claude Code 원격 컨테이너 (Python 3.12.3 venv 신규 구성, PostgreSQL 16 로컬 클러스터)

## Changed Files

| 파일 | 변경 |
|---|---|
| `backend/app/apps/pettracker/models.py` | `WalkPhotoCaptionStatus` enum + `WalkPhoto` 모델 추가 (+34줄, 기존 코드 무변경) |
| `backend/migrations/env.py` | `WalkPhoto` 임포트 1줄 추가 |
| `backend/migrations/versions/f7c2d4a91b3e_add_walk_photos.py` | 신규 마이그레이션 (직접 작성, autogenerate 미사용 — c4b1f5e7a8d2 룰 준수) |
| `backend/tests/unit/test_walk_photo_model.py` | 신규 4 테스트 |
| `backend/tests/unit/test_portone_provider.py` | 신규 7 테스트 (기존 PortOne 구현의 테스트 공백 해소) |

## Commands & Results

### 1. 신규 단위 테스트 — **VERIFIED**
```
.venv/bin/python -m pytest tests/unit/test_walk_photo_model.py tests/unit/test_portone_provider.py -v
→ 11 passed in 2.20s
```
- WalkPhoto: defaults(pending)·enum 값 스펙 일치·FR-B5 edited 전이·세션별 업로드 순서 조회
- PortOne: ABC 준수·HMAC fail-closed(secret 미설정 거부)·유효 서명 수락(대문자 hex 포함)·변조 거부·dev-mode confirm(PAID)·전체 취소(CANCELLED)·부분 취소(PARTIAL_CANCELLED)

### 2. Alembic 마이그레이션 — **VERIFIED** (실 PostgreSQL 16)
```
alembic upgrade head   → Running upgrade e7a9b2c4d6f8 -> f7c2d4a91b3e ✅
\d walk_photos         → 7컬럼·PK·FK(walk_sessions.id)·인덱스 2개 모두 스펙 일치 ✅
alembic downgrade -1   → 테이블 깨끗하게 drop ✅
alembic upgrade head   → 재적용 성공, select count(*) = 0 ✅
alembic heads          → f7c2d4a91b3e 단일 head ✅
```
검증 방법 주의: fresh DB에서 전체 체인 replay는 **선재 이슈로 불가** (아래 신규 발견).
`Base.metadata.create_all`(walk_photos 제외) + `alembic stamp e7a9b2c4d6f8` 후 신규 마이그레이션만 표적 검증.

### 3. 린트 — **VERIFIED**
```
ruff check tests/unit/test_walk_photo_model.py tests/unit/test_portone_provider.py → clean
```
`models.py`의 E501/I001 13건은 전부 기존 레거시 라인 (이번 diff 라인은 클린).
마이그레이션 파일은 `extend-exclude = ["migrations"]`로 린트 제외 대상.

### 4. 전체 백엔드 회귀 — **VERIFIED (회귀 0)**
```
.venv/bin/python -m pytest --tb=line -q --timeout=120
→ 214 passed / 7 failed / 3 errors in 555.25s (0:09:15)
```
**산수**: 총 221 tests = 직전 baseline 210 + 신규 11 (본 슬라이스). 214 passed = baseline 207 + 신규 11 − 4 (아래 환경성 flaky).
**실패 전수 분류 — 전부 기지 이슈, 이번 변경 표면과 무관**:
| 건수 | 테스트 | 분류 |
|---|---|---|
| 3 fail | `test_billing_pg.py::TestTossWebhook` 3건 | **KI-2** (TOSS_WEBHOOK_SECRET 미설정, baseline과 동일) |
| 1 fail | `test_e2e_hardening.py::test_health_endpoint_returns_ok` | **KI-3** (health degraded, 기지 flaky) |
| 3 fail + 3 error | WS 인증/GPS relay 3건 (`test_e2e_hardening`·`test_m4_websocket`) | **KI-4** (WS teardown race) — 본 컨테이너에서는 starlette TestClient teardown **무한 hang**으로 발현 (py-spy로 `start_blocking_portal` join 대기 확인). `pytest-timeout --timeout=120` (signal)으로 가시화. error 3건은 동일 테스트의 teardown 중복 계상 |

**환경 노트**: 원격 컨테이너 신규 구성 (Python 3.12.3 venv + PostgreSQL 16 + Redis 기동). Redis 미기동 시 suite가 조기 hang — 컨테이너에서 재실행 시 Redis 선기동 필수. `pytest-timeout`은 venv에만 ad-hoc 설치 (pyproject 미반영 — KI-4 hang 가시화용, 채택 여부는 별도 결정).

## 신규 발견 (선재 이슈, 이번 변경과 무관)

- **KI-5 (NEW)**: fresh DB에서 `alembic upgrade head` 전체 체인 replay가 `m001_multi_app_context`에서 실패 — `ALTER TABLE messages ...` 시 `relation "messages" does not exist`. `messages` 테이블이 alembic 체인 밖(create_all)에서 생성된 전제. 기존 dev DB에서는 발현하지 않으나, 신규 환경 프로비저닝 시 차단 요인. 출시 critical path 진입 전(P2 트랙) 보정 권장.
- **KI-4 발현 양상 갱신**: 기존 기록은 "teardown race → 1 error"였으나, 본 컨테이너에서는 WS 테스트 3건이 **무한 hang**으로 발현 (timeout 없으면 suite 전체가 멈춤). flaky가 아니라 환경 의존적 deadlock일 가능성 — P2 트랙에서 원인 조사 권장.

## Residual Risks

- PortOne production 분기(실 API 호출·실 서명 형식)는 가맹점 계약 전이라 **UNVERIFIED** — provider docstring에 명시된 기존 한계 그대로 (V1 패치 트랙)
- WalkPhoto 호출부(업로드 confirm hook·캡션 파이프라인·리포트 endpoint)는 P2-2 범위 — 본 슬라이스는 저장 골격만
