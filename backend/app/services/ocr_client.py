"""HTTP client for calling the OCR microservice."""

import httpx

from app.core.config import settings


def call_ocr_service(file_bytes: bytes, filename: str, doc_type: str) -> dict:
    """Send an image to the OCR microservice and return the structured data.

    Args:
        file_bytes: Raw bytes of the uploaded image.
        filename: Original filename (used for Content-Type guessing).
        doc_type: One of 'invoice', 'quotation', 'purchase_order', 'grn'.

    Returns:
        The full response dict from the OCR service, containing:
        - doc_type: str
        - mock: bool
        - data: dict (structured extraction matching DB schema)
        - raw_text: str (only when mock=False)

    Raises:
        httpx.HTTPStatusError: If the OCR service returns a non-2xx status.
        httpx.ConnectError: If the OCR service is unreachable.
    """
    url = f"{settings.OCR_SERVICE_URL}/ocr/extract"

    with httpx.Client(timeout=600.0) as client:
        response = client.post(
            url,
            files={"file": (filename, file_bytes)},
            params={"doc_type": doc_type},
        )
        response.raise_for_status()
        return response.json()
