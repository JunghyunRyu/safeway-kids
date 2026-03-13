"""M2: add fcm_token to users, vehicle_id to daily_schedule_instances

Revision ID: m2_schema_001
Revises: 959a28869c77
Create Date: 2026-03-13
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "m2_schema_001"
down_revision = "959a28869c77"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("fcm_token", sa.String(500), nullable=True))
    op.add_column(
        "daily_schedule_instances",
        sa.Column(
            "vehicle_id",
            sa.Uuid(),
            sa.ForeignKey("vehicles.id"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("daily_schedule_instances", "vehicle_id")
    op.drop_column("users", "fcm_token")
