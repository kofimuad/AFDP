from __future__ import annotations

import uuid

import pytest


async def _register_vendor(client) -> dict[str, str]:
    email = f"vendor-{uuid.uuid4().hex[:10]}@example.com"
    res = await client.post(
        "/api/v1/auth/vendor-register",
        json={
            "email": email,
            "full_name": "Analytics Vendor",
            "password": "password123",
            "business_name": f"Test Kitchen {uuid.uuid4().hex[:6]}",
            "business_type": "restaurant",
            "address": "1 Test Way, Washington, DC",
            "lat": 38.9072,
            "lng": -77.0369,
        },
    )
    assert res.status_code in (200, 201), res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.mark.asyncio
async def test_vendor_analytics_requires_auth(client) -> None:
    res = await client.get("/api/v1/vendors/me/analytics")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_vendor_analytics_forbidden_for_regular_user(client) -> None:
    email = f"user-{uuid.uuid4().hex[:10]}@example.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Regular User", "password": "password123"},
    )
    assert reg.status_code in (200, 201)
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    res = await client.get("/api/v1/vendors/me/analytics", headers=headers)
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_vendor_analytics_returns_shape(client) -> None:
    headers = await _register_vendor(client)
    res = await client.get("/api/v1/vendors/me/analytics", headers=headers)
    assert res.status_code == 200, res.text

    body = res.json()
    assert set(body["totals"].keys()) == {"views", "search_appearances", "dish_views", "saves"}
    assert all(isinstance(v, int) for v in body["totals"].values())

    series = body["views_this_week"]
    assert len(series) == 7
    assert all("label" in p and "count" in p for p in series)
    # A brand-new vendor has no events yet
    assert body["totals"]["views"] == 0
