import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class InvoiceItem(Base):
  __tablename__ = "invoice_items"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  invoice_id = Column(
    UUID(as_uuid=True),
    ForeignKey("invoices.id", ondelete="CASCADE"),
    nullable=False,
    index=True,
  )
  product_name = Column(String(255), nullable=False)
  quantity = Column(Numeric(12, 2), nullable=False)
  unit_price = Column(Numeric(12, 2), nullable=False)
  gst_percent = Column(Numeric(5, 2), nullable=False)
  line_total = Column(Numeric(12, 2), nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

  invoice = relationship("Invoice", back_populates="items")

