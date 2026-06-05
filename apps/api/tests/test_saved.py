from __future__ import annotations

import uuid

import pytest


async def _register(client) -> dict[str, str]:
    """Register a throwaway user and return an auth header."""
    email = f"saver-{uuid.uuid4().hex[:10]}@example.com"
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Test Saver", "password": "password123"},
    )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_saved_requires_auth(client) -> None:
    response = await client.get("/api/v1/saved")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_save_list_and_unsave_food(client) -> None:
    headers = await _register(client)

    foods = await client.get("/api/v1/foods")
    assert foods.status_code == 200
    food_list = foods.json()
    if not food_list:
        pytest.skip("no seeded foods to save")
    slug = food_list[0]["slug"]

    # Starts empty
    empty = await client.get("/api/v1/saved", headers=headers)
    assert empty.status_code == 200
    assert empty.json()["foods"] == []

    # Save
    saved = await client.post(f"/api/v1/saved/foods/{slug}", headers=headers)
    assert saved.status_code == 200
    assert saved.json()["status"] == "saved"

    # Appears in the collection
    listed = await client.get("/api/v1/saved", headers=headers)
    assert any(f["slug"] == slug for f in listed.json()["foods"])

    # Saving again is idempotent (no duplicate)
    again = await client.post(f"/api/v1/saved/foods/{slug}", headers=headers)
    assert again.status_code == 200
    listed_again = await client.get("/api/v1/saved", headers=headers)
    assert sum(1 for f in listed_again.json()["foods"] if f["slug"] == slug) == 1

    # Unsave
    removed = await client.delete(f"/api/v1/saved/foods/{slug}", headers=headers)
    assert removed.status_code == 200
    assert removed.json()["status"] == "removed"

    final = await client.get("/api/v1/saved", headers=headers)
    assert all(f["slug"] != slug for f in final.json()["foods"])


@pytest.mark.asyncio
async def test_save_unknown_food_returns_404(client) -> None:
    headers = await _register(client)
    res = await client.post("/api/v1/saved/foods/not-a-real-dish", headers=headers)
    assert res.status_code == 404
