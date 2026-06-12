"""add_user_consents

Revision ID: a4b8e2c6d9f1
Revises: f7c2d4a91b3e
Create Date: 2026-06-11 12:00:00.000000

Tech Spec FR-C1 (2026-06-11 pt-payment-signup) — 사용자 본인 약관·개인정보·
위치정보 동의 기록 테이블. GuardianConsent(아동 동의)와 별개.

NOTE: alembic autogenerate 미사용 — c4b1f5e7a8d2 NOTE와 동일한 룰.
upgrade()는 추가만 하고 어떤 drop도 포함하지 않는다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a4b8e2c6d9f1'
down_revision: Union[str, None] = 'f7c2d4a91b3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_consents',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('doc_type', sa.String(length=20), nullable=False),
        sa.Column('doc_version', sa.String(length=64), nullable=False),
        sa.Column(
            'consent_method',
            sa.String(length=40),
            nullable=False,
            server_default='mobile_checkbox_v1',
        ),
        sa.Column(
            'granted_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('withdrawn_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_user_consents_user_id', 'user_consents', ['user_id'], unique=False,
    )
    op.create_index(
        'ix_user_consents_user_doc', 'user_consents', ['user_id', 'doc_type'], unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_user_consents_user_doc', table_name='user_consents')
    op.drop_index('ix_user_consents_user_id', table_name='user_consents')
    op.drop_table('user_consents')
