from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.models.purchase_order import SystemRecommendation, FinanceDecision


class PurchaseOrderItemCreate(BaseModel):
  product_name: str
  quantity: Decimal
  unit_price: Decimal
  gst_percent: Decimal
  line_total: Decimal


class PurchaseOrderItemRead(BaseModel):
  id: UUID
  purchase_order_id: UUID
  product_name: str
  quantity: Decimal
  unit_price: Decimal
  gst_percent: Decimal
  line_total: Decimal

  class Config:
    from_attributes = True


class PurchaseOrderCreate(BaseModel):
  currency: str
  subtotal: Decimal
  gst_total: Decimal
  discount: Decimal
  grand_total: Decimal
  items: list[PurchaseOrderItemCreate]


class PurchaseOrderRead(BaseModel):
  id: UUID
  transaction_id: UUID
  selected_quotation_id: UUID
  currency: str
  subtotal: Decimal
  gst_total: Decimal
  discount: Decimal
  grand_total: Decimal
  risk_score: int
  system_recommendation: SystemRecommendation
  finance_decision: FinanceDecision
  finance_comment: str | None
  approved_by: UUID | None
  approved_at: datetime | None
  created_at: datetime
  items: list[PurchaseOrderItemRead]

  class Config:
    from_attributes = True


class FinanceDecisionRequest(BaseModel):
  decision: FinanceDecision
  comment: str | None = None

