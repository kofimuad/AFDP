"""Search router for food and vendor discovery flows."""

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response

from app.schemas.search import SearchResponse
from app.services.analytics_service import log_search_event
from app.services.auth_service import get_optional_user
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


def _count_results(payload: dict) -> int:
    restaurants = payload.get("restaurants") or []
    ingredients = payload.get("ingredients") or []
    ingredient_stores = sum(len(bundle.get("stores") or []) for bundle in ingredients)
    return len(restaurants) + ingredient_stores


@router.get(
    "",
    response_model=SearchResponse,
    responses={200: {"description": "Search result", "content": {"application/json": {"example": SEARCH_EXAMPLE}}}},
)
async def search(
    response: Response,
    background_tasks: BackgroundTasks,
    q: str = Query(..., min_length=1),
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(10, gt=0),
    type_: str | None = Query(default=None, alias="type", pattern="^(restaurant|grocery_store)$"),
    current_user: dict | None = Depends(get_optional_user),
) -> SearchResponse:
    """Search for foods and nearby vendors."""

    payload, cache_status = await run_search(q=q, lat=lat, lng=lng, radius_km=radius_km, vendor_type=type_)
    response.headers["X-Cache"] = cache_status

    background_tasks.add_task(
        log_search_event,
        query=q,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        result_count=_count_results(payload),
        food_match_id=str(payload["food_match"]["id"]) if payload.get("food_match") else None,
        user_id=current_user["id"] if current_user else None,
    )

    return SearchResponse.model_validate(payload)
