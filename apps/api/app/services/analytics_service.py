"""Demand-intelligence event logging and aggregation.

Events are written fire-and-forget — any logging failure is swallowed so
discovery endpoints never break because of analytics. Aggregation helpers
power the admin demand dashboard.
"""
from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from app.core.database import execute, fetch


logger = logging.getLogger(__name__)


def _normalize_query(q: str) -> str:
    return " ".join(q.strip().lower().split())


async def log_search_event(
    *,
    query: str,
    lat: float | None,
    lng: float | None,
    radius_km: float | None,
    result_count: int,
    food_match_id: str | None,
    user_id: str | None,
) -> None:
    """Insert a search event. Never raises."""
    try:
        await execute(
            """
            INSERT INTO search_events
              (query, normalized_query, lat, lng, radius_km, result_count, zero_result, food_match_id, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            """,
            query,
            _normalize_query(query),
            lat,
            lng,
            radius_km,
            result_count,
            result_count == 0,
            UUID(food_match_id) if food_match_id else None,
            UUID(user_id) if user_id else None,
        )
    except Exception:
        logger.warning("Failed to log search event", exc_info=True)


async def log_view_event(
    *,
    entity_type: str,
    entity_id: str,
    user_id: str | None,
) -> None:
    """Insert a view event. Never raises."""
    if entity_type not in {"vendor", "food", "ingredient"}:
        return
    try:
        await execute(
            "INSERT INTO view_events (entity_type, entity_id, user_id) VALUES ($1, $2, $3);",
            entity_type,
            UUID(entity_id),
            UUID(user_id) if user_id else None,
        )
    except Exception:
        logger.warning("Failed to log view event", exc_info=True)


async def top_searches(limit: int = 20, days: int = 30) -> list[dict[str, Any]]:
    rows = await fetch(
        """
        SELECT normalized_query AS query, COUNT(*) AS count,
               SUM(CASE WHEN zero_result THEN 1 ELSE 0 END) AS zero_result_count
        FROM search_events
        WHERE created_at >= now() - make_interval(days => $1)
        GROUP BY normalized_query
        ORDER BY count DESC
        LIMIT $2;
        """,
        days,
        limit,
    )
    return [dict(r) for r in rows]


async def top_zero_result_searches(limit: int = 20, days: int = 30) -> list[dict[str, Any]]:
    rows = await fetch(
        """
        SELECT normalized_query AS query, COUNT(*) AS count,
               AVG(lat) AS avg_lat, AVG(lng) AS avg_lng
        FROM search_events
        WHERE zero_result = true
          AND created_at >= now() - make_interval(days => $1)
        GROUP BY normalized_query
        ORDER BY count DESC
        LIMIT $2;
        """,
        days,
        limit,
    )
    return [dict(r) for r in rows]


async def search_geo_points(days: int = 30, limit: int = 1000) -> list[dict[str, Any]]:
    """Raw lat/lng of recent searches for a heatmap."""
    rows = await fetch(
        """
        SELECT lat, lng, zero_result, normalized_query AS query, created_at
        FROM search_events
        WHERE lat IS NOT NULL AND lng IS NOT NULL
          AND created_at >= now() - make_interval(days => $1)
        ORDER BY created_at DESC
        LIMIT $2;
        """,
        days,
        limit,
    )
    return [dict(r) for r in rows]


async def top_viewed(entity_type: str, limit: int = 20, days: int = 30) -> list[dict[str, Any]]:
    rows = await fetch(
        """
        SELECT entity_id, COUNT(*) AS views
        FROM view_events
        WHERE entity_type = $1
          AND created_at >= now() - make_interval(days => $2)
        GROUP BY entity_id
        ORDER BY views DESC
        LIMIT $3;
        """,
        entity_type,
        days,
        limit,
    )
    return [dict(r) for r in rows]


async def platform_totals() -> dict[str, int]:
    rows = await fetch(
        """
        SELECT
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM vendors) AS vendors,
          (SELECT COUNT(*) FROM search_events) AS total_searches,
          (SELECT COUNT(*) FROM search_events WHERE zero_result) AS zero_result_searches,
          (SELECT COUNT(*) FROM view_events) AS total_views;
        """
    )
    if not rows:
        return {"users": 0, "vendors": 0, "total_searches": 0, "zero_result_searches": 0, "total_views": 0}
    return {k: int(v or 0) for k, v in dict(rows[0]).items()}
