"""Transactional email delivery over SMTP.

Sends mail through an SMTP server (e.g. Gmail) when ``SMTP_USER`` and
``SMTP_PASSWORD`` are configured. When they are not, messages are logged
instead of sent so flows like password reset stay testable in development
without a provider. smtplib ships with the standard library, so no extra
package is required. The blocking send runs on a worker thread.
"""
from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html: str, text: str | None = None) -> None:
    """Send a single email with an HTML body (and optional plain-text part).

    Raises on SMTP errors so callers can decide how to react. When no SMTP
    credentials are configured the message is logged and the call succeeds.
    """
    settings = get_settings()

    if not (settings.smtp_user and settings.smtp_password):
        logger.info(
            "SMTP not configured; logging email instead of sending.\n"
            "  to: %s\n  subject: %s\n  body:\n%s",
            to,
            subject,
            text or html,
        )
        return

    sender = settings.email_from or settings.smtp_user
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = to
    message.set_content(text or "This email requires an HTML-capable client.")
    message.add_alternative(html, subtype="html")

    def _send() -> None:
        if settings.smtp_starttls:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(message)

    await asyncio.to_thread(_send)


async def send_password_reset_email(to: str, reset_url: str) -> None:
    """Send the password-reset email containing a one-time reset link."""
    settings = get_settings()
    minutes = settings.password_reset_token_expire_minutes
    subject = "Reset your AFDP password"
    text = (
        "Reset your password\n\n"
        "We received a request to reset the password for your AFDP account. "
        "Open the link below to choose a new one:\n\n"
        f"{reset_url}\n\n"
        f"This link expires in {minutes} minutes. If you didn't request a "
        "password reset, you can safely ignore this email."
    )
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
    await send_email(to, subject, html, text=text)
