import os
import json
from PIL import Image
import google.generativeai as genai
from io import BytesIO

GEMINI_MODEL = "gemini-2.5-flash"


def extract_text_api(image_bytes: bytes, doc_type: str, api_key: str | None = None):
    """
    Uses Gemini Vision model to extract structured data from an image.
    """

    # Configure API key
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("Gemini API key not provided")

    genai.configure(api_key=key)

    model = genai.GenerativeModel(GEMINI_MODEL)

    image = Image.open(BytesIO(image_bytes))

    prompt = f"""
You are an OCR extraction system.

Extract structured data from this {doc_type} document.

Return ONLY valid JSON.

Structure must follow this schema:

For invoices / quotations:
{{
  "vendor_name": "",
  "invoice_number": "",
  "currency": "",
  "subtotal": 0,
  "gst_total": 0,
  "discount": 0,
  "grand_total": 0,
  "items": [
    {{
      "product_name": "",
      "quantity": 0,
      "unit_price": 0,
      "gst_percent": 0,
      "line_total": 0
    }}
  ]
}}

For GRN:
{{
  "grn_number": "",
  "items": [
    {{
      "product_name": "",
      "quantity_received": 0
    }}
  ]
}}
"""

    response = model.generate_content([prompt, image])

    text = response.text.strip()

    # Remove markdown formatting if Gemini returns ```json
    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    return json.loads(text)