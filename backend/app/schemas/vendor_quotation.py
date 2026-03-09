from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class QuotationItemCreate(BaseModel):
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    gst_percent: Decimal
    line_total: Decimal


class QuotationItemRead(BaseModel):
    id: UUID
    quotation_id: UUID
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    gst_percent: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True


class VendorQuotationCreate(BaseModel):
    vendor_name: str
    currency: str
    subtotal: Decimal
    gst_total: Decimal
    discount: Decimal
    grand_total: Decimal
    items: list[QuotationItemCreate]


class VendorQuotationRead(BaseModel):
    id: UUID
    transaction_id: UUID
    vendor_name: str
    currency: str
    subtotal: Decimal
    gst_total: Decimal
    discount: Decimal
    grand_total: Decimal
    is_selected: bool
    created_at: datetime
    items: list[QuotationItemRead]

    class Config:
        from_attributes = True
