"""OCR Microservice — FastAPI application.

Exposes POST /ocr/extract that accepts a document image and doc_type,
runs OCR + LLM structuring, and returns JSON matching the backend DB schemas.

Set MOCK_MODE=true to skip ML models and return sample data for dev/testing.
"""

import os
import logging
from contextlib import asynccontextmanager
from io import BytesIO
from enum import Enum

from fastapi import FastAPI, File, Query, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

logger = logging.getLogger("ocr_service")

# ---------------------------------------------------------------------------
# Configuration via env vars
# ---------------------------------------------------------------------------
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() in ("true", "1", "yes")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:8b")


class DocType(str, Enum):
    invoice = "invoice"
    quotation = "quotation"
    purchase_order = "purchase_order"
    grn = "grn"


# ---------------------------------------------------------------------------
# Lifespan: load the OCR model once at startup (unless in mock mode)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    if MOCK_MODE:
        logger.info("Running in MOCK MODE — ML models will NOT be loaded.")
    else:
        logger.info("Loading LightOnOCR model...")
        from ocr_engine import engine
        engine.load()
        logger.info("LightOnOCR model loaded successfully.")
    yield


app = FastAPI(
    title="OCR Extraction Service",
    description="Extracts structured data from scanned procurement documents.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "mock_mode": MOCK_MODE}


@app.post("/ocr/extract")
async def extract_document(
    file: UploadFile = File(..., description="Scanned document image (JPEG, PNG, etc.)"),
    doc_type: DocType = Query(..., description="Type of document being scanned"),
):
    """Extract structured data from a scanned document image.

    1. Runs LightOnOCR to get raw text from the image.
    2. Sends the raw text to Ollama (Llama3) with a document-type-specific
       prompt to produce structured JSON.
    3. Returns the structured JSON matching the backend DB schema.

    In MOCK_MODE, skips steps 1-2 and returns sample data.
    """
    # --- Mock mode ---
    if MOCK_MODE:
        from mock_data import get_mock_extraction
        return {
            "doc_type": doc_type.value,
            "mock": True,
            "data": get_mock_extraction(doc_type.value),
        }

    # --- Real extraction ---
    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"File must be an image. Got content_type='{content_type}'",
        )

    import time
    total_start = time.time()
    print(f"\n{'='*60}")
    print(f"[REQUEST] Processing {doc_type.value} document: {file.filename}")
    print(f"{'='*60}")

    try:
        image_bytes = await file.read()
        image = Image.open(BytesIO(image_bytes))
        print(f"[REQUEST] Image loaded: {image.size[0]}x{image.size[1]} pixels")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not open image: {exc}")

    # Step 1: OCR
    from ocr_engine import engine
    try:
        raw_text = engine.extract_text(image)
        print(f"[REQUEST] Step 1/2 complete — OCR text extracted")
    except Exception as exc:
        logger.exception("OCR extraction failed")
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {exc}")

    # Step 2: LLM structuring
    from llm_structurer import structure_text
    try:
        structured = structure_text(raw_text, doc_type.value, ollama_model=OLLAMA_MODEL)
        print(f"[REQUEST] Step 2/2 complete — Data structured")
    except Exception as exc:
        logger.exception("LLM structuring failed")
        raise HTTPException(
            status_code=500,
            detail=f"LLM structuring failed: {exc}. Raw OCR text: {raw_text[:500]}",
        )

    total_elapsed = time.time() - total_start
    print(f"[REQUEST] ✓ Done in {total_elapsed:.1f}s total")
    print(f"{'='*60}\n")

    return {
        "doc_type": doc_type.value,
        "mock": False,
        "raw_text": raw_text,
        "data": structured,
    }
