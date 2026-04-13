"""Seed script for AFDP DMV demo data."""

from __future__ import annotations

import asyncio
import os

import asyncpg
from slugify import slugify

DB_URL = os.environ.get("DATABASE_URL")

if not DB_URL:
    raise RuntimeError("DATABASE_URL must be set to seed the DMV demo data")

FOODS = [
    {
        "name": "Jollof Rice",
        "description": "Smoky tomato-based rice dish popular across West Africa.",
        "image_url": "https://images.example.com/jollof-rice.jpg",
    },
    {
        "name": "Egusi Soup",
        "description": "Melon seed soup with leafy greens and protein.",
        "image_url": "https://images.example.com/egusi-soup.jpg",
    },
    {
        "name": "Injera with Doro Wat",
        "description": "Ethiopian sour flatbread served with spiced chicken stew.",
        "image_url": "https://images.example.com/injera-doro-wat.jpg",
    },
]

INGREDIENTS = [
    "Long grain rice",
    "Tomato paste",
    "Scotch bonnet pepper",
    "Egusi seeds",
    "Palm oil",
    "Berbere spice",
    "Teff flour",
]

VENDORS = [
    {
        "name": "Lagos Grill Silver Spring",
        "type": "restaurant",
        "address": "8455 Colesville Rd, Silver Spring, MD",
        "lat": 38.9957,
        "lng": -77.0282,
    },
    {
        "name": "Suya Spot DC",
        "type": "restaurant",
        "address": "1911 9th St NW, Washington, DC",
        "lat": 38.9168,
        "lng": -77.0233,
    },
    {
        "name": "Addis Corner Arlington",
        "type": "restaurant",
        "address": "3100 Columbia Pike, Arlington, VA",
        "lat": 38.8630,
        "lng": -77.0874,
    },
    {
        "name": "Motherland Grocery Hyattsville",
        "type": "grocery_store",
        "address": "5400 Queens Chapel Rd, Hyattsville, MD",
        "lat": 38.9559,
        "lng": -76.9425,
    },
    {
        "name": "Nile Market Alexandria",
        "type": "grocery_store",
        "address": "6224 Richmond Hwy, Alexandria, VA",
        "lat": 38.7893,
        "lng": -77.0820,
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

        food_ids: dict[str, str] = {}
        for food in FOODS:
            food_id = await conn.fetchval(
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
                food["description"],
                food["image_url"],
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

        food_ingredient_map = {
            "Jollof Rice": ["Long grain rice", "Tomato paste", "Scotch bonnet pepper"],
            "Egusi Soup": ["Egusi seeds", "Palm oil"],
            "Injera with Doro Wat": ["Berbere spice", "Teff flour"],
        }

        for food_name, ingredient_names in food_ingredient_map.items():
            for ingredient_name in ingredient_names:
                await conn.execute(
                    """
                    INSERT INTO food_ingredients (food_id, ingredient_id, quantity_note)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (food_id, ingredient_id) DO UPDATE SET quantity_note = EXCLUDED.quantity_note;
                    """,
                    food_ids[food_name],
                    ingredient_ids[ingredient_name],
                    "As needed",
                )

        vendor_ids: dict[str, str] = {}
        for vendor in VENDORS:
            vendor_id = await conn.fetchval(
                """
                INSERT INTO vendors (
                    id, name, slug, type, address, location, is_verified, is_featured
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4,
                    ST_SetSRID(ST_MakePoint($5, $6), 4326),
                    true, false
                )
                ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    type = EXCLUDED.type,
                    address = EXCLUDED.address,
                    location = EXCLUDED.location
                RETURNING id;
                """,
                vendor["name"],
                slugify(vendor["name"]),
                vendor["type"],
                vendor["address"],
                vendor["lng"],
                vendor["lat"],
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
