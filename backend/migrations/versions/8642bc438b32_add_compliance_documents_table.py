"""add compliance_documents table

Revision ID: 8642bc438b32
Revises: 4a989d8a9392
Create Date: 2026-03-20 00:00:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8642bc438b32"
down_revision: str | None = "4a989d8a9392"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "compliance_documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("academy_id", sa.Uuid(), nullable=False),
        sa.Column(
            "document_type",
            sa.Enum(
                "INSURANCE_CERT",
                "POLICE_REPORT",
                "SAFETY_TRAINING",
                "VEHICLE_INSPECTION",
                "OTHER",
                name="documenttype",
            ),
            nullable=False,
        ),
        sa.Column("file_name", sa.String(length=500), nullable=False),
        sa.Column("file_path", sa.String(length=1000), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("uploaded_by", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["academy_id"], ["academies.id"]),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("compliance_documents")
    op.execute("DROP TYPE IF EXISTS documenttype")
