"""add caregiver review reply fields

Revision ID: 1eaf8be691fc
Revises: m002_shared_tables
Create Date: 2026-04-09 01:33:44.474216
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1eaf8be691fc'
down_revision: Union[str, None] = 'm002_shared_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('caregiver_reviews', sa.Column('caregiver_reply', sa.Text(), nullable=True))
    op.add_column('caregiver_reviews', sa.Column('replied_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('caregiver_reviews', 'replied_at')
    op.drop_column('caregiver_reviews', 'caregiver_reply')
