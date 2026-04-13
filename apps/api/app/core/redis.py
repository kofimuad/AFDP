from __future__ import annotations

from redis.asyncio import Redis

from app.core.config import get_settings

_redis_client: Redis | None = None


async def init_redis() -> None:
    """Initialize Redis async client."""

    global _redis_client
    settings = get_settings()
    if _redis_client is None:
        _redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
        await _redis_client.ping()


async def close_redis() -> None:
    """Close Redis client gracefully."""

    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None


def get_redis() -> Redis:
    """Get initialized Redis client."""

    if _redis_client is None:
        raise RuntimeError("Redis is not initialized")
    return _redis_client
