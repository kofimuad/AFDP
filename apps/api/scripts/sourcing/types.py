from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Optional


@dataclass
class VendorRecord:
    name: str
    type: str  # "restaurant" | "grocery_store"
    address: str
    lat: float
    lng: float
    phone: Optional[str] = None
    website: Optional[str] = None
    source: str = ""
    source_id: str = ""
    search_term: str = ""
    country: str = ""
    city: str = ""
    image_url: Optional[str] = None
    # Google Places photo resource (e.g. "places/X/photos/Y"). Resolved to a
    # real URL after dedup to avoid redundant Places Photos API calls.
    google_photo_name: Optional[str] = None

    def dedup_key(self) -> str:
        return f"{self.name.strip().lower()}::{round(self.lat, 4)}::{round(self.lng, 4)}"

    def to_dict(self) -> dict:
        return asdict(self)
