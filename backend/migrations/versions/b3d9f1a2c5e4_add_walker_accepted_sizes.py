"""add_walker_accepted_sizes

Revision ID: b3d9f1a2c5e4
Revises: f1a3c5b7d9e2
Create Date: 2026-06-04 00:00:00.000000

UX 감사 O-02 — 보호자 견종 크기 필터를 백엔드에서 실제 동작시키기 위해
walker_qualifications에 accepted_sizes(JSON) 컬럼 신설. 워커가 산책 가능한
반려동물 크기 목록 ["small","medium","large"]. NULL = 모든 크기 수용(레거시 호환).

NOTE: alembic autogenerate 미사용. 프로젝트 컨벤션에 따라 직접 작성하며
upgrade()는 add_column만 수행(어떤 drop도 없음). 단일 head f1a3c5b7d9e2를
계승하여 head 단일성을 유지한다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b3d9f1a2c5e4'
down_revision: Union[str, None] = 'f1a3c5b7d9e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'walker_qualifications',
        sa.Column('accepted_sizes', sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('walker_qualifications', 'accepted_sizes')
