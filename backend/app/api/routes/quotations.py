from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import AuditLog, ProcurementTransaction, QuotationItem, User, UserRole, VendorQuotation
from app.models.procurement_transaction import TransactionStatus
from app.schemas.vendor_quotation import VendorQuotationCreate, VendorQuotationRead
from app.services.vendor_evaluation_service import (
    NoQuotationsFoundError,
    evaluate_vendors,
)

router = APIRouter()


def create_audit_entry(
    db: Session,
    transaction_id: UUID,
    action: str,
    performed_by_id: UUID,
) -> None:
    entry = AuditLog(
        transaction_id=transaction_id,
        action=action,
        performed_by=performed_by_id,
    )
    db.add(entry)


def get_transaction_or_404(db: Session, transaction_id: UUID) -> ProcurementTransaction:
    transaction = db.query(ProcurementTransaction).filter(
        ProcurementTransaction.id == transaction_id
    ).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    return transaction


@router.post(
    "/transactions/{transaction_id}/quotations",
    response_model=VendorQuotationRead,
)
def create_quotation(
    transaction_id: UUID,
    data: VendorQuotationCreate,
    current_user: Annotated[User, Depends(require_roles(UserRole.BUYER))],
    db: Annotated[Session, Depends(get_db)],
):
    """Create a quotation for a transaction. BUYER only."""
    transaction = get_transaction_or_404(db, transaction_id)
    if transaction.status not in (TransactionStatus.CREATED, TransactionStatus.VENDOR_SELECTED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quotations can only be added when status is CREATED or VENDOR_SELECTED. Current: {transaction.status.value}",
        )
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

    # Create line items
    for item in data.items:
        db_item = QuotationItem(
            quotation_id=quotation.id,
            product_name=item.product_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_percent=item.gst_percent,
            line_total=item.line_total,
        )
        db.add(db_item)

    create_audit_entry(db, transaction_id, "QUOTATION_ADDED", current_user.id)
    db.commit()
    db.refresh(quotation)
    return quotation


@router.get(
    "/transactions/{transaction_id}/quotations",
    response_model=list[VendorQuotationRead],
)
def list_quotations(
    transaction_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """List quotations for a transaction. Any authenticated user."""
    get_transaction_or_404(db, transaction_id)
    quotations = db.query(VendorQuotation).filter(
        VendorQuotation.transaction_id == transaction_id
    ).all()
    return quotations


@router.get("/transactions/{transaction_id}/vendor-evaluation")
def get_vendor_evaluation(
    transaction_id: UUID,
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.BUYER, UserRole.FINANCE_MANAGER, UserRole.ADMIN)),
    ],
    db: Annotated[Session, Depends(get_db)],
):
    """Get vendor evaluation for a transaction. BUYER, FINANCE_MANAGER, ADMIN."""
    get_transaction_or_404(db, transaction_id)
    try:
        result = evaluate_vendors(transaction_id, db)
        return result
    except NoQuotationsFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quotations found for this transaction",
        )


@router.post(
    "/transactions/{transaction_id}/quotations/{quotation_id}/select",
    response_model=VendorQuotationRead,
)
def select_quotation(
    transaction_id: UUID,
    quotation_id: UUID,
    current_user: Annotated[User, Depends(require_roles(UserRole.BUYER))],
    db: Annotated[Session, Depends(get_db)],
):
    """Select a quotation. BUYER only."""
    transaction = get_transaction_or_404(db, transaction_id)
    quotation = db.query(VendorQuotation).filter(
        VendorQuotation.id == quotation_id,
        VendorQuotation.transaction_id == transaction_id,
    ).first()
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found",
        )

    try:
        evaluation = evaluate_vendors(transaction_id, db)
    except NoQuotationsFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quotations found for this transaction",
        )

    if evaluation["type"] == "MULTI_VENDOR":
        recommended_id = evaluation.get("recommended_vendor_id")
        if recommended_id and str(quotation_id) == recommended_id:
            audit_action = "VENDOR_RECOMMENDED_SELECTED"
        else:
            audit_action = "VENDOR_OVERRIDE_SELECTED"
    else:
        audit_action = "SINGLE_VENDOR_SELECTED"

    for q in transaction.quotations:
        q.is_selected = q.id == quotation_id
    transaction.status = TransactionStatus.VENDOR_SELECTED
    create_audit_entry(db, transaction_id, audit_action, current_user.id)
    db.commit()
    db.refresh(quotation)
    return quotation
