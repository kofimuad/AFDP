"""JWT authentication router for user and vendor account flows."""

from __future__ import annotations

from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import fetchrow
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserRegisterRequest,
    UserResponse,
    VendorRegisterRequest,
)
from app.schemas.vendor import VendorRegisterIn
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.services.vendor_service import register_vendor

router = APIRouter(prefix="/auth", tags=["Auth"])

async def _get_user_by_email(email: str) -> asyncpg.Record | None:
    return await fetchrow(
        """
        SELECT id, email, full_name, hashed_password, role, vendor_id, is_active
        FROM users
        WHERE email = $1;
        """,
        email.lower(),
    )

def _to_user_response(row: asyncpg.Record) -> UserResponse:
    return UserResponse(
        id=str(row["id"]),
        email=row["email"],
        full_name=row["full_name"],
        role=row["role"],
        vendor_id=str(row["vendor_id"]) if row["vendor_id"] else None,
    )

@router.post("/register", response_model=TokenResponse)
async def register_user(payload: UserRegisterRequest) -> TokenResponse:
    existing = await _get_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    user = await fetchrow(
        """
        INSERT INTO users (email, full_name, hashed_password, role, is_active)
        VALUES ($1, $2, $3, 'user', true)
        RETURNING id, email, full_name, role, vendor_id;
        """,
        payload.email.lower(),
        payload.full_name.strip(),
        hash_password(payload.password),
    )
    assert user is not None

    access = create_access_token({"sub": str(user["id"]), "email": user["email"], "role": user["role"]})
    refresh = create_refresh_token({"sub": str(user["id"])})
    return TokenResponse(access_token=access, refresh_token=refresh, user=_to_user_response(user))

@router.post("/vendor-register", response_model=TokenResponse)
async def register_vendor_user(payload: VendorRegisterRequest) -> TokenResponse:
    existing = await _get_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    vendor = await register_vendor(
        VendorRegisterIn(
            name=payload.business_name,
            type=payload.business_type,
            address=payload.address,
            lat=payload.lat,
            lng=payload.lng,
            phone=payload.phone,
            website=payload.website,
            image_url=None,
        )
    )

    user = await fetchrow(
        """
        INSERT INTO users (email, full_name, hashed_password, role, vendor_id, is_active)
        VALUES ($1, $2, $3, 'vendor', $4::uuid, true)
        RETURNING id, email, full_name, role, vendor_id;
        """,
        payload.email.lower(),
        payload.full_name.strip(),
        hash_password(payload.password),
        UUID(vendor["id"]),
    )
    assert user is not None

    access = create_access_token({"sub": str(user["id"]), "email": user["email"], "role": user["role"]})
    refresh = create_refresh_token({"sub": str(user["id"])})
    return TokenResponse(access_token=access, refresh_token=refresh, user=_to_user_response(user))

@router.post("/login", response_model=TokenResponse)
async def login_user(payload: LoginRequest) -> TokenResponse:
    user = await _get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user["is_active"]:
        raise HTTPException(status_code=401, detail="Inactive account")

    access = create_access_token({"sub": str(user["id"]), "email": user["email"], "role": user["role"]})
    refresh = create_refresh_token({"sub": str(user["id"])})
    return TokenResponse(access_token=access, refresh_token=refresh, user=_to_user_response(user))

@router.post("/refresh")
async def refresh_token(payload: RefreshRequest) -> dict[str, str]:
    claims = decode_token(payload.refresh_token)
    if claims.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = await fetchrow(
        "SELECT id, email, role, is_active FROM users WHERE id = $1;",
        UUID(str(sub)),
    )
    if not user or not user["is_active"]:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access = create_access_token({"sub": str(user["id"]), "email": user["email"], "role": user["role"]})
    return {"access_token": access, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        vendor_id=current_user["vendor_id"],
    )

@router.post("/logout")
async def logout() -> dict[str, str]:
    return {"message": "logged out"}