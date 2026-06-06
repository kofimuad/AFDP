from __future__ import annotations

import uuid

import pytest


@pytest.mark.asyncio
async def test_track_view_accepts_valid_event(client) -> None:
    res = await client.post(
        "/api/v1/events/view",
        json={"entity_type": "food", "entity_id": str(uuid.uuid4())},
    )
    assert res.status_code == 202
    assert res.json()["status"] == "accepted"


@pytest.mark.asyncio
async def test_track_view_rejects_bad_entity_type(client) -> None:
    res = await client.post(
        "/api/v1/events/view",
        json={"entity_type": "banana", "entity_id": str(uuid.uuid4())},
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_track_view_rejects_bad_uuid(client) -> None:
    res = await client.post(
        "/api/v1/events/view",
        json={"entity_type": "vendor", "entity_id": "not-a-uuid"},
    )
    assert res.status_code == 422
