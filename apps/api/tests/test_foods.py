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
