"""Orchestrator: sweeps every (city, query, provider) combination and dedups
results by (name, lat, lng) so overlapping providers don't create duplicates."""

from __future__ import annotations

import asyncio
import time

import httpx

from .cities import TARGET_CITIES
from .providers import Provider
from .search_terms import GROCERY_QUERIES, RESTAURANT_QUERIES
from .types import VendorRecord


def _merge(dedup: dict[str, VendorRecord], items: list[VendorRecord]) -> int:
    added = 0
    for v in items:
        if not v.name or not v.address:
            continue
        if v.lat == 0 and v.lng == 0:
            continue
        k = v.dedup_key()
        if k not in dedup:
            dedup[k] = v
            added += 1
    return added


async def run_sourcing(
    providers: list[Provider],
    cities: list[dict] | None = None,
    restaurant_queries: list[str] | None = None,
    grocery_queries: list[str] | None = None,
    target: int | None = None,
) -> list[VendorRecord]:
    """Run all providers across all cities/queries.

    Args:
        target: optional early-exit threshold. If the deduped count reaches
            this, the sweep stops. Useful when you only need ~500+ vendors.
    """
    cities = cities or TARGET_CITIES
    rqs = restaurant_queries or RESTAURANT_QUERIES
    gqs = grocery_queries or GROCERY_QUERIES

    active = [p for p in providers if p.enabled()]
    if not active:
        raise RuntimeError(
            "No providers enabled. Set GOOGLE_PLACES_API_KEY, YELP_API_KEY, or "
            "FOURSQUARE_API_KEY — or include 'osm' to use OpenStreetMap (no key required)."
        )
    print(f"Active providers: {', '.join(p.name for p in active)}")
    print(f"Cities: {len(cities)} | Restaurant queries: {len(rqs)} | Grocery queries: {len(gqs)}")

    dedup: dict[str, VendorRecord] = {}
    started = time.time()

    async with httpx.AsyncClient() as client:
        for city in cities:
            for query, vtype in [(q, "restaurant") for q in rqs] + [(q, "grocery_store") for q in gqs]:
                for p in active:
                    try:
                        items = await p.search(client, query, city, vtype)
                    except Exception as e:
                        print(f"[{p.name}] {city['name']} / {query} → error: {e}")
                        items = []
                    added = _merge(dedup, items)
                    print(
                        f"[{p.name}] {city['name']} / {query} ({vtype}) "
                        f"→ {len(items)} results, +{added} new (total: {len(dedup)})"
                    )
                    if target and len(dedup) >= target:
                        print(f"\nReached target of {target} — stopping early.")
                        return list(dedup.values())
                await asyncio.sleep(0.2)

    print(f"\nDone in {time.time() - started:.1f}s — {len(dedup)} unique vendors.")
    return list(dedup.values())
