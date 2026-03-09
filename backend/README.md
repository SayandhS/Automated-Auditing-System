# FastAPI Modular Monolith Backend

## Setup

1. Create virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   copy .env.example .env
   ```

4. Ensure PostgreSQL is running and create the database if needed.

## Run

From the `backend` directory:

```bash
python run.py
```

Or with uvicorn directly:
```bash
uvicorn app.main:app --reload
```

API will be available at http://127.0.0.1:8000

## Migrations

```bash
alembic upgrade head
```

## Seed Users

Creates initial users: admin, buyer1, finance1, inventory1 (passwords: admin123, buyer123, etc.)

```bash
python -m app.scripts.seed_users
```

## Procurement Transactions

**Endpoints:**
- `POST /transactions` – BUYER only. Creates new transaction (status=CREATED) and audit log.
- `GET /transactions` – BUYER sees own, ADMIN sees all.
- `GET /transactions/{id}` – Role-restricted (owner or ADMIN).
- `GET /transactions/{id}/audit-logs` – Audit logs for verification.

**Testing via Swagger:**
1. Login as buyer1 at `/auth/login`.
2. Authorize with the returned token.
3. `POST /transactions` with body `{"title": "Test purchase"}`.
4. Verify response: `status: "CREATED"`.
5. `GET /transactions/{id}/audit-logs` to confirm audit entry exists.
