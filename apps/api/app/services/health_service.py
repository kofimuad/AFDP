from __future__ import annotations

from app.core.config import get_settings
from app.core.database import fetchrow
from app.core.redis import get_redis, init_redis


async def check_health() -> dict:
    """Check database and Redis connectivity and return a normalized payload."""

    settings = get_settings()

    database_status = "connected"
    redis_status = "connected"

    try:
        await fetchrow("SELECT 1 AS ok;")
    except Exception:
        database_status = "error"

    try:
        try:
            redis = get_redis()
        except RuntimeError:
            await init_redis()
            redis = get_redis()
        await redis.ping()
    except Exception:
        redis_status = "error"

    return {
        "status": "ok",
        "database": database_status,
        "redis": redis_status,
        "version": settings.app_version,
    }
