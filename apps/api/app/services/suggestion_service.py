from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException
from slugify import slugify

from app.core.database import execute, fetch, fetchrow
from app.schemas.food import FoodCreateIn
from app.schemas.suggestion import FoodSuggestionCreate
from app.services.admin_management_service import create_food_admin

_SUGGESTION_SELECT = """
    SELECT
        s.id, s.name, s.description, s.region, s.image_url, s.recipe_link, s.note,
        s.status, s.created_at, s.reviewed_at,
        u.email AS suggested_by_email,
        f.slug AS created_food_slug
    FROM food_suggestions s
    LEFT JOIN users u ON u.id = s.suggested_by
    LEFT JOIN foods f ON f.id = s.created_food_id
"""


def _payload(row: Any) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "region": row["region"],
        "image_url": row["image_url"],
        "recipe_link": row["recipe_link"],
        "note": row["note"],
        "status": row["status"],
        "suggested_by_email": row["suggested_by_email"],
        "created_food_slug": row["created_food_slug"],
        "created_at": row["created_at"],
        "reviewed_at": row["reviewed_at"],
    }


async def _get_suggestion(suggestion_id: UUID) -> dict[str, Any]:
    row = await fetchrow(f"{_SUGGESTION_SELECT} WHERE s.id = $1;", suggestion_id)
    if not row:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return _payload(row)


async def create_suggestion(user_id: UUID, payload: FoodSuggestionCreate) -> dict[str, Any]:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name is required")
    row = await fetchrow(
        """
        INSERT INTO food_suggestions (id, name, description, region, image_url, recipe_link, note, suggested_by)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
        """,
        name,
        payload.description,
        payload.region,
        payload.image_url,
        payload.recipe_link,
        payload.note,
        user_id,
    )
    return await _get_suggestion(row["id"])


async def list_my_suggestions(user_id: UUID) -> list[dict[str, Any]]:
    rows = await fetch(f"{_SUGGESTION_SELECT} WHERE s.suggested_by = $1 ORDER BY s.created_at DESC;", user_id)
    return [_payload(r) for r in rows]


async def list_suggestions_admin(status: str | None, page: int, page_size: int) -> list[dict[str, Any]]:
    params: list[Any] = []
    where = ""
    if status:
        if status not in {"pending", "accepted", "declined"}:
            raise HTTPException(status_code=422, detail="Invalid status filter")
        params.append(status)
        where = f"WHERE s.status = ${len(params)}"
    offset = max(page - 1, 0) * page_size
    params.append(page_size)
    params.append(offset)
    sql = f"{_SUGGESTION_SELECT} {where} ORDER BY s.created_at DESC LIMIT ${len(params) - 1} OFFSET ${len(params)};"
    rows = await fetch(sql, *params)
    return [_payload(r) for r in rows]


async def accept_suggestion(suggestion_id: UUID) -> dict[str, Any]:
    """Accept a pending suggestion: create the catalog food, then mark accepted.

    If a food with the same slug already exists, link to it rather than failing —
    the dish is in the catalog either way, which is the moderator's intent.
    """
    suggestion = await fetchrow("SELECT * FROM food_suggestions WHERE id = $1;", suggestion_id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if suggestion["status"] != "pending":
        raise HTTPException(status_code=409, detail="Suggestion already reviewed")

    slug = slugify(suggestion["name"])
    existing = await fetchrow("SELECT id FROM foods WHERE slug = $1;", slug)
    if existing:
        food_id = str(existing["id"])
    else:
        food = await create_food_admin(
            FoodCreateIn(
                name=suggestion["name"],
                description=suggestion["description"],
                region=suggestion["region"],
                image_url=suggestion["image_url"],
                recipe_link=suggestion["recipe_link"],
            )
        )
        food_id = str(food["id"])

    await execute(
        "UPDATE food_suggestions SET status = 'accepted', created_food_id = $2::uuid, reviewed_at = now() WHERE id = $1;",
        suggestion_id,
        food_id,
    )
    return await _get_suggestion(suggestion_id)


async def decline_suggestion(suggestion_id: UUID) -> dict[str, Any]:
    suggestion = await fetchrow("SELECT status FROM food_suggestions WHERE id = $1;", suggestion_id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if suggestion["status"] != "pending":
        raise HTTPException(status_code=409, detail="Suggestion already reviewed")
    await execute(
        "UPDATE food_suggestions SET status = 'declined', reviewed_at = now() WHERE id = $1;",
        suggestion_id,
    )
    return await _get_suggestion(suggestion_id)
