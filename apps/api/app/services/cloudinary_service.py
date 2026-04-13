"""Cloudinary upload helpers.

Uploads run on a worker thread since the Cloudinary SDK is blocking.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import cloudinary
import cloudinary.uploader

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_configured = False


def _configure() -> None:
    global _configured
    if _configured:
        return
    settings = get_settings()
    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret):
        raise RuntimeError("Cloudinary credentials are not configured")
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    _configured = True


async def upload_image(data: bytes, folder: str, public_id: str | None = None) -> str:
    """Upload image bytes to Cloudinary and return the secure URL."""
    _configure()

    def _do_upload() -> dict[str, Any]:
        return cloudinary.uploader.upload(
            data,
            folder=folder,
            public_id=public_id,
            overwrite=True,
            resource_type="image",
        )

    result = await asyncio.to_thread(_do_upload)
    url = result.get("secure_url")
    if not url:
        raise RuntimeError("Cloudinary returned no secure_url")
    return url
