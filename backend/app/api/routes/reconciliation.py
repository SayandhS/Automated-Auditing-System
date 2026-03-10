from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models import User, UserRole
from app.services.reconciliation_service import compare_po_invoice_grn

router = APIRouter()


@router.get("/transactions/{transaction_id}/reconciliation")
def get_reconciliation(
  transaction_id: UUID,
  current_user: Annotated[
    User,
    Depends(require_roles(UserRole.BUYER, UserRole.FINANCE_MANAGER, UserRole.ADMIN)),
  ],
  db: Annotated[Session, Depends(get_db)],
):
  """Return skeleton reconciliation data for a transaction."""
  return compare_po_invoice_grn(transaction_id, db)

