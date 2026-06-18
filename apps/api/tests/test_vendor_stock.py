from __future__ import annotations

import uuid

import pytest


async def _register_vendor(client) -> tuple[dict[str, str], str]:
    """Register a grocery vendor; return (auth header, vendor_id)."""
    email = f"store-{uuid.uuid4().hex[:10]}@example.com"
    res = await client.post(
        "/api/v1/auth/vendor-register",
        json={
            "email": email,
            "full_name": "Store Owner",
            "password": "password123",
            "business_name": f"Test Mart {uuid.uuid4().hex[:6]}",
            "business_type": "grocery_store",
            "address": "100 Test St, Washington, DC",
            "lat": 38.9,
            "lng": -77.0,
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["vendor_id"]


def _stocked_ids(me: dict) -> set[str]:
    return {it["ingredient"]["id"] for it in me["vendor_items"] if it.get("ingredient")}


@pytest.mark.asyncio
async def test_vendor_can_toggle_carried_ingredient(client) -> None:
    headers, vendor_id = await _register_vendor(client)
    ingredients = (await client.get("/api/v1/ingredients")).json()
    assert ingredients, "ingredient catalog should be seeded"
    ing_id = ingredients[0]["id"]

    # Mark as carried.
    res = await client.put(f"/api/v1/vendors/{vendor_id}/stock/{ing_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["stocked"] is True

    me = (await client.get("/api/v1/vendors/me", headers=headers)).json()
    assert ing_id in _stocked_ids(me)

    # Idempotent — toggling on again doesn't duplicate.
    await client.put(f"/api/v1/vendors/{vendor_id}/stock/{ing_id}", headers=headers)
    me_again = (await client.get("/api/v1/vendors/me", headers=headers)).json()
    assert sum(1 for it in me_again["vendor_items"] if it.get("ingredient") and it["ingredient"]["id"] == ing_id) == 1

    # Un-stock.
    res = await client.delete(f"/api/v1/vendors/{vendor_id}/stock/{ing_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["stocked"] is False
    me2 = (await client.get("/api/v1/vendors/me", headers=headers)).json()
    assert ing_id not in _stocked_ids(me2)


@pytest.mark.asyncio
async def test_stock_toggle_rejects_non_owner(client) -> None:
    _, vendor_a = await _register_vendor(client)
    headers_b, _ = await _register_vendor(client)
    ing_id = (await client.get("/api/v1/ingredients")).json()[0]["id"]

    # Vendor B may not edit Vendor A's stock.
    res = await client.put(f"/api/v1/vendors/{vendor_a}/stock/{ing_id}", headers=headers_b)
    assert res.status_code == 403
