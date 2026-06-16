"""Per-user shopping list built from recipe ingredients, plus the
store-coverage ranking that finds where to buy the most items in fewest trips.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException

from app.core.database import execute, fetch, fetchrow
from app.services.geo_service import meters_from_km
from app.services.vendor_service import _row_to_vendor_summary

_STORE_LIMIT = 8


def _row_to_list_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "ingredient": {
            "id": row["ingredient_id"],
            "name": row["ingredient_name"],
            "slug": row["ingredient_slug"],
            "image_url": row.get("ingredient_image_url"),
        },
        "quantity_note": row.get("quantity_note"),
        "checked": row["checked"],
        "source_food_name": row.get("source_food_name"),
        "source_food_slug": row.get("source_food_slug"),
    }


async def add_recipe_to_list(user_id: UUID, food_slug: str) -> dict[str, Any]:
    """Add every ingredient of a recipe to the user's list (deduped, idempotent)."""

    food = await fetchrow("SELECT id, name, slug FROM foods WHERE slug = $1;", food_slug)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    # ON CONFLICT DO NOTHING keeps existing items (and their checked state); the
    # RETURNING rows are exactly the newly-added ingredients.
    inserted = await fetch(
        """
        INSERT INTO shopping_list_items (user_id, ingredient_id, quantity_note, source_food_id)
        SELECT $1, fi.ingredient_id, fi.quantity_note, $2
        FROM food_ingredients fi
        WHERE fi.food_id = $2
        ON CONFLICT (user_id, ingredient_id) DO NOTHING
        RETURNING id;
        """,
        user_id,
        food["id"],
    )

    total = await fetchrow(
        "SELECT COUNT(*) AS n FROM shopping_list_items WHERE user_id = $1;", user_id
    )
    return {
        "food_slug": food["slug"],
        "food_name": food["name"],
        "added": len(inserted),
        "total": total["n"],
    }


async def get_shopping_list(user_id: UUID) -> dict[str, Any]:
    """Return the user's list, unchecked first, with recipe provenance."""

    rows = await fetch(
        """
        SELECT
            s.id, s.quantity_note, s.checked,
            i.id AS ingredient_id, i.name AS ingredient_name,
            i.slug AS ingredient_slug, i.image_url AS ingredient_image_url,
            f.name AS source_food_name, f.slug AS source_food_slug
        FROM shopping_list_items s
        JOIN ingredients i ON i.id = s.ingredient_id
        LEFT JOIN foods f ON f.id = s.source_food_id
        WHERE s.user_id = $1
        ORDER BY s.checked ASC, i.name ASC;
        """,
        user_id,
    )
    items = [_row_to_list_item(dict(r)) for r in rows]
    return {
        "items": items,
        "total": len(items),
        "checked_count": sum(1 for it in items if it["checked"]),
    }


async def set_item_checked(user_id: UUID, item_id: UUID, checked: bool) -> dict[str, Any]:
    """Toggle an item's checked state (own items only)."""

    row = await fetchrow(
        """
        WITH upd AS (
            UPDATE shopping_list_items
            SET checked = $3
            WHERE id = $1 AND user_id = $2
            RETURNING id, ingredient_id, quantity_note, checked, source_food_id
        )
        SELECT
            upd.id, upd.quantity_note, upd.checked,
            i.id AS ingredient_id, i.name AS ingredient_name,
            i.slug AS ingredient_slug, i.image_url AS ingredient_image_url,
            f.name AS source_food_name, f.slug AS source_food_slug
        FROM upd
        JOIN ingredients i ON i.id = upd.ingredient_id
        LEFT JOIN foods f ON f.id = upd.source_food_id;
        """,
        item_id,
        user_id,
        checked,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Shopping list item not found")
    return _row_to_list_item(dict(row))


async def remove_item(user_id: UUID, item_id: UUID) -> None:
    """Remove a single item (own items only)."""

    result = await execute(
        "DELETE FROM shopping_list_items WHERE id = $1 AND user_id = $2;", item_id, user_id
    )
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Shopping list item not found")


async def clear_list(user_id: UUID) -> None:
    """Empty the user's shopping list."""

    await execute("DELETE FROM shopping_list_items WHERE user_id = $1;", user_id)


async def best_stores_for_list(
    user_id: UUID, lat: float, lng: float, radius_km: float
) -> list[dict[str, Any]]:
    """Stores ranked by how many list items they stock, then by proximity.

    This is the "fewest trips" answer: the store at the top covers the most of
    the user's shopping list and is closest among equally-covering stores.
    """

    total_row = await fetchrow(
        "SELECT COUNT(*) AS n FROM shopping_list_items WHERE user_id = $1;", user_id
    )
    total_items = total_row["n"]
    if total_items == 0:
        return []

    rows = await fetch(
        f"""
        WITH list AS (
            SELECT ingredient_id FROM shopping_list_items WHERE user_id = $4
        )
        SELECT
            v.id, v.name, v.slug, v.type, v.address,
            ST_Y(v.location::geometry) AS lat,
            ST_X(v.location::geometry) AS lng,
            v.phone, v.website, v.image_url, v.is_verified, v.is_featured,
            v.delivery_available, v.created_at,
            ROUND((ST_Distance(
                v.location::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) / 1000)::numeric, 2) AS distance_km,
            COUNT(DISTINCT vi.ingredient_id) AS items_covered,
            array_agg(DISTINCT vi.ingredient_id) AS covered_ingredient_ids
        FROM vendors v
        JOIN vendor_items vi
            ON vi.vendor_id = v.id
            AND vi.ingredient_id IN (SELECT ingredient_id FROM list)
        WHERE v.type = 'grocery_store'
            AND ST_DWithin(
                v.location::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
            )
        GROUP BY v.id
        ORDER BY items_covered DESC, distance_km ASC
        LIMIT {_STORE_LIMIT};
        """,
        lng,
        lat,
        meters_from_km(radius_km),
        user_id,
    )

    results: list[dict[str, Any]] = []
    for row in rows:
        d = dict(row)
        results.append(
            {
                "store": _row_to_vendor_summary(d),
                "items_covered": d["items_covered"],
                "total_items": total_items,
                "covered_ingredient_ids": list(d.get("covered_ingredient_ids") or []),
            }
        )
    return results
