from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from app.core.database import fetch, fetchrow
from app.services.food_service import _row_to_food_summary
from app.services.vendor_service import _dedupe_vendors, _row_to_vendor_summary
from app.services.query_utils import bind_param


def _row_to_ingredient_summary(row: dict[str, Any]) -> dict[str, Any]:
    """Convert an ingredient row into a summary payload."""

    return {
        "id": row["id"],
        "name": row["name"],
        "slug": row["slug"],
        "image_url": row.get("image_url"),
    }


async def list_ingredients() -> list[dict[str, Any]]:
    """Return the full ingredient catalog."""

    rows = await fetch(
        """
        SELECT id, name, slug, image_url
        FROM ingredients
        ORDER BY name ASC;
        """
    )
    return [_row_to_ingredient_summary(dict(row)) for row in rows]


async def get_ingredient_detail(slug: str, lat: float | None = None, lng: float | None = None) -> dict[str, Any]:
    """Return an ingredient with nearby vendors that sell it."""

    if (lat is None) != (lng is None):
        raise HTTPException(status_code=422, detail="lat and lng must be provided together")

    ingredient = await fetchrow(
        """
        SELECT id, name, slug, image_url
        FROM ingredients
        WHERE slug = $1;
        """,
        slug,
    )
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    params: list[Any] = [ingredient["id"]]
    where_clauses = ["v.type = 'grocery_store'"]
    distance_select = ""
    order_sql = "ORDER BY v.created_at DESC"

    if lat is not None and lng is not None:
        lng_placeholder = bind_param(params, lng)
        lat_placeholder = bind_param(params, lat)
        distance_select = (
            f", ROUND((ST_Distance(v.location::geography, ST_SetSRID(ST_MakePoint({lng_placeholder}, {lat_placeholder}), 4326)::geography) / 1000)::numeric, 2) AS distance_km"
        )
        order_sql = "ORDER BY distance_km ASC, v.created_at DESC"

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
        JOIN vendor_items vi ON vi.vendor_id = v.id
        WHERE vi.ingredient_id = $1
          AND {' AND '.join(where_clauses)}
        {order_sql};
    """
    rows = await fetch(sql, *params)

    return {
        **_row_to_ingredient_summary(dict(ingredient)),
        "stores": [_row_to_vendor_summary(row) for row in _dedupe_vendors([dict(row) for row in rows])],
    }
