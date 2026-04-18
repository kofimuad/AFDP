#!/usr/bin/env python3
"""CLI that sweeps configured place-search providers across target cities and
writes the deduped vendor list to JSON. Run from ``apps/api``:

    python -m scripts.source_vendors --providers google,yelp,foursquare,osm

Any provider without an API key is skipped. OSM works with no key.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

# Make "scripts.sourcing" importable regardless of how this is invoked.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.sourcing.orchestrator import run_sourcing  # noqa: E402
from scripts.sourcing.providers import (  # noqa: E402
    FoursquareProvider,
    GooglePlacesProvider,
    OSMOverpassProvider,
    YelpFusionProvider,
)


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Source African vendor data.")
    ap.add_argument(
        "--out",
        default="scripts/data/vendors.json",
        help="Output JSON path (relative to apps/api).",
    )
    ap.add_argument(
        "--providers",
        default="google,yelp,foursquare,osm",
        help="Comma-separated provider list. Any without keys are skipped.",
    )
    ap.add_argument(
        "--target",
        type=int,
        default=None,
        help="Optional early-exit: stop once this many unique vendors are sourced.",
    )
    return ap.parse_args()


async def main() -> None:
    args = parse_args()
    requested = {p.strip() for p in args.providers.split(",") if p.strip()}

    providers = []
    if "google" in requested:
        providers.append(GooglePlacesProvider(os.environ.get("GOOGLE_PLACES_API_KEY")))
    if "yelp" in requested:
        providers.append(YelpFusionProvider(os.environ.get("YELP_API_KEY")))
    if "foursquare" in requested:
        providers.append(FoursquareProvider(os.environ.get("FOURSQUARE_API_KEY")))
    if "osm" in requested:
        providers.append(OSMOverpassProvider())

    vendors = await run_sourcing(providers, target=args.target)

    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = Path(__file__).resolve().parents[1] / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps([v.to_dict() for v in vendors], indent=2))

    by_type: dict[str, int] = {}
    by_country: dict[str, int] = {}
    by_source: dict[str, int] = {}
    for v in vendors:
        by_type[v.type] = by_type.get(v.type, 0) + 1
        by_country[v.country] = by_country.get(v.country, 0) + 1
        by_source[v.source] = by_source.get(v.source, 0) + 1

    print(f"\nWrote {len(vendors)} vendors → {out_path}")
    print(f"  By type:    {by_type}")
    print(f"  By country: {by_country}")
    print(f"  By source:  {by_source}")


if __name__ == "__main__":
    asyncio.run(main())
