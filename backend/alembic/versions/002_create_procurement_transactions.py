"""create procurement transactions and audit logs

Revision ID: 002
Revises: 001
Create Date: 2025-01-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    transaction_status_enum = ENUM(
        "CREATED",
        "VENDOR_SELECTED",
        "PO_APPROVED",
        "PO_REJECTED",
        "PAYMENT_REVIEW",
        "CLOSED",
        name="transactionstatus",
        create_type=True,
    )
    op.create_table(
        "procurement_transactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("created_by_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", transaction_status_enum, nullable=False, server_default="CREATED"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("transaction_id", UUID(as_uuid=True), sa.ForeignKey("procurement_transactions.id"), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("performed_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("procurement_transactions")
    op.execute("DROP TYPE transactionstatus")
