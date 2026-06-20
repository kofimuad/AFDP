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
from passlib.context import CryptContext

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from seeds.seed_vendors import _upsert_catalog  # noqa: E402


DB_URL = os.environ.get("DATABASE_URL")
_PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def _seed_admin(conn: asyncpg.Connection) -> None:
    """Create/refresh an admin user from env vars, if provided.

    Runs on deploy. We do NOT hardcode a password here — set SEED_ADMIN_EMAIL and
    SEED_ADMIN_PASSWORD (e.g. in Railway) and the admin is created/updated on the
    next deploy. Skipped silently when unset.
    """
    email = os.environ.get("SEED_ADMIN_EMAIL")
    password = os.environ.get("SEED_ADMIN_PASSWORD")
    if not (email and password):
        return
    await conn.execute(
        """
        INSERT INTO users (id, email, full_name, hashed_password, role, is_active)
        VALUES (gen_random_uuid(), $1, 'AFDP Admin', $2, 'admin', true)
        ON CONFLICT (email) DO UPDATE SET
            role = 'admin',
            hashed_password = EXCLUDED.hashed_password,
            is_active = true;
        """,
        email.strip().lower(),
        _PWD_CONTEXT.hash(password),
    )
    print(f"Seeded admin user: {email.strip().lower()}")


async def seed_catalog() -> None:
    if not DB_URL:
        raise RuntimeError("DATABASE_URL must be set")

    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
        food_ids, ingredient_ids = await _upsert_catalog(conn)
        print(f"Catalog upserted: {len(food_ids)} foods, {len(ingredient_ids)} ingredients")
        await _seed_admin(conn)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed_catalog())
