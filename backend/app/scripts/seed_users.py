"""Seed script to create initial users: admin, buyer1, finance1, inventory1."""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import User, UserRole


def seed_users() -> None:
    users_data = [
        {"username": "admin", "password": "admin123", "role": UserRole.ADMIN},
        {"username": "buyer1", "password": "buyer123", "role": UserRole.BUYER},
        {"username": "finance1", "password": "finance123", "role": UserRole.FINANCE_MANAGER},
        {"username": "inventory1", "password": "inventory123", "role": UserRole.INVENTORY_MANAGER},
    ]

    db: Session = SessionLocal()
    try:
        for data in users_data:
            existing = db.query(User).filter(User.username == data["username"]).first()
            if existing:
                print(f"User {data['username']} already exists, skipping.")
                continue
            user = User(
                username=data["username"],
                hashed_password=hash_password(data["password"]),
                role=data["role"],
            )
            db.add(user)
            print(f"Created user: {data['username']} ({data['role'].value})")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
    print("Seed complete.")
