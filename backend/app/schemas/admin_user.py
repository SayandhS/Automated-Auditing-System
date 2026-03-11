from uuid import UUID

from pydantic import BaseModel, Field

from app.models.user import UserRole


class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1)
    role: UserRole


class UserRead(BaseModel):
    id: UUID
    username: str
    role: UserRole

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: UserRole

