"""create_walk_photos

Revision ID: f1a3c5b7d9e2
Revises: e7a9b2c4d6f8
Create Date: 2026-05-22 00:00:00.000000

Tech Spec FR-B2 / FR-F2 — 산책 사진 + AI 자동 캡션 + 펫 컨디션 테이블 신설.
축 B(사진 캡션) · 축 F(컨디션) 인프라. P1-3 슬라이스 (모델 + 마이그레이션).

시퀀싱 근거: Tech Spec §16.1은 AI 4개 테이블을 1건 마이그레이션으로 계획했으나,
사용자 결정 D-8(슬라이스 전략) 하에 WalkPhoto만 분리. 나머지 3개 테이블
(PtIncidentClassification·PtModerationFlag·PtAiInsight)은 P2-2로 이연.
상세: artifacts/gap-notes/2026-05-22-walkphoto-migration-sequencing.md

NOTE: alembic autogenerate 미사용. 프로젝트 컨벤션(c4b1f5e7a8d2 NOTE 참조 —
스푸리어스 drop 위험 회피)에 따라 직접 작성한다. upgrade()는 추가만 하고
어떤 drop도 포함하지 않는다. 신규 마이그레이션은 단일 head e7a9b2c4d6f8를
계승하여 head 단일성을 유지한다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a3c5b7d9e2'
down_revision: Union[str, None] = 'e7a9b2c4d6f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # walk_photos 테이블 신설 (산책 사진 + AI 캡션 + 컨디션)
    op.create_table(
        'walk_photos',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('session_id', sa.Uuid(), nullable=False),
        sa.Column('s3_key', sa.String(length=500), nullable=False),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column(
            'caption_status',
            sa.String(length=20),
            nullable=False,
            server_default='pending',
        ),
        sa.Column('condition', sa.String(length=20), nullable=True),
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
        'ix_walk_photos_session_created',
        'walk_photos',
        ['session_id', 'created_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_walk_photos_session_created', table_name='walk_photos')
    op.drop_table('walk_photos')
