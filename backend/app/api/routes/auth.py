from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.core.security import verify_password, create_access_token
from app.models import User, UserRole
from app.schemas.auth import LoginRequest, LoginResponse, UserMeResponse, user_to_me_response

router = APIRouter()


@router.post("/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT."""
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(subject=str(user.id), role=user.role.value)
    return LoginResponse(access_token=token, role=user.role.value)


@router.get("/auth/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return current authenticated user."""
    return user_to_me_response(current_user)


@router.get("/auth/admin-only")
def admin_only(current_user: User = Depends(require_roles(UserRole.ADMIN))):
    """Example: Admin-only endpoint protected by role guard."""
    return {"message": f"Hello admin {current_user.username}"}
