from __future__ import annotations

from app.core.database import fetch


def meters_from_km(radius_km: float) -> float:
    """Convert kilometers to meters for PostGIS distance calculations."""

    return radius_km * 1000.0


async def fetch_vendors_within_radius(
    base_where_sql: str,
    where_args: tuple,
    lat: float,
    lng: float,
    radius_km: float,
    limit: int | None = None,
) -> list[dict]:
    """Return vendors that match a predicate and are within radius of coordinates.

    If ``limit`` is provided the query also enforces ``LIMIT n`` after ordering
    by ascending distance.
    """

    limit_sql = f"LIMIT {int(limit)}" if limit and limit > 0 else ""
    sql = f"""
        SELECT
            v.id,
            v.name,
            v.slug,
            v.type,
            v.address,
            ST_Y(v.location::geometry) AS lat,
            ST_X(v.location::geometry) AS lng,
            v.phone,
            v.website,
            v.image_url,
            v.is_verified,
            v.is_featured,
            v.created_at,
            ROUND((ST_Distance(v.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000)::numeric, 2) AS distance_km
        FROM vendors v
        WHERE
            {base_where_sql}
            AND ST_DWithin(
                v.location::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
            )
        ORDER BY distance_km ASC
        {limit_sql};
    """
    rows = await fetch(sql, lng, lat, meters_from_km(radius_km), *where_args)
    return [dict(row) for row in rows]
