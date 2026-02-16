from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, auth

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


@app.get("/")
async def root():
    return {"message": "FastAPI Modular Monolith API"}
