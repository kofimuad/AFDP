from __future__ import annotations

from typing import Any

from app.core.config import get_settings
from app.core.database import fetch, fetchrow
from app.core.redis import get_redis
from app.services.cache_service import get_cached_response, set_cached_response
from app.services.geo_service import fetch_vendors_within_radius

# When a radius-bounded search returns nothing, we widen to a global radius
# (20,000 km covers the whole planet) and cap the result set so users in
# under-covered regions still see the nearest matches rather than an empty page.
_GLOBAL_FALLBACK_RADIUS_KM = 20_000.0
_GLOBAL_FALLBACK_LIMIT = 10


def build_search_cache_key(q: str, lat: float, lng: float, radius_km: float) -> str:
    """Build cache key for search payload with rounded coordinates."""

    return f"search:{q.strip().lower()}:{round(lat, 2)}:{round(lng, 2)}:{radius_km}"


async def find_best_food_match(q: str) -> dict[str, Any] | None:
    """Find the closest food match by case-insensitive fuzzy name search."""

    sql = """
        SELECT
            f.id, f.name, f.slug, f.description, f.image_url,
            f.prep_minutes, f.cook_minutes, f.created_at,
            (
                SELECT r.name FROM food_regions fr
                JOIN regions r ON r.id = fr.region_id
                WHERE fr.food_id = f.id ORDER BY r.name LIMIT 1
            ) AS region,
            COALESCE((
                SELECT array_agg(c.name ORDER BY c.name) FROM food_cuisines fc
                JOIN cuisines c ON c.id = fc.cuisine_id
                WHERE fc.food_id = f.id
            ), ARRAY[]::text[]) AS cuisines
        FROM foods f
        WHERE f.name ILIKE $1
        ORDER BY CASE WHEN lower(f.name) = lower($2) THEN 0 ELSE 1 END, f.name
        LIMIT 1;
    """
    row = await fetchrow(sql, f"%{q}%", q)
    if not row:
        return None
    data = dict(row)
    data["cuisines"] = list(data.get("cuisines") or [])
    return data


async def find_primary_recipe_for_food(food_id: str) -> dict[str, Any] | None:
    """Return the dish's primary recipe link, falling back to the newest curated one."""

    sql = """
        SELECT id, url, source_type, title, thumbnail_url, is_primary, last_checked
        FROM recipe_links
        WHERE food_id = $1
        ORDER BY is_primary DESC, created_at ASC
        LIMIT 1;
    """
    row = await fetchrow(sql, food_id)
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
    """Find restaurants offering a specific food within a radius.

    Falls back to the nearest matches worldwide (capped) if nothing is in range.
    """

    where_sql = "v.id IN (SELECT vi.vendor_id FROM vendor_items vi WHERE vi.food_id = $4)"
    where_args: tuple[Any, ...] = (food_id,)

    if vendor_type:
        where_sql += " AND v.type = $5"
        where_args = (food_id, vendor_type)

    results = await fetch_vendors_within_radius(where_sql, where_args, lat, lng, radius_km)
    if not results and radius_km < _GLOBAL_FALLBACK_RADIUS_KM:
        results = await fetch_vendors_within_radius(
            where_sql, where_args, lat, lng, _GLOBAL_FALLBACK_RADIUS_KM, limit=_GLOBAL_FALLBACK_LIMIT
        )
    return results


async def find_stores_for_ingredient(
    ingredient_id: str,
    lat: float,
    lng: float,
    radius_km: float,
    vendor_type: str | None,
) -> list[dict]:
    """Find stores carrying an ingredient within a radius.

    Falls back to the nearest matches worldwide (capped) if nothing is in range.
    """

    where_sql = "v.id IN (SELECT vi.vendor_id FROM vendor_items vi WHERE vi.ingredient_id = $4)"
    where_args: tuple[Any, ...] = (ingredient_id,)

    if vendor_type:
        where_sql += " AND v.type = $5"
        where_args = (ingredient_id, vendor_type)

    results = await fetch_vendors_within_radius(where_sql, where_args, lat, lng, radius_km)
    if not results and radius_km < _GLOBAL_FALLBACK_RADIUS_KM:
        results = await fetch_vendors_within_radius(
            where_sql, where_args, lat, lng, _GLOBAL_FALLBACK_RADIUS_KM, limit=_GLOBAL_FALLBACK_LIMIT
        )
    return results


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
    primary_recipe: dict[str, Any] | None = None

    if food_match:
        primary_recipe = await find_primary_recipe_for_food(str(food_match["id"]))

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
        "primary_recipe": primary_recipe,
    }

    await set_cached_response(cache_key, response, settings.search_cache_ttl_seconds)
    try:
        redis = get_redis()
        await redis.incr("stats:total_searches")
    except Exception:
        pass
    return response, "MISS"
