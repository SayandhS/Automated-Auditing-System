"""LLM structurer: converts raw OCR text into structured JSON via Ollama.

Each document type has a prompt tailored to produce JSON that maps exactly
to the corresponding database models in the main backend.
"""

import json
import ollama


# ---------------------------------------------------------------------------
# Per-document-type prompts (JSON schemas match the backend DB models)
# ---------------------------------------------------------------------------

INVOICE_PROMPT = """\
You are a document data extraction API.
Return ONLY valid JSON. No explanation, no markdown.

Extract invoice data from the following text and return JSON with this exact schema:

{{
  "invoice_number": string,
  "vendor_name": string,
  "currency": string (e.g. "INR", "USD"),
  "subtotal": number,
  "gst_total": number,
  "discount": number (0 if none),
  "grand_total": number,
  "items": [
    {{
      "product_name": string,
      "quantity": number,
      "unit_price": number,
      "gst_percent": number,
      "line_total": number
    }}
  ]
}}

If a value is missing, use reasonable defaults (0 for numbers, "" for strings).
All numeric values must be numbers without currency symbols.

Document text:
{ocr_text}
"""

QUOTATION_PROMPT = """\
You are a document data extraction API.
Return ONLY valid JSON. No explanation, no markdown.

Extract vendor quotation data from the following text and return JSON with this exact schema:

{{
  "vendor_name": string,
  "currency": string (e.g. "INR", "USD"),
  "subtotal": number,
  "gst_total": number,
  "discount": number (0 if none),
  "grand_total": number,
  "items": [
    {{
      "product_name": string,
      "quantity": number,
      "unit_price": number,
      "gst_percent": number,
      "line_total": number
    }}
  ]
}}

If a value is missing, use reasonable defaults (0 for numbers, "" for strings).
All numeric values must be numbers without currency symbols.

Document text:
{ocr_text}
"""

PURCHASE_ORDER_PROMPT = """\
You are a document data extraction API.
Return ONLY valid JSON. No explanation, no markdown.

Extract purchase order data from the following text and return JSON with this exact schema:

{{
  "currency": string (e.g. "INR", "USD"),
  "subtotal": number,
  "gst_total": number,
  "discount": number (0 if none),
  "grand_total": number,
  "items": [
    {{
      "product_name": string,
      "quantity": number,
      "unit_price": number,
      "gst_percent": number,
      "line_total": number
    }}
  ]
}}

If a value is missing, use reasonable defaults (0 for numbers, "" for strings).
All numeric values must be numbers without currency symbols.

Document text:
{ocr_text}
"""

GRN_PROMPT = """\
You are a document data extraction API.
Return ONLY valid JSON. No explanation, no markdown.

Extract Goods Received Note (GRN) data from the following text and return JSON with this exact schema:

{{
  "grn_number": string,
  "items": [
    {{
      "product_name": string,
      "quantity_received": number
    }}
  ]
}}

If a value is missing, use reasonable defaults (0 for numbers, "" for strings).
All numeric values must be numbers without currency symbols.

Document text:
{ocr_text}
"""

PROMPTS = {
    "invoice": INVOICE_PROMPT,
    "quotation": QUOTATION_PROMPT,
    "purchase_order": PURCHASE_ORDER_PROMPT,
    "grn": GRN_PROMPT,
}


def structure_text(ocr_text: str, doc_type: str, ollama_model: str = "llama3:8b") -> dict:
    """Send raw OCR text to Ollama and return structured JSON.

    Args:
        ocr_text: Raw text extracted by the OCR engine.
        doc_type: One of 'invoice', 'quotation', 'purchase_order', 'grn'.
        ollama_model: Ollama model name to use.

    Returns:
        Parsed dict matching the document-type schema.

    Raises:
        ValueError: If doc_type is unknown.
        json.JSONDecodeError: If Ollama returns invalid JSON.
    """
    prompt_template = PROMPTS.get(doc_type)
    if prompt_template is None:
        raise ValueError(f"Unknown doc_type '{doc_type}'. Must be one of: {list(PROMPTS.keys())}")

    prompt = prompt_template.format(ocr_text=ocr_text)

    import time
    print(f"[LLM] Sending to Ollama ({ollama_model}) for {doc_type} structuring...")
    start_time = time.time()

    response = ollama.chat(
        model=ollama_model,
        messages=[{"role": "user", "content": prompt}],
        format="json",
        options={"temperature": 0},
    )

    elapsed = time.time() - start_time
    raw_content = response["message"]["content"]
    print(f"[LLM] Ollama response received in {elapsed:.1f}s — {len(raw_content)} chars")

    parsed = json.loads(raw_content)
    print(f"[LLM] JSON parsed successfully — {len(parsed.get('items', []))} items found")
    return parsed
