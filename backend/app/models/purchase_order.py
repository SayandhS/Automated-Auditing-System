import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class SystemRecommendation(str, enum.Enum):
  APPROVE = "APPROVE"
  REVIEW = "REVIEW"
  REJECT = "REJECT"


class FinanceDecision(str, enum.Enum):
  APPROVED = "APPROVED"
  REJECTED = "REJECTED"
  PENDING = "PENDING"


class PurchaseOrder(Base):
  __tablename__ = "purchase_orders"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  transaction_id = Column(
    UUID(as_uuid=True),
    ForeignKey("procurement_transactions.id", ondelete="CASCADE"),
    nullable=False,
    unique=True,
  )
  selected_quotation_id = Column(
    UUID(as_uuid=True),
    ForeignKey("vendor_quotations.id"),
    nullable=False,
  )

  currency = Column(String(10), nullable=False)
  subtotal = Column(Numeric(12, 2), nullable=False)
  gst_total = Column(Numeric(12, 2), nullable=False)
  discount = Column(Numeric(12, 2), nullable=False, default=0)
  grand_total = Column(Numeric(12, 2), nullable=False)

  risk_score = Column(Numeric(4, 0), nullable=False, default=0)
  system_recommendation = Column(
    Enum(SystemRecommendation),
    nullable=False,
  )

  finance_decision = Column(
    Enum(FinanceDecision),
    nullable=False,
    default=FinanceDecision.PENDING,
  )
  finance_comment = Column(String(500), nullable=True)
  approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
  approved_at = Column(DateTime, nullable=True)

  created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

  items = relationship(
    "PurchaseOrderItem",
    back_populates="purchase_order",
    cascade="all, delete-orphan",
  )

