"""Purchase order evaluation business logic."""

from collections.abc import Sequence


def evaluate_purchase_order(po_items: Sequence, quotation_items: Sequence) -> dict:
  """Evaluate a purchase order against the selected quotation.

  Both sequences are expected to contain objects with:
  - product_name
  - quantity
  - unit_price
  - gst_percent
  """
  quotation_by_product = {
    q.product_name: q for q in quotation_items
  }

  risk_score = 0
  mismatch_details: list[dict] = []

  for po_item in po_items:
    q_item = quotation_by_product.get(po_item.product_name)
    if not q_item:
      # No matching quotation line: treat as full mismatch
      risk_score += 40 + 30 + 20
      mismatch_details.append(
        {
          "product_name": po_item.product_name,
          "unit_price_mismatch": True,
          "quantity_mismatch": True,
          "gst_mismatch": True,
        }
      )
      continue

    unit_price_mismatch = po_item.unit_price != q_item.unit_price
    quantity_mismatch = po_item.quantity != q_item.quantity
    gst_mismatch = po_item.gst_percent != q_item.gst_percent

    item_risk = 0
    if unit_price_mismatch:
      item_risk += 40
    if quantity_mismatch:
      item_risk += 30
    if gst_mismatch:
      item_risk += 20

    if item_risk:
      mismatch_details.append(
        {
          "product_name": po_item.product_name,
          "unit_price_mismatch": unit_price_mismatch,
          "quantity_mismatch": quantity_mismatch,
          "gst_mismatch": gst_mismatch,
        }
      )
      risk_score += item_risk

  # Determine recommendation from aggregate risk score
  if risk_score <= 20:
    recommendation = "APPROVE"
  elif risk_score <= 60:
    recommendation = "REVIEW"
  else:
    recommendation = "REJECT"

  return {
    "risk_score": int(risk_score),
    "recommendation": recommendation,
    "mismatch_details": mismatch_details,
  }

