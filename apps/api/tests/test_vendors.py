from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_list_vendors_returns_list(client) -> None:
    response = await client.get("/api/v1/vendors")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_vendor_by_slug_returns_detail(client) -> None:
    response = await client.get("/api/v1/vendors/lagos-grill-silver-spring")

    assert response.status_code == 200
    payload = response.json()
    assert payload["slug"] == "lagos-grill-silver-spring"
    assert "vendor_items" in payload


@pytest.mark.asyncio
async def test_get_vendor_by_slug_invalid_returns_404(client) -> None:
    response = await client.get("/api/v1/vendors/not-a-real-vendor")

    assert response.status_code == 404
    assert response.json()["error"] == "not_found"
