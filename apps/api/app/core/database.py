from __future__ import annotations

from typing import Any

import asyncpg

from app.core.config import get_settings

_pool: asyncpg.Pool | None = None


async def init_db_pool() -> None:
    """Initialize the asyncpg connection pool."""

    global _pool
    settings = get_settings()
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=settings.database_min_pool_size,
            max_size=settings.database_max_pool_size,
        )


async def close_db_pool() -> None:
    """Close the asyncpg connection pool."""

    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def fetch(query: str, *args: Any) -> list[asyncpg.Record]:
    """Run a SELECT query and return all rows."""

    if _pool is None:
        await init_db_pool()
    assert _pool is not None
    async with _pool.acquire() as connection:
        return await connection.fetch(query, *args)


async def fetchrow(query: str, *args: Any) -> asyncpg.Record | None:
    """Run a SELECT query and return one row."""

    if _pool is None:
        await init_db_pool()
    assert _pool is not None
    async with _pool.acquire() as connection:
        return await connection.fetchrow(query, *args)


async def execute(query: str, *args: Any) -> str:
    """Run an INSERT/UPDATE/DELETE query."""

    if _pool is None:
        await init_db_pool()
    assert _pool is not None
    async with _pool.acquire() as connection:
        return await connection.execute(query, *args)
