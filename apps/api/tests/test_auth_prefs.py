from __future__ import annotations

import uuid

import pytest


async def _register(client) -> tuple[str, dict[str, str]]:
    email = f"prefs-{uuid.uuid4().hex[:10]}@example.com"
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Prefs Tester", "password": "password123"},
    )
    assert res.status_code in (200, 201), res.text
    return email, {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.mark.asyncio
async def test_change_password_flow(client) -> None:
    email, headers = await _register(client)

    # Wrong current password is rejected
    bad = await client.post(
        "/api/v1/auth/me/password",
        headers=headers,
        json={"current_password": "wrongpass", "new_password": "newpassword456"},
    )
    assert bad.status_code == 400

    # Correct current password succeeds
    ok = await client.post(
        "/api/v1/auth/me/password",
        headers=headers,
        json={"current_password": "password123", "new_password": "newpassword456"},
    )
    assert ok.status_code == 200

    # Old password no longer works; new one does
    old_login = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "password123"}
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "newpassword456"}
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_password_change_requires_auth(client) -> None:
    res = await client.post(
        "/api/v1/auth/me/password",
        json={"current_password": "x", "new_password": "newpassword456"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_set_and_clear_location(client) -> None:
    _, headers = await _register(client)

    # New users have no saved location
    me = await client.get("/api/v1/auth/me", headers=headers)
    assert me.json()["pref_lat"] is None

    # Set it
    saved = await client.put(
        "/api/v1/auth/me/location", headers=headers, json={"lat": 38.9072, "lng": -77.0369}
    )
    assert saved.status_code == 200
    assert saved.json()["pref_lat"] == pytest.approx(38.9072)
    assert saved.json()["pref_lng"] == pytest.approx(-77.0369)

    # Persists on /me
    me2 = await client.get("/api/v1/auth/me", headers=headers)
    assert me2.json()["pref_lat"] == pytest.approx(38.9072)

    # Clear it
    cleared = await client.delete("/api/v1/auth/me/location", headers=headers)
    assert cleared.status_code == 200
    assert cleared.json()["pref_lat"] is None

    me3 = await client.get("/api/v1/auth/me", headers=headers)
    assert me3.json()["pref_lat"] is None


@pytest.mark.asyncio
async def test_set_location_rejects_out_of_range(client) -> None:
    _, headers = await _register(client)
    res = await client.put(
        "/api/v1/auth/me/location", headers=headers, json={"lat": 200, "lng": 0}
    )
    assert res.status_code == 422
