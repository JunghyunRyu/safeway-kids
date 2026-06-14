"""add_walk_gps_filter_flags

Revision ID: b6d1f3e8c2a7
Revises: a4b8e2c6d9f1
Create Date: 2026-06-14 09:00:00.000000

Tech Spec FR-1 (2026-06-14 pt-gps-accuracy-filtering) — walk_gps_history에
저정확도·순간이동 점 표식(is_filtered, filter_reason) 추가. 원본은 보존하되
polyline·실시간 발행·거리계산에서 제외하기 위한 플래그.

NOTE: alembic autogenerate 미사용 — c4b1f5e7a8d2 NOTE와 동일한 룰.
upgrade()는 추가만 하고 어떤 drop도 포함하지 않는다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b6d1f3e8c2a7'
down_revision: Union[str, None] = 'a4b8e2c6d9f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'walk_gps_history',
        sa.Column('is_filtered', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.add_column(
        'walk_gps_history',
        sa.Column('filter_reason', sa.String(length=30), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('walk_gps_history', 'filter_reason')
    op.drop_column('walk_gps_history', 'is_filtered')
