"""HTTP client for calling the OCR microservice."""

import httpx

from app.core.config import settings


def call_ocr_service(file_bytes: bytes, filename: str, doc_type: str, engine="LOCAL", api_key=None) -> dict:
    """Send an image to the OCR microservice and return the structured data."""

    url = f"{settings.OCR_SERVICE_URL}/ocr/extract"

    with httpx.Client(timeout=600.0) as client:
        response = client.post(
            url,
            files={"file": (filename, file_bytes)},
            params={
                "doc_type": doc_type,
                "engine": engine,
                "api_key": api_key,
            },
        )

        response.raise_for_status()
        return response.json()  