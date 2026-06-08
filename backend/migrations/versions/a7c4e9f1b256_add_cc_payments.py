"""add cc_payments table (CareConnect PortOne v2 결제 — PT 패리티)

PetTracker `pt_payments`와 동일 구조의 CareConnect 결제 테이블.
CareConnect를 PetTracker 개발 수준으로 끌어올리는 결제 연동 작업(CC-uplift M1).

Revision ID: a7c4e9f1b256
Revises: f3b9c1d27a40
Create Date: 2026-06-08 00:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a7c4e9f1b256'
down_revision: Union[str, None] = 'f3b9c1d27a40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'cc_payments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('booking_id', sa.Uuid(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=8), server_default='KRW', nullable=False),
        sa.Column('pg_provider', sa.String(length=20), server_default='portone', nullable=False),
        sa.Column('imp_uid', sa.String(length=100), nullable=True),
        sa.Column('merchant_uid', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='pending', nullable=False),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_amount', sa.Integer(), nullable=True),
        sa.Column('cancel_reason', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['cc_bookings.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_cc_payments_booking_id'), 'cc_payments', ['booking_id'], unique=False)
    op.create_index(op.f('ix_cc_payments_imp_uid'), 'cc_payments', ['imp_uid'], unique=True)
    op.create_index(op.f('ix_cc_payments_merchant_uid'), 'cc_payments', ['merchant_uid'], unique=True)
    op.create_index('ix_cc_payments_booking_status', 'cc_payments', ['booking_id', 'status'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_cc_payments_booking_status', table_name='cc_payments')
    op.drop_index(op.f('ix_cc_payments_merchant_uid'), table_name='cc_payments')
    op.drop_index(op.f('ix_cc_payments_imp_uid'), table_name='cc_payments')
    op.drop_index(op.f('ix_cc_payments_booking_id'), table_name='cc_payments')
    op.drop_table('cc_payments')
