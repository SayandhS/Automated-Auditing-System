from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FinanceDecisionCreate(BaseModel):
  system_recommendation: str
  human_decision: str
  comment: str | None = None


class FinanceDecisionRead(BaseModel):
  id: UUID
  transaction_id: UUID
  system_recommendation: str
  human_decision: str
  comment: str | None
  decided_by: UUID
  decided_at: datetime

  class Config:
    from_attributes = True

