import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class GRN(Base):
  __tablename__ = "grns"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  transaction_id = Column(
    UUID(as_uuid=True),
    ForeignKey("procurement_transactions.id", ondelete="CASCADE"),
    nullable=False,
    index=True,
  )
  grn_number = Column(String(100), nullable=False)
  received_by = Column(
    UUID(as_uuid=True),
    ForeignKey("users.id"),
    nullable=False,
  )
  created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

  items = relationship(
    "GRNItem",
    back_populates="grn",
    cascade="all, delete-orphan",
  )

