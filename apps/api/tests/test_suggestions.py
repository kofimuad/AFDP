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
            "ingredients": [
                {"name": "Egusi seeds", "quantity_note": "2 cups"},
                {"name": "Palm oil", "quantity_note": "to taste"},
                {"name": "", "quantity_note": "ignored blank"},
            ],
        },
        headers=user_h,
    )
    assert res.status_code == 201, res.text
    sug = res.json()
    assert sug["status"] == "pending"
    # Blank ingredient lines are dropped.
    assert [i["name"] for i in sug["ingredients"]] == ["Egusi seeds", "Palm oil"]
    sid = sug["id"]

    # Submitter sees it in their list.
    mine = await client.get("/api/v1/food-suggestions/mine", headers=user_h)
    assert any(s["id"] == sid for s in mine.json())

    # Admin sees it in the pending queue.
    admin_h = await _admin(client)
    queue = await client.get("/api/v1/admin/manage/food-suggestions?status=pending", headers=admin_h)
    assert any(s["id"] == sid for s in queue.json())

    # Admin edits the ingredient list before accepting.
    edit = await client.patch(
        f"/api/v1/admin/manage/food-suggestions/{sid}",
        json={"ingredients": [
            {"name": "Egusi seeds", "quantity_note": "2 cups"},
            {"name": "Spinach", "quantity_note": "1 bunch"},
        ]},
        headers=admin_h,
    )
    assert edit.status_code == 200, edit.text
    assert {i["name"] for i in edit.json()["ingredients"]} == {"Egusi seeds", "Spinach"}

    # Accept → creates the catalog food.
    acc = await client.patch(f"/api/v1/admin/manage/food-suggestions/{sid}/accept", headers=admin_h)
    assert acc.status_code == 200, acc.text
    assert acc.json()["status"] == "accepted"
    slug = acc.json()["created_food_slug"]
    assert slug
    detail = await client.get(f"/api/v1/foods/{slug}")
    assert detail.status_code == 200
    # Edited ingredients carried onto the catalog food.
    names = {i["ingredient"]["name"] for i in detail.json()["ingredients"]}
    assert {"Egusi seeds", "Spinach"} <= names

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
