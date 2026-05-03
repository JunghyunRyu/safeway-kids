"""add_user_firebase_uid

Revision ID: a28a0d0bb9b6
Revises: a9e8b625085b
Create Date: 2026-04-24 20:51:55.254400

NOTE: alembic autogenerate가 5개 테이블(webhooks, notification_preferences,
messages, notification_logs, api_keys) drop을 감지했으나, 이는 모델 파일에서
import만 누락된 상태이므로 production DB에는 테이블이 그대로 존재한다.
drop 명령은 의도적으로 제거한다 (data loss 방지).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a28a0d0bb9b6'
down_revision: Union[str, None] = 'a9e8b625085b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('firebase_uid', sa.String(length=128), nullable=True))
    op.create_unique_constraint('uq_users_firebase_uid', 'users', ['firebase_uid'])


def downgrade() -> None:
    op.drop_constraint('uq_users_firebase_uid', 'users', type_='unique')
    op.drop_column('users', 'firebase_uid')
