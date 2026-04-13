# African Food Discovery Platform (AFDP)

AFDP is a map-based discovery platform for African diaspora communities in the U.S. Users can search dishes like Jollof Rice and discover nearby restaurants, ingredients, and stores.

## Monorepo Structure

- `apps/web`: Next.js 14 + TypeScript frontend (map-first discovery UX)
- `apps/api`: FastAPI backend with PostGIS geospatial search and Redis caching
- `apps/mobile`: Flutter scaffold with planned BLoC architecture
- `packages/types`: shared TypeScript types

## Core Endpoint

`GET /api/v1/search`

Query params:

- `q`: food/vendor search term
- `lat`: latitude
- `lng`: longitude
- `radius_km`: search radius in km (default 10)
- `type`: optional vendor type (`restaurant` or `grocery_store`)

Response:

- `food_match`
- `restaurants`
- `ingredients` with nearby stores
- `preparation_guide` placeholder

## Local Development

1. Copy env values if needed:
   - Start from `.env.example`
2. Start infrastructure and apps:
   - `docker compose up --build`
3. API should be available at:
   - `http://localhost:8000`
4. Web app should be available at:
   - `http://localhost:3000`

## Database and Seed

1. Run migrations inside API container:
   - `docker compose exec api alembic upgrade head`
2. Seed sample DMV data:
   - `docker compose exec api python seeds/seed_dmv.py`

## Testing

- API tests:
  - `cd apps/api && pytest -q`
- Web build:
  - `cd apps/web && npm run build`

## Deployment Targets

- Web: Vercel
- API: Render (Docker)
- Cloud DB: Neon Postgres
- Cache: Upstash Redis
- Images: Cloudinary

## Notes

- Business logic is API-only; frontend and mobile are clients.
- All API routes are versioned under `/api/v1`.
- Error responses use shape: `{ "error": "...", "detail": "..." }`.
