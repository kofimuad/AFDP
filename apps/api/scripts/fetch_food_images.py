#!/usr/bin/env python3
"""Fetch a primary image for each AFDP food from Wikipedia and upload it to
Cloudinary at the public_id the catalog expects (``afdp/foods/<slug>``).

Usage (from apps/api):

    export CLOUDINARY_CLOUD_NAME=...
    export CLOUDINARY_API_KEY=...
    export CLOUDINARY_API_SECRET=...

    # Preview what would be fetched without uploading:
    python -m scripts.fetch_food_images --dry-run

    # Fetch and upload everything:
    python -m scripts.fetch_food_images

    # Only retry a few dishes:
    python -m scripts.fetch_food_images --only jerk-chicken,ndole,sadza

Wikipedia's API returns one lead image per article. If a dish's article has no
image or the title search misses, the run reports it so you can hand-curate
just those. Re-runs are safe — Cloudinary uploads use ``overwrite=True``.

Images from Wikipedia are generally CC-licensed via Wikimedia Commons. The
attribution is recorded on each image's Commons page; if you need explicit
credit in your UI, surface a link back to the Commons URL reported at the end
of the run.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import time
from pathlib import Path

import cloudinary
import cloudinary.uploader
import httpx
from slugify import slugify

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.sourcing.catalog import FOODS  # noqa: E402

WIKI_API = "https://en.wikipedia.org/w/api.php"
UA = "AFDP-FoodImageFetcher/1.0 (https://github.com/kofimuad; contact via repo)"
CLOUDINARY_FOLDER = "afdp/foods"


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Fetch AFDP food images from Wikipedia → Cloudinary.")
    ap.add_argument("--dry-run", action="store_true", help="Show what would be fetched without uploading.")
    ap.add_argument(
        "--only",
        default="",
        help="Comma-separated list of food slugs to (re-)process. Default: all.",
    )
    ap.add_argument("--thumbsize", type=int, default=1200, help="Wikipedia thumbnail max dimension.")
    return ap.parse_args()


def _configure_cloudinary() -> None:
    cloud = os.environ.get("CLOUDINARY_CLOUD_NAME")
    key = os.environ.get("CLOUDINARY_API_KEY")
    secret = os.environ.get("CLOUDINARY_API_SECRET")
    if not (cloud and key and secret):
        raise SystemExit(
            "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, "
            "CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
        )
    cloudinary.config(cloud_name=cloud, api_key=key, api_secret=secret, secure=True)


async def _wiki_page_image(
    client: httpx.AsyncClient, title: str, thumbsize: int
) -> tuple[str | None, str | None]:
    """Return (thumbnail_url, resolved_title) for a Wikipedia article title."""
    params = {
        "action": "query",
        "format": "json",
        "prop": "pageimages",
        "piprop": "thumbnail|name",
        "pithumbsize": thumbsize,
        "redirects": 1,
        "titles": title,
    }
    r = await client.get(WIKI_API, params=params, timeout=20.0)
    r.raise_for_status()
    data = r.json()
    pages = ((data.get("query") or {}).get("pages")) or {}
    for pid, page in pages.items():
        if pid == "-1":
            continue
        thumb = (page.get("thumbnail") or {}).get("source")
        if thumb:
            return thumb, page.get("title")
    return None, None


async def _wiki_search(client: httpx.AsyncClient, query: str) -> str | None:
    """Find the best-matching article title via Wikipedia search."""
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": query,
        "srlimit": 1,
    }
    r = await client.get(WIKI_API, params=params, timeout=20.0)
    r.raise_for_status()
    hits = ((r.json().get("query") or {}).get("search")) or []
    return hits[0]["title"] if hits else None


async def _resolve_image(
    client: httpx.AsyncClient, food_name: str, thumbsize: int
) -> tuple[str | None, str | None]:
    """Try the food name as a direct title, then fall back to search."""
    thumb, title = await _wiki_page_image(client, food_name, thumbsize)
    if thumb:
        return thumb, title
    search_title = await _wiki_search(client, food_name)
    if search_title:
        thumb, title = await _wiki_page_image(client, search_title, thumbsize)
        if thumb:
            return thumb, title
    return None, None


async def _download(client: httpx.AsyncClient, url: str) -> bytes:
    r = await client.get(url, timeout=30.0)
    r.raise_for_status()
    return r.content


def _upload(slug: str, data: bytes) -> str:
    result = cloudinary.uploader.upload(
        data,
        folder=CLOUDINARY_FOLDER,
        public_id=slug,
        overwrite=True,
        resource_type="image",
    )
    return result.get("secure_url") or ""


async def main() -> None:
    args = parse_args()
    only = {s.strip() for s in args.only.split(",") if s.strip()} if args.only else None
    if not args.dry_run:
        _configure_cloudinary()

    headers = {"User-Agent": UA}
    uploaded: list[tuple[str, str]] = []
    missing: list[str] = []
    failed: list[tuple[str, str]] = []

    async with httpx.AsyncClient(headers=headers) as client:
        for food in FOODS:
            name = food["name"]
            slug = slugify(name)
            if only and slug not in only:
                continue

            try:
                thumb, resolved_title = await _resolve_image(client, name, args.thumbsize)
            except Exception as e:
                failed.append((slug, f"wiki lookup: {e}"))
                print(f"  ✗ {slug}: wiki lookup failed: {e}")
                continue

            if not thumb:
                missing.append(slug)
                print(f"  · {slug}: no Wikipedia image found")
                continue

            if args.dry_run:
                print(f"  • {slug} ← {resolved_title}  {thumb}")
                await asyncio.sleep(0.5)
                continue

            try:
                data = await _download(client, thumb)
                url = _upload(slug, data)
            except Exception as e:
                failed.append((slug, f"upload: {e}"))
                print(f"  ✗ {slug}: {e}")
                continue

            uploaded.append((slug, resolved_title or ""))
            print(f"  ✓ {slug} ← {resolved_title}")
            # Be polite to both APIs.
            await asyncio.sleep(0.6)

    print(
        f"\nDone. uploaded={len(uploaded)}  missing={len(missing)}  failed={len(failed)}  "
        f"total={len(uploaded) + len(missing) + len(failed)}"
    )
    if missing:
        print("\nNo image on Wikipedia (hand-curate these):")
        for s in missing:
            print(f"  - {s}")
    if failed:
        print("\nFailed uploads:")
        for s, reason in failed:
            print(f"  - {s}: {reason}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
