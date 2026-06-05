"""JWT authentication router for user and vendor account flows."""

from __future__ import annotations

from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.database import execute, fetchrow
from app.services.cloudinary_service import upload_image
from app.schemas.auth import (
    LocationUpdateRequest,
    LoginRequest,
    PasswordChangeRequest,
    RefreshRequest,
    TokenResponse,
    UserRegisterRequest,
    UserResponse,
    UserUpdateRequest,
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

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024

async def _get_user_by_email(email: str) -> asyncpg.Record | None:
    return await fetchrow(
        """
        SELECT id, email, full_name, hashed_password, role, vendor_id, is_active, created_at
        FROM users
        WHERE email = $1;
        """,
        email.lower(),
    )

def _to_user_response(row: asyncpg.Record) -> UserResponse:
    """Convert a users row into the public UserResponse payload."""
    keys = row.keys()
    created_at = row["created_at"] if "created_at" in keys else None
    profile_image_url = row["profile_image_url"] if "profile_image_url" in keys else None
    pref_lat = row["pref_lat"] if "pref_lat" in keys else None
    pref_lng = row["pref_lng"] if "pref_lng" in keys else None
    return UserResponse(
        id=str(row["id"]),
        email=row["email"],
        full_name=row["full_name"],
        role=row["role"],
        vendor_id=str(row["vendor_id"]) if row["vendor_id"] else None,
        created_at=created_at,
        profile_image_url=profile_image_url,
        pref_lat=pref_lat,
        pref_lng=pref_lng,
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
        RETURNING id, email, full_name, role, vendor_id, created_at, profile_image_url, pref_lat, pref_lng;
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
        RETURNING id, email, full_name, role, vendor_id, created_at, profile_image_url, pref_lat, pref_lng;
        """,
        payload.email.lower(),
        payload.full_name.strip(),
        hash_password(payload.password),
        str(vendor["id"]),
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
    """Return the authenticated user's profile, including created_at and photo."""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        vendor_id=current_user["vendor_id"],
        created_at=current_user.get("created_at"),
        profile_image_url=current_user.get("profile_image_url"),
        pref_lat=current_user.get("pref_lat"),
        pref_lng=current_user.get("pref_lng"),
    )


@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Update the authenticated user's editable profile fields (full_name)."""
    if payload.full_name is None:
        return await me(current_user)

    updated = await fetchrow(
        """
        UPDATE users
        SET full_name = $1
        WHERE id = $2
        RETURNING id, email, full_name, role, vendor_id, created_at, profile_image_url, pref_lat, pref_lng;
        """,
        payload.full_name.strip(),
        UUID(current_user["id"]),
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_user_response(updated)

@router.post("/me/photo", response_model=UserResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Upload a profile photo for the authenticated user.

    Accepts JPEG, PNG, or WebP up to 5MB. Stores the file on disk and updates
    the user's profile_image_url to a relative URL served by the /uploads mount.
    """
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 5MB or smaller")

    try:
        url = await upload_image(
            contents,
            folder="afdp/profiles",
            public_id=current_user["id"],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Image upload failed") from exc

    updated = await fetchrow(
        """
        UPDATE users
        SET profile_image_url = $1
        WHERE id = $2
        RETURNING id, email, full_name, role, vendor_id, created_at, profile_image_url, pref_lat, pref_lng;
        """,
        url,
        UUID(current_user["id"]),
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_user_response(updated)


@router.post("/me/password")
async def change_password(
    payload: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user),
) -> dict[str, str]:
    """Change the authenticated user's password after verifying the current one."""
    row = await fetchrow(
        "SELECT hashed_password FROM users WHERE id = $1;",
        UUID(current_user["id"]),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(payload.current_password, row["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.new_password == payload.current_password:
        raise HTTPException(status_code=400, detail="New password must be different")

    await execute(
        "UPDATE users SET hashed_password = $1 WHERE id = $2;",
        hash_password(payload.new_password),
        UUID(current_user["id"]),
    )
    return {"message": "Password updated"}


@router.put("/me/location", response_model=UserResponse)
async def set_location(
    payload: LocationUpdateRequest,
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Save the authenticated user's default location for proximity searches."""
    updated = await fetchrow(
        """
        UPDATE users
        SET pref_lat = $1, pref_lng = $2
        WHERE id = $3
        RETURNING id, email, full_name, role, vendor_id, created_at, profile_image_url, pref_lat, pref_lng;
        """,
        payload.lat,
        payload.lng,
        UUID(current_user["id"]),
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_user_response(updated)


@router.delete("/me/location", response_model=UserResponse)
async def clear_location(
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Clear the authenticated user's saved default location."""
    updated = await fetchrow(
        """
        UPDATE users
        SET pref_lat = NULL, pref_lng = NULL
        WHERE id = $1
        RETURNING id, email, full_name, role, vendor_id, created_at, profile_image_url, pref_lat, pref_lng;
        """,
        UUID(current_user["id"]),
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_user_response(updated)


@router.post("/logout")
async def logout() -> dict[str, str]:
    return {"message": "logged out"}