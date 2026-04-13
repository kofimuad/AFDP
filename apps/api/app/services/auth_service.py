from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from fastapi import Depends, Header, HTTPException
from jose import JWTError, ExpiredSignatureError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.database import fetchrow

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict[str, Any]) -> str:
    """Create a signed JWT access token with role/email claims."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": data["sub"],
        "email": data["email"],
        "role": data["role"],
        "type": "access",
        "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a signed JWT refresh token."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": data["sub"],
        "type": "refresh",
        "exp": now + timedelta(days=settings.jwt_refresh_token_expire_days),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token, raising 401 on failure."""
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

async def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> dict[str, Any]:
    """Resolve the current active user from a Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token subject")

    user_row = await fetchrow(
        """
        SELECT id, email, full_name, role, vendor_id, is_active
        FROM users
        WHERE id = $1;
        """,
        UUID(str(sub)),
    )
    if not user_row:
        raise HTTPException(status_code=401, detail="User not found")
    if not user_row["is_active"]:
        raise HTTPException(status_code=401, detail="User is inactive")

    return {
        "id": str(user_row["id"]),
        "email": user_row["email"],
        "full_name": user_row["full_name"],
        "role": user_row["role"],
        "vendor_id": str(user_row["vendor_id"]) if user_row["vendor_id"] else None,
        "is_active": user_row["is_active"],
    }

async def require_vendor(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Require vendor or admin role for protected vendor operations."""
    if current_user["role"] not in {"vendor", "admin"}:
        raise HTTPException(status_code=403, detail="Vendor access required")
    return current_user

async def require_admin(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Require admin role for protected admin operations."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user