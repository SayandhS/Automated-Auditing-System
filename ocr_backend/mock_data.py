"""Mock/fallback data for development without ML models.

Returns realistic sample data matching the DB schemas so the full
upload → save → view pipeline can be tested without GPU or Ollama.
"""


MOCK_INVOICE = {
    "invoice_number": "INV-2026-0042",
    "vendor_name": "Acme Supplies Pvt Ltd",
    "currency": "INR",
    "subtotal": 45000.00,
    "gst_total": 8100.00,
    "discount": 2000.00,
    "grand_total": 51100.00,
    "items": [
        {
            "product_name": "A4 Printer Paper (500 sheets)",
            "quantity": 100,
            "unit_price": 250.00,
            "gst_percent": 18.00,
            "line_total": 29500.00,
        },
        {
            "product_name": "Black Ink Cartridge",
            "quantity": 20,
            "unit_price": 800.00,
            "gst_percent": 18.00,
            "line_total": 18880.00,
        },
        {
            "product_name": "Stapler Heavy Duty",
            "quantity": 5,
            "unit_price": 350.00,
            "gst_percent": 12.00,
            "line_total": 1960.00,
        },
    ],
}

MOCK_QUOTATION = {
    "vendor_name": "Acme Supplies Pvt Ltd",
    "currency": "INR",
    "subtotal": 45000.00,
    "gst_total": 8100.00,
    "discount": 2000.00,
    "grand_total": 51100.00,
    "items": [
        {
            "product_name": "A4 Printer Paper (500 sheets)",
            "quantity": 100,
            "unit_price": 250.00,
            "gst_percent": 18.00,
            "line_total": 29500.00,
        },
        {
            "product_name": "Black Ink Cartridge",
            "quantity": 20,
            "unit_price": 800.00,
            "gst_percent": 18.00,
            "line_total": 18880.00,
        },
    ],
}

MOCK_PURCHASE_ORDER = {
    "currency": "INR",
    "subtotal": 45000.00,
    "gst_total": 8100.00,
    "discount": 2000.00,
    "grand_total": 51100.00,
    "items": [
        {
            "product_name": "A4 Printer Paper (500 sheets)",
            "quantity": 100,
            "unit_price": 250.00,
            "gst_percent": 18.00,
            "line_total": 29500.00,
        },
        {
            "product_name": "Black Ink Cartridge",
            "quantity": 20,
            "unit_price": 800.00,
            "gst_percent": 18.00,
            "line_total": 18880.00,
        },
    ],
}

MOCK_GRN = {
    "grn_number": "GRN-2026-0018",
    "items": [
        {
            "product_name": "A4 Printer Paper (500 sheets)",
            "quantity_received": 100,
        },
        {
            "product_name": "Black Ink Cartridge",
            "quantity_received": 20,
        },
        {
            "product_name": "Stapler Heavy Duty",
            "quantity_received": 5,
        },
    ],
}

MOCK_DATA = {
    "invoice": MOCK_INVOICE,
    "quotation": MOCK_QUOTATION,
    "purchase_order": MOCK_PURCHASE_ORDER,
    "grn": MOCK_GRN,
}


def get_mock_extraction(doc_type: str) -> dict:
    """Return mock extracted data for the given document type.

    Args:
        doc_type: One of 'invoice', 'quotation', 'purchase_order', 'grn'.

    Returns:
        Dict matching the document-type schema.

    Raises:
        ValueError: If doc_type is unknown.
    """
    data = MOCK_DATA.get(doc_type)
    if data is None:
        raise ValueError(f"Unknown doc_type '{doc_type}'. Must be one of: {list(MOCK_DATA.keys())}")
    # Return a deep copy to prevent mutation
    import copy
    return copy.deepcopy(data)
