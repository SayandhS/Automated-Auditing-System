from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models import FinanceDecisionRecord, ProcurementTransaction, User, UserRole
from app.schemas.finance_decision import FinanceDecisionCreate, FinanceDecisionRead

router = APIRouter()


@router.post(
  "/transactions/{transaction_id}/finance-decision",
  response_model=FinanceDecisionRead,
)
def create_finance_decision(
  transaction_id: UUID,
  payload: FinanceDecisionCreate,
  current_user: Annotated[User, Depends(require_roles(UserRole.FINANCE_MANAGER))],
  db: Annotated[Session, Depends(get_db)],
):
  tx = (
    db.query(ProcurementTransaction)
    .filter(ProcurementTransaction.id == transaction_id)
    .first()
  )
  if not tx:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Transaction not found",
    )

  record = FinanceDecisionRecord(
    transaction_id=transaction_id,
    system_recommendation=payload.system_recommendation,
    human_decision=payload.human_decision,
    comment=payload.comment,
    decided_by=current_user.id,
    decided_at=datetime.utcnow(),
  )
  db.add(record)
  db.commit()
  db.refresh(record)
  return record

