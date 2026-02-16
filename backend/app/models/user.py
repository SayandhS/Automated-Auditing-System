import uuid
import enum
from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class UserRole(str, enum.Enum):
    BUYER = "BUYER"
    FINANCE_MANAGER = "FINANCE_MANAGER"
    INVENTORY_MANAGER = "INVENTORY_MANAGER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.BUYER)
