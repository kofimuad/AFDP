"""Seed script for AFDP DMV demo data."""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import asyncpg
from slugify import slugify

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.sourcing.catalog import FOOD_RECIPE_LINKS  # noqa: E402

DB_URL = os.environ.get("DATABASE_URL")

if not DB_URL:
    raise RuntimeError("DATABASE_URL must be set to seed the DMV demo data")

FOODS = [
    {
        "name": "Jollof Rice",
        "description": "Smoky tomato-based rice dish popular across West Africa.",
        "image_url": "https://images.example.com/jollof-rice.jpg",
        "prep_minutes": 20,
        "cook_minutes": 45,
        "servings": 6,
        "cuisines": ["Ghanaian", "Nigerian"],
    },
    {
        "name": "Egusi Soup",
        "description": "Melon seed soup with leafy greens and protein.",
        "image_url": "https://images.example.com/egusi-soup.jpg",
        "prep_minutes": 25,
        "cook_minutes": 50,
        "servings": 6,
        "cuisines": ["Cameroonian", "Nigerian"],
    },
    {
        "name": "Injera with Doro Wat",
        "description": "Ethiopian sour flatbread served with spiced chicken stew.",
        "image_url": "https://images.example.com/injera-doro-wat.jpg",
        "prep_minutes": 40,
        "cook_minutes": 90,
        "servings": 4,
        "cuisines": ["Eritrean", "Ethiopian"],
    },
]

# Cuisine display names referenced by FOODS above (seeded into the cuisines table).
CUISINES = ["Ghanaian", "Nigerian", "Cameroonian", "Eritrean", "Ethiopian"]

INGREDIENTS = [
    "Long grain rice",
    "Tomato paste",
    "Scotch bonnet pepper",
    "Egusi seeds",
    "Palm oil",
    "Berbere spice",
    "Teff flour",
]

# "delivery" demonstrates the tri-state: True (delivers), False (verified no
# delivery), None (unknown — not yet verified). Stores carry it too, not just
# restaurants.
VENDORS = [
    {
        "name": "Lagos Grill Silver Spring",
        "type": "restaurant",
        "address": "8455 Colesville Rd, Silver Spring, MD",
        "lat": 38.9957,
        "lng": -77.0282,
        "delivery": True,
    },
    {
        "name": "Suya Spot DC",
        "type": "restaurant",
        "address": "1911 9th St NW, Washington, DC",
        "lat": 38.9168,
        "lng": -77.0233,
        "delivery": True,
    },
    {
        "name": "Addis Corner Arlington",
        "type": "restaurant",
        "address": "3100 Columbia Pike, Arlington, VA",
        "lat": 38.8630,
        "lng": -77.0874,
        "delivery": None,  # unknown
    },
    {
        "name": "Motherland Grocery Hyattsville",
        "type": "grocery_store",
        "address": "5400 Queens Chapel Rd, Hyattsville, MD",
        "lat": 38.9559,
        "lng": -76.9425,
        "delivery": True,
    },
    {
        "name": "Nile Market Alexandria",
        "type": "grocery_store",
        "address": "6224 Richmond Hwy, Alexandria, VA",
        "lat": 38.7893,
        "lng": -77.0820,
        "delivery": False,  # verified: no delivery
    },
]


async def seed() -> None:
    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

        region_id = await conn.fetchval(
            """
            INSERT INTO regions (id, name)
            VALUES (gen_random_uuid(), 'West African')
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
            """
        )

        cuisine_ids: dict[str, str] = {}
        for cuisine_name in CUISINES:
            cuisine_id = await conn.fetchval(
                """
                INSERT INTO cuisines (id, name, slug)
                VALUES (gen_random_uuid(), $1, $2)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id;
                """,
                cuisine_name,
                slugify(cuisine_name),
            )
            cuisine_ids[cuisine_name] = str(cuisine_id)

        food_ids: dict[str, str] = {}
        for food in FOODS:
            food_id = await conn.fetchval(
                """
                INSERT INTO foods (id, name, slug, description, image_url, prep_minutes, cook_minutes, servings)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    image_url = EXCLUDED.image_url,
                    prep_minutes = EXCLUDED.prep_minutes,
                    cook_minutes = EXCLUDED.cook_minutes,
                    servings = EXCLUDED.servings
                RETURNING id;
                """,
                food["name"],
                slugify(food["name"]),
                food["description"],
                food["image_url"],
                food.get("prep_minutes"),
                food.get("cook_minutes"),
                food.get("servings"),
            )
            food_ids[food["name"]] = str(food_id)
            await conn.execute(
                """
                INSERT INTO food_regions (food_id, region_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING;
                """,
                food_id,
                region_id,
            )
            for cuisine_name in food.get("cuisines", []):
                cid = cuisine_ids.get(cuisine_name)
                if cid:
                    await conn.execute(
                        """
                        INSERT INTO food_cuisines (food_id, cuisine_id)
                        VALUES ($1, $2)
                        ON CONFLICT DO NOTHING;
                        """,
                        food_id,
                        cid,
                    )

        ingredient_ids: dict[str, str] = {}
        for ingredient_name in INGREDIENTS:
            ingredient_id = await conn.fetchval(
                """
                INSERT INTO ingredients (id, name, slug, image_url)
                VALUES (gen_random_uuid(), $1, $2, $3)
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                RETURNING id;
                """,
                ingredient_name,
                slugify(ingredient_name),
                f"https://images.example.com/{slugify(ingredient_name)}.jpg",
            )
            ingredient_ids[ingredient_name] = str(ingredient_id)

        # (ingredient, quantity_note, quantity, unit) — Jollof carries structured
        # amounts so the recipe data model is exercised end to end.
        food_ingredient_map = {
            "Jollof Rice": [
                ("Long grain rice", "3 cups", 3, "cups"),
                ("Tomato paste", "3 tbsp", 3, "tbsp"),
                ("Scotch bonnet pepper", "2, blended", 2, None),
            ],
            "Egusi Soup": [
                ("Egusi seeds", "2 cups, ground", 2, "cups"),
                ("Palm oil", "1/2 cup", 0.5, "cup"),
            ],
            "Injera with Doro Wat": [
                ("Berbere spice", "3 tbsp", 3, "tbsp"),
                ("Teff flour", "4 cups", 4, "cups"),
            ],
        }

        for food_name, rows in food_ingredient_map.items():
            for ingredient_name, note, quantity, unit in rows:
                await conn.execute(
                    """
                    INSERT INTO food_ingredients (food_id, ingredient_id, quantity_note, quantity, unit)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (food_id, ingredient_id) DO UPDATE SET
                        quantity_note = EXCLUDED.quantity_note,
                        quantity = EXCLUDED.quantity,
                        unit = EXCLUDED.unit;
                    """,
                    food_ids[food_name],
                    ingredient_ids[ingredient_name],
                    note,
                    quantity,
                    unit,
                )

        # Recipe links — upsert by (food_id, url) so re-seeding stays idempotent.
        for food_name, links in FOOD_RECIPE_LINKS.items():
            food_id = food_ids.get(food_name)
            if not food_id:
                continue
            for link in links:
                await conn.execute(
                    """
                    INSERT INTO recipe_links
                        (id, food_id, url, source_type, title, thumbnail_url, is_primary, last_checked)
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now())
                    ON CONFLICT (food_id, url) DO UPDATE SET
                        source_type = EXCLUDED.source_type,
                        title = EXCLUDED.title,
                        thumbnail_url = EXCLUDED.thumbnail_url,
                        is_primary = EXCLUDED.is_primary,
                        last_checked = now();
                    """,
                    food_id,
                    link["url"],
                    link["source_type"],
                    link["title"],
                    link.get("thumbnail_url"),
                    link["is_primary"],
                )

        vendor_ids: dict[str, str] = {}
        for vendor in VENDORS:
            vendor_id = await conn.fetchval(
                """
                INSERT INTO vendors (
                    id, name, slug, type, address, location, is_verified, is_featured, delivery_available
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4,
                    ST_SetSRID(ST_MakePoint($5, $6), 4326),
                    true, false, $7
                )
                ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    type = EXCLUDED.type,
                    address = EXCLUDED.address,
                    location = EXCLUDED.location,
                    delivery_available = EXCLUDED.delivery_available
                RETURNING id;
                """,
                vendor["name"],
                slugify(vendor["name"]),
                vendor["type"],
                vendor["address"],
                vendor["lng"],
                vendor["lat"],
                vendor.get("delivery"),
            )
            vendor_ids[vendor["name"]] = str(vendor_id)

        await conn.execute(
            """
            INSERT INTO vendor_items (id, vendor_id, food_id, ingredient_id, price, available)
            VALUES
            (gen_random_uuid(), $1, $2, NULL, 14.99, true),
            (gen_random_uuid(), $3, $2, NULL, 15.50, true),
            (gen_random_uuid(), $4, $5, NULL, 18.99, true),
            (gen_random_uuid(), $6, NULL, $7, 4.99, true),
            (gen_random_uuid(), $6, NULL, $8, 3.49, true),
            (gen_random_uuid(), $9, NULL, $10, 6.99, true),
            (gen_random_uuid(), $9, NULL, $11, 7.25, true)
            ON CONFLICT DO NOTHING;
            """,
            vendor_ids["Lagos Grill Silver Spring"],
            food_ids["Jollof Rice"],
            vendor_ids["Suya Spot DC"],
            vendor_ids["Addis Corner Arlington"],
            food_ids["Injera with Doro Wat"],
            vendor_ids["Motherland Grocery Hyattsville"],
            ingredient_ids["Long grain rice"],
            ingredient_ids["Tomato paste"],
            vendor_ids["Nile Market Alexandria"],
            ingredient_ids["Egusi seeds"],
            ingredient_ids["Berbere spice"],
        )

        print("Seeded AFDP DMV demo data")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())
