"""M001: Multi-app context — extend UserRole enum, add app_context column, composite uniques

Revision ID: m001_multi_app
Revises: fe02afa3a8b8
Create Date: 2026-04-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "m001_multi_app"
down_revision: Union[str, None] = "fe02afa3a8b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Step 1: Extend UserRole enum ────────────────────────────────
    # ALTER TYPE ADD VALUE is non-transactional in PostgreSQL.
    # We must commit the current transaction, add values, then start a new one.
    op.execute("COMMIT")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'pet_owner'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'walker'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'caregiver'")
    op.execute("BEGIN")

    # ── Step 2: Add app_context column ──────────────────────────────
    op.add_column(
        "users",
        sa.Column("app_context", sa.String(30), nullable=False, server_default="safeway_kids"),
    )

    # ── Step 3: Replace phone unique with composite unique ──────────
    # Drop old unique constraint on phone (may be named differently)
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key")
    op.create_unique_constraint("uq_users_phone_app", "users", ["phone", "app_context"])

    # ── Step 4: Replace kakao_id unique with composite partial index ─
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_kakao_id_key")
    op.execute("DROP INDEX IF EXISTS ix_users_kakao_id")
    op.execute(
        "CREATE UNIQUE INDEX ix_users_kakao_app ON users (kakao_id, app_context) "
        "WHERE kakao_id IS NOT NULL"
    )

    # ── Step 5: Add app_context to messages table ───────────────────
    op.add_column(
        "messages",
        sa.Column("app_context", sa.String(30), server_default="safeway_kids"),
    )


def downgrade() -> None:
    # Remove app_context from messages
    op.drop_column("messages", "app_context")

    # Restore kakao_id unique (simple)
    op.execute("DROP INDEX IF EXISTS ix_users_kakao_app")
    op.execute(
        "CREATE UNIQUE INDEX ix_users_kakao_id ON users (kakao_id) "
        "WHERE kakao_id IS NOT NULL"
    )

    # Restore phone unique (simple)
    op.drop_constraint("uq_users_phone_app", "users", type_="unique")
    op.create_unique_constraint("users_phone_key", "users", ["phone"])

    # Remove app_context column
    op.drop_column("users", "app_context")

    # NOTE: Cannot remove enum values in PostgreSQL.
    # pet_owner, walker, caregiver will remain in the enum type.
