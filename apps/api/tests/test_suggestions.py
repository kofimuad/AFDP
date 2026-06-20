from __future__ import annotations

import uuid

import pytest

from app.core.database import execute


async def _user(client) -> tuple[dict[str, str], str]:
    email = f"sug-{uuid.uuid4().hex[:10]}@example.com"
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Suggest User", "password": "password123"},
    )
    body = r.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


async def _admin(client) -> dict[str, str]:
    headers, uid = await _user(client)
    await execute("UPDATE users SET role = 'admin' WHERE id = $1;", uuid.UUID(uid))
    return headers


@pytest.mark.asyncio
async def test_suggestion_submit_then_admin_accept_creates_food(client) -> None:
    user_h, _ = await _user(client)
    name = f"Suggested Dish {uuid.uuid4().hex[:6]}"
    res = await client.post(
        "/api/v1/food-suggestions",
        json={
            "name": name,
            "description": "Looks great.",
            "region": "West African",
            "recipe_link": "https://www.youtube.com/watch?v=abc",
            "note": "Please add this!",
        },
        headers=user_h,
    )
    assert res.status_code == 201, res.text
    sug = res.json()
    assert sug["status"] == "pending"
    sid = sug["id"]

    # Submitter sees it in their list.
    mine = await client.get("/api/v1/food-suggestions/mine", headers=user_h)
    assert any(s["id"] == sid for s in mine.json())

    # Admin sees it in the pending queue.
    admin_h = await _admin(client)
    queue = await client.get("/api/v1/admin/manage/food-suggestions?status=pending", headers=admin_h)
    assert any(s["id"] == sid for s in queue.json())

    # Accept → creates the catalog food.
    acc = await client.patch(f"/api/v1/admin/manage/food-suggestions/{sid}/accept", headers=admin_h)
    assert acc.status_code == 200, acc.text
    assert acc.json()["status"] == "accepted"
    slug = acc.json()["created_food_slug"]
    assert slug
    assert (await client.get(f"/api/v1/foods/{slug}")).status_code == 200

    # Re-reviewing is rejected.
    assert (await client.patch(f"/api/v1/admin/manage/food-suggestions/{sid}/accept", headers=admin_h)).status_code == 409


@pytest.mark.asyncio
async def test_suggestion_decline_archives(client) -> None:
    user_h, _ = await _user(client)
    res = await client.post(
        "/api/v1/food-suggestions",
        json={"name": f"Decline Me {uuid.uuid4().hex[:6]}"},
        headers=user_h,
    )
    sid = res.json()["id"]
    admin_h = await _admin(client)
    dec = await client.patch(f"/api/v1/admin/manage/food-suggestions/{sid}/decline", headers=admin_h)
    assert dec.status_code == 200
    assert dec.json()["status"] == "declined"


@pytest.mark.asyncio
async def test_suggestion_auth_rules(client) -> None:
    # Anonymous cannot submit.
    assert (await client.post("/api/v1/food-suggestions", json={"name": "x"})).status_code == 401
    # A normal user cannot reach the moderation queue.
    user_h, _ = await _user(client)
    assert (await client.get("/api/v1/admin/manage/food-suggestions", headers=user_h)).status_code == 403
