"""student_name_encryption

Revision ID: e7a9b2c4d6f8
Revises: d5e7f9a1b3c4
Create Date: 2026-05-06 23:00:00.000000

C-2 잔존 처리 (audit 2026-05-06 + spec 2026-05-06-student-name-encryption-tech-spec.md).
Student.name 평문 → name_encrypted (AES-GCM) + name_hash (HMAC-SHA256) 분리.
UniqueConstraint("guardian_id", "name", "date_of_birth") → ("guardian_id", "name_hash", "date_of_birth") 동등 unique 보장.

데이터 백필 가정:
- dev/staging 시드 데이터만 있는 가정 (실 prod 데이터 0, K8s 미프로비저닝 시점).
- 기존 평문 name 데이터가 있을 경우 본 마이그레이션 실행 전에 별도 backfill 스크립트 필요.

prod 백필 절차 가이드 (실 데이터 있을 때):
  1. 기존 students 테이블에서 (id, name, date_of_birth, guardian_id) tuple 추출
  2. Python 스크립트: 각 row에 대해 encrypt_value(name) + compute_name_hash(name) 계산
  3. 임시 칼럼 (name_encrypted, name_hash)을 본 마이그레이션 upgrade()의 step 1까지만 실행 후 백필
     UPDATE students SET name_encrypted = :enc, name_hash = :hash WHERE id = :id
  4. 백필 완료 후 본 마이그레이션 step 3·4·5 (drop_constraint·drop_column·alter_column·create_unique_constraint) 수동 실행
  5. 백필 검증: 모든 row의 name_hash가 NOT NULL이고 unique constraint violation 없음

dev 환경 (시드 데이터만): 본 마이그레이션 그대로 실행 + 시드 재실행으로 회복.

NOTE: alembic autogenerate 미사용. drop_column·drop_constraint 직접 작성.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e7a9b2c4d6f8'
down_revision: Union[str, None] = 'd5e7f9a1b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 새 칼럼 추가 (임시 nullable)
    op.add_column('students', sa.Column('name_encrypted', sa.String(length=500), nullable=True))
    op.add_column('students', sa.Column('name_hash', sa.String(length=64), nullable=True))

    # 2. 기존 평문 name 데이터 → name_encrypted + name_hash 자동 백필 (Python)
    # AES-GCM nonce 무작위성 때문에 SQL 단일 호출 불가 — get_bind()로 connection 받아 row-by-row Python 처리.
    # 평문 name 칼럼이 아직 살아 있어야 가능 (drop_column보다 먼저 실행).
    from app.common.security import compute_name_hash, encrypt_value
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, name FROM students WHERE name IS NOT NULL")).fetchall()
    for row in rows:
        student_id = row[0]
        plaintext_name = row[1]
        if plaintext_name and plaintext_name.strip():
            enc = encrypt_value(plaintext_name)
            h = compute_name_hash(plaintext_name)
            bind.execute(
                sa.text("UPDATE students SET name_encrypted = :enc, name_hash = :h WHERE id = :sid"),
                {"enc": enc, "h": h, "sid": student_id},
            )

    # 3. 기존 UniqueConstraint 제거
    op.drop_constraint('uq_student_guardian', 'students', type_='unique')

    # 4. 기존 name 칼럼 제거 (백필 완료 후라 데이터 손실 없음)
    op.drop_column('students', 'name')

    # 5. NOT NULL 변경 + 인덱스 + 새 UniqueConstraint
    op.alter_column('students', 'name_encrypted', nullable=False)
    op.alter_column('students', 'name_hash', nullable=False)
    op.create_index('ix_students_name_hash', 'students', ['name_hash'])
    op.create_unique_constraint(
        'uq_student_guardian', 'students',
        ['guardian_id', 'name_hash', 'date_of_birth']
    )


def downgrade() -> None:
    op.drop_constraint('uq_student_guardian', 'students', type_='unique')
    op.drop_index('ix_students_name_hash', table_name='students')
    op.add_column('students', sa.Column('name', sa.String(length=100), nullable=True))
    op.drop_column('students', 'name_encrypted')
    op.drop_column('students', 'name_hash')
    op.alter_column('students', 'name', nullable=False)
    op.create_unique_constraint(
        'uq_student_guardian', 'students',
        ['guardian_id', 'name', 'date_of_birth']
    )
