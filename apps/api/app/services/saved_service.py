"""Service layer for per-user saved collections (M6 SCRUM-37)."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException

from app.core.database import execute, fetch, fetchrow


async def _food_id_by_slug(slug: str) -> UUID:
    row = await fetchrow("SELECT id FROM foods WHERE slug = $1;", slug)
    if not row:
        raise HTTPException(status_code=404, detail="Food not found")
    return row["id"]


async def _vendor_id_by_slug(slug: str) -> UUID:
    row = await fetchrow("SELECT id FROM vendors WHERE slug = $1;", slug)
    if not row:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return row["id"]


async def get_saved_collection(user_id: UUID) -> dict[str, Any]:
    """Return the user's saved dishes and places, newest first."""

    food_rows = await fetch(
        """
        SELECT f.id, f.name, f.slug, f.description, f.image_url, f.created_at
        FROM saved_items s
        JOIN foods f ON f.id = s.food_id
        WHERE s.user_id = $1 AND s.item_type = 'food'
        ORDER BY s.created_at DESC;
        """,
        user_id,
    )

    vendor_rows = await fetch(
        """
        SELECT
            v.id,
            v.name,
            v.slug,
            v.type,
            v.address,
            ST_Y(v.location::geometry) AS lat,
            ST_X(v.location::geometry) AS lng,
            v.phone,
            v.website,
            v.image_url,
            v.is_verified,
            v.is_featured,
            v.created_at
        FROM saved_items s
        JOIN vendors v ON v.id = s.vendor_id
        WHERE s.user_id = $1 AND s.item_type = 'vendor'
        ORDER BY s.created_at DESC;
        """,
        user_id,
    )

    return {
        "foods": [dict(row) for row in food_rows],
        "vendors": [dict(row) for row in vendor_rows],
    }


async def save_food(user_id: UUID, slug: str) -> UUID:
    """Save a dish for the user. Idempotent — saving twice is a no-op."""

    food_id = await _food_id_by_slug(slug)
    await execute(
        """
        INSERT INTO saved_items (user_id, item_type, food_id)
        VALUES ($1, 'food', $2)
        ON CONFLICT (user_id, food_id) WHERE food_id IS NOT NULL DO NOTHING;
        """,
        user_id,
        food_id,
    )
    return food_id


async def unsave_food(user_id: UUID, slug: str) -> UUID:
    """Remove a saved dish for the user. Idempotent."""

    food_id = await _food_id_by_slug(slug)
    await execute(
        "DELETE FROM saved_items WHERE user_id = $1 AND food_id = $2;",
        user_id,
        food_id,
    )
    return food_id


async def save_vendor(user_id: UUID, slug: str) -> UUID:
    """Save a place (vendor) for the user. Idempotent."""

    vendor_id = await _vendor_id_by_slug(slug)
    await execute(
        """
        INSERT INTO saved_items (user_id, item_type, vendor_id)
        VALUES ($1, 'vendor', $2)
        ON CONFLICT (user_id, vendor_id) WHERE vendor_id IS NOT NULL DO NOTHING;
        """,
        user_id,
        vendor_id,
    )
    return vendor_id


async def unsave_vendor(user_id: UUID, slug: str) -> UUID:
    """Remove a saved place for the user. Idempotent."""

    vendor_id = await _vendor_id_by_slug(slug)
    await execute(
        "DELETE FROM saved_items WHERE user_id = $1 AND vendor_id = $2;",
        user_id,
        vendor_id,
    )
    return vendor_id
