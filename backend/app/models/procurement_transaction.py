import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class TransactionStatus(str, enum.Enum):
    CREATED = "CREATED"
    VENDOR_SELECTED = "VENDOR_SELECTED"
    PO_APPROVED = "PO_APPROVED"
    PO_REJECTED = "PO_REJECTED"
    PAYMENT_REVIEW = "PAYMENT_REVIEW"
    CLOSED = "CLOSED"


class ProcurementTransaction(Base):
    __tablename__ = "procurement_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum(TransactionStatus), nullable=False, default=TransactionStatus.CREATED
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    created_by = relationship("User", backref="procurement_transactions")
    quotations = relationship(
        "VendorQuotation",
        back_populates="transaction",
        cascade="all, delete-orphan",
    )
