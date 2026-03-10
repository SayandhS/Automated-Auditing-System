import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class GRNItem(Base):
  __tablename__ = "grn_items"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  grn_id = Column(
    UUID(as_uuid=True),
    ForeignKey("grns.id", ondelete="CASCADE"),
    nullable=False,
    index=True,
  )
  product_name = Column(String(255), nullable=False)
  quantity_received = Column(Numeric(12, 2), nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

  grn = relationship("GRN", back_populates="items")

