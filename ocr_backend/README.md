# OCR Microservice

Extracts structured data from scanned procurement documents using LightOnOCR + Ollama.

## Setup

1.  Create virtual environment:
    ```bash
    python -m venv venv
    venv\Scripts\activate  # Windows
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  Ensure **Ollama** is running with the `llama3:8b` model pulled:
    ```bash
    ollama pull llama3:8b
    ```

## Run

```bash
uvicorn main:app --reload --port 8001
```

The service will be available at http://127.0.0.1:8001  
Swagger docs: http://127.0.0.1:8001/docs

## Mock Mode (No GPU / No Models)

Run without ML models by setting `MOCK_MODE=true`:

```bash
set MOCK_MODE=true          # Windows
uvicorn main:app --reload --port 8001
```

This returns realistic sample data for all document types, so the full upload → save → view pipeline can be tested.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MOCK_MODE` | `false` | Set to `true` to skip ML models |
| `OLLAMA_MODEL` | `llama3:8b` | Ollama model name for structuring |

## API

**`POST /ocr/extract`**
- **Body**: multipart file upload (`file` field) — JPEG/PNG image.
- **Query param**: `doc_type` — one of `invoice`, `quotation`, `purchase_order`, `grn`.
- **Returns**: JSON with `doc_type`, `mock` flag, and `data` matching the backend DB schema.
