from __future__ import annotations

from fastapi import HTTPException

from app.core.config import get_settings
from app.core.database import fetchrow
from app.core.redis import get_redis


def require_admin_key(provided_key: str | None) -> None:
    """Validate the admin API key from the X-Admin-Key header."""

    settings = get_settings()
    if not settings.admin_api_key or provided_key != settings.admin_api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing admin key")


async def get_admin_stats() -> dict:
    """Return platform statistics for the admin dashboard."""

    vendors = await fetchrow(
        """
        SELECT
            COUNT(*) AS total_vendors,
            COUNT(*) FILTER (WHERE type = 'restaurant') AS total_restaurants,
            COUNT(*) FILTER (WHERE type = 'grocery_store') AS total_grocery_stores
        FROM vendors;
        """
    )
    foods = await fetchrow("SELECT COUNT(*) AS total_foods FROM foods;")
    ingredients = await fetchrow("SELECT COUNT(*) AS total_ingredients FROM ingredients;")

    total_searches = 0
    try:
        redis = get_redis()
        raw_total_searches = await redis.get("stats:total_searches")
        if raw_total_searches is not None:
            total_searches = int(raw_total_searches)
    except Exception:
        total_searches = 0

    return {
        "total_vendors": int(vendors["total_vendors"]),
        "total_restaurants": int(vendors["total_restaurants"]),
        "total_grocery_stores": int(vendors["total_grocery_stores"]),
        "total_foods": int(foods["total_foods"]),
        "total_ingredients": int(ingredients["total_ingredients"]),
        "total_searches": total_searches,
    }
