"""pt p2p3 schema: review reply, insurance, photo, recurrence

Revision ID: a9e8b625085b
Revises: 1eaf8be691fc
Create Date: 2026-04-09 01:58:14.498546
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a9e8b625085b'
down_revision: Union[str, None] = '1eaf8be691fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('walker_availabilities', sa.Column('recurrence_type', sa.String(length=20), nullable=True))
    op.add_column('walker_availabilities', sa.Column('recurrence_end_date', sa.Date(), nullable=True))
    op.drop_constraint('uq_walker_avail_date', 'walker_availabilities', type_='unique')
    op.create_unique_constraint('uq_walker_avail_date_time', 'walker_availabilities', ['walker_id', 'available_date', 'start_time'])
    op.add_column('walker_qualifications', sa.Column('has_insurance', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('walker_qualifications', sa.Column('insurance_expiry', sa.Date(), nullable=True))
    op.add_column('walker_qualifications', sa.Column('profile_photo_url', sa.String(length=500), nullable=True))
    op.add_column('walker_reviews', sa.Column('walker_reply', sa.Text(), nullable=True))
    op.add_column('walker_reviews', sa.Column('replied_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('walker_reviews', 'replied_at')
    op.drop_column('walker_reviews', 'walker_reply')
    op.drop_column('walker_qualifications', 'profile_photo_url')
    op.drop_column('walker_qualifications', 'insurance_expiry')
    op.drop_column('walker_qualifications', 'has_insurance')
    op.drop_constraint('uq_walker_avail_date_time', 'walker_availabilities', type_='unique')
    op.create_unique_constraint('uq_walker_avail_date', 'walker_availabilities', ['walker_id', 'available_date'])
    op.drop_column('walker_availabilities', 'recurrence_end_date')
    op.drop_column('walker_availabilities', 'recurrence_type')
