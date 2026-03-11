"""Pydantic schemas for OCR extraction responses and upload endpoints.

These schemas mirror the database models exactly so that the extracted
data can be directly mapped to Invoice, VendorQuotation, GRN, etc.
"""

from decimal import Decimal
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------
class OcrInvoiceItem(BaseModel):
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    gst_percent: Decimal
    line_total: Decimal


class OcrInvoiceData(BaseModel):
    invoice_number: str
    vendor_name: str
    currency: str
    subtotal: Decimal
    gst_total: Decimal
    discount: Decimal = Decimal("0")
    grand_total: Decimal
    items: list[OcrInvoiceItem]


# ---------------------------------------------------------------------------
# Vendor Quotation
# ---------------------------------------------------------------------------
class OcrQuotationItem(BaseModel):
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    gst_percent: Decimal
    line_total: Decimal


class OcrQuotationData(BaseModel):
    vendor_name: str
    currency: str
    subtotal: Decimal
    gst_total: Decimal
    discount: Decimal = Decimal("0")
    grand_total: Decimal
    items: list[OcrQuotationItem]


# ---------------------------------------------------------------------------
# GRN (Goods Received Note)
# ---------------------------------------------------------------------------
class OcrGrnItem(BaseModel):
    product_name: str
    quantity_received: Decimal


class OcrGrnData(BaseModel):
    grn_number: str
    items: list[OcrGrnItem]


# ---------------------------------------------------------------------------
# Generic extraction response (returned by the upload endpoints)
# ---------------------------------------------------------------------------
class OcrExtractionResponse(BaseModel):
    doc_type: str
    mock: bool
    data: dict
