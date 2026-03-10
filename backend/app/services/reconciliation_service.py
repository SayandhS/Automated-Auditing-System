"""Reconciliation skeleton for PO, Invoice, and GRN.

This is intentionally minimal and does not implement AI logic.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models import GRN, Invoice, PurchaseOrder


def compare_po_invoice_grn(transaction_id: UUID, db: Session) -> dict:
  """Retrieve PO, invoice, and GRN items and return a skeleton structure.

  Status is always 'PENDING_AI_VALIDATION' for now.
  """
  po = (
    db.query(PurchaseOrder)
    .filter(PurchaseOrder.transaction_id == transaction_id)
    .first()
  )
  invoices = (
    db.query(Invoice)
    .filter(Invoice.transaction_id == transaction_id)
    .all()
  )
  grns = (
    db.query(GRN)
    .filter(GRN.transaction_id == transaction_id)
    .all()
  )

  def serialize_items(items):
    return [
      {
        "product_name": item.product_name,
        "quantity": getattr(item, "quantity", None) or getattr(item, "quantity_received", None),
        "unit_price": getattr(item, "unit_price", None),
        "gst_percent": getattr(item, "gst_percent", None),
        "line_total": getattr(item, "line_total", None),
      }
      for item in items
    ]

  po_items = serialize_items(po.items) if po else []
  invoice_items = serialize_items(
    [item for inv in invoices for item in inv.items]
  ) if invoices else []
  grn_items = serialize_items(
    [item for g in grns for item in g.items]
  ) if grns else []

  return {
    "status": "PENDING_AI_VALIDATION",
    "po_items": po_items,
    "invoice_items": invoice_items,
    "grn_items": grn_items,
  }

