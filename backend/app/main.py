from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, auth, transactions, quotations

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


@app.get("/")
async def root():
    return {"message": "FastAPI Modular Monolith API"}
