"""Upload routes: accept document images, run OCR, and save to DB.

Flow for each document type:
  1. POST .../upload/{doc_type}       → extract data via OCR, return preview
  2. POST .../upload/{doc_type}/save  → validate + persist to DB models

This two-step flow lets the user review extracted data before saving.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import (
    AuditLog,
    GRN,
    GRNItem,
    Invoice,
    InvoiceItem,
    ProcurementTransaction,
    QuotationItem,
    User,
    UserRole,
    VendorQuotation,
)
from app.schemas.ocr_upload import (
    OcrExtractionResponse,
    OcrGrnData,
    OcrInvoiceData,
    OcrQuotationData,
)
from app.services.ocr_client import call_ocr_service

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_transaction_or_404(db: Session, transaction_id: UUID) -> ProcurementTransaction:
    tx = db.query(ProcurementTransaction).filter(
        ProcurementTransaction.id == transaction_id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return tx


def create_audit_entry(db: Session, transaction_id: UUID, action: str, performed_by_id: UUID) -> None:
    db.add(AuditLog(transaction_id=transaction_id, action=action, performed_by=performed_by_id))


# ---------------------------------------------------------------------------
# 1. Extract (preview) endpoints — call OCR and return structured data
# ---------------------------------------------------------------------------

@router.post(
    "/transactions/{transaction_id}/upload/{doc_type}",
    response_model=OcrExtractionResponse,
)
def upload_and_extract(
    transaction_id: UUID,
    doc_type: str,
    file: UploadFile = File(..., description="Scanned document image"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a scanned document image and extract structured data via OCR.

    Returns the extracted data for preview. Call the corresponding /save
    endpoint to persist it to the database.
    """
    valid_types = ("invoice", "quotation", "grn")
    if doc_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"doc_type must be one of {valid_types}",
        )

    get_transaction_or_404(db, transaction_id)

    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"File must be an image. Got: '{content_type}'")

    file_bytes = file.file.read()
    filename = file.filename or "document.jpg"

    try:
        result = call_ocr_service(file_bytes, filename, doc_type)
    except Exception as exc:
        import traceback
        print(f"[OCR UPLOAD ERROR] {type(exc).__name__}: {exc}")
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"OCR service error: {type(exc).__name__}: {exc}",
        )

    return OcrExtractionResponse(
        doc_type=result["doc_type"],
        mock=result.get("mock", False),
        data=result["data"],
    )


# ---------------------------------------------------------------------------
# 2. Save endpoints — persist extracted data to DB
# ---------------------------------------------------------------------------

@router.post("/transactions/{transaction_id}/upload/invoice/save")
def save_invoice_from_ocr(
    transaction_id: UUID,
    data: OcrInvoiceData,
    current_user: Annotated[User, Depends(require_roles(UserRole.BUYER, UserRole.ADMIN))],
    db: Annotated[Session, Depends(get_db)],
):
    """Save OCR-extracted invoice data to the database."""
    get_transaction_or_404(db, transaction_id)

    invoice = Invoice(
        transaction_id=transaction_id,
        vendor_name=data.vendor_name,
        invoice_number=data.invoice_number,
        currency=data.currency,
        subtotal=data.subtotal,
        gst_total=data.gst_total,
        discount=data.discount,
        grand_total=data.grand_total,
    )
    db.add(invoice)
    db.flush()

    for item in data.items:
        db.add(InvoiceItem(
            invoice_id=invoice.id,
            product_name=item.product_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_percent=item.gst_percent,
            line_total=item.line_total,
        ))

    create_audit_entry(db, transaction_id, "INVOICE_UPLOADED_VIA_OCR", current_user.id)
    db.commit()
    db.refresh(invoice)

    return {
        "message": "Invoice saved successfully",
        "invoice_id": str(invoice.id),
        "item_count": len(data.items),
    }


@router.post("/transactions/{transaction_id}/upload/quotation/save")
def save_quotation_from_ocr(
    transaction_id: UUID,
    data: OcrQuotationData,
    current_user: Annotated[User, Depends(require_roles(UserRole.BUYER, UserRole.ADMIN))],
    db: Annotated[Session, Depends(get_db)],
):
    """Save OCR-extracted quotation data to the database."""
    get_transaction_or_404(db, transaction_id)

    quotation = VendorQuotation(
        transaction_id=transaction_id,
        vendor_name=data.vendor_name,
        currency=data.currency,
        subtotal=data.subtotal,
        gst_total=data.gst_total,
        discount=data.discount,
        grand_total=data.grand_total,
        is_selected=False,
    )
    db.add(quotation)
    db.flush()

    for item in data.items:
        db.add(QuotationItem(
            quotation_id=quotation.id,
            product_name=item.product_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_percent=item.gst_percent,
            line_total=item.line_total,
        ))

    create_audit_entry(db, transaction_id, "QUOTATION_UPLOADED_VIA_OCR", current_user.id)
    db.commit()
    db.refresh(quotation)

    return {
        "message": "Quotation saved successfully",
        "quotation_id": str(quotation.id),
        "item_count": len(data.items),
    }


@router.post("/transactions/{transaction_id}/upload/grn/save")
def save_grn_from_ocr(
    transaction_id: UUID,
    data: OcrGrnData,
    current_user: Annotated[User, Depends(require_roles(UserRole.BUYER, UserRole.INVENTORY_MANAGER, UserRole.ADMIN))],
    db: Annotated[Session, Depends(get_db)],
):
    """Save OCR-extracted GRN data to the database."""
    get_transaction_or_404(db, transaction_id)

    grn = GRN(
        transaction_id=transaction_id,
        grn_number=data.grn_number,
        received_by=current_user.id,
    )
    db.add(grn)
    db.flush()

    for item in data.items:
        db.add(GRNItem(
            grn_id=grn.id,
            product_name=item.product_name,
            quantity_received=item.quantity_received,
        ))

    create_audit_entry(db, transaction_id, "GRN_UPLOADED_VIA_OCR", current_user.id)
    db.commit()
    db.refresh(grn)

    return {
        "message": "GRN saved successfully",
        "grn_id": str(grn.id),
        "item_count": len(data.items),
    }
