#!/usr/bin/env python3
"""Backfill ``vendors.image_url`` for rows that don't have one yet.

For each vendor missing an image, we run a targeted Google Places Text Search
(query = vendor name, biased tightly around the stored coordinates), take the
first photo from the top result, resolve it to a ``googleusercontent`` URL,
and ``UPDATE`` the DB.

Usage (from apps/api, with DATABASE_URL and GOOGLE_PLACES_API_KEY set):

    python -m scripts.backfill_vendor_images
    python -m scripts.backfill_vendor_images --limit 100 --concurrency 8
    python -m scripts.backfill_vendor_images --dry-run

Re-running is safe. By default we only touch vendors with ``image_url IS NULL``;
pass ``--overwrite`` to replace existing URLs too (useful if Google's CDN URLs
have started expiring).

Cost, roughly (New Places API, 2025 SKUs):
    * Text Search:   $32 / 1,000 calls  → 1 call per vendor
    * Place Photos:  $7  / 1,000 calls  → 1 call per vendor that has a photo

So ~$40 per 1,000 vendors backfilled, well inside Google's $200/mo Maps credit.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path
from typing import Optional

import asyncpg
import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.sourcing.providers import GooglePlacesProvider  # noqa: E402


TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
# We only need the photo name from the top result — keep the field mask narrow
# so Google bills us for the cheapest SKU.
TEXT_SEARCH_FIELD_MASK = "places.displayName,places.photos.name"


async def _search_top_photo_name(
    client: httpx.AsyncClient,
    api_key: str,
    name: str,
    lat: float,
    lng: float,
    radius_m: int = 500,
) -> Optional[str]:
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": TEXT_SEARCH_FIELD_MASK,
    }
    body = {
        "textQuery": name,
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius_m,
            }
        },
        "pageSize": 1,
    }
    try:
        r = await client.post(TEXT_SEARCH_URL, headers=headers, json=body, timeout=30.0)
        r.raise_for_status()
    except httpx.HTTPError as e:
        print(f"  ! search failed for {name!r}: {e}")
        return None
    places = r.json().get("places") or []
    if not places:
        return None
    photos = places[0].get("photos") or []
    return photos[0].get("name") if photos else None


async def _backfill_one(
    client: httpx.AsyncClient,
    pool: asyncpg.Pool,
    provider: GooglePlacesProvider,
    vendor: asyncpg.Record,
    dry_run: bool,
) -> bool:
    api_key = provider.api_key
    assert api_key  # guarded by caller
    photo_name = await _search_top_photo_name(
        client, api_key, vendor["name"], vendor["lat"], vendor["lng"]
    )
    if not photo_name:
        print(f"  - no photo for {vendor['name']}")
        return False

    url = await provider.resolve_photo_url(client, photo_name)
    if not url:
        return False

    if dry_run:
        print(f"  ✓ {vendor['name']} → {url[:80]}... (dry-run)")
        return True

    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE vendors SET image_url = $1 WHERE id = $2", url, vendor["id"]
        )
    print(f"  ✓ {vendor['name']}")
    return True


async def backfill(
    limit: Optional[int],
    concurrency: int,
    overwrite: bool,
    dry_run: bool,
) -> None:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit("DATABASE_URL must be set")
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise SystemExit("GOOGLE_PLACES_API_KEY must be set")

    provider = GooglePlacesProvider(api_key)

    where = "" if overwrite else "WHERE image_url IS NULL"
    limit_sql = f"LIMIT {int(limit)}" if limit else ""
    query = f"""
        SELECT id, name, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
        FROM vendors
        {where}
        ORDER BY created_at ASC
        {limit_sql};
    """

    pool = await asyncpg.create_pool(db_url, min_size=1, max_size=max(4, concurrency))
    try:
        async with pool.acquire() as conn:
            vendors = await conn.fetch(query)
        if not vendors:
            print("No vendors to backfill.")
            return
        print(
            f"Backfilling {len(vendors)} vendors "
            f"(overwrite={overwrite}, dry_run={dry_run}, concurrency={concurrency})"
        )

        sem = asyncio.Semaphore(concurrency)
        done = 0

        async with httpx.AsyncClient() as client:
            async def run(v: asyncpg.Record) -> bool:
                async with sem:
                    return await _backfill_one(client, pool, provider, v, dry_run)

            for ok in await asyncio.gather(*(run(v) for v in vendors)):
                if ok:
                    done += 1

        print(f"\nDone. Updated {done}/{len(vendors)} vendors.")
    finally:
        await pool.close()


def main() -> None:
    ap = argparse.ArgumentParser(description="Backfill vendor images via Google Places.")
    ap.add_argument("--limit", type=int, default=None, help="Max vendors to process.")
    ap.add_argument("--concurrency", type=int, default=10, help="Parallel requests.")
    ap.add_argument(
        "--overwrite",
        action="store_true",
        help="Re-fetch even for vendors that already have an image_url.",
    )
    ap.add_argument("--dry-run", action="store_true", help="Don't write to the DB.")
    args = ap.parse_args()
    asyncio.run(backfill(args.limit, args.concurrency, args.overwrite, args.dry_run))


if __name__ == "__main__":
    main()
