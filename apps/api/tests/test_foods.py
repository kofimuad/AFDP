from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_list_foods_returns_list(client) -> None:
    response = await client.get("/api/v1/foods")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_food_by_slug_returns_ingredients(client) -> None:
    response = await client.get("/api/v1/foods/jollof-rice")

    assert response.status_code == 200
    payload = response.json()
    assert payload["slug"] == "jollof-rice"
    assert len(payload["ingredients"]) >= 1


@pytest.mark.asyncio
async def test_get_food_includes_recipe_links(client) -> None:
    response = await client.get("/api/v1/foods/jollof-rice")

    assert response.status_code == 200
    payload = response.json()
    assert "recipe_links" in payload
    links = payload["recipe_links"]
    assert isinstance(links, list)
    assert len(links) >= 1

    # Exactly one primary, and every link carries a usable url + valid source type.
    primary = [link for link in links if link["is_primary"]]
    assert len(primary) == 1
    for link in links:
        assert link["url"]
        assert link["source_type"] in {"youtube", "article"}


# DMV coordinates near the seeded grocery stores.
DMV_LAT, DMV_LNG = 38.9072, -77.0369


@pytest.mark.asyncio
async def test_ingredient_stores_returns_nearby_per_ingredient(client) -> None:
    response = await client.get(
        "/api/v1/foods/jollof-rice/ingredient-stores",
        params={"lat": DMV_LAT, "lng": DMV_LNG, "radius_km": 50},
    )

    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) >= 1

    for item in items:
        assert "ingredient" in item and item["ingredient"]["slug"]
        assert isinstance(item["available_nearby"], bool)
        assert isinstance(item["stores"], list)
        assert isinstance(item["fallback_stores"], list)

    # At least one ingredient is stocked nearby, and its stores carry a slug +
    # distance so the UI can link to the store profile and show how far it is.
    stocked = [i for i in items if i["available_nearby"]]
    assert len(stocked) >= 1
    store = stocked[0]["stores"][0]
    assert store["slug"]
    assert store["distance_km"] is not None


@pytest.mark.asyncio
async def test_ingredient_stores_falls_back_when_none_in_radius(client) -> None:
    # A tiny radius pushes every store out of range, so results should come back
    # as fallbacks (closest alternative) rather than nearby matches.
    response = await client.get(
        "/api/v1/foods/jollof-rice/ingredient-stores",
        params={"lat": DMV_LAT, "lng": DMV_LNG, "radius_km": 0.1},
    )

    assert response.status_code == 200
    items = response.json()
    assert all(i["available_nearby"] is False for i in items)
    assert all(i["stores"] == [] for i in items)
    # Ingredients that are stocked anywhere surface a closest-alternative fallback.
    assert any(len(i["fallback_stores"]) > 0 for i in items)


@pytest.mark.asyncio
async def test_ingredient_stores_unknown_food_404(client) -> None:
    response = await client.get(
        "/api/v1/foods/not-a-real-dish/ingredient-stores",
        params={"lat": DMV_LAT, "lng": DMV_LNG},
    )
    assert response.status_code == 404
