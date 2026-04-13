"""Ingredient router for catalog discovery and ingredient detail responses."""

from fastapi import APIRouter, Query

from app.schemas.error import ErrorResponse
from app.schemas.ingredient import IngredientDetailOut, IngredientOut
from app.services.ingredient_service import get_ingredient_detail, list_ingredients

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])

INGREDIENT_EXAMPLE = {
    "id": "44444444-4444-4444-4444-444444444444",
    "name": "Long grain rice",
    "slug": "long-grain-rice",
    "image_url": "https://images.example.com/long-grain-rice.jpg",
}

INGREDIENT_DETAIL_EXAMPLE = {
    **INGREDIENT_EXAMPLE,
    "stores": [],
}


@router.get(
    "",
    response_model=list[IngredientOut],
    responses={200: {"description": "Ingredient list", "content": {"application/json": {"example": [INGREDIENT_EXAMPLE]}}}},
)
async def list_ingredients_route() -> list[IngredientOut]:
    """List all ingredients."""

    return [IngredientOut.model_validate(row) for row in await list_ingredients()]


@router.get(
    "/{slug}",
    response_model=IngredientDetailOut,
    responses={
        200: {"description": "Ingredient detail", "content": {"application/json": {"example": INGREDIENT_DETAIL_EXAMPLE}}},
        404: {"model": ErrorResponse, "content": {"application/json": {"example": {"error": "not_found", "detail": "Ingredient not found"}}}},
    },
)
async def get_ingredient_route(slug: str, lat: float | None = Query(default=None), lng: float | None = Query(default=None)) -> IngredientDetailOut:
    """Return an ingredient detail record by slug."""

    return IngredientDetailOut.model_validate(await get_ingredient_detail(slug=slug, lat=lat, lng=lng))
