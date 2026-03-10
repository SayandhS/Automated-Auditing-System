import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class PurchaseOrderItem(Base):
  __tablename__ = "purchase_order_items"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  purchase_order_id = Column(
    UUID(as_uuid=True),
    ForeignKey("purchase_orders.id", ondelete="CASCADE"),
    nullable=False,
    index=True,
  )
  product_name = Column(String(255), nullable=False)
  quantity = Column(Numeric(12, 2), nullable=False)
  unit_price = Column(Numeric(12, 2), nullable=False)
  gst_percent = Column(Numeric(5, 2), nullable=False)
  line_total = Column(Numeric(12, 2), nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

  purchase_order = relationship("PurchaseOrder", back_populates="items")

