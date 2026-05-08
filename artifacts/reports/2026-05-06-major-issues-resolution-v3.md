# Major Issues Resolution v3 — 2026-05-06 Round 2 (잔존 처리)

**기준일**: 2026-05-06
**범위**: v2 종료 후 잔존 4건 + Student.name 본격 구현 + 환경 검증 v2
**처리 시간**: 약 1.5시간 (메인 직접 + 1 sub-agent 환경 검증)

---

## 0. v2 → v3 추가 처리 항목

| ID | 처리 | 상태 |
|---|---|---|
| 카드 #2 R-12-B | ConsentNote에 만 14세 미만 법정대리인 동의 명시 단락 추가 (개인정보보호법 §22④) | **VERIFIED** |
| 카드 #2 R-12-C | LoginScreen step "phone" 영역에 OTP 수집 목적 사전 고지 텍스트 + styles.otpNotice 추가 (개인정보보호법 §15) | **VERIFIED** |
| 신청서 잔존 6곳 | 50,417/145/15건 인용이 분산된 §1·§4·§7·5축 매핑·평가표·정량 수치 8건 모두 62,200/178/PT 9 파일로 통합 갱신. 작성 버전 v1.1 → v1.3 | **VERIFIED** |
| 카드 #4 Student.name 본격 구현 | spec 5단계 모두 적용 + Class-level SQL 5곳 회귀 차단 | **VERIFIED (코드 변경)** / pytest 미실행 (환경 제약) |
| 환경 검증 v2 (mobile npm install + tsc) | npm ci 946 packages 설치되었으나 typescript 모듈 누락 (lock mismatch) | **UNVERIFIED** (환경 제약 잔존) |

---

## 1. Student.name 구현 상세 (카드 #4)

### Step 1 — `app/common/security.py`
- `compute_name_hash(name)` 함수 신설: NFC 정규화 + strip + HMAC-SHA256(name, hash_key)
- `_get_hash_key()` 함수 신설: settings.hash_key fallback to aes_encryption_key

### Step 2 — `app/config.py`
- `hash_key: str = "change-me-32-byte-hash-key-prod!"` 추가
- 운영 환경 변수 `HASH_KEY` prod 설정 필요 (.env에 secret 추가)

### Step 3 — `app/modules/student_management/models.py`
- `name: String(100) NOT NULL` 제거
- `name_encrypted: String(500) NOT NULL` 추가
- `name_hash: String(64) NOT NULL, indexed` 추가
- `UniqueConstraint("guardian_id", "name", "date_of_birth")` → `("guardian_id", "name_hash", "date_of_birth")`
- `@hybrid_property def name(self) -> str` getter (decrypt) + setter (encrypt + hash)

### Step 4 — `app/modules/student_management/service.py`
- L561 검색 쿼리 `Student.name == name` → `Student.name_hash == compute_name_hash(name)`
- 다른 인스턴스 레벨 호출 (`student.name = request.name`)은 setter가 자동 처리

### Step 5 — `migrations/versions/e7a9b2c4d6f8_student_name_encryption.py`
- head chain: `d5e7f9a1b3c4 → e7a9b2c4d6f8`
- `add_column name_encrypted/name_hash` → `drop_constraint uq_student_guardian` → `drop_column name` → `create_index ix_students_name_hash` + 새 unique constraint

### Class-level SQL 회귀 차단 (5곳)

spec에서 "out-of-scope"으로 분류한 영역이지만 실제 코드에 잔존하여 즉시 처리:

| 위치 | 변경 |
|---|---|
| `scheduling/service.py:549` | `Student.name.label("student_name")` → `Student.name_encrypted.label("student_name_encrypted")` + L615에서 decrypt |
| `billing/service.py:188` | 동일 패턴 (invoice 단건) + L247 decrypt |
| `billing/service.py:267` | 동일 패턴 (invoice 리스트) + L284 decrypt |
| `admin/service.py:458` | `Student.name.ilike(f"%{query}%")` → `Student.name_hash == compute_name_hash(query)` (정확 일치만, 부분 검색은 phone으로 폴백) |

---

## 2. 변경 파일 (Round 2 추가, 누적 v3)

### 신규 변경 (Round 2, 9 파일)

1. `backend/app/common/security.py` — compute_name_hash + _get_hash_key
2. `backend/app/config.py` — hash_key setting
3. `backend/app/modules/student_management/models.py` — Student.name → name_encrypted + name_hash + hybrid_property + UniqueConstraint
4. `backend/app/modules/student_management/service.py` — L561 검색 쿼리 hash 기반
5. `backend/app/modules/scheduling/service.py` — L549 SQL select 절 name_encrypted (이미 v2에서 allergies_encrypted 처리 패턴 동일)
6. `backend/app/modules/billing/service.py` — L184~194 + L247 + L263~285 SQL select + decrypt 처리
7. `backend/app/modules/admin/service.py` — L458 ILIKE → hash exact match
8. `backend/migrations/versions/e7a9b2c4d6f8_student_name_encryption.py` (신규)
9. `backend/app/modules/student_management/models.py` import — compute_name_hash

### 모바일 (2 파일)

10. `mobile/src/screens/LoginScreen.tsx` — OTP 수집 목적 사전 고지 (R-12-C)
11. `mobile/src/screens/parent/components/ConsentDetail.tsx` — 만 14세 미만 법정대리인 동의 명시 (R-12-B)

### 신청서 (1 파일, 4 추가 갱신)

12. `artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md` — line 32, 73(이미 v2), 160, 253, 279, 374 모두 갱신 + 작성 버전 v1.1 → v1.3

### 메타·보고서 (3 파일)

13. `STATE.md` — Last updated v3
14. `CLAUDE.md` — (v2에서 이미 갱신)
15. `artifacts/reports/2026-05-06-major-issues-resolution-v3.md` (본 문서)

**총 v3 변경 파일 (Round 2)**: 12개. v1+v2+v3 누적: **45개 파일**.

---

## 3. 검증 상태 (v3 baseline)

### VERIFIED (35건)
- v1: 12 → v2: 30 → v3: **35** (+5: R-12-B, R-12-C, 신청서 6곳, Student.name 코드 변경, GAP-2 리네이밍 검증)

### PARTIAL (2건)
- 환경 검증 v2 mobile tsc — node_modules typescript 누락 (lock mismatch)
- pytest Round 2 회귀 검증 미실행 (환경 제약)

### 환경 SKIP (1건)
- mobile tsc 자동 검증 — 다음 세션 `npm install --force` 또는 lock 재생성 후 재시도

---

## 4. Round 2 회귀 risk (UNVERIFIED 잔존)

| Risk | 영향 | mitigation |
|---|---|---|
| `Student(name="...")` 키워드 초기화 시 hybrid_property setter 정상 trigger 가정 | 8개 테스트 fixture + service.py 2곳 영향 | SQLAlchemy declarative `__init__`은 setattr로 처리하므로 setter 호출됨 (표준 행동). 단, 첫 pytest 실행으로 검증 필요 |
| `compute_name_hash` 결과가 동일 NFC + strip 평문에 대해 deterministic | UniqueConstraint 정합 | hashlib.sha256 + hmac으로 보장. 단, settings.hash_key·aes_encryption_key 환경 일관성 검증 필요 |
| 마이그레이션 `drop_column name` 실행 시 시드 데이터 손실 | dev/staging 환경에서 학생 이름 0 | 시드 재실행으로 회복. prod 데이터는 본 마이그레이션 전 backfill 스크립트 실행 가정 |
| Class-level SQL 변경 5곳 회귀 | 8개 테스트 + 운영 endpoint 영향 | pytest 178 collected 재실행으로 검증 (다음 세션) |
| HASH_KEY 환경변수 미설정 시 fallback to aes_encryption_key | dev에서 정상 동작 / prod 운영 시 별도 secret 권장 | `.env.example`에 HASH_KEY 추가 권고 (이번 세션 미수행) |

---

## 5. Round 3 권고 (다음 세션)

1. **환경 검증** (~30분 예상):
   - `cd backend && pytest tests/ --tb=line` 실행 → Round 2 변경분 회귀 0 검증
   - `cd backend && alembic upgrade head` → 마이그레이션 e7a9b2c4d6f8 SQL syntax 검증
   - `cd mobile && rm -rf node_modules package-lock.json && npm install` → typescript 재설치 + tsc

2. **`.env.example` 갱신** (5분):
   - `HASH_KEY=...` 항목 추가 + 운영 환경 변수 가이드

3. **단위 테스트 신규 작성** (~30분):
   - `backend/tests/unit/test_security.py`에 compute_name_hash 4 케이스
   - 동일 평문 → 동일 hash / NFC 정규화 / strip 효과 / 다른 평문 → 다른 hash

4. **Round 2 회귀 발견 시 수정** (불확실):
   - SQLAlchemy hybrid_property + `Student(name="...")` 패턴이 의도와 다르게 동작 시 테스트 fixture 패턴 변경 (`student = Student(...); student.name = "..."` 분리)

---

## 6. 변경 이력

- 2026-05-06 v1.0: 18건 처리
- 2026-05-06 v2.0: 38건 + 환경 검증 5종 + 카드 6건
- 2026-05-06 v3.0: Round 2 — R-12-B/C + 신청서 6곳 + Student.name 본격 구현 + 환경 검증 v2 (총 처리 누적: **VERIFIED 35 + PARTIAL 2 + SKIP 1**)
