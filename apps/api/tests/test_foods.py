from __future__ import annotations

import uuid

import pytest

from app.core.database import execute


async def _admin_headers(client) -> dict[str, str]:
    """Register a user, promote to admin in the DB, return an auth header."""
    email = f"chef-admin-{uuid.uuid4().hex[:10]}@example.com"
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Recipe Admin", "password": "password123"},
    )
    assert res.status_code in (200, 201), res.text
    body = res.json()
    await execute("UPDATE users SET role = 'admin' WHERE id = $1;", uuid.UUID(body["user"]["id"]))
    return {"Authorization": f"Bearer {body['access_token']}"}


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
async def test_food_detail_has_servings_and_structured_quantities(client) -> None:
    response = await client.get("/api/v1/foods/jollof-rice")
    assert response.status_code == 200
    payload = response.json()

    assert isinstance(payload["servings"], int) and payload["servings"] > 0
    # At least one ingredient carries a structured quantity + unit (not just a note).
    structured = [
        i for i in payload["ingredients"] if i.get("quantity") is not None and i.get("unit")
    ]
    assert len(structured) >= 1
    assert structured[0]["quantity_note"]  # free-text note still present alongside


@pytest.mark.asyncio
async def test_admin_can_create_recipe(client) -> None:
    headers = await _admin_headers(client)
    slug = f"test-dish-{uuid.uuid4().hex[:8]}"
    payload = {
        "name": slug.replace("-", " ").title(),
        "description": "An admin-created test dish.",
        "region": "West African",
        "cuisines": ["Nigerian"],
        "prep_minutes": 15,
        "cook_minutes": 30,
        "servings": 4,
        "ingredients": [
            {"name": "Yam", "quantity": 1, "unit": "tuber", "quantity_note": "1 medium"},
            {"name": "Palm oil", "quantity": 0.25, "unit": "cup"},
            {"name": "Scotch bonnet pepper", "quantity": 2, "unit": None, "quantity_note": "blended"},
        ],
    }
    res = await client.post("/api/v1/admin/manage/recipes", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["servings"] == 4
    assert body["cuisines"] == ["Nigerian"]
    assert len(body["ingredients"]) == 3
    assert any(i["quantity"] == 1 and i["unit"] == "tuber" for i in body["ingredients"])

    # The new recipe is now in the catalog.
    fetched = await client.get(f"/api/v1/foods/{body['slug']}")
    assert fetched.status_code == 200


@pytest.mark.asyncio
async def test_admin_food_crud(client) -> None:
    headers = await _admin_headers(client)
    name = f"Admin Test Stew {uuid.uuid4().hex[:6]}"

    # Create
    created = await client.post(
        "/api/v1/admin/manage/foods",
        json={
            "name": name,
            "description": "A test dish.",
            "region": "West African",
            "image_url": "https://example.com/x.jpg",
            "recipe_link": "https://www.youtube.com/watch?v=abc123",
        },
        headers=headers,
    )
    assert created.status_code == 201, created.text
    food = created.json()
    slug = food["slug"]
    assert food["region"] == "West African"
    assert "youtube.com" in food["recipe_link"]

    # Appears in the admin list and the public catalog
    listed = (await client.get("/api/v1/admin/manage/foods", headers=headers)).json()
    assert any(f["slug"] == slug for f in listed)
    public = await client.get(f"/api/v1/foods/{slug}")
    assert public.status_code == 200
    assert any(rl["is_primary"] and rl["source_type"] == "youtube" for rl in public.json()["recipe_links"])

    # Update
    upd = await client.patch(
        f"/api/v1/admin/manage/foods/{slug}",
        json={"description": "Updated description.", "region": "East African"},
        headers=headers,
    )
    assert upd.status_code == 200
    assert upd.json()["description"] == "Updated description."
    assert upd.json()["region"] == "East African"

    # Delete
    assert (await client.delete(f"/api/v1/admin/manage/foods/{slug}", headers=headers)).status_code == 200
    assert (await client.get(f"/api/v1/foods/{slug}")).status_code == 404


@pytest.mark.asyncio
async def test_admin_food_endpoints_require_admin(client) -> None:
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": f"u-{uuid.uuid4().hex[:10]}@example.com", "full_name": "Plain User", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    res = await client.post("/api/v1/admin/manage/foods", json={"name": "Nope"}, headers=headers)
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_create_recipe_requires_admin(client) -> None:
    # A normal (non-admin) user is forbidden.
    email = f"plain-{uuid.uuid4().hex[:10]}@example.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Plain User", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    res = await client.post(
        "/api/v1/admin/manage/recipes",
        json={"name": "Sneaky Dish", "ingredients": []},
        headers=headers,
    )
    assert res.status_code == 403


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
async def test_food_restaurants_expose_delivery_flag(client) -> None:
    response = await client.get("/api/v1/foods/jollof-rice")

    assert response.status_code == 200
    restaurants = response.json()["restaurants"]
    assert len(restaurants) >= 1
    # Tri-state: True (delivers), False (no delivery), None (unknown — never guessed).
    for vendor in restaurants:
        assert vendor["delivery_available"] in (True, False, None)
    # At least one seeded restaurant is known to deliver, so the badge has data.
    assert any(vendor["delivery_available"] is True for vendor in restaurants)


@pytest.mark.asyncio
async def test_ingredient_stores_unknown_food_404(client) -> None:
    response = await client.get(
        "/api/v1/foods/not-a-real-dish/ingredient-stores",
        params={"lat": DMV_LAT, "lng": DMV_LNG},
    )
    assert response.status_code == 404
