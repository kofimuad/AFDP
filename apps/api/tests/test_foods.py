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
