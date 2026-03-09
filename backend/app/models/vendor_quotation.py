import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class VendorQuotation(Base):
    __tablename__ = "vendor_quotations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("procurement_transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vendor_name = Column(String(255), nullable=False)
    # Header-level accounting fields
    subtotal = Column(Numeric(12, 2), nullable=False)
    gst_total = Column(Numeric(12, 2), nullable=False)
    discount = Column(Numeric(12, 2), nullable=False, default=0)
    grand_total = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), nullable=False)
    is_selected = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    transaction = relationship("ProcurementTransaction", back_populates="quotations")
    items = relationship(
        "QuotationItem",
        back_populates="quotation",
        cascade="all, delete-orphan",
    )
