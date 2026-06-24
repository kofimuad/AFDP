from __future__ import annotations

import uuid

import pytest

import app.routers.auth as auth_router


async def _register(client) -> tuple[str, str]:
    """Register a fresh user and return (email, password)."""
    email = f"reset-{uuid.uuid4().hex[:10]}@example.com"
    password = "password123"
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Reset Tester", "password": password},
    )
    assert res.status_code in (200, 201), res.text
    return email, password


@pytest.fixture
def capture_reset(monkeypatch) -> list[str]:
    """Capture reset URLs instead of sending email; returns the URL list."""
    urls: list[str] = []

    async def _fake_send(to: str, reset_url: str) -> None:
        urls.append(reset_url)

    monkeypatch.setattr(auth_router, "send_password_reset_email", _fake_send)
    return urls


def _token_from_url(url: str) -> str:
    return url.split("token=", 1)[1]


@pytest.mark.asyncio
async def test_forgot_password_is_generic_for_unknown_email(client, capture_reset) -> None:
    res = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": f"nobody-{uuid.uuid4().hex}@example.com"},
    )
    assert res.status_code == 200
    assert "reset link has been sent" in res.json()["message"]
    # No email attempted for a non-existent account.
    assert capture_reset == []


@pytest.mark.asyncio
async def test_full_reset_flow(client, capture_reset) -> None:
    email, old_password = await _register(client)

    res = await client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert res.status_code == 200
    assert len(capture_reset) == 1
    token = _token_from_url(capture_reset[0])

    new_password = "brandnewpass456"
    reset = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": new_password},
    )
    assert reset.status_code == 200, reset.text

    # Old password no longer works; new one does.
    old_login = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": old_password}
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": new_password}
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_reset_token_is_single_use(client, capture_reset) -> None:
    email, _ = await _register(client)
    await client.post("/api/v1/auth/forgot-password", json={"email": email})
    token = _token_from_url(capture_reset[0])

    first = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "firstchange123"},
    )
    assert first.status_code == 200

    # Reusing the same token fails because the password hash it was bound to
    # has changed.
    second = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "secondchange123"},
    )
    assert second.status_code == 400


@pytest.mark.asyncio
async def test_reset_rejects_garbage_token(client) -> None:
    res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "not-a-real-token", "new_password": "whatever12345"},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_reset_enforces_password_length(client, capture_reset) -> None:
    email, _ = await _register(client)
    await client.post("/api/v1/auth/forgot-password", json={"email": email})
    token = _token_from_url(capture_reset[0])

    res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "short"},
    )
    assert res.status_code == 422
