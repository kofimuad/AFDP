from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException

from app.core.database import fetch, fetchrow
from app.services.vendor_service import _dedupe_vendors, _row_to_vendor_summary
from app.services.query_utils import bind_param


def _row_to_food_summary(row: dict[str, Any]) -> dict[str, Any]:
    """Convert a food row into a summary payload."""

    return {
        "id": row["id"],
        "name": row["name"],
        "slug": row["slug"],
        "description": row.get("description"),
        "image_url": row.get("image_url"),
        "created_at": row.get("created_at"),
    }


async def list_foods(region: str | None = None) -> list[dict[str, Any]]:
    """Return all foods, optionally restricted to a named region."""

    if region:
        rows = await fetch(
            """
            SELECT f.id, f.name, f.slug, f.description, f.image_url, f.created_at
            FROM foods f
            WHERE EXISTS (
                SELECT 1
                FROM food_regions fr
                JOIN regions r ON r.id = fr.region_id
                WHERE fr.food_id = f.id AND r.name ILIKE $1
            )
            ORDER BY f.name ASC;
            """,
            region,
        )
    else:
        rows = await fetch(
            """
            SELECT id, name, slug, description, image_url, created_at
            FROM foods
            ORDER BY name ASC;
            """
        )

    return [_row_to_food_summary(dict(row)) for row in rows]


async def get_food_detail(slug: str, lat: float | None = None, lng: float | None = None) -> dict[str, Any]:
    """Return a food with ingredients and nearby vendors that serve it."""

    if (lat is None) != (lng is None):
        raise HTTPException(status_code=422, detail="lat and lng must be provided together")

    food = await fetchrow(
        """
        SELECT id, name, slug, description, image_url, created_at
        FROM foods
        WHERE slug = $1;
        """,
        slug,
    )
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    ingredients = await fetch(
        """
        SELECT
            i.id,
            i.name,
            i.slug,
            i.image_url,
            fi.quantity_note
        FROM food_ingredients fi
        JOIN ingredients i ON i.id = fi.ingredient_id
        WHERE fi.food_id = $1
        ORDER BY i.name ASC;
        """,
        food["id"],
    )

    restaurants = await _fetch_vendors_for_food(food_id=food["id"], relation="food", vendor_type="restaurant", lat=lat, lng=lng)
    stores = await _fetch_vendors_for_food(food_id=food["id"], relation="ingredient", vendor_type="grocery_store", lat=lat, lng=lng)

    return {
        **_row_to_food_summary(dict(food)),
        "ingredients": [
            {
                "ingredient": {
                    "id": row["id"],
                    "name": row["name"],
                    "slug": row["slug"],
                    "image_url": row.get("image_url"),
                },
                "quantity_note": row.get("quantity_note"),
            }
            for row in ingredients
        ],
        "restaurants": restaurants,
        "stores": stores,
    }


async def _fetch_vendors_for_food(
    *,
    food_id: UUID,
    relation: str,
    vendor_type: str,
    lat: float | None,
    lng: float | None,
) -> list[dict[str, Any]]:
    """Return vendors related to a food item, optionally with distance calculations."""

    params: list[Any] = [food_id]
    where_clauses = [f"v.type = {bind_param(params, vendor_type)}"]
    distance_select = ""
    order_sql = "ORDER BY v.created_at DESC"

    if lat is not None and lng is not None:
        lng_placeholder = bind_param(params, lng)
        lat_placeholder = bind_param(params, lat)
        distance_select = (
            f", ROUND((ST_Distance(v.location::geography, ST_SetSRID(ST_MakePoint({lng_placeholder}, {lat_placeholder}), 4326)::geography) / 1000)::numeric, 2) AS distance_km"
        )
        order_sql = "ORDER BY distance_km ASC, v.created_at DESC"

    if relation == "food":
        join_sql = "JOIN vendor_items vi ON vi.vendor_id = v.id AND vi.food_id = $1"
    else:
        join_sql = "JOIN vendor_items vi ON vi.vendor_id = v.id JOIN food_ingredients fi ON fi.ingredient_id = vi.ingredient_id AND fi.food_id = $1"

    sql = f"""
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
            {distance_select}
        FROM vendors v
        {join_sql}
        WHERE {' AND '.join(where_clauses)}
        {order_sql};
    """
    rows = await fetch(sql, *params)
    return [_row_to_vendor_summary(row) for row in _dedupe_vendors([dict(row) for row in rows])]
