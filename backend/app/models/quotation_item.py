import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quotation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vendor_quotations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_name = Column(String(255), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    gst_percent = Column(Numeric(5, 2), nullable=False)
    line_total = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    quotation = relationship("VendorQuotation", back_populates="items")

