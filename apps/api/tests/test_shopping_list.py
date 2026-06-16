from __future__ import annotations

import uuid

import pytest

DMV_LAT, DMV_LNG = 38.9072, -77.0369


async def _register(client) -> dict[str, str]:
    email = f"shopper-{uuid.uuid4().hex[:10]}@example.com"
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Test Shopper", "password": "password123"},
    )
    assert res.status_code in (200, 201), res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.mark.asyncio
async def test_shopping_list_requires_auth(client) -> None:
    assert (await client.get("/api/v1/shopping-list")).status_code == 401


@pytest.mark.asyncio
async def test_add_recipe_builds_checkable_list(client) -> None:
    headers = await _register(client)

    # Starts empty
    empty = await client.get("/api/v1/shopping-list", headers=headers)
    assert empty.status_code == 200
    assert empty.json()["total"] == 0

    # AC1: one tap turns a recipe's ingredients into a list
    add = await client.post("/api/v1/shopping-list/recipes/jollof-rice", headers=headers)
    assert add.status_code == 200
    result = add.json()
    assert result["added"] >= 1
    first_total = result["total"]

    listed = (await client.get("/api/v1/shopping-list", headers=headers)).json()
    assert listed["total"] == first_total
    assert len(listed["items"]) == first_total
    for item in listed["items"]:
        assert item["ingredient"]["slug"]
        assert item["checked"] is False

    # AC4: check an item off — it persists
    item_id = listed["items"][0]["id"]
    checked = await client.patch(
        f"/api/v1/shopping-list/items/{item_id}", json={"checked": True}, headers=headers
    )
    assert checked.status_code == 200
    assert checked.json()["checked"] is True
    after = (await client.get("/api/v1/shopping-list", headers=headers)).json()
    assert after["checked_count"] == 1


@pytest.mark.asyncio
async def test_list_combines_recipes_without_duplicates(client) -> None:
    headers = await _register(client)

    await client.post("/api/v1/shopping-list/recipes/jollof-rice", headers=headers)
    t1 = (await client.get("/api/v1/shopping-list", headers=headers)).json()["total"]

    # Adding the same recipe again is a no-op (deduped)
    again = await client.post("/api/v1/shopping-list/recipes/jollof-rice", headers=headers)
    assert again.json()["added"] == 0
    assert again.json()["total"] == t1

    # AC2: a second recipe combines in; shared ingredients are not duplicated
    await client.post("/api/v1/shopping-list/recipes/egusi-soup", headers=headers)
    listed = (await client.get("/api/v1/shopping-list", headers=headers)).json()
    ingredient_ids = [it["ingredient"]["id"] for it in listed["items"]]
    assert len(ingredient_ids) == len(set(ingredient_ids))  # no duplicates
    assert listed["total"] >= t1


@pytest.mark.asyncio
async def test_best_stores_rank_by_coverage_then_proximity(client) -> None:
    headers = await _register(client)
    await client.post("/api/v1/shopping-list/recipes/jollof-rice", headers=headers)

    res = await client.get(
        "/api/v1/shopping-list/stores",
        params={"lat": DMV_LAT, "lng": DMV_LNG, "radius_km": 50},
        headers=headers,
    )
    assert res.status_code == 200
    stores = res.json()
    assert len(stores) >= 1

    covered = [s["items_covered"] for s in stores]
    assert covered == sorted(covered, reverse=True)  # AC3: ranked by coverage
    top = stores[0]
    assert 1 <= top["items_covered"] <= top["total_items"]
    assert top["store"]["slug"]
    assert top["store"]["distance_km"] is not None


@pytest.mark.asyncio
async def test_remove_and_clear(client) -> None:
    headers = await _register(client)
    await client.post("/api/v1/shopping-list/recipes/jollof-rice", headers=headers)

    listed = (await client.get("/api/v1/shopping-list", headers=headers)).json()
    item_id = listed["items"][0]["id"]

    removed = await client.delete(f"/api/v1/shopping-list/items/{item_id}", headers=headers)
    assert removed.status_code == 200
    after = (await client.get("/api/v1/shopping-list", headers=headers)).json()
    assert all(it["id"] != item_id for it in after["items"])

    cleared = await client.delete("/api/v1/shopping-list", headers=headers)
    assert cleared.status_code == 200
    assert (await client.get("/api/v1/shopping-list", headers=headers)).json()["total"] == 0
