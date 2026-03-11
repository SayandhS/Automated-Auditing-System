from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
  health,
  auth,
  transactions,
  quotations,
  purchase_orders,
  reconciliation,
  finance_decisions,
  admin_users,
  ocr_upload,
)

app = FastAPI(
    title="FastAPI Modular Monolith",
    description="Backend API with modular monolith structure",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(auth.router, tags=["auth"])
app.include_router(transactions.router, tags=["transactions"])
app.include_router(quotations.router, tags=["quotations"])
app.include_router(purchase_orders.router, tags=["purchase_orders"])
app.include_router(reconciliation.router, tags=["reconciliation"])
app.include_router(finance_decisions.router, tags=["finance_decisions"])
app.include_router(admin_users.router, tags=["admin"])
app.include_router(ocr_upload.router, tags=["ocr_upload"])


@app.get("/")
async def root():
    return {"message": "FastAPI Modular Monolith API"}
