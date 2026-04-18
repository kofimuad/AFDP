"""Search terms partitioned by vendor type. Vendor type is inferred directly
from which list a query came from, so we don't have to guess."""

from __future__ import annotations

RESTAURANT_QUERIES: list[str] = [
    "African restaurant",
    "West African restaurant",
    "East African restaurant",
    "Nigerian restaurant",
    "Ghanaian restaurant",
    "Senegalese restaurant",
    "Ivorian restaurant",
    "Cameroonian restaurant",
    "Sierra Leonean restaurant",
    "Liberian restaurant",
    "Ethiopian restaurant",
    "Eritrean restaurant",
    "Somali restaurant",
    "Sudanese restaurant",
    "Kenyan restaurant",
    "Ugandan restaurant",
    "Tanzanian restaurant",
    "Moroccan restaurant",
    "Tunisian restaurant",
    "Algerian restaurant",
    "South African restaurant",
    "Zimbabwean restaurant",
    "Congolese restaurant",
]

GROCERY_QUERIES: list[str] = [
    "African grocery",
    "African market",
    "African food store",
    "African supermarket",
    "West African market",
    "East African market",
    "Nigerian grocery",
    "Ethiopian grocery",
    "Ghanaian grocery",
    "Halal African market",
    "African spice shop",
]

# Cuisine key extracted from a search query so we can pair sourced vendors with
# the right subset of foods/ingredients when seeding vendor_items.
_CUISINE_KEYWORDS = [
    ("nigerian", "nigerian"),
    ("ghanaian", "ghanaian"),
    ("senegalese", "senegalese"),
    ("ivorian", "ivorian"),
    ("cameroonian", "cameroonian"),
    ("sierra leonean", "sierra_leonean"),
    ("liberian", "liberian"),
    ("ethiopian", "ethiopian"),
    ("eritrean", "eritrean"),
    ("somali", "somali"),
    ("sudanese", "sudanese"),
    ("kenyan", "kenyan"),
    ("ugandan", "ugandan"),
    ("tanzanian", "tanzanian"),
    ("moroccan", "moroccan"),
    ("tunisian", "tunisian"),
    ("algerian", "algerian"),
    ("south african", "south_african"),
    ("zimbabwean", "zimbabwean"),
    ("congolese", "congolese"),
    ("west african", "west_african"),
    ("east african", "east_african"),
]


def query_cuisine(query: str) -> str:
    """Return a cuisine key for a search term. Falls back to 'african'."""
    q = (query or "").lower()
    for needle, key in _CUISINE_KEYWORDS:
        if needle in q:
            return key
    return "african"
