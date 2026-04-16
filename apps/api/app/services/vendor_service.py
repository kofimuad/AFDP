from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

import asyncpg
from fastapi import HTTPException
from slugify import slugify

from app.core.database import execute, fetch, fetchrow
from app.schemas.vendor import VendorItemCreate, VendorRegisterIn
from app.services.query_utils import bind_param


def _row_to_vendor_summary(row: dict[str, Any]) -> dict[str, Any]:
    """Convert a vendor row into a public payload."""

    payload: dict[str, Any] = {
        "id": row["id"],
        "name": row["name"],
        "slug": row["slug"],
        "type": row["type"],
        "address": row["address"],
        "lat": row.get("lat"),
        "lng": row.get("lng"),
        "phone": row.get("phone"),
        "website": row.get("website"),
        "image_url": row.get("image_url"),
        "is_verified": row.get("is_verified", False),
        "is_featured": row.get("is_featured", False),
        "created_at": row.get("created_at"),
        "vendor_items": row.get("vendor_items", []),
    }
    if "distance_km" in row:
        payload["distance_km"] = row.get("distance_km")
    return payload


def _row_to_vendor_item(row: dict[str, Any]) -> dict[str, Any]:
    """Convert a vendor item row into a nested payload."""

    item_type = "food" if row.get("vendor_food_id") is not None else "ingredient"
    payload: dict[str, Any] = {
        "id": row["id"],
        "vendor_id": row["vendor_id"],
        "food_id": row.get("vendor_food_id"),
        "ingredient_id": row.get("vendor_ingredient_id"),
        "price": float(row["price"]) if row.get("price") is not None else None,
        "available": row.get("available", True),
        "item_type": item_type,
        "food": None,
        "ingredient": None,
    }
    if row.get("vendor_food_id") is not None:
        payload["food"] = {
            "id": row["food_id"],
            "name": row["food_name"],
            "slug": row["food_slug"],
            "description": row.get("food_description"),
            "image_url": row.get("food_image_url"),
            "created_at": row.get("food_created_at"),
        }
    if row.get("vendor_ingredient_id") is not None:
        payload["ingredient"] = {
            "id": row["ingredient_id"],
            "name": row["ingredient_name"],
            "slug": row["ingredient_slug"],
            "image_url": row.get("ingredient_image_url"),
        }
    return payload


def _dedupe_vendors(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Deduplicate vendor rows while preserving their order."""

    seen: set[str] = set()
    unique_rows: list[dict[str, Any]] = []
    for row in rows:
        vendor_id = str(row["id"])
        if vendor_id in seen:
            continue
        seen.add(vendor_id)
        unique_rows.append(row)
    return unique_rows


async def list_vendors(
    *,
    type_: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float = 10,
    is_featured: bool | None = None,
    is_verified: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> list[dict[str, Any]]:
    """Return vendors with optional type, proximity, and moderation filters."""

    if (lat is None) != (lng is None):
        raise HTTPException(status_code=422, detail="lat and lng must be provided together")

    params: list[Any] = []
    where_clauses: list[str] = []
    distance_select = ""
    order_sql = "ORDER BY v.created_at DESC"

    if type_ is not None:
        where_clauses.append(f"v.type = {bind_param(params, type_)}")
    if is_featured is not None:
        where_clauses.append(f"v.is_featured = {bind_param(params, is_featured)}")
    if is_verified is not None:
        where_clauses.append(f"v.is_verified = {bind_param(params, is_verified)}")

    if lat is not None and lng is not None:
        lng_placeholder = bind_param(params, lng)
        lat_placeholder = bind_param(params, lat)
        radius_placeholder = bind_param(params, radius_km * 1000.0)
        distance_select = (
            f", ROUND((ST_Distance(v.location::geography, ST_SetSRID(ST_MakePoint({lng_placeholder}, {lat_placeholder}), 4326)::geography) / 1000)::numeric, 2) AS distance_km"
        )
        where_clauses.append(
            f"ST_DWithin(v.location::geography, ST_SetSRID(ST_MakePoint({lng_placeholder}, {lat_placeholder}), 4326)::geography, {radius_placeholder})"
        )
        order_sql = "ORDER BY distance_km ASC, v.created_at DESC"

    offset = max(page - 1, 0) * page_size
    limit_placeholder = bind_param(params, page_size)
    offset_placeholder = bind_param(params, offset)

    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"
    sql = f"""
        SELECT
            v.id,
            v.name,
            v.slug,
            v.type,
            v.address,
            ST_Y(v.location::geometry) AS lat,
            ST_X(v.location::geometry) AS lng,
            v.phone,
            v.website,
            v.image_url,
            v.is_verified,
            v.is_featured,
            v.created_at
            {distance_select}
        FROM vendors v
        WHERE {where_sql}
        {order_sql}
        LIMIT {limit_placeholder} OFFSET {offset_placeholder};
    """
    rows = await fetch(sql, *params)
    return [_row_to_vendor_summary(dict(row)) for row in rows]


async def get_vendor_detail(slug: str, lat: float | None = None, lng: float | None = None) -> dict[str, Any]:
    """Return a vendor with all of its attached foods and ingredients."""

    if (lat is None) != (lng is None):
        raise HTTPException(status_code=422, detail="lat and lng must be provided together")

    params: list[Any] = [slug]
    distance_select = ""
    if lat is not None and lng is not None:
        lng_placeholder = bind_param(params, lng)
        lat_placeholder = bind_param(params, lat)
        distance_select = (
            f", ROUND((ST_Distance(v.location::geography, ST_SetSRID(ST_MakePoint({lng_placeholder}, {lat_placeholder}), 4326)::geography) / 1000)::numeric, 2) AS distance_km"
        )

    vendor = await fetchrow(
        f"""
        SELECT
            v.id,
            v.name,
            v.slug,
            v.type,
            v.address,
            ST_Y(v.location::geometry) AS lat,
            ST_X(v.location::geometry) AS lng,
            v.phone,
            v.website,
            v.image_url,
            v.is_verified,
            v.is_featured,
            v.created_at
            {distance_select}
        FROM vendors v
        WHERE v.slug = $1;
        """,
        *params,
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor_items = await fetch(
        """
        SELECT
            vi.id,
            vi.vendor_id,
            vi.food_id AS vendor_food_id,
            vi.ingredient_id AS vendor_ingredient_id,
            vi.price,
            vi.available,
            f.id AS food_id,
            f.name AS food_name,
            f.slug AS food_slug,
            f.description AS food_description,
            f.image_url AS food_image_url,
            f.created_at AS food_created_at,
            i.id AS ingredient_id,
            i.name AS ingredient_name,
            i.slug AS ingredient_slug,
            i.image_url AS ingredient_image_url
        FROM vendor_items vi
        LEFT JOIN foods f ON f.id = vi.food_id
        LEFT JOIN ingredients i ON i.id = vi.ingredient_id
        WHERE vi.vendor_id = $1
        ORDER BY vi.available DESC, vi.id ASC;
        """,
        vendor["id"],
    )

    return {
        **_row_to_vendor_summary(dict(vendor)),
        "vendor_items": [_row_to_vendor_item(dict(row)) for row in vendor_items],
    }


async def register_vendor(payload: VendorRegisterIn) -> dict[str, Any]:
    """Create a vendor and guarantee a unique slug."""

    base_slug = slugify(payload.name)
    if not base_slug:
        base_slug = f"vendor-{uuid4().hex[:8]}"

    candidate_slug = base_slug
    for _ in range(10):
        try:
            row = await fetchrow(
                """
                INSERT INTO vendors (
                    id, name, slug, type, address, location, phone, website, image_url, is_verified, is_featured
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4,
                    ST_SetSRID(ST_MakePoint($5, $6), 4326),
                    $7, $8, $9, false, false
                )
                RETURNING
                    id, name, slug, type, address,
                    ST_Y(location::geometry) AS lat,
                    ST_X(location::geometry) AS lng,
                    phone, website, image_url, is_verified, is_featured, created_at;
                """,
                payload.name,
                candidate_slug,
                payload.type,
                payload.address,
                payload.lng,
                payload.lat,
                payload.phone,
                payload.website,
                payload.image_url,
            )
            if row:
                return _row_to_vendor_summary(dict(row))
        except asyncpg.UniqueViolationError:
            candidate_slug = f"{base_slug}-{uuid4().hex[:6]}"

    raise HTTPException(status_code=500, detail="Unable to create a unique vendor slug")


async def add_vendor_item(vendor_id: UUID, payload: VendorItemCreate) -> dict[str, Any]:
    """Attach a food or ingredient item to a vendor."""

    vendor = await fetchrow("SELECT id FROM vendors WHERE id = $1;", vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if payload.food_id is not None:
        food = await fetchrow(
            "SELECT id, name, slug, description, image_url, created_at FROM foods WHERE id = $1;",
            payload.food_id,
        )
        if not food:
            raise HTTPException(status_code=404, detail="Food not found")
    else:
        ingredient = await fetchrow(
            "SELECT id, name, slug, image_url FROM ingredients WHERE id = $1;",
            payload.ingredient_id,
        )
        if not ingredient:
            raise HTTPException(status_code=404, detail="Ingredient not found")

    row = await fetchrow(
        """
        INSERT INTO vendor_items (id, vendor_id, food_id, ingredient_id, price, available)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
        RETURNING id, vendor_id, food_id, ingredient_id, price, available;
        """,
        vendor_id,
        payload.food_id,
        payload.ingredient_id,
        payload.price,
        payload.available,
    )
    assert row is not None

    if payload.food_id is not None:
        food = await fetchrow(
            "SELECT id, name, slug, description, image_url, created_at FROM foods WHERE id = $1;",
            payload.food_id,
        )
        assert food is not None
        return {
            "id": row["id"],
            "vendor_id": row["vendor_id"],
            "food_id": row["food_id"],
            "ingredient_id": row["ingredient_id"],
            "food": {
                "id": food["id"],
                "name": food["name"],
                "slug": food["slug"],
                "description": food.get("description"),
                "image_url": food.get("image_url"),
                "created_at": food.get("created_at"),
            },
            "ingredient": None,
            "price": float(row["price"]) if row["price"] is not None else None,
            "available": row["available"],
            "item_type": "food",
        }

    ingredient = await fetchrow(
        "SELECT id, name, slug, image_url FROM ingredients WHERE id = $1;",
        payload.ingredient_id,
    )
    assert ingredient is not None
    return {
        "id": row["id"],
        "vendor_id": row["vendor_id"],
        "food_id": row["food_id"],
        "ingredient_id": row["ingredient_id"],
        "food": None,
        "ingredient": {
            "id": ingredient["id"],
            "name": ingredient["name"],
            "slug": ingredient["slug"],
            "image_url": ingredient.get("image_url"),
        },
        "price": float(row["price"]) if row["price"] is not None else None,
        "available": row["available"],
        "item_type": "ingredient",
    }


async def find_or_create_food(
    name: str,
    description: str | None = None,
    image_url: str | None = None,
) -> dict[str, Any]:
    """Look up a food by case-insensitive name; create it if missing."""

    existing = await fetchrow(
        "SELECT id, name, slug, description, image_url, created_at FROM foods WHERE lower(name) = lower($1) LIMIT 1;",
        name.strip(),
    )
    if existing:
        row = dict(existing)
        if image_url and not row.get("image_url"):
            updated = await fetchrow(
                "UPDATE foods SET image_url = $2 WHERE id = $1 RETURNING id, name, slug, description, image_url, created_at;",
                row["id"],
                image_url,
            )
            if updated:
                row = dict(updated)
        return row

    base_slug = slugify(name) or f"food-{uuid4().hex[:8]}"
    candidate = base_slug
    for _ in range(10):
        try:
            row = await fetchrow(
                """
                INSERT INTO foods (id, name, slug, description, image_url)
                VALUES (gen_random_uuid(), $1, $2, $3, $4)
                RETURNING id, name, slug, description, image_url, created_at;
                """,
                name.strip(),
                candidate,
                description,
                image_url,
            )
            if row:
                return dict(row)
        except asyncpg.UniqueViolationError:
            candidate = f"{base_slug}-{uuid4().hex[:6]}"
    raise HTTPException(status_code=500, detail="Unable to create food")


async def add_vendor_dish(
    vendor_id: UUID,
    *,
    name: str,
    description: str | None,
    price: float | None,
    available: bool,
    image_url: str | None,
) -> dict[str, Any]:
    """Vendor-facing helper: ensure food exists in catalog, attach to vendor."""

    vendor = await fetchrow("SELECT id FROM vendors WHERE id = $1;", vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    food = await find_or_create_food(name=name, description=description, image_url=image_url)

    existing = await fetchrow(
        "SELECT id FROM vendor_items WHERE vendor_id = $1 AND food_id = $2;",
        vendor_id,
        food["id"],
    )
    if existing:
        raise HTTPException(status_code=409, detail="Dish already on this vendor")

    row = await fetchrow(
        """
        INSERT INTO vendor_items (id, vendor_id, food_id, ingredient_id, price, available)
        VALUES (gen_random_uuid(), $1, $2, NULL, $3, $4)
        RETURNING id, vendor_id, food_id, price, available;
        """,
        vendor_id,
        food["id"],
        price,
        available,
    )
    assert row is not None
    return {
        "id": row["id"],
        "vendor_id": row["vendor_id"],
        "food_id": row["food_id"],
        "ingredient_id": None,
        "food": {
            "id": food["id"],
            "name": food["name"],
            "slug": food["slug"],
            "description": food.get("description"),
            "image_url": food.get("image_url"),
            "created_at": food.get("created_at"),
        },
        "ingredient": None,
        "price": float(row["price"]) if row["price"] is not None else None,
        "available": row["available"],
        "item_type": "food",
    }


async def remove_vendor_item(vendor_id: UUID, item_id: UUID) -> None:
    """Remove a vendor item by vendor and item identifier."""

    result = await execute("DELETE FROM vendor_items WHERE id = $1 AND vendor_id = $2;", item_id, vendor_id)
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Vendor item not found")


async def update_vendor_item(
    vendor_id: UUID,
    item_id: UUID,
    fields: dict[str, Any],
) -> dict[str, Any]:
    """Update a vendor's dish: name/description on the linked food, price on the item."""

    item_row = await fetchrow(
        "SELECT id, vendor_id, food_id, ingredient_id FROM vendor_items WHERE id = $1 AND vendor_id = $2;",
        item_id,
        vendor_id,
    )
    if not item_row:
        raise HTTPException(status_code=404, detail="Vendor item not found")
    if item_row["food_id"] is None:
        raise HTTPException(status_code=400, detail="Only food items can be edited via this endpoint")

    food_updates: dict[str, Any] = {}
    if "name" in fields and fields["name"] is not None:
        food_updates["name"] = str(fields["name"]).strip()
    if "description" in fields:
        food_updates["description"] = fields["description"]

    if food_updates:
        params: list[Any] = []
        set_clauses = [f"{col} = {bind_param(params, value)}" for col, value in food_updates.items()]
        food_id_placeholder = bind_param(params, item_row["food_id"])
        await execute(
            f"UPDATE foods SET {', '.join(set_clauses)} WHERE id = {food_id_placeholder};",
            *params,
        )

    if "price" in fields:
        await execute(
            "UPDATE vendor_items SET price = $1 WHERE id = $2;",
            fields["price"],
            item_id,
        )

    refreshed = await fetchrow(
        """
        SELECT
            vi.id,
            vi.vendor_id,
            vi.food_id AS vendor_food_id,
            vi.ingredient_id AS vendor_ingredient_id,
            vi.price,
            vi.available,
            f.id AS food_id,
            f.name AS food_name,
            f.slug AS food_slug,
            f.description AS food_description,
            f.image_url AS food_image_url,
            f.created_at AS food_created_at
        FROM vendor_items vi
        LEFT JOIN foods f ON f.id = vi.food_id
        WHERE vi.id = $1;
        """,
        item_id,
    )
    assert refreshed is not None
    return _row_to_vendor_item(dict(refreshed))


async def get_vendor_by_id(vendor_id: UUID) -> dict[str, Any]:
    """Fetch a vendor by primary key."""

    row = await fetchrow(
        """
        SELECT
            id, name, slug, type, address,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            phone, website, image_url, is_verified, is_featured, created_at
        FROM vendors
        WHERE id = $1;
        """,
        vendor_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return _row_to_vendor_summary(dict(row))


async def list_admin_vendors() -> list[dict[str, Any]]:
    """Return all vendors including unverified entries."""

    return await list_vendors(page=1, page_size=10_000)


ALLOWED_VENDOR_UPDATE_COLUMNS = {"name", "type", "address", "phone", "website"}


async def update_vendor(vendor_id: UUID, fields: dict[str, Any]) -> dict[str, Any]:
    """Partial-update a vendor and return the summary record."""

    filtered = {k: v for k, v in fields.items() if k in ALLOWED_VENDOR_UPDATE_COLUMNS}
    if not filtered:
        return await get_vendor_by_id(vendor_id)

    params: list[Any] = []
    set_clauses = [f"{col} = {bind_param(params, value)}" for col, value in filtered.items()]
    id_placeholder = bind_param(params, vendor_id)

    sql = f"""
        UPDATE vendors
        SET {", ".join(set_clauses)}
        WHERE id = {id_placeholder}
        RETURNING
            id, name, slug, type, address,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            phone, website, image_url, is_verified, is_featured, created_at;
    """
    row = await fetchrow(sql, *params)
    if not row:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return _row_to_vendor_summary(dict(row))


async def update_vendor_image(vendor_id: UUID, image_url: str) -> dict[str, Any]:
    """Update a vendor's listing image and return the summary record."""

    row = await fetchrow(
        """
        UPDATE vendors
        SET image_url = $2
        WHERE id = $1
        RETURNING
            id, name, slug, type, address,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            phone, website, image_url, is_verified, is_featured, created_at;
        """,
        vendor_id,
        image_url,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return _row_to_vendor_summary(dict(row))


async def verify_vendor(vendor_id: UUID) -> dict[str, Any]:
    """Mark a vendor as verified and return the updated record."""

    row = await fetchrow(
        """
        UPDATE vendors
        SET is_verified = true
        WHERE id = $1
        RETURNING
            id, name, slug, type, address,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            phone, website, image_url, is_verified, is_featured, created_at;
        """,
        vendor_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return _row_to_vendor_summary(dict(row))


async def toggle_vendor_feature(vendor_id: UUID) -> dict[str, Any]:
    """Toggle the featured flag on a vendor and return the updated record."""

    row = await fetchrow(
        """
        UPDATE vendors
        SET is_featured = NOT is_featured
        WHERE id = $1
        RETURNING
            id, name, slug, type, address,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            phone, website, image_url, is_verified, is_featured, created_at;
        """,
        vendor_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return _row_to_vendor_summary(dict(row))


async def delete_vendor(vendor_id: UUID) -> None:
    """Delete a vendor by identifier."""

    result = await execute("DELETE FROM vendors WHERE id = $1;", vendor_id)
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Vendor not found")
