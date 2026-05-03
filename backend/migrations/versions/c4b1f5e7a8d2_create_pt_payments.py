"""create_pt_payments

Revision ID: c4b1f5e7a8d2
Revises: a28a0d0bb9b6
Create Date: 2026-04-24 22:00:00.000000

Tech Spec FR-1.1 — PortOne v2 결제 기록 테이블 신설.
SafeWay `payments` 테이블과 격리 (academy_id 외래키 충돌 회피).

NOTE: alembic autogenerate 미사용. 5개 테이블 drop 위험(이전 마이그레이션
a28a0d0bb9b6 NOTE 참조)을 피하기 위해 직접 작성한다. 본 마이그레이션의
upgrade()는 추가만 하고 어떤 drop도 포함하지 않는다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c4b1f5e7a8d2'
down_revision: Union[str, None] = 'a28a0d0bb9b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users.portone_customer_uid (PortOne 고객 식별자, 향후 정기결제용)
    op.add_column(
        'users',
        sa.Column('portone_customer_uid', sa.String(length=128), nullable=True),
    )

    # pt_payments 테이블 신설
    op.create_table(
        'pt_payments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('booking_id', sa.Uuid(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='KRW'),
        sa.Column('pg_provider', sa.String(length=20), nullable=False, server_default='portone'),
        sa.Column('imp_uid', sa.String(length=100), nullable=True),
        sa.Column('merchant_uid', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_amount', sa.Integer(), nullable=True),
        sa.Column('cancel_reason', sa.String(length=200), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['booking_id'], ['pt_bookings.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('imp_uid', name='uq_pt_payments_imp_uid'),
        sa.UniqueConstraint('merchant_uid', name='uq_pt_payments_merchant_uid'),
    )
    op.create_index(
        'ix_pt_payments_booking_id', 'pt_payments', ['booking_id'], unique=False,
    )
    op.create_index(
        'ix_pt_payments_imp_uid', 'pt_payments', ['imp_uid'], unique=False,
    )
    op.create_index(
        'ix_pt_payments_merchant_uid', 'pt_payments', ['merchant_uid'], unique=False,
    )
    op.create_index(
        'ix_pt_payments_booking_status',
        'pt_payments',
        ['booking_id', 'status'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_pt_payments_booking_status', table_name='pt_payments')
    op.drop_index('ix_pt_payments_merchant_uid', table_name='pt_payments')
    op.drop_index('ix_pt_payments_imp_uid', table_name='pt_payments')
    op.drop_index('ix_pt_payments_booking_id', table_name='pt_payments')
    op.drop_table('pt_payments')
    op.drop_column('users', 'portone_customer_uid')
