"""Admin management service: user and vendor administration for JWT admin users."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException

from app.core.database import execute, fetch, fetchrow

ALLOWED_ROLES = {"user", "vendor", "admin"}
ALLOWED_PLANS = {"basic", "featured", "premium"}


async def list_users(
    *,
    q: str | None = None,
    role: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> list[dict[str, Any]]:
    """List users with optional search by email/name and role filter."""

    params: list[Any] = []
    clauses: list[str] = []
    if q:
        params.append(f"%{q.lower()}%")
        clauses.append(f"(LOWER(email) LIKE ${len(params)} OR LOWER(full_name) LIKE ${len(params)})")
    if role:
        if role not in ALLOWED_ROLES:
            raise HTTPException(status_code=422, detail="Invalid role filter")
        params.append(role)
        clauses.append(f"role = ${len(params)}")

    where = " AND ".join(clauses) if clauses else "TRUE"
    offset = max(page - 1, 0) * page_size
    params.append(page_size)
    params.append(offset)
    sql = f"""
        SELECT id, email, full_name, role, vendor_id, is_active, created_at, profile_image_url
        FROM users
        WHERE {where}
        ORDER BY created_at DESC
        LIMIT ${len(params) - 1} OFFSET ${len(params)};
    """
    rows = await fetch(sql, *params)
    return [
        {
            "id": str(r["id"]),
            "email": r["email"],
            "full_name": r["full_name"],
            "role": r["role"],
            "vendor_id": str(r["vendor_id"]) if r["vendor_id"] else None,
            "is_active": r["is_active"],
            "created_at": r["created_at"],
            "profile_image_url": r["profile_image_url"],
        }
        for r in rows
    ]


async def update_user_role(user_id: UUID, role: str) -> dict[str, Any]:
    """Update a user's role."""

    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=422, detail="Invalid role")
    row = await fetchrow(
        """
        UPDATE users SET role = $2 WHERE id = $1
        RETURNING id, email, full_name, role, vendor_id, is_active, created_at, profile_image_url;
        """,
        user_id,
        role,
    )
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "vendor_id": str(row["vendor_id"]) if row["vendor_id"] else None,
        "is_active": row["is_active"],
        "created_at": row["created_at"],
        "profile_image_url": row["profile_image_url"],
    }


async def set_user_active(user_id: UUID, is_active: bool) -> dict[str, Any]:
    """Activate or deactivate a user."""

    row = await fetchrow(
        """
        UPDATE users SET is_active = $2 WHERE id = $1
        RETURNING id, email, full_name, role, vendor_id, is_active, created_at, profile_image_url;
        """,
        user_id,
        is_active,
    )
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "vendor_id": str(row["vendor_id"]) if row["vendor_id"] else None,
        "is_active": row["is_active"],
        "created_at": row["created_at"],
        "profile_image_url": row["profile_image_url"],
    }


async def list_all_vendors(
    *,
    q: str | None = None,
    is_verified: bool | None = None,
    plan: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> list[dict[str, Any]]:
    """List all vendors with admin filters including plan."""

    params: list[Any] = []
    clauses: list[str] = []
    if q:
        params.append(f"%{q.lower()}%")
        clauses.append(f"(LOWER(name) LIKE ${len(params)} OR LOWER(address) LIKE ${len(params)})")
    if is_verified is not None:
        params.append(is_verified)
        clauses.append(f"is_verified = ${len(params)}")
    if plan:
        if plan not in ALLOWED_PLANS:
            raise HTTPException(status_code=422, detail="Invalid plan filter")
        params.append(plan)
        clauses.append(f"plan = ${len(params)}")

    where = " AND ".join(clauses) if clauses else "TRUE"
    offset = max(page - 1, 0) * page_size
    params.append(page_size)
    params.append(offset)
    sql = f"""
        SELECT
            id, name, slug, type, address,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            phone, website, image_url, is_verified, is_featured, created_at,
            plan, plan_expires_at
        FROM vendors
        WHERE {where}
        ORDER BY created_at DESC
        LIMIT ${len(params) - 1} OFFSET ${len(params)};
    """
    rows = await fetch(sql, *params)
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "slug": r["slug"],
            "type": r["type"],
            "address": r["address"],
            "lat": r["lat"],
            "lng": r["lng"],
            "phone": r["phone"],
            "website": r["website"],
            "image_url": r["image_url"],
            "is_verified": r["is_verified"],
            "is_featured": r["is_featured"],
            "created_at": r["created_at"],
            "plan": r["plan"],
            "plan_expires_at": r["plan_expires_at"],
        }
        for r in rows
    ]


async def update_vendor_plan(vendor_id: UUID, plan: str) -> dict[str, Any]:
    """Override a vendor's plan."""

    if plan not in ALLOWED_PLANS:
        raise HTTPException(status_code=422, detail="Invalid plan")
    row = await fetchrow(
        """
        UPDATE vendors SET plan = $2::vendor_plan WHERE id = $1
        RETURNING id, name, slug, plan, plan_expires_at;
        """,
        vendor_id,
        plan,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "slug": row["slug"],
        "plan": row["plan"],
        "plan_expires_at": row["plan_expires_at"],
    }
