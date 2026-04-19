"""Place-search providers. All providers return a list of ``VendorRecord``.

Google Places (New) is the primary source. Yelp Fusion and Foursquare are
commercial alternatives with free tiers. OSM Overpass is completely free and
requires no API key — useful for sourcing immediately without a billing setup.
"""

from __future__ import annotations

import asyncio
from typing import Optional

import httpx

from .types import VendorRecord


class Provider:
    name: str = ""

    def enabled(self) -> bool:
        return False

    async def search(
        self, client: httpx.AsyncClient, query: str, city: dict, vendor_type: str
    ) -> list[VendorRecord]:
        return []


class GooglePlacesProvider(Provider):
    """Google Places API (New) — Text Search.

    Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
    Requires billing to be enabled on the Google Cloud project.
    """

    name = "google"
    URL = "https://places.googleapis.com/v1/places:searchText"
    FIELD_MASK = (
        "places.id,places.displayName,places.formattedAddress,places.location,"
        "places.nationalPhoneNumber,places.internationalPhoneNumber,"
        "places.websiteUri,places.primaryType,places.types,nextPageToken"
    )

    def __init__(self, api_key: Optional[str]):
        self.api_key = api_key

    def enabled(self) -> bool:
        return bool(self.api_key)

    async def search(
        self, client: httpx.AsyncClient, query: str, city: dict, vendor_type: str
    ) -> list[VendorRecord]:
        if not self.api_key:
            return []
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": self.FIELD_MASK,
        }
        body: dict = {
            "textQuery": f"{query} in {city['name']}",
            "locationBias": {
                "circle": {
                    "center": {"latitude": city["lat"], "longitude": city["lng"]},
                    "radius": min(city.get("radius_m", 40000), 50000),
                }
            },
            "pageSize": 20,
        }

        results: list[VendorRecord] = []
        for _ in range(3):  # up to 3 pages -> 60 places per (query, city)
            try:
                r = await client.post(self.URL, headers=headers, json=body, timeout=30.0)
                r.raise_for_status()
            except httpx.HTTPError as e:
                print(f"[google] {city['name']} / {query} -> error: {e}")
                break
            data = r.json()
            for p in data.get("places", []):
                loc = p.get("location") or {}
                name = (p.get("displayName") or {}).get("text") or ""
                if not name:
                    continue
                results.append(
                    VendorRecord(
                        name=name,
                        type=vendor_type,
                        address=p.get("formattedAddress", ""),
                        lat=float(loc.get("latitude") or 0.0),
                        lng=float(loc.get("longitude") or 0.0),
                        phone=p.get("internationalPhoneNumber") or p.get("nationalPhoneNumber"),
                        website=p.get("websiteUri"),
                        source=self.name,
                        source_id=p.get("id", ""),
                        search_term=query,
                        country=city["country"],
                        city=city["name"],
                    )
                )
            next_token = data.get("nextPageToken")
            if not next_token:
                break
            # Google requires a short delay before the next-page token is valid.
            await asyncio.sleep(2.0)
            body = {"pageToken": next_token}

        return results


class YelpFusionProvider(Provider):
    """Yelp Fusion API.

    Docs: https://docs.developer.yelp.com/reference/v3_business_search
    Free tier: 300 calls/day. Signup does not require a credit card.
    """

    name = "yelp"
    URL = "https://api.yelp.com/v3/businesses/search"

    def __init__(self, api_key: Optional[str]):
        self.api_key = api_key

    def enabled(self) -> bool:
        return bool(self.api_key)

    async def search(
        self, client: httpx.AsyncClient, query: str, city: dict, vendor_type: str
    ) -> list[VendorRecord]:
        if not self.api_key:
            return []
        headers = {"Authorization": f"Bearer {self.api_key}"}
        results: list[VendorRecord] = []
        for offset in (0, 50):
            params = {
                "term": query,
                "latitude": city["lat"],
                "longitude": city["lng"],
                "radius": min(city.get("radius_m", 40000), 40000),
                "limit": 50,
                "offset": offset,
            }
            try:
                r = await client.get(self.URL, params=params, headers=headers, timeout=30.0)
                r.raise_for_status()
            except httpx.HTTPError as e:
                print(f"[yelp] {city['name']} / {query} -> error: {e}")
                break
            data = r.json()
            businesses = data.get("businesses") or []
            for b in businesses:
                coord = b.get("coordinates") or {}
                loc = b.get("location") or {}
                lat = coord.get("latitude")
                lng = coord.get("longitude")
                if lat is None or lng is None:
                    continue
                results.append(
                    VendorRecord(
                        name=b.get("name", ""),
                        type=vendor_type,
                        address=", ".join([p for p in (loc.get("display_address") or []) if p]),
                        lat=float(lat),
                        lng=float(lng),
                        phone=b.get("phone") or None,
                        website=b.get("url"),
                        source=self.name,
                        source_id=b.get("id", ""),
                        search_term=query,
                        country=city["country"],
                        city=city["name"],
                    )
                )
            if len(businesses) < 50:
                break
        return results


class FoursquareProvider(Provider):
    """Foursquare Places API v3.

    Docs: https://docs.foursquare.com/developer/reference/place-search
    Free tier: generous daily cap. Signup does not require a credit card.
    """

    name = "foursquare"
    URL = "https://api.foursquare.com/v3/places/search"

    def __init__(self, api_key: Optional[str]):
        self.api_key = api_key

    def enabled(self) -> bool:
        return bool(self.api_key)

    async def search(
        self, client: httpx.AsyncClient, query: str, city: dict, vendor_type: str
    ) -> list[VendorRecord]:
        if not self.api_key:
            return []
        headers = {"Authorization": self.api_key, "Accept": "application/json"}
        params = {
            "query": query,
            "ll": f"{city['lat']},{city['lng']}",
            "radius": min(city.get("radius_m", 40000), 100000),
            "limit": 50,
        }
        try:
            r = await client.get(self.URL, params=params, headers=headers, timeout=30.0)
            r.raise_for_status()
        except httpx.HTTPError as e:
            print(f"[foursquare] {city['name']} / {query} -> error: {e}")
            return []

        data = r.json()
        results: list[VendorRecord] = []
        for v in data.get("results") or []:
            geo = ((v.get("geocodes") or {}).get("main")) or {}
            loc = v.get("location") or {}
            lat = geo.get("latitude")
            lng = geo.get("longitude")
            if lat is None or lng is None:
                continue
            address = loc.get("formatted_address") or ", ".join(
                [p for p in [loc.get("address"), loc.get("locality"), loc.get("region"), loc.get("country")] if p]
            )
            results.append(
                VendorRecord(
                    name=v.get("name", ""),
                    type=vendor_type,
                    address=address,
                    lat=float(lat),
                    lng=float(lng),
                    phone=v.get("tel"),
                    website=v.get("website"),
                    source=self.name,
                    source_id=v.get("fsq_id", ""),
                    search_term=query,
                    country=city["country"],
                    city=city["name"],
                )
            )
        return results


class OSMOverpassProvider(Provider):
    """OpenStreetMap Overpass API — no API key required, completely free.

    Coverage varies by region (good in Europe, uneven in the US), but it's a
    zero-cost way to bootstrap data while commercial keys are being set up.
    """

    name = "osm"
    URL = "https://overpass-api.de/api/interpreter"

    _GROCERY_NAME_FILTER = (
        "african", "nigerian", "ghanaian", "ethiopian", "eritrean", "senegalese",
        "somali", "kenyan", "moroccan", "cameroonian", "congolese", "sudanese",
        "ivorian", "liberian", "sierra leonean", "south african", "zimbabwean",
        "tunisian", "algerian", "ugandan", "tanzanian",
    )

    _CUISINE_LOOKUP = [
        ("nigerian", "nigerian"), ("ghanaian", "ghanaian"), ("senegalese", "senegalese"),
        ("ivorian", "ivorian"), ("cameroonian", "cameroonian"),
        ("liberian", "liberian"), ("sierra leonean", "sierra_leonean"),
        ("ethiopian", "ethiopian"), ("eritrean", "eritrean"),
        ("somali", "somali"), ("sudanese", "sudanese"),
        ("kenyan", "kenyan"), ("ugandan", "ugandan"), ("tanzanian", "tanzanian"),
        ("moroccan", "moroccan"), ("tunisian", "tunisian"), ("algerian", "algerian"),
        ("south african", "south_african"), ("zimbabwean", "zimbabwean"),
        ("congolese", "congolese"),
        ("west african", "west_african|nigerian|ghanaian|senegalese"),
        ("east african", "east_african|ethiopian|eritrean|somali|kenyan"),
        ("african", "african|nigerian|ghanaian|senegalese|ethiopian|eritrean|somali|kenyan|moroccan"),
    ]

    def enabled(self) -> bool:
        return True

    def _cuisine_regex(self, query: str) -> str:
        q = query.lower()
        for needle, regex in self._CUISINE_LOOKUP:
            if needle in q:
                return regex
        return "african"

    async def search(
        self, client: httpx.AsyncClient, query: str, city: dict, vendor_type: str
    ) -> list[VendorRecord]:
        radius = min(city.get("radius_m", 40000), 50000)
        lat, lng = city["lat"], city["lng"]

        if vendor_type == "grocery_store":
            overpass = f"""
                [out:json][timeout:60];
                (
                  node["shop"~"supermarket|convenience|grocery|food|general"](around:{radius},{lat},{lng});
                  way["shop"~"supermarket|convenience|grocery|food|general"](around:{radius},{lat},{lng});
                );
                out center 200;
            """
            name_filter = self._GROCERY_NAME_FILTER
        else:
            regex = self._cuisine_regex(query)
            overpass = f"""
                [out:json][timeout:60];
                (
                  node["amenity"="restaurant"]["cuisine"~"{regex}",i](around:{radius},{lat},{lng});
                  way["amenity"="restaurant"]["cuisine"~"{regex}",i](around:{radius},{lat},{lng});
                );
                out center 200;
            """
            name_filter = None

        try:
            r = await client.post(self.URL, data={"data": overpass}, timeout=90.0)
            r.raise_for_status()
        except httpx.HTTPError as e:
            print(f"[osm] {city['name']} / {query} -> error: {e}")
            return []

        data = r.json()
        results: list[VendorRecord] = []
        for el in data.get("elements") or []:
            tags = el.get("tags") or {}
            name = tags.get("name") or ""
            if not name:
                continue
            if name_filter:
                if not any(kw in name.lower() for kw in name_filter):
                    continue
            lat_v = el.get("lat")
            lng_v = el.get("lon")
            if lat_v is None or lng_v is None:
                center = el.get("center") or {}
                lat_v = center.get("lat")
                lng_v = center.get("lon")
            if lat_v is None or lng_v is None:
                continue
            addr_parts = [
                tags.get("addr:housenumber"),
                tags.get("addr:street"),
                tags.get("addr:city"),
                tags.get("addr:postcode"),
                tags.get("addr:country") or city["country"],
            ]
            address = ", ".join([p for p in addr_parts if p]) or city["name"]
            results.append(
                VendorRecord(
                    name=name,
                    type=vendor_type,
                    address=address,
                    lat=float(lat_v),
                    lng=float(lng_v),
                    phone=tags.get("phone") or tags.get("contact:phone"),
                    website=tags.get("website") or tags.get("contact:website"),
                    source=self.name,
                    source_id=str(el.get("id") or ""),
                    search_term=query,
                    country=city["country"],
                    city=city["name"],
                )
            )
        # Overpass is community-run; be gentle.
        await asyncio.sleep(1.0)
        return results
