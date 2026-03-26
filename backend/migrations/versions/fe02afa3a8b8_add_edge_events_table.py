"""add_edge_events_table

Revision ID: fe02afa3a8b8
Revises: 8723a985bcbb
Create Date: 2026-03-26 10:49:16.820848
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fe02afa3a8b8'
down_revision: Union[str, None] = '8723a985bcbb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('edge_events',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('event_type', sa.Enum('FACE_RECOGNIZED', 'ABNORMAL_BEHAVIOR', 'REMAINING_PASSENGER', name='edge_event_type', create_constraint=True), nullable=False),
    sa.Column('vehicle_id', sa.UUID(), nullable=True),
    sa.Column('details', postgresql.JSON(astext_type=sa.Text()), nullable=False),
    sa.Column('event_timestamp', sa.DateTime(timezone=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_edge_events_event_type'), 'edge_events', ['event_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_edge_events_event_type'), table_name='edge_events')
    op.drop_table('edge_events')
