"""Search router for food and vendor discovery flows."""

from fastapi import APIRouter, Query, Response

from app.schemas.search import SearchResponse
from app.services.search_service import run_search

router = APIRouter(prefix="/search", tags=["Search"])

SEARCH_EXAMPLE = {
    "food_match": {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Jollof Rice",
        "slug": "jollof-rice",
        "description": "Smoky tomato-based rice dish popular across West Africa.",
        "image_url": "https://images.example.com/jollof-rice.jpg",
        "created_at": "2026-04-12T00:00:00Z",
    },
    "restaurants": [],
    "ingredients": [],
    "preparation_guide": None,
}


@router.get(
    "",
    response_model=SearchResponse,
    responses={200: {"description": "Search result", "content": {"application/json": {"example": SEARCH_EXAMPLE}}}},
)
async def search(
    response: Response,
    q: str = Query(..., min_length=1),
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(10, gt=0),
    type_: str | None = Query(default=None, alias="type", pattern="^(restaurant|grocery_store)$"),
) -> SearchResponse:
    """Search for foods and nearby vendors."""

    payload, cache_status = await run_search(q=q, lat=lat, lng=lng, radius_km=radius_km, vendor_type=type_)
    response.headers["X-Cache"] = cache_status
    return SearchResponse.model_validate(payload)
