"""add_walk_photos

Revision ID: f7c2d4a91b3e
Revises: e7a9b2c4d6f8
Create Date: 2026-06-11 00:00:00.000000

Tech Spec FR-B2/FR-F2 — 산책 사진 + AI 캡션 상태 테이블 (축 B 인프라).
캡션 생성 파이프라인(Vision LLM)은 P2-2에서 wire — 본 마이그레이션은
저장 골격만 추가한다. Spec §16.1의 나머지 3개 AI 테이블
(PtIncidentClassification·PtModerationFlag·PtAiInsight)은 P2-2와 함께
별도 head로 추가 (gap-notes/2026-06-11-p1-3-portone-already-implemented.md).

NOTE: alembic autogenerate 미사용 — c4b1f5e7a8d2 NOTE와 동일한 룰.
upgrade()는 추가만 하고 어떤 drop도 포함하지 않는다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f7c2d4a91b3e'
down_revision: Union[str, None] = 'e7a9b2c4d6f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'walk_photos',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('session_id', sa.Uuid(), nullable=False),
        sa.Column('s3_key', sa.String(length=500), nullable=False),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column('caption_status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('condition', sa.String(length=50), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['session_id'], ['walk_sessions.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_walk_photos_session_id', 'walk_photos', ['session_id'], unique=False,
    )
    op.create_index(
        'ix_walk_photos_session_created',
        'walk_photos',
        ['session_id', 'created_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_walk_photos_session_created', table_name='walk_photos')
    op.drop_index('ix_walk_photos_session_id', table_name='walk_photos')
    op.drop_table('walk_photos')
