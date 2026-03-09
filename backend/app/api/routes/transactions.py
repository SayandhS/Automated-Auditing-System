from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models import AuditLog, ProcurementTransaction, User, UserRole
from app.models.procurement_transaction import TransactionStatus
from app.schemas.procurement_transaction import (
    ProcurementTransactionCreate,
    ProcurementTransactionRead,
)

router = APIRouter()


def create_audit_entry(
    db: Session,
    transaction_id: UUID,
    action: str,
    performed_by_id: UUID,
) -> None:
    """Create audit log entry."""
    entry = AuditLog(
        transaction_id=transaction_id,
        action=action,
        performed_by=performed_by_id,
    )
    db.add(entry)


@router.post("/transactions", response_model=ProcurementTransactionRead)
def create_transaction(
    data: ProcurementTransactionCreate,
    current_user: Annotated[User, Depends(require_roles(UserRole.BUYER))],
    db: Annotated[Session, Depends(get_db)],
):
    """Create a new ProcurementTransaction. BUYER only."""
    transaction = ProcurementTransaction(
        title=data.title,
        created_by_id=current_user.id,
        status=TransactionStatus.CREATED,
    )
    db.add(transaction)
    db.flush()  # Get transaction.id before audit log

    create_audit_entry(
        db=db,
        transaction_id=transaction.id,
        action="CREATED",
        performed_by_id=current_user.id,
    )
    db.commit()
    db.refresh(transaction)

    return transaction


@router.get("/transactions", response_model=list[ProcurementTransactionRead])
def list_transactions(
    current_user: Annotated[
    User,
    Depends(
        require_roles(
            UserRole.BUYER,
            UserRole.FINANCE_MANAGER,
            UserRole.INVENTORY_MANAGER,
            UserRole.ADMIN,
        )
    ),
],
    db: Annotated[Session, Depends(get_db)],
):
    """List transactions. BUYER sees own, ADMIN sees all."""
    query = db.query(ProcurementTransaction)
    return query.all()


@router.get("/transactions/{transaction_id}/audit-logs")
def get_transaction_audit_logs(
    transaction_id: UUID,
    current_user: Annotated[User, Depends(
    require_roles(
        UserRole.BUYER,
        UserRole.FINANCE_MANAGER,
        UserRole.INVENTORY_MANAGER,
        UserRole.ADMIN,
    )
)
],
    db: Annotated[Session, Depends(get_db)],
):
    """Get audit logs for a transaction. Must belong to buyer unless ADMIN."""
    transaction = db.query(ProcurementTransaction).filter(
        ProcurementTransaction.id == transaction_id
    ).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    logs = db.query(AuditLog).filter(AuditLog.transaction_id == transaction_id).all()
    return [
        {"id": str(log.id), "action": log.action, "performed_by": str(log.performed_by), "timestamp": str(log.timestamp)}
        for log in logs
    ]


@router.get("/transactions/{transaction_id}", response_model=ProcurementTransactionRead)
def get_transaction(
    transaction_id: UUID,
    current_user: Annotated[User, Depends(
    require_roles(
        UserRole.BUYER,
        UserRole.FINANCE_MANAGER,
        UserRole.INVENTORY_MANAGER,
        UserRole.ADMIN,
    )
)
],
    db: Annotated[Session, Depends(get_db)],
):
    """Get transaction by id. Must belong to buyer unless ADMIN."""
    transaction = db.query(ProcurementTransaction).filter(
        ProcurementTransaction.id == transaction_id
    ).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    if current_user.role == UserRole.BUYER and transaction.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    return transaction
