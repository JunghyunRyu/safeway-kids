# Final Tech Spec — Student.name AES-GCM Encryption (C-2 잔존)

**작성일**: 2026-05-06
**상태**: APPROVED FOR TRACK 2 IMPLEMENTATION
**우선순위**: HIGH (개인정보보호법 §29 안전성 확보 의무)
**예상 슬롯**: Track 2 5/16~5/19 (T2.0 pip check 직후, T2.1 LLM 인프라 시작 전)
**예상 공수**: 4~6시간

---

## 1. 문제 정의

`backend/app/modules/student_management/models.py`의 `Student.name` 필드(L19)가 평문 String(100)으로 저장되어 있다. 2026-05-06 audit에서 발견된 C-2 catastrophic 보안 결함의 잔여 부분이다.

**왜 본 세션(2026-05-06)에서 즉시 처리 못 했는가**: `Student.name`은 다음 3개 의존성에 묶여 있다.
1. **검색 쿼리**: `service.py:561` `Student.name == name` (엑셀 bulk upload 중복 체크)
2. **UniqueConstraint**: `models.py:41` `UniqueConstraint("guardian_id", "name", "date_of_birth", name="uq_student_guardian")`
3. **검색·정렬**: 학원 admin 학생 리스트 화면 + 보호자 자녀 리스트

같은 audit에서 `allergies`·`medical_notes`·`emergency_contact` 3 필드는 검색·UniqueConstraint 무관하므로 hybrid_property 패턴으로 즉시 처리 완료. 본 spec은 `name` 1 필드만 처리한다.

## 2. Goals / Non-goals

### Goals
- `Student.name` 평문 → AES-GCM 암호화 저장
- UniqueConstraint("guardian_id", "name", "date_of_birth") 동등 보장
- Bulk upload 중복 체크 쿼리 동등 동작
- 학원 admin 학생 리스트·보호자 자녀 리스트 표시 정상 동작
- 기존 178 def test_ 회귀 0
- 개인정보보호법 §29 안전성 확보 의무 준수 — DB 직접 노출 시 학생 이름 추출 불가

### Non-goals
- `name` 부분 일치 검색(LIKE 'kim%') 지원 — 현재 코드에 미사용. 필요 시 별도 spec.
- 정렬 by name (한국어 정렬) — 현재 코드는 created_at 기준 정렬. 필요 시 별도 spec.
- CcChild·SafeWay 외 다른 모델의 PII 암호화 — 본 spec 범위 외.
- hybrid_property 패턴 vs CcChild 명시적 decrypt 패턴의 일관성 — V1.1 별도 spec.

## 3. 사용자 시나리오

### S-1. 학원 admin 엑셀 bulk upload — 중복 학생 등록 차단
1. admin이 엑셀 파일 업로드 (학생 50명, 동일 보호자 + 동일 이름 + 동일 생년월일 1건 중복 포함)
2. 백엔드가 각 행에서 (guardian_id, name, date_of_birth) 3-tuple로 중복 검사
3. 중복 행은 "이미 등록된 학생입니다" 응답
4. 신규 행은 정상 등록 + name은 암호화되어 DB 저장

### S-2. 학원 admin 학생 리스트 조회
1. admin이 페이지네이션 학생 목록 요청
2. 백엔드가 Student rows fetch + 각 row에서 name decrypt
3. 응답 JSON에 name이 평문으로 노출 (admin 권한)

### S-3. 보호자 자녀 등록·수정·조회
1. 보호자가 자녀 추가 요청 (name="김민지")
2. 백엔드가 (guardian_id, "김민지", date_of_birth) 중복 체크 (해시 기준)
3. 신규면 Student 생성 + name 암호화
4. 보호자가 자녀 리스트 조회 시 name 평문 반환

## 4. Functional Requirements

### FR-1. Database Schema
| 필드 | 타입 | 변경 |
|---|---|---|
| `name` (기존) | String(100) NOT NULL | DROP |
| `name_encrypted` | String(500) NOT NULL | ADD — AES-GCM ciphertext (base64-encoded nonce+ct) |
| `name_hash` | String(64) NOT NULL | ADD — HMAC-SHA256(name, app_secret) hex digest |
| **UniqueConstraint** | (guardian_id, name, date_of_birth) | DROP |
| **UniqueConstraint** | (guardian_id, name_hash, date_of_birth) | ADD — 동등 unique 보장 |

### FR-2. ORM Model
- `Student.name_encrypted: Mapped[str]` (raw column)
- `Student.name_hash: Mapped[str]` (raw column, indexed for lookup)
- `@hybrid_property def name(self) -> str` (decrypt 자동, instance-level)
- `@name.setter def name(self, value: str)` (encrypt + hash 자동)

### FR-3. Bulk Upload 중복 체크
- 기존: `Student.name == name`
- 변경: `Student.name_hash == compute_name_hash(name)`
- `compute_name_hash` 함수 신설: `app/common/security.py`

### FR-4. Hash 함수 (보안)
```python
def compute_name_hash(name: str) -> str:
    """HMAC-SHA256(name, ENCRYPTION_KEY) — 동일 평문 → 동일 hash, ciphertext와 다른 secret 사용 권장."""
    import hmac
    import hashlib
    key = _get_hash_key()  # ENCRYPTION_KEY와 분리된 secret
    return hmac.new(key, name.encode(), hashlib.sha256).hexdigest()
```

### FR-5. Schema 응답
- `StudentResponse.name` 그대로 (pydantic from_attributes가 hybrid_property 자동 매핑)

## 5. Non-functional Requirements

| 항목 | 목표 |
|---|---|
| 회귀 | 178 def test_ 모두 통과 (현재 baseline) |
| 마이그레이션 시간 | 시드 데이터 ≤100건 기준 1초 내 |
| Bulk upload 중복 체크 성능 | 기존 동등 (인덱스 보장) |
| 검색 쿼리 응답 시간 | 기존 ±5% 이내 (name_hash 인덱스) |
| API 응답 형태 | 변경 없음 (StudentResponse JSON 동일) |

## 6. Constraints

- **5/15 K-Startup 신청 후 진행** (5/16 Track 2 시작 직후)
- **자원**: 1인 창업가, 4~6시간 슬롯
- **회귀 risk 우선**: 기존 145 (CLAUDE.md) / 178 (실측) 테스트 회귀 0이 1차 조건
- **메모리 anchor**: hybrid_property 패턴은 CcChild 명시적 decrypt 패턴과 다름 (V1.1 일관성 spec 별도)

## 7. Architecture / Data Flow

```
[Boundary: User Input]
  POST /students {"name": "김민지", "date_of_birth": "2018-03-12"}
  ↓
[Pydantic Schema]
  StudentCreateRequest (validation, 평문 그대로)
  ↓
[Service Layer: create_student]
  Student(guardian_id=..., name="김민지", date_of_birth=...)
  ↓
[ORM hybrid_property setter]
  self.name_encrypted = encrypt_value("김민지")  # AES-GCM
  self.name_hash = compute_name_hash("김민지")    # HMAC-SHA256
  ↓
[Database]
  INSERT INTO students (name_encrypted, name_hash, ...)
  UniqueConstraint check on (guardian_id, name_hash, date_of_birth)

[Read Path]
  SELECT * FROM students WHERE id = ?
  ↓
[ORM hybrid_property getter]
  name = decrypt_value(name_encrypted)
  ↓
[Pydantic Response]
  StudentResponse(name="김민지", ...)

[Bulk Upload Duplicate Check]
  hash = compute_name_hash(name)
  SELECT * FROM students
   WHERE name_hash = ? AND date_of_birth = ? AND guardian_id = ?
```

## 8. Interfaces

### 8.1 New file: `app/common/security.py` (확장)

기존 `encrypt_value`/`decrypt_value` 옆에 `compute_name_hash` 추가:

```python
import hashlib
import hmac
import os

def _get_hash_key() -> bytes:
    """Get HMAC key for name_hash. Separate from ENCRYPTION_KEY for defense in depth."""
    key_b64 = os.environ.get("HASH_KEY")
    if not key_b64:
        raise RuntimeError("HASH_KEY environment variable not set")
    return base64.b64decode(key_b64)

def compute_name_hash(name: str) -> str:
    return hmac.new(_get_hash_key(), name.encode("utf-8"), hashlib.sha256).hexdigest()
```

### 8.2 Modified: `student_management/models.py`

```python
class Student(Base):
    __tablename__ = "students"
    # ... existing fields ...
    name_encrypted: Mapped[str] = mapped_column(String(500), nullable=False)
    name_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    # ... allergies_encrypted, medical_notes_encrypted, emergency_contact_encrypted (이미 적용됨) ...

    __table_args__ = (
        UniqueConstraint("guardian_id", "name_hash", "date_of_birth", name="uq_student_guardian"),
    )

    @hybrid_property
    def name(self) -> str:
        return decrypt_value(self.name_encrypted)

    @name.setter  # type: ignore[no-redef]
    def name(self, value: str) -> None:
        self.name_encrypted = encrypt_value(value)
        self.name_hash = compute_name_hash(value)
```

### 8.3 Modified: `student_management/service.py`

```python
# L561 변경
from app.common.security import compute_name_hash

dup_stmt = select(Student).where(
    Student.name_hash == compute_name_hash(name),  # 변경
    Student.date_of_birth == dob,
    Student.guardian_id == guardian.id,
    Student.deleted_at.is_(None),
)
```

L598 Student 생성도 hybrid_property setter가 자동 처리하므로 변경 불필요.

### 8.4 Migration: `e7a9b2c4d6f8_student_name_encryption.py`

```python
revision = 'e7a9b2c4d6f8'
down_revision = 'd5e7f9a1b3c4'  # 본 세션 마이그레이션 다음

def upgrade():
    # 새 칼럼 추가
    op.add_column('students', sa.Column('name_encrypted', sa.String(500), nullable=True))  # 임시 nullable
    op.add_column('students', sa.Column('name_hash', sa.String(64), nullable=True))

    # 데이터 백필 (시드 데이터 가정)
    # NOTE: prod 데이터가 있다면 별도 backfill 스크립트 필요 (Python에서 encrypt_value + compute_name_hash 호출 + UPDATE)
    # dev/staging 시드 데이터는 재시드로 처리 가능

    # 기존 UniqueConstraint 제거
    op.drop_constraint('uq_student_guardian', 'students', type_='unique')

    # 기존 name 칼럼 제거
    op.drop_column('students', 'name')

    # NOT NULL 변경 + 새 UniqueConstraint
    op.alter_column('students', 'name_encrypted', nullable=False)
    op.alter_column('students', 'name_hash', nullable=False)
    op.create_index('ix_students_name_hash', 'students', ['name_hash'])
    op.create_unique_constraint(
        'uq_student_guardian', 'students',
        ['guardian_id', 'name_hash', 'date_of_birth']
    )

def downgrade():
    op.drop_constraint('uq_student_guardian', 'students', type_='unique')
    op.drop_index('ix_students_name_hash', table_name='students')
    op.add_column('students', sa.Column('name', sa.String(100), nullable=True))
    op.drop_column('students', 'name_encrypted')
    op.drop_column('students', 'name_hash')
    op.alter_column('students', 'name', nullable=False)
    op.create_unique_constraint(
        'uq_student_guardian', 'students',
        ['guardian_id', 'name', 'date_of_birth']
    )
```

## 9. Edge Cases

| EC | 시나리오 | 처리 |
|---|---|---|
| EC-1 | name이 한국어 자모 분리 (NFC vs NFD) | `name.normalize("NFC")` 사전 정규화 후 hash 계산. setter에서 처리 |
| EC-2 | name 앞뒤 공백 차이 | `name.strip()` 사전 처리. setter에서 처리 |
| EC-3 | HASH_KEY 환경변수 미설정 | 부팅 시 즉시 실패 (FastAPI startup hook). 운영 environment 검증 |
| EC-4 | 기존 prod 데이터 marshalling 실패 | 마이그레이션 backfill 스크립트로 처리. 환경별 분기 |
| EC-5 | bulk upload 시 동일 batch 내 중복 | hash 같으므로 첫 row만 INSERT 성공, 나머지는 IntegrityError → catch + "이미 등록" 응답 |
| EC-6 | name 변경 시 hash·encrypted 동시 갱신 | hybrid_property setter가 둘 다 자동 갱신 |

## 10. Failure Handling

| Failure | Detection | Recovery |
|---|---|---|
| HASH_KEY 누락 | startup hook | 부팅 실패 + 명시적 에러 메시지 |
| ENCRYPTION_KEY 누락 (기존 시스템) | startup hook | 동일 |
| Migration mid-failure | alembic revision 추적 | downgrade로 롤백 후 데이터 정합성 검증 |
| Backfill 데이터 불일치 (이름 없음) | row 발견 시 로그 | 수동 확인 + admin 직접 갱신 |

## 11. Testing Strategy

### 11.1 Unit
- `test_security.py`에 `compute_name_hash` 테스트 추가:
  - 동일 평문 → 동일 hash
  - 다른 평문 → 다른 hash
  - NFC 정규화 효과
  - 공백 trim 효과

### 11.2 Integration
- 기존 `test_persona_scenarios.py:902~904` (학생 create payload with allergies/medical_notes/emergency_contact)에 `name: "김민지"` 추가 검증
- 신규 테스트: `test_student_name_encryption.py`
  - 학생 생성 → DB 직접 조회 → name 칼럼 없음 + name_encrypted ciphertext + name_hash hex
  - API 응답 JSON에 name 평문 노출
  - 동일 보호자 + 동일 이름 + 동일 생년월일 중복 차단
  - 다른 보호자 + 동일 이름 + 동일 생년월일 등록 가능
  - bulk upload 중복 체크 정상 동작

### 11.3 Migration
- dev DB에 시드 데이터 5명 → upgrade head 실행 → 각 학생 read·decrypt 정상
- downgrade → upgrade head → 동등 결과
- prod 시뮬레이션: 기존 150명 데이터 backfill 스크립트 실행 시간 측정 (≤30초 목표)

### 11.4 회귀
- 178 def test_ 전량 통과
- web 학원 admin 학생 리스트 화면 정상 표시 (수동 확인)
- 모바일 보호자 자녀 등록 화면 정상 동작 (수동 확인)

## 12. Rollback Strategy

1. **Tier 1 (코드 수정 직후)**: `alembic downgrade -1` 실행 + 변경 코드 git revert
2. **Tier 2 (배포 후 데이터 일부)**: backfill 역방향 스크립트 (name_encrypted decrypt → name 평문 복원) 후 downgrade
3. **Tier 3 (prod 데이터 손상)**: 백업에서 복원 (5/15 신청 후 prod 배포 전이라 risk 낮음)

## 13. Acceptance Criteria

- [ ] `models.py`에 `name_encrypted`, `name_hash` 칼럼 + hybrid_property 정의
- [ ] `service.py:561` 검색 쿼리 `Student.name_hash == compute_name_hash(name)`로 변경
- [ ] `app/common/security.py`에 `compute_name_hash` 함수 추가
- [ ] HASH_KEY 환경변수 추가 (`.env.example` 갱신)
- [ ] Alembic 마이그레이션 `e7a9b2c4d6f8` 작성 + `alembic upgrade head` 실행 PASS
- [ ] 178 def test_ 전량 통과 (회귀 0)
- [ ] `test_student_name_encryption.py` 4 케이스 신규 통과
- [ ] DB 직접 조회 시 student 평문 이름 노출 0건 확인
- [ ] web 학원 admin 학생 리스트 화면 정상 표시 (수동 검증)
- [ ] 모바일 보호자 자녀 등록 화면 정상 동작 (수동 검증)

## 14. Out-of-scope

- Pet.name 암호화 (반려동물 데이터, §29 외)
- CcChild 패턴 일관성 (V1.1 spec)
- LIKE 'name%' 부분 일치 검색
- 한국어 정렬 (현재 미사용)
- prod 환경 백필 스크립트 (별도 작업, 배포 시점)

## 15. Code Impact Map

| 파일 | 변경 |
|---|---|
| `backend/app/common/security.py` | `compute_name_hash` 함수 추가 + `_get_hash_key` |
| `backend/app/modules/student_management/models.py` | `name` 필드 → `name_encrypted` + `name_hash` + hybrid_property |
| `backend/app/modules/student_management/service.py` | L561 검색 쿼리 hash 기반으로 변경 |
| `backend/migrations/versions/e7a9b2c4d6f8_student_name_encryption.py` | 신규 파일 |
| `backend/.env.example` | `HASH_KEY` 항목 추가 |
| `backend/tests/unit/test_security.py` | `compute_name_hash` 단위 테스트 추가 |
| `backend/tests/integration/test_student_name_encryption.py` | 신규 통합 테스트 (4 케이스) |
| `backend/scripts/seed_demo_data.py` (있다면) | seed 데이터 시드 재실행 (hybrid_property가 자동 처리) |

## 16. Dependencies

- 본 spec은 **2026-05-06 마이그레이션 `d5e7f9a1b3c4` (Student 3 PII + Wallet bank_account + Pet medical_notes) 적용 후** 진행한다.
- HASH_KEY 환경변수가 운영 환경에 사전 배포되어 있어야 한다 (배포 5/15 후, Track 2 시작 5/16 전).

## 17. 변경 이력

- 2026-05-06 v1.0: 초안 작성. 카드 #4 결정 시 즉시 시작 가능.
