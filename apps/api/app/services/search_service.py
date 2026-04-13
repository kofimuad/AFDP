from __future__ import annotations

from typing import Any

from app.core.config import get_settings
from app.core.database import fetch, fetchrow
from app.core.redis import get_redis
from app.services.cache_service import get_cached_response, set_cached_response
from app.services.geo_service import fetch_vendors_within_radius


def build_search_cache_key(q: str, lat: float, lng: float, radius_km: float) -> str:
    """Build cache key for search payload with rounded coordinates."""

    return f"search:{q.strip().lower()}:{round(lat, 2)}:{round(lng, 2)}:{radius_km}"


async def find_best_food_match(q: str) -> dict[str, Any] | None:
    """Find the closest food match by case-insensitive fuzzy name search."""

    sql = """
        SELECT id, name, slug, description, image_url, created_at
        FROM foods
        WHERE name ILIKE $1
        ORDER BY CASE WHEN lower(name) = lower($2) THEN 0 ELSE 1 END, name
        LIMIT 1;
    """
    row = await fetchrow(sql, f"%{q}%", q)
    return dict(row) if row else None


async def find_ingredients_for_food(food_id: str) -> list[dict[str, Any]]:
    """Fetch ingredients linked to a food item."""

    sql = """
        SELECT i.id, i.name, i.slug, i.image_url
        FROM food_ingredients fi
        JOIN ingredients i ON i.id = fi.ingredient_id
        WHERE fi.food_id = $1
        ORDER BY i.name ASC;
    """
    rows = await fetch(sql, food_id)
    return [dict(row) for row in rows]


async def find_food_restaurants(food_id: str, lat: float, lng: float, radius_km: float, vendor_type: str | None) -> list[dict]:
    """Find restaurants offering a specific food within a radius."""

    where_sql = "v.id IN (SELECT vi.vendor_id FROM vendor_items vi WHERE vi.food_id = $4)"
    where_args: tuple[Any, ...] = (food_id,)

    if vendor_type:
        where_sql += " AND v.type = $5"
        where_args = (food_id, vendor_type)

    return await fetch_vendors_within_radius(where_sql, where_args, lat, lng, radius_km)


async def find_stores_for_ingredient(
    ingredient_id: str,
    lat: float,
    lng: float,
    radius_km: float,
    vendor_type: str | None,
) -> list[dict]:
    """Find stores carrying an ingredient within a radius."""

    where_sql = "v.id IN (SELECT vi.vendor_id FROM vendor_items vi WHERE vi.ingredient_id = $4)"
    where_args: tuple[Any, ...] = (ingredient_id,)

    if vendor_type:
        where_sql += " AND v.type = $5"
        where_args = (ingredient_id, vendor_type)

    return await fetch_vendors_within_radius(where_sql, where_args, lat, lng, radius_km)


async def find_matching_vendors_by_name(q: str, lat: float, lng: float, radius_km: float, vendor_type: str | None) -> list[dict]:
    """Backward-compatible fallback helper that now returns no matches."""

    return []


async def run_search(
    q: str,
    lat: float,
    lng: float,
    radius_km: float = 10,
    vendor_type: str | None = None,
) -> tuple[dict[str, Any], str]:
    """Execute the unified AFDP search workflow and return payload plus cache status."""

    settings = get_settings()
    cache_key = build_search_cache_key(q=q, lat=lat, lng=lng, radius_km=radius_km)

    cached = await get_cached_response(cache_key)
    if cached is not None:
        try:
            redis = get_redis()
            await redis.incr("stats:total_searches")
        except Exception:
            pass
        return cached, "HIT"

    food_match = await find_best_food_match(q)

    restaurants: list[dict[str, Any]] = []
    ingredients_payload: list[dict[str, Any]] = []

    if food_match:
        restaurants = await find_food_restaurants(
            food_id=str(food_match["id"]),
            lat=lat,
            lng=lng,
            radius_km=radius_km,
            vendor_type=vendor_type,
        )

        ingredients = await find_ingredients_for_food(str(food_match["id"]))
        for ingredient in ingredients:
            stores = await find_stores_for_ingredient(
                ingredient_id=str(ingredient["id"]),
                lat=lat,
                lng=lng,
                radius_km=radius_km,
                vendor_type=vendor_type,
            )
            ingredients_payload.append({"ingredient": ingredient, "stores": stores})
    response = {
        "food_match": food_match,
        "restaurants": restaurants,
        "ingredients": ingredients_payload,
        "preparation_guide": None,
    }

    await set_cached_response(cache_key, response, settings.search_cache_ttl_seconds)
    try:
        redis = get_redis()
        await redis.incr("stats:total_searches")
    except Exception:
        pass
    return response, "MISS"
