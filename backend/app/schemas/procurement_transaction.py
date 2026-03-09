from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProcurementTransactionCreate(BaseModel):
    title: str


class ProcurementTransactionRead(BaseModel):
    id: UUID
    title: str
    created_by_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
