"""merge_heads_before_audit_logs

Revision ID: 669d22698f33
Revises: 22410ab5734a, 8642bc438b32
Create Date: 2026-03-20 18:17:16.653395
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '669d22698f33'
down_revision: Union[str, None] = ('22410ab5734a', '8642bc438b32')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
