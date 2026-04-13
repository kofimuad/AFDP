from __future__ import annotations

import json
from typing import Any

from app.core.redis import get_redis


async def get_cached_response(key: str) -> dict[str, Any] | None:
    """Get cached JSON response from Redis by key."""

    try:
        redis = get_redis()
    except RuntimeError:
        return None

    raw = await redis.get(key)
    if not raw:
        return None
    return json.loads(raw)


async def set_cached_response(key: str, payload: dict[str, Any], ttl: int) -> None:
    """Set cached JSON response in Redis with TTL."""

    try:
        redis = get_redis()
    except RuntimeError:
        return

    await redis.set(key, json.dumps(payload, default=str), ex=ttl)
