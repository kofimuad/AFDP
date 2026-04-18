"""Bulk vendor importer.

Reads vendors from a CSV or JSON file and upserts them into the ``vendors``
table using ``ON CONFLICT (slug)`` so the script is safe to re-run.

Usage (from apps/api, with DATABASE_URL set):

    python -m seeds.seed_bulk --input scripts/data/vendors.json
    python -m seeds.seed_bulk --input scripts/data/vendors.csv

Input schema (per record):

  Required: name, type, address, lat, lng
  Optional: phone, website, city, is_verified, is_featured

``type`` must be ``restaurant`` or ``grocery_store``.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import asyncpg
from slugify import slugify


DB_URL = os.environ.get("DATABASE_URL")
VALID_TYPES = {"restaurant", "grocery_store"}


@dataclass
class Stats:
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0

    @property
    def total_success(self) -> int:
        return self.inserted + self.updated


def _read_records(path: Path) -> list[dict]:
    suffix = path.suffix.lower()
    if suffix == ".json":
        data = json.loads(path.read_text())
        if not isinstance(data, list):
            raise ValueError(f"Expected JSON array of objects in {path}")
        return data
    if suffix == ".csv":
        with path.open(newline="", encoding="utf-8") as fh:
            return list(csv.DictReader(fh))
    raise ValueError(f"Unsupported input extension: {suffix} (use .json or .csv)")


def _coerce_bool(v) -> bool:
    if isinstance(v, bool):
        return v
    if v is None:
        return False
    return str(v).strip().lower() in ("1", "true", "t", "yes", "y")


def _normalize(record: dict) -> dict | None:
    """Return a cleaned record or None if it's unusable."""
    name = (record.get("name") or "").strip()
    vtype = (record.get("type") or "").strip()
    address = (record.get("address") or "").strip()
    if not name or not address or vtype not in VALID_TYPES:
        return None
    try:
        lat = float(record.get("lat"))
        lng = float(record.get("lng"))
    except (TypeError, ValueError):
        return None
    if lat == 0 and lng == 0:
        return None

    city = (record.get("city") or "").strip()
    slug_seed = f"{name}-{city}-{round(lat, 3)}-{round(lng, 3)}" if city else f"{name}-{round(lat, 3)}-{round(lng, 3)}"

    return {
        "name": name,
        "slug": slugify(slug_seed),
        "type": vtype,
        "address": address,
        "lat": lat,
        "lng": lng,
        "phone": (record.get("phone") or None) or None,
        "website": (record.get("website") or None) or None,
        "is_verified": _coerce_bool(record.get("is_verified")),
        "is_featured": _coerce_bool(record.get("is_featured")),
    }


async def _upsert(conn: asyncpg.Connection, v: dict) -> str:
    """Upsert a vendor. Returns 'inserted' or 'updated'."""
    row = await conn.fetchrow(
        """
        INSERT INTO vendors (
            id, name, slug, type, address, location, phone, website,
            is_verified, is_featured
        ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            ST_SetSRID(ST_MakePoint($5, $6), 4326),
            $7, $8, $9, $10
        )
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            address = EXCLUDED.address,
            location = EXCLUDED.location,
            phone = COALESCE(EXCLUDED.phone, vendors.phone),
            website = COALESCE(EXCLUDED.website, vendors.website),
            is_verified = EXCLUDED.is_verified OR vendors.is_verified,
            is_featured = EXCLUDED.is_featured OR vendors.is_featured
        RETURNING (xmax = 0) AS inserted;
        """,
        v["name"],
        v["slug"],
        v["type"],
        v["address"],
        v["lng"],
        v["lat"],
        v["phone"],
        v["website"],
        v["is_verified"],
        v["is_featured"],
    )
    return "inserted" if row["inserted"] else "updated"


async def import_records(records: Iterable[dict]) -> Stats:
    if not DB_URL:
        raise RuntimeError("DATABASE_URL must be set")
    stats = Stats()
    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
        for raw in records:
            normalized = _normalize(raw)
            if normalized is None:
                stats.skipped += 1
                continue
            try:
                result = await _upsert(conn, normalized)
            except Exception as e:
                stats.failed += 1
                print(f"  FAIL {raw.get('name')!r}: {e}")
                continue
            if result == "inserted":
                stats.inserted += 1
            else:
                stats.updated += 1
    finally:
        await conn.close()
    return stats


def main() -> None:
    ap = argparse.ArgumentParser(description="Bulk-import vendors from CSV or JSON.")
    ap.add_argument("--input", required=True, help="Path to .json or .csv file.")
    args = ap.parse_args()

    path = Path(args.input)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[1] / args.input
    if not path.exists():
        raise SystemExit(f"Input file not found: {path}")

    records = _read_records(path)
    print(f"Loaded {len(records)} records from {path}")
    stats = asyncio.run(import_records(records))

    print(
        "\nDone. "
        f"inserted={stats.inserted}  updated={stats.updated}  "
        f"skipped={stats.skipped}  failed={stats.failed}  "
        f"(success={stats.total_success}/{len(records)})"
    )
    if stats.failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
