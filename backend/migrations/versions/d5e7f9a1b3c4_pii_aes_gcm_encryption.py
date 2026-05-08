"""pii_aes_gcm_encryption

Revision ID: d5e7f9a1b3c4
Revises: c4b1f5e7a8d2
Create Date: 2026-05-06 22:00:00.000000

C-2 / C-3 catastrophic 보안 결함 해소 (audit 2026-05-06).
Student 모델 3개 PII 필드 + WalkerWallet/CaregiverWallet bank_account 평문 저장 → AES-256-GCM 암호화 칼럼으로 교체.

개인정보보호법 §29 안전성 확보 의무 + 전자금융거래법 안전성 기준 적용.

데이터 이전 가정:
- dev/staging 시드 데이터 외 실 prod 데이터 0 (출시 전, K8s 미프로비저닝).
- 기존 평문 데이터가 있을 경우 본 마이그레이션 실행 전에 별도 백필 스크립트 필요.
- Student.name 암호화는 본 마이그레이션 범위 외 (UniqueConstraint·검색 쿼리 영향 별도 spec).

NOTE: alembic autogenerate 미사용. 직접 작성.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd5e7f9a1b3c4'
down_revision: Union[str, None] = 'c4b1f5e7a8d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # students — 3 PII 필드 평문 → _encrypted (AES-GCM)
    op.add_column('students', sa.Column('allergies_encrypted', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('medical_notes_encrypted', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('emergency_contact_encrypted', sa.String(length=500), nullable=True))
    op.drop_column('students', 'allergies')
    op.drop_column('students', 'medical_notes')
    op.drop_column('students', 'emergency_contact')

    # walker_wallets — bank_account 평문 → bank_account_encrypted
    op.add_column('walker_wallets', sa.Column('bank_account_encrypted', sa.String(length=500), nullable=True))
    op.drop_column('walker_wallets', 'bank_account')

    # caregiver_wallets — bank_account 평문 → bank_account_encrypted
    op.add_column('caregiver_wallets', sa.Column('bank_account_encrypted', sa.String(length=500), nullable=True))
    op.drop_column('caregiver_wallets', 'bank_account')

    # pets — medical_notes 평문 → medical_notes_encrypted (반려동물 의료 정보, 보호자 신뢰)
    op.add_column('pets', sa.Column('medical_notes_encrypted', sa.Text(), nullable=True))
    op.drop_column('pets', 'medical_notes')


def downgrade() -> None:
    # pets
    op.add_column('pets', sa.Column('medical_notes', sa.Text(), nullable=True))
    op.drop_column('pets', 'medical_notes_encrypted')

    # caregiver_wallets
    op.add_column('caregiver_wallets', sa.Column('bank_account', sa.String(length=100), nullable=True))
    op.drop_column('caregiver_wallets', 'bank_account_encrypted')

    # walker_wallets
    op.add_column('walker_wallets', sa.Column('bank_account', sa.String(length=100), nullable=True))
    op.drop_column('walker_wallets', 'bank_account_encrypted')

    # students
    op.add_column('students', sa.Column('allergies', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('medical_notes', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('emergency_contact', sa.String(length=20), nullable=True))
    op.drop_column('students', 'allergies_encrypted')
    op.drop_column('students', 'medical_notes_encrypted')
    op.drop_column('students', 'emergency_contact_encrypted')
