"""Admin-facing demand-intelligence endpoints (JWT-guarded)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.services.analytics_service import (
    platform_totals,
    search_geo_points,
    top_searches,
    top_viewed,
    top_zero_result_searches,
)
from app.services.auth_service import require_admin

router = APIRouter(
    prefix="/admin/analytics",
    tags=["Admin Analytics"],
    dependencies=[Depends(require_admin)],
)


@router.get("/totals")
async def totals_route() -> dict[str, int]:
    return await platform_totals()


@router.get("/top-searches")
async def top_searches_route(days: int = Query(30, ge=1, le=365), limit: int = Query(20, ge=1, le=100)) -> list[dict[str, Any]]:
    return await top_searches(limit=limit, days=days)


@router.get("/zero-result-searches")
async def zero_result_searches_route(days: int = Query(30, ge=1, le=365), limit: int = Query(20, ge=1, le=100)) -> list[dict[str, Any]]:
    return await top_zero_result_searches(limit=limit, days=days)


@router.get("/search-geo")
async def search_geo_route(days: int = Query(30, ge=1, le=365), limit: int = Query(1000, ge=1, le=5000)) -> list[dict[str, Any]]:
    return await search_geo_points(days=days, limit=limit)


@router.get("/top-viewed/{entity_type}")
async def top_viewed_route(
    entity_type: str,
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(20, ge=1, le=100),
) -> list[dict[str, Any]]:
    if entity_type not in {"vendor", "food", "ingredient"}:
        return []
    return await top_viewed(entity_type=entity_type, limit=limit, days=days)
