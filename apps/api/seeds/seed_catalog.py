"""Idempotent catalog seeder — foods, ingredients, regions, cuisines, and the
food_regions / food_cuisines / food_ingredients links (including prep/cook times).

Unlike ``seed_vendors`` this does NOT touch the (large) vendors table, so it is
cheap and safe to run on every deploy. It powers the "Cook it yourself" browse
and the cuisine/region filters.

Usage (from apps/api, with DATABASE_URL set):

    python -m seeds.seed_catalog
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import asyncpg

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from seeds.seed_vendors import _upsert_catalog  # noqa: E402


DB_URL = os.environ.get("DATABASE_URL")


async def seed_catalog() -> None:
    if not DB_URL:
        raise RuntimeError("DATABASE_URL must be set")

    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
        food_ids, ingredient_ids = await _upsert_catalog(conn)
        print(f"Catalog upserted: {len(food_ids)} foods, {len(ingredient_ids)} ingredients")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed_catalog())
