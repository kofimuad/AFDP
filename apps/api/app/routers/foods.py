"""Food router for catalog discovery and food detail responses."""

from fastapi import APIRouter, Query

from app.schemas.error import ErrorResponse
from app.schemas.food import FoodDetailOut, FoodOut
from app.services.food_service import get_food_detail, list_foods

router = APIRouter(prefix="/foods", tags=["Foods"])

FOOD_EXAMPLE = {
    "id": "33333333-3333-3333-3333-333333333333",
    "name": "Jollof Rice",
    "slug": "jollof-rice",
    "description": "Smoky tomato-based rice dish popular across West Africa.",
    "image_url": "https://images.example.com/jollof-rice.jpg",
    "created_at": "2026-04-12T00:00:00Z",
}

FOOD_DETAIL_EXAMPLE = {
    **FOOD_EXAMPLE,
    "ingredients": [
        {
            "ingredient": {
                "id": "44444444-4444-4444-4444-444444444444",
                "name": "Long grain rice",
                "slug": "long-grain-rice",
                "image_url": "https://images.example.com/long-grain-rice.jpg",
            },
            "quantity_note": "As needed",
        }
    ],
    "restaurants": [],
    "stores": [],
}


@router.get(
    "",
    response_model=list[FoodOut],
    responses={200: {"description": "Food list", "content": {"application/json": {"example": [FOOD_EXAMPLE]}}}},
)
async def list_foods_route(region: str | None = Query(default=None)) -> list[FoodOut]:
    """List foods with an optional region filter."""

    return [FoodOut.model_validate(row) for row in await list_foods(region=region)]


@router.get(
    "/{slug}",
    response_model=FoodDetailOut,
    responses={
        200: {"description": "Food detail", "content": {"application/json": {"example": FOOD_DETAIL_EXAMPLE}}},
        404: {"model": ErrorResponse, "content": {"application/json": {"example": {"error": "not_found", "detail": "Food not found"}}}},
    },
)
async def get_food_route(slug: str, lat: float | None = Query(default=None), lng: float | None = Query(default=None)) -> FoodDetailOut:
    """Return a food detail record by slug."""

    return FoodDetailOut.model_validate(await get_food_detail(slug=slug, lat=lat, lng=lng))
