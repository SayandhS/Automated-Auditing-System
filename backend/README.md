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
