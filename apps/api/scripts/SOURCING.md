# Vendor Sourcing Guide

End-to-end pipeline for populating AFDP with African restaurants and grocery
stores across North America and Europe.

## What it does

`scripts/source_vendors.py` sweeps a list of cities (US, CA, UK, DE, FR, NL,
SE) with ~30 targeted search terms (Nigerian/Ghanaian/Ethiopian/Moroccan
restaurants, African groceries, etc.) against one or more place-search
providers, dedupes results by name + rounded coordinates, and writes a JSON
file.

`seeds/seed_vendors.py` reads that JSON and inserts:

1. 55+ African dishes across 5 regions
2. 80+ African ingredients
3. Food → ingredient links for recipe lookups
4. The sourced vendors (upsert by slug)
5. `vendor_items` rows linking each vendor to a plausible subset of
   dishes/ingredients based on the cuisine inferred from the search term that
   found it — so `/api/v1/search` returns non-empty `restaurants` and
   `ingredients.stores` payloads immediately after seeding.

## Providers

All providers are implemented in [sourcing/providers.py](sourcing/providers.py).
You can enable any combination; running with multiple is fine, the orchestrator
dedupes across them.

| Provider | API key needed? | Credit card to start? | Free tier | Coverage |
| --- | --- | --- | --- | --- |
| **Google Places (New)** | Yes | Yes (billing must be enabled) | $200/mo credit (~11K text searches) | Worldwide, best data quality |
| **Yelp Fusion** | Yes | **No** | 300 calls/day | US + CA + partial UK/FR/DE/NL/SE |
| **Foursquare** | Yes | **No** | ~100K calls/mo | Worldwide |
| **OSM Overpass** | **No** | **No** | Unlimited (be polite) | Worldwide, quality varies |

### Google Places API (New) — primary

1. Go to https://console.cloud.google.com/ and create a project.
2. Enable billing on the project (**credit card required**). Google gives
   every account $200 of Maps credit per month.
3. `APIs & Services → Library → Places API (New) → Enable`.
4. `APIs & Services → Credentials → Create credentials → API key`.
5. Restrict the key to the Places API (New) to prevent abuse.
6. `export GOOGLE_PLACES_API_KEY=...`

Docs: https://developers.google.com/maps/documentation/places/web-service/text-search

### Yelp Fusion — no credit card needed

1. Sign up at https://www.yelp.com (normal Yelp account is fine).
2. Go to https://www.yelp.com/developers/v3/manage_app and create an app.
3. Copy the **API key** (not the client ID/secret).
4. `export YELP_API_KEY=...`

Docs: https://docs.developer.yelp.com/reference/v3_business_search

### Foursquare — no credit card needed

1. Sign up at https://foursquare.com/developers/signup.
2. Create a project → Generate a **Service API Key** (v3).
3. `export FOURSQUARE_API_KEY=...`

Docs: https://docs.foursquare.com/developer/reference/place-search

### OpenStreetMap Overpass — no key, no account

Already enabled by default. Queries hit the public
https://overpass-api.de endpoint. Be kind: the orchestrator inserts a 1s
delay between Overpass calls. Coverage is strong in Europe, weaker in some
US metros.

## Running it

From `apps/api`:

```bash
# Install deps (once)
pip install -r requirements.txt

# 1) Source vendors → JSON  (~35 cities × ~35 queries; takes 10–40 min)
export GOOGLE_PLACES_API_KEY=...   # optional
export YELP_API_KEY=...            # optional
export FOURSQUARE_API_KEY=...      # optional

python -m scripts.source_vendors \
  --providers google,yelp,foursquare,osm \
  --out scripts/data/vendors.json \
  --target 600                       # optional early-exit once we clear 600

# 2) Seed DB (vendors + foods + ingredients + vendor_items)
export DATABASE_URL=postgres://...
python -m seeds.seed_vendors --vendors scripts/data/vendors.json
```

Inside docker-compose:

```bash
docker compose exec -e GOOGLE_PLACES_API_KEY=$GOOGLE_PLACES_API_KEY api \
  python -m scripts.source_vendors --providers google,osm --target 600

docker compose exec api python -m seeds.seed_vendors \
  --vendors scripts/data/vendors.json
```

## Zero-API-key path (start today)

You don't need a credit card to get started — run OSM only:

```bash
python -m scripts.source_vendors --providers osm --out scripts/data/vendors.json
python -m seeds.seed_vendors --vendors scripts/data/vendors.json
```

Expect a few hundred vendors (European cities are especially well-covered).
Once the Google/Yelp keys are in place, re-run the sourcer and re-seed — the
seeder upserts by slug, so running it again just enriches the existing rows.

## Expected yield (rough)

| Config | Typical unique vendors |
| --- | --- |
| OSM only | 250–450 |
| Yelp only (US/CA focus) | 500–900 |
| Google only | 900–1,400 |
| All four | 1,200–1,800 |

## Tuning

- Edit [sourcing/cities.py](sourcing/cities.py) to add/remove target cities.
- Edit [sourcing/search_terms.py](sourcing/search_terms.py) to add cuisine
  queries — the vendor type is inferred from which list a query lives in, so
  just drop new strings into `RESTAURANT_QUERIES` or `GROCERY_QUERIES`.
- Edit [sourcing/catalog.py](sourcing/catalog.py) to add dishes, ingredients,
  or recipe mappings. The `CUISINE_FOODS` / `CUISINE_INGREDIENTS` dicts control
  how vendors get linked to items at seed time.

## Vendor images

`source_vendors` now captures an `image_url` for each vendor when the source
supports it:

- **Google Places** — the Text Search response includes `photos[*].name`. After
  the sweep finishes, we resolve each first-photo `name` to a persistent
  `googleusercontent.com` URL via the Place Photos endpoint (called with
  `skipHttpRedirect=true` so we get JSON + a `photoUri` back). Costs ~$7 per
  1,000 resolved photos.
- **Yelp Fusion** — businesses come back with an `image_url` already, so we
  just keep it.
- **Foursquare / OSM** — no reliable image field, left empty.

`seed_vendors.py` upserts `image_url` using `COALESCE(EXCLUDED.image_url,
vendors.image_url)` so re-seeding only fills in missing images and never
overwrites a good one with `NULL`.

### Backfilling existing vendors (cheap path)

If you already have vendors in the DB and just want to add images without
re-running the full sweep, use the dedicated backfill script:

```bash
export DATABASE_URL=postgres://...
export GOOGLE_PLACES_API_KEY=...

# Dry-run first to see what would happen
python -m scripts.backfill_vendor_images --dry-run --limit 10

# Real run — updates vendors where image_url IS NULL
python -m scripts.backfill_vendor_images

# Re-fetch even for vendors that already have an image
python -m scripts.backfill_vendor_images --overwrite
```

The script runs one Text Search (tightly biased to the vendor's stored
coordinates) + one Photo fetch per vendor. Budget ~$40 per 1,000 vendors.

### Attribution

Google requires a "Powered by Google" attribution wherever Places photos are
shown. The photos returned also carry `authorAttributions` that Google wants
surfaced. If we later show a byline on vendor cards, pull them from the
`places.photos.authorAttributions` field.

## Files

- [scripts/source_vendors.py](source_vendors.py) — CLI entrypoint
- [scripts/backfill_vendor_images.py](backfill_vendor_images.py) — image-only backfill for existing DB vendors
- [scripts/sourcing/orchestrator.py](sourcing/orchestrator.py) — sweep + dedup
- [scripts/sourcing/providers.py](sourcing/providers.py) — Google / Yelp / Foursquare / OSM
- [scripts/sourcing/cities.py](sourcing/cities.py) — target cities
- [scripts/sourcing/search_terms.py](sourcing/search_terms.py) — queries + cuisine lookup
- [scripts/sourcing/catalog.py](sourcing/catalog.py) — foods, ingredients, recipe map
- [scripts/sourcing/types.py](sourcing/types.py) — `VendorRecord` dataclass
- [seeds/seed_vendors.py](../seeds/seed_vendors.py) — DB seeder
