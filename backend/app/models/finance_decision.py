import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class FinanceDecisionRecord(Base):
  """Record of final finance decision at transaction level."""

  __tablename__ = "finance_decisions"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  transaction_id = Column(
    UUID(as_uuid=True),
    ForeignKey("procurement_transactions.id", ondelete="CASCADE"),
    nullable=False,
    index=True,
  )
  system_recommendation = Column(String(50), nullable=False)
  human_decision = Column(String(50), nullable=False)
  comment = Column(String(500), nullable=True)
  decided_by = Column(
    UUID(as_uuid=True),
    ForeignKey("users.id"),
    nullable=False,
  )
  decided_at = Column(DateTime, default=datetime.utcnow, nullable=False)

  transaction = relationship("ProcurementTransaction", backref="finance_decisions")

