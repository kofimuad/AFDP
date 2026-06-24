"""Transactional email delivery.

Sends mail through the Resend HTTP API when ``RESEND_API_KEY`` is configured.
When it is not, messages are logged instead of sent so flows like password
reset stay testable in development without a provider. httpx is already a
dependency, so no extra package is required.
"""
from __future__ import annotations

import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

RESEND_ENDPOINT = "https://api.resend.com/emails"


async def send_email(to: str, subject: str, html: str) -> None:
    """Send a single HTML email.

    Raises on provider errors so callers can decide how to react. When no
    provider is configured the message is logged and the call succeeds.
    """
    settings = get_settings()

    if not settings.resend_api_key:
        logger.info(
            "Email provider not configured; logging email instead of sending.\n"
            "  to: %s\n  subject: %s\n  body:\n%s",
            to,
            subject,
            html,
        )
        return

    async with httpx.AsyncClient(timeout=10.0) as http:
        response = await http.post(
            RESEND_ENDPOINT,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from,
                "to": [to],
                "subject": subject,
                "html": html,
            },
        )
        response.raise_for_status()


async def send_password_reset_email(to: str, reset_url: str) -> None:
    """Send the password-reset email containing a one-time reset link."""
    settings = get_settings()
    minutes = settings.password_reset_token_expire_minutes
    subject = "Reset your AFDP password"
    html = (
        "<div style=\"font-family:system-ui,Arial,sans-serif;line-height:1.6;color:#1a0f08\">"
        "<h2>Reset your password</h2>"
        "<p>We received a request to reset the password for your AFDP account. "
        "Click the button below to choose a new one.</p>"
        f"<p><a href=\"{reset_url}\" "
        "style=\"display:inline-block;background:#f23b2f;color:#fff;"
        "text-decoration:none;padding:12px 20px;border-radius:9999px;"
        "font-weight:600\">Reset password</a></p>"
        f"<p style=\"color:#6b5d52;font-size:14px\">This link expires in {minutes} minutes. "
        "If you didn't request a password reset, you can safely ignore this email.</p>"
        f"<p style=\"color:#6b5d52;font-size:12px\">If the button doesn't work, paste this "
        f"link into your browser:<br>{reset_url}</p>"
        "</div>"
    )
    await send_email(to, subject, html)
