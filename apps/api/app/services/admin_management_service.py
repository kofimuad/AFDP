"""Admin management service: user and vendor administration for JWT admin users."""

from __future__ import annotations

import json
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from slugify import slugify

from app.core.database import execute, fetch, fetchrow
from app.schemas.food import FoodCreateIn, FoodUpdateIn
from app.services.food_service import link_food_ingredient

ALLOWED_ROLES = {"user", "vendor", "admin"}
ALLOWED_PLANS = {"basic", "featured", "premium"}


async def list_users(
    *,
    q: str | None = None,
    role: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> list[dict[str, Any]]:
    """List users with optional search by email/name and role filter."""

    params: list[Any] = []
    clauses: list[str] = []
    if q:
        params.append(f"%{q.lower()}%")
        clauses.append(f"(LOWER(email) LIKE ${len(params)} OR LOWER(full_name) LIKE ${len(params)})")
    if role:
        if role not in ALLOWED_ROLES:
            raise HTTPException(status_code=422, detail="Invalid role filter")
        params.append(role)
        clauses.append(f"role = ${len(params)}")

    where = " AND ".join(clauses) if clauses else "TRUE"
    offset = max(page - 1, 0) * page_size
    params.append(page_size)
    params.append(offset)
    sql = f"""
        SELECT id, email, full_name, role, vendor_id, is_active, created_at, profile_image_url
        FROM users
        WHERE {where}
        ORDER BY created_at DESC
        LIMIT ${len(params) - 1} OFFSET ${len(params)};
    """
    rows = await fetch(sql, *params)
    return [
        {
            "id": str(r["id"]),
            "email": r["email"],
            "full_name": r["full_name"],
            "role": r["role"],
            "vendor_id": str(r["vendor_id"]) if r["vendor_id"] else None,
            "is_active": r["is_active"],
            "created_at": r["created_at"],
            "profile_image_url": r["profile_image_url"],
        }
        for r in rows
    ]


async def update_user_role(user_id: UUID, role: str) -> dict[str, Any]:
    """Update a user's role."""

    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=422, detail="Invalid role")
    row = await fetchrow(
        """
        UPDATE users SET role = $2 WHERE id = $1
        RETURNING id, email, full_name, role, vendor_id, is_active, created_at, profile_image_url;
        """,
        user_id,
        role,
    )
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "vendor_id": str(row["vendor_id"]) if row["vendor_id"] else None,
        "is_active": row["is_active"],
        "created_at": row["created_at"],
        "profile_image_url": row["profile_image_url"],
    }


async def set_user_active(user_id: UUID, is_active: bool) -> dict[str, Any]:
    """Activate or deactivate a user."""

    row = await fetchrow(
        """
        UPDATE users SET is_active = $2 WHERE id = $1
        RETURNING id, email, full_name, role, vendor_id, is_active, created_at, profile_image_url;
        """,
        user_id,
        is_active,
    )
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "vendor_id": str(row["vendor_id"]) if row["vendor_id"] else None,
        "is_active": row["is_active"],
        "created_at": row["created_at"],
        "profile_image_url": row["profile_image_url"],
    }


async def list_all_vendors(
    *,
    q: str | None = None,
    is_verified: bool | None = None,
    plan: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> list[dict[str, Any]]:
    """List all vendors with admin filters including plan."""

    params: list[Any] = []
    clauses: list[str] = []
    if q:
        params.append(f"%{q.lower()}%")
        clauses.append(f"(LOWER(name) LIKE ${len(params)} OR LOWER(address) LIKE ${len(params)})")
    if is_verified is not None:
        params.append(is_verified)
        clauses.append(f"is_verified = ${len(params)}")
    if plan:
        if plan not in ALLOWED_PLANS:
            raise HTTPException(status_code=422, detail="Invalid plan filter")
        params.append(plan)
        clauses.append(f"plan = ${len(params)}")

    where = " AND ".join(clauses) if clauses else "TRUE"
    offset = max(page - 1, 0) * page_size
    params.append(page_size)
    params.append(offset)
    sql = f"""
        SELECT
            id, name, slug, type, address,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            phone, website, image_url, is_verified, is_featured, delivery_available, created_at,
            plan, plan_expires_at
        FROM vendors
        WHERE {where}
        ORDER BY created_at DESC
        LIMIT ${len(params) - 1} OFFSET ${len(params)};
    """
    rows = await fetch(sql, *params)
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "slug": r["slug"],
            "type": r["type"],
            "address": r["address"],
            "lat": r["lat"],
            "lng": r["lng"],
            "phone": r["phone"],
            "website": r["website"],
            "image_url": r["image_url"],
            "is_verified": r["is_verified"],
            "is_featured": r["is_featured"],
            "delivery_available": r["delivery_available"],
            "created_at": r["created_at"],
            "plan": r["plan"],
            "plan_expires_at": r["plan_expires_at"],
        }
        for r in rows
    ]


async def update_vendor_plan(vendor_id: UUID, plan: str) -> dict[str, Any]:
    """Override a vendor's plan."""

    if plan not in ALLOWED_PLANS:
        raise HTTPException(status_code=422, detail="Invalid plan")
    row = await fetchrow(
        """
        UPDATE vendors SET plan = $2::vendor_plan WHERE id = $1
        RETURNING id, name, slug, plan, plan_expires_at;
        """,
        vendor_id,
        plan,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "slug": row["slug"],
        "plan": row["plan"],
        "plan_expires_at": row["plan_expires_at"],
    }


# ── Admin food management ──────────────────────────────────────────────────

_ADMIN_FOOD_SELECT = """
    SELECT
        f.id, f.name, f.slug, f.description, f.image_url, f.created_at,
        (SELECT r.name FROM food_regions fr JOIN regions r ON r.id = fr.region_id
         WHERE fr.food_id = f.id ORDER BY r.name LIMIT 1) AS region,
        (SELECT rl.url FROM recipe_links rl WHERE rl.food_id = f.id
         ORDER BY rl.is_primary DESC, rl.created_at ASC LIMIT 1) AS recipe_link,
        (SELECT COALESCE(
            json_agg(json_build_object('name', i.name, 'quantity_note', fi.quantity_note)
                     ORDER BY i.name),
            '[]')
         FROM food_ingredients fi JOIN ingredients i ON i.id = fi.ingredient_id
         WHERE fi.food_id = f.id) AS ingredients
    FROM foods f
"""


def _detect_source_type(url: str) -> str:
    u = url.lower()
    return "youtube" if ("youtube.com" in u or "youtu.be" in u) else "article"


def _parse_food_ingredients(raw: Any) -> list[dict[str, Any]]:
    """json_agg returns a JSON string (no asyncpg codec registered)."""
    if not raw:
        return []
    data = json.loads(raw) if isinstance(raw, str) else raw
    return [
        {"name": item.get("name"), "quantity_note": item.get("quantity_note")}
        for item in data
        if isinstance(item, dict) and item.get("name")
    ]


def _admin_food_payload(row: Any) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "slug": row["slug"],
        "description": row["description"],
        "region": row["region"],
        "image_url": row["image_url"],
        "recipe_link": row["recipe_link"],
        "ingredients": _parse_food_ingredients(row["ingredients"]),
        "created_at": row["created_at"],
    }


async def _set_food_region(food_id: UUID, region_name: str | None) -> None:
    """Set (or, with a blank string, clear) the food's single region."""
    if region_name is None:
        return
    region_name = region_name.strip()
    await execute("DELETE FROM food_regions WHERE food_id = $1;", food_id)
    if not region_name:
        return
    region = await fetchrow(
        "INSERT INTO regions (id, name) VALUES (gen_random_uuid(), $1) "
        "ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id;",
        region_name,
    )
    await execute(
        "INSERT INTO food_regions (food_id, region_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;",
        food_id,
        region["id"],
    )


async def _replace_food_ingredients(food_id: UUID, ingredients: list[Any], replace: bool = False) -> None:
    """Attach the given ingredient lines to a food.

    With ``replace=True`` the food's existing ingredients are cleared first, so an
    admin edit reflects exactly the list on the form (adds, edits, and removals).
    Each line is matched/created by name via the shared food_service helper.
    """
    if replace:
        await execute("DELETE FROM food_ingredients WHERE food_id = $1;", food_id)
    for ing in ingredients:
        await link_food_ingredient(food_id, ing.name, quantity_note=ing.quantity_note)


async def _set_food_primary_recipe_link(food_id: UUID, food_name: str, url: str | None) -> None:
    """Set the food's primary recipe link (YouTube/article detected from the URL)."""
    if url is None:
        return
    url = url.strip()
    if not url:
        return
    await execute("UPDATE recipe_links SET is_primary = false WHERE food_id = $1;", food_id)
    await execute(
        """
        INSERT INTO recipe_links (id, food_id, url, source_type, title, is_primary, last_checked)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, true, now())
        ON CONFLICT (food_id, url) DO UPDATE SET
            source_type = EXCLUDED.source_type,
            title = EXCLUDED.title,
            is_primary = true,
            last_checked = now();
        """,
        food_id,
        url,
        _detect_source_type(url),
        f"{food_name} recipe",
    )


async def get_admin_food(slug: str) -> dict[str, Any] | None:
    row = await fetchrow(f"{_ADMIN_FOOD_SELECT} WHERE f.slug = $1;", slug)
    return _admin_food_payload(row) if row else None


async def list_foods_admin(q: str | None, page: int, page_size: int) -> list[dict[str, Any]]:
    """List catalog foods for the admin table, newest first, optional name search."""
    params: list[Any] = []
    where = ""
    if q:
        params.append(f"%{q.lower()}%")
        where = f"WHERE LOWER(f.name) LIKE ${len(params)}"
    offset = max(page - 1, 0) * page_size
    params.append(page_size)
    params.append(offset)
    sql = f"{_ADMIN_FOOD_SELECT} {where} ORDER BY f.created_at DESC LIMIT ${len(params) - 1} OFFSET ${len(params)};"
    rows = await fetch(sql, *params)
    return [_admin_food_payload(r) for r in rows]


async def create_food_admin(payload: FoodCreateIn) -> dict[str, Any]:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name is required")
    slug = slugify(name)
    if await fetchrow("SELECT id FROM foods WHERE slug = $1;", slug):
        raise HTTPException(status_code=409, detail="A food with this name already exists")
    food = await fetchrow(
        "INSERT INTO foods (id, name, slug, description, image_url) "
        "VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id;",
        name,
        slug,
        payload.description,
        payload.image_url,
    )
    await _set_food_region(food["id"], payload.region)
    await _set_food_primary_recipe_link(food["id"], name, payload.recipe_link)
    await _replace_food_ingredients(food["id"], payload.ingredients)
    return await get_admin_food(slug)  # type: ignore[return-value]


async def update_food_admin(slug: str, payload: FoodUpdateIn) -> dict[str, Any]:
    """Update a food. Slug stays fixed (it identifies the food and backs saved links)."""
    food = await fetchrow("SELECT id, name FROM foods WHERE slug = $1;", slug)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    new_name = payload.name.strip() if payload.name else None
    await execute(
        """
        UPDATE foods SET
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            image_url = COALESCE($4, image_url)
        WHERE id = $1;
        """,
        food["id"],
        new_name,
        payload.description,
        payload.image_url,
    )
    await _set_food_region(food["id"], payload.region)
    await _set_food_primary_recipe_link(food["id"], new_name or food["name"], payload.recipe_link)
    if payload.ingredients is not None:
        await _replace_food_ingredients(food["id"], payload.ingredients, replace=True)
    return await get_admin_food(slug)  # type: ignore[return-value]


async def delete_food_admin(slug: str) -> None:
    result = await execute("DELETE FROM foods WHERE slug = $1;", slug)
    if result.endswith(" 0"):
        raise HTTPException(status_code=404, detail="Food not found")
