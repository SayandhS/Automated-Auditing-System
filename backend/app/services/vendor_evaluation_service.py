"""Vendor evaluation business logic. No FastAPI or HTTP concerns."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models import VendorQuotation


class NoQuotationsFoundError(Exception):
    """Raised when a transaction has no vendor quotations."""

    pass


def evaluate_vendors(transaction_id: UUID, db: Session) -> dict:
    """
    Evaluate vendors for a transaction using stored quotation totals.
    Returns a structured result; raises NoQuotationsFoundError if no quotations exist.
    """
    quotations = (
        db.query(VendorQuotation)
        .filter(VendorQuotation.transaction_id == transaction_id)
        .all()
    )
    if not quotations:
        raise NoQuotationsFoundError("No quotations found for this transaction")

    if len(quotations) == 1:
        return {
            "type": "SINGLE_VENDOR",
            "message": "Only one vendor uploaded. Are you sure you want to proceed?",
            "recommended_vendor_id": None,
        }

    # Multiple quotations: rank by grand_total ascending, lowest = recommended
    sorted_quotations = sorted(quotations, key=lambda q: q.grand_total)
    recommended = sorted_quotations[0]
    return {
        "type": "MULTI_VENDOR",
        "recommended_vendor_id": str(recommended.id),
        "recommended_vendor_name": recommended.vendor_name,
    }
