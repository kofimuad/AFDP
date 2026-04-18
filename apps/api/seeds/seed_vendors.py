"""Seed the database with sourced vendors + an expanded food/ingredient catalog.

Usage (from apps/api, with DATABASE_URL set):

    python -m seeds.seed_vendors --vendors scripts/data/vendors.json

The vendors JSON is produced by ``scripts/source_vendors.py``.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import random
import sys
from pathlib import Path

import asyncpg
from slugify import slugify

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.sourcing.catalog import (  # noqa: E402
    CUISINE_FOODS,
    CUISINE_INGREDIENTS,
    FOOD_INGREDIENTS,
    FOODS,
    INGREDIENTS,
    REGIONS,
    food_image_url,
    ingredient_image_url,
)
from scripts.sourcing.search_terms import query_cuisine  # noqa: E402


DB_URL = os.environ.get("DATABASE_URL")


async def _upsert_catalog(conn: asyncpg.Connection) -> tuple[dict[str, str], dict[str, str]]:
    """Insert or update foods, ingredients, food_regions, and food_ingredients."""
    region_ids: dict[str, str] = {}
    for r in REGIONS:
        rid = await conn.fetchval(
            """
            INSERT INTO regions (id, name) VALUES (gen_random_uuid(), $1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
            """,
            r,
        )
        region_ids[r] = rid

    food_ids: dict[str, str] = {}
    for food in FOODS:
        fid = await conn.fetchval(
            """
            INSERT INTO foods (id, name, slug, description, image_url)
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                image_url = EXCLUDED.image_url
            RETURNING id;
            """,
            food["name"],
            slugify(food["name"]),
            food.get("description"),
            food_image_url(food["name"]),
        )
        food_ids[food["name"]] = fid
        rid = region_ids.get(food["region"])
        if rid:
            await conn.execute(
                """
                INSERT INTO food_regions (food_id, region_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING;
                """,
                fid,
                rid,
            )

    ingredient_ids: dict[str, str] = {}
    for name in INGREDIENTS:
        iid = await conn.fetchval(
            """
            INSERT INTO ingredients (id, name, slug, image_url)
            VALUES (gen_random_uuid(), $1, $2, $3)
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name,
                image_url = EXCLUDED.image_url
            RETURNING id;
            """,
            name,
            slugify(name),
            ingredient_image_url(name),
        )
        ingredient_ids[name] = iid

    for food_name, ing_list in FOOD_INGREDIENTS.items():
        fid = food_ids.get(food_name)
        if not fid:
            continue
        for ing_name, quantity_note in ing_list:
            iid = ingredient_ids.get(ing_name)
            if not iid:
                continue
            await conn.execute(
                """
                INSERT INTO food_ingredients (food_id, ingredient_id, quantity_note)
                VALUES ($1, $2, $3)
                ON CONFLICT (food_id, ingredient_id)
                DO UPDATE SET quantity_note = EXCLUDED.quantity_note;
                """,
                fid,
                iid,
                quantity_note,
            )

    return food_ids, ingredient_ids


async def _seed_vendor(
    conn: asyncpg.Connection,
    v: dict,
    food_ids: dict[str, str],
    ingredient_ids: dict[str, str],
) -> bool:
    if not v.get("name") or v.get("type") not in ("restaurant", "grocery_store"):
        return False
    if not v.get("address"):
        return False

    slug = slugify(
        f"{v['name']}-{v.get('city','')}-{round(float(v['lat']), 3)}-{round(float(v['lng']), 3)}"
    )

    vid = await conn.fetchval(
        """
        INSERT INTO vendors (
            id, name, slug, type, address, location, phone, website,
            is_verified, is_featured
        ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            ST_SetSRID(ST_MakePoint($5, $6), 4326),
            $7, $8, false, false
        )
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            address = EXCLUDED.address,
            location = EXCLUDED.location,
            phone = COALESCE(EXCLUDED.phone, vendors.phone),
            website = COALESCE(EXCLUDED.website, vendors.website)
        RETURNING id;
        """,
        v["name"],
        slug,
        v["type"],
        v["address"],
        float(v["lng"]),
        float(v["lat"]),
        v.get("phone"),
        v.get("website"),
    )

    cuisine = query_cuisine(v.get("search_term", ""))
    if v["type"] == "restaurant":
        pool = CUISINE_FOODS.get(cuisine) or CUISINE_FOODS["african"]
        k = min(6, len(pool))
        for food_name in random.sample(pool, k):
            fid = food_ids.get(food_name)
            if not fid:
                continue
            await conn.execute(
                """
                INSERT INTO vendor_items (id, vendor_id, food_id, ingredient_id, price, available)
                VALUES (gen_random_uuid(), $1, $2, NULL, $3, true)
                ON CONFLICT DO NOTHING;
                """,
                vid,
                fid,
                round(random.uniform(12, 25), 2),
            )
    else:
        pool = CUISINE_INGREDIENTS.get(cuisine) or CUISINE_INGREDIENTS["african"]
        k = min(15, len(pool))
        for ing_name in random.sample(pool, k):
            iid = ingredient_ids.get(ing_name)
            if not iid:
                continue
            await conn.execute(
                """
                INSERT INTO vendor_items (id, vendor_id, food_id, ingredient_id, price, available)
                VALUES (gen_random_uuid(), $1, NULL, $2, $3, true)
                ON CONFLICT DO NOTHING;
                """,
                vid,
                iid,
                round(random.uniform(2, 12), 2),
            )
    return True


async def seed(vendors_path: str, seed_rng: int | None = None) -> None:
    if not DB_URL:
        raise RuntimeError("DATABASE_URL must be set")
    if seed_rng is not None:
        random.seed(seed_rng)

    path = Path(vendors_path)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[1] / vendors_path
    vendors = json.loads(path.read_text()) if path.exists() else []
    print(f"Loaded {len(vendors)} sourced vendors from {path}")

    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
        food_ids, ingredient_ids = await _upsert_catalog(conn)
        print(f"Upserted {len(food_ids)} foods, {len(ingredient_ids)} ingredients")

        inserted = 0
        for v in vendors:
            try:
                if await _seed_vendor(conn, v, food_ids, ingredient_ids):
                    inserted += 1
            except Exception as e:
                print(f"  skip {v.get('name')!r}: {e}")
        print(f"Seeded {inserted} vendors")
    finally:
        await conn.close()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--vendors", default="scripts/data/vendors.json")
    ap.add_argument("--seed-rng", type=int, default=42, help="Deterministic RNG seed for item linking.")
    args = ap.parse_args()
    asyncio.run(seed(args.vendors, args.seed_rng))


if __name__ == "__main__":
    main()
