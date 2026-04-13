from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_search_returns_food_match_and_restaurants(client) -> None:
    response = await client.get(
        "/api/v1/search",
        params={"q": "Jollof Rice", "lat": 38.9072, "lng": -77.0369, "radius_km": 20},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["food_match"]["slug"] == "jollof-rice"
    assert len(payload["restaurants"]) >= 1
    assert response.headers["x-cache"] in {"HIT", "MISS"}


@pytest.mark.asyncio
async def test_search_unknown_food_returns_empty_results(client) -> None:
    response = await client.get(
        "/api/v1/search",
        params={"q": "Unknown Food", "lat": 38.9072, "lng": -77.0369, "radius_km": 20},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["food_match"] is None
    assert payload["restaurants"] == []
    assert payload["ingredients"] == []
