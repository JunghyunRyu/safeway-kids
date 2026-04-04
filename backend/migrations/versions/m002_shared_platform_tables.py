"""M002: Shared platform tables — wallet_transactions, commission_records, location_consents, subscriptions

Revision ID: m002_shared_tables
Revises: m001_multi_app
Create Date: 2026-04-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "m002_shared_tables"
down_revision: Union[str, None] = "m001_multi_app"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "wallet_transactions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("wallet_type", sa.String(20), nullable=False),
        sa.Column("wallet_id", sa.Uuid(), nullable=False, index=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("tx_type", sa.String(30), nullable=False),
        sa.Column("reference_id", sa.Uuid()),
        sa.Column("reference_type", sa.String(30)),
        sa.Column("pg_transfer_id", sa.String(200)),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "commission_records",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("app_context", sa.String(30), nullable=False),
        sa.Column("booking_id", sa.Uuid(), nullable=False),
        sa.Column("booking_type", sa.String(30), nullable=False),
        sa.Column("gross_amount", sa.Integer(), nullable=False),
        sa.Column("commission_rate", sa.Integer(), nullable=False),
        sa.Column("commission_amount", sa.Integer(), nullable=False),
        sa.Column("provider_amount", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "location_consents",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("app_context", sa.String(30), nullable=False),
        sa.Column("consent_granted", sa.Boolean(), server_default="true"),
        sa.Column("granted_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("withdrawn_at", sa.DateTime(timezone=True)),
        sa.Column("ip_address", sa.String(45)),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("app_context", sa.String(30), nullable=False),
        sa.Column("plan_type", sa.String(30), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("pg_subscription_key", sa.String(200)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("subscriptions")
    op.drop_table("location_consents")
    op.drop_table("commission_records")
    op.drop_table("wallet_transactions")
