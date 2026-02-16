from pydantic import BaseModel

from app.models.user import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserMeResponse(BaseModel):
    id: str
    username: str
    role: str

    class Config:
        from_attributes = True


def user_to_me_response(user) -> UserMeResponse:
    return UserMeResponse(
        id=str(user.id),
        username=user.username,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
    )
