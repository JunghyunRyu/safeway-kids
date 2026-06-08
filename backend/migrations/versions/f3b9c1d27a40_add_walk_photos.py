"""add walk_photos table (PT AI 축 B/F 영속 레이어)

Tech Spec: 2026-04-29-pt-ai-differentiation-final-tech-spec.md §4.2 FR-B2 / §4.5 FR-F2 / §16 Migration Plan
슬라이스 P1-3 — 스키마 골격만 추가. LLM 캡션/컨디션 채움(generate_caption)은 P2-2.

Revision ID: f3b9c1d27a40
Revises: e7a9b2c4d6f8
Create Date: 2026-06-08 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f3b9c1d27a40'
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
        sa.Column('caption_status', sa.String(length=20), server_default='pending', nullable=False),
        sa.Column('condition', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['walk_sessions.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_walk_photos_session_created', 'walk_photos', ['session_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_walk_photos_session_created', table_name='walk_photos')
    op.drop_table('walk_photos')
