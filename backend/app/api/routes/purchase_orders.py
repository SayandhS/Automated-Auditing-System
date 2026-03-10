from datetime import datetime
from typing import Annotated
from uuid import UUID


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session


from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import (
  AuditLog,
  ProcurementTransaction,
  PurchaseOrder,
  PurchaseOrderItem,
  User,
  UserRole,
  VendorQuotation,
)
from app.models.procurement_transaction import TransactionStatus
from app.models.purchase_order import FinanceDecision, SystemRecommendation
from app.schemas.purchase_order import (
  FinanceDecisionRequest,
  PurchaseOrderCreate,
  PurchaseOrderRead,
)
from app.services.po_approval_service import evaluate_purchase_order


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
  return tx




@router.post(
  "/transactions/{transaction_id}/purchase-order",
  response_model=PurchaseOrderRead,
)
def create_purchase_order(
  transaction_id: UUID,
  data: PurchaseOrderCreate,
  current_user: Annotated[User, Depends(require_roles(UserRole.BUYER))],
  db: Annotated[Session, Depends(get_db)],
):
  """Create a Purchase Order for a transaction. BUYER only."""
  tx = get_transaction_or_404(db, transaction_id)


  # Ensure a quotation is selected
  selected_quotation = (
    db.query(VendorQuotation)
    .filter(
      VendorQuotation.transaction_id == transaction_id,
      VendorQuotation.is_selected.is_(True),
    )
    .first()
  )
  if not selected_quotation:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="No selected quotation for this transaction",
    )


  # Ensure PO does not already exist
  existing_po = (
    db.query(PurchaseOrder)
    .filter(PurchaseOrder.transaction_id == transaction_id)
    .first()
  )
  if existing_po:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Purchase order already exists for this transaction",
    )


  # Build transient PO-like items for evaluation BEFORE inserting the PO
  class _POItem:
    def __init__(self, product_name, quantity, unit_price, gst_percent):
      self.product_name = product_name
      self.quantity = quantity
      self.unit_price = unit_price
      self.gst_percent = gst_percent

  po_items_for_eval = [
    _POItem(
      product_name=item.product_name,
      quantity=item.quantity,
      unit_price=item.unit_price,
      gst_percent=item.gst_percent,
    )
    for item in data.items
  ]

  evaluation = evaluate_purchase_order(
    po_items=po_items_for_eval,
    quotation_items=selected_quotation.items,
  )
  risk_score = evaluation["risk_score"]
  recommendation = evaluation["recommendation"]


  po = PurchaseOrder(
    transaction_id=transaction_id,
    selected_quotation_id=selected_quotation.id,
    currency=data.currency,
    subtotal=data.subtotal,
    gst_total=data.gst_total,
    discount=data.discount,
    grand_total=data.grand_total,
    risk_score=risk_score,
    system_recommendation=SystemRecommendation(recommendation),
    finance_decision=FinanceDecision.PENDING,
  )
  db.add(po)
  db.flush()

  # Create PO items
  for item in data.items:
    po_item = PurchaseOrderItem(
      purchase_order_id=po.id,
      product_name=item.product_name,
      quantity=item.quantity,
      unit_price=item.unit_price,
      gst_percent=item.gst_percent,
      line_total=item.line_total,
    )
    db.add(po_item)

  db.flush()


  # Map system recommendation to transaction status
  if recommendation == "APPROVE":
    tx.status = TransactionStatus.PO_AUTO_APPROVED
    rec_action = "SYSTEM_RECOMMENDATION_APPROVE"
  elif recommendation == "REVIEW":
    tx.status = TransactionStatus.PO_REVIEW
    rec_action = "SYSTEM_RECOMMENDATION_REVIEW"
  else:
    tx.status = TransactionStatus.PO_REJECTED
    rec_action = "SYSTEM_RECOMMENDATION_REJECT"


  # Audit logs
  create_audit_entry(db, transaction_id, "PO_CREATED", current_user.id)
  create_audit_entry(db, transaction_id, rec_action, current_user.id)


  db.commit()
  db.refresh(po)
  return po




@router.post(
  "/purchase-orders/{po_id}/finance-decision",
  response_model=PurchaseOrderRead,
)
def set_finance_decision(
  po_id: UUID,
  payload: FinanceDecisionRequest,
  current_user: Annotated[User, Depends(require_roles(UserRole.FINANCE_MANAGER))],
  db: Annotated[Session, Depends(get_db)],
):
  """Finance manager decision on a purchase order."""
  po = (
    db.query(PurchaseOrder)
    .filter(PurchaseOrder.id == po_id)
    .first()
  )
  if not po:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Purchase order not found",
    )


  tx = get_transaction_or_404(db, po.transaction_id)


  po.finance_decision = payload.decision
  po.finance_comment = payload.comment
  po.approved_by = current_user.id
  po.approved_at = datetime.utcnow()


  if payload.decision == FinanceDecision.APPROVED:
    tx.status = TransactionStatus.PO_APPROVED
    action = "FINANCE_APPROVED_PO"
  else:
    tx.status = TransactionStatus.PO_REJECTED
    action = "FINANCE_REJECTED_PO"


  create_audit_entry(db, tx.id, action, current_user.id)


  db.commit()
  db.refresh(po)
  return po