"""Shopping-list router: per-user list built from recipes + store coverage."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.schemas.error import ErrorResponse
from app.schemas.shared import ActionResponse
from app.schemas.shopping import (
    AddFromSavedResult,
    AddRecipeResult,
    ItemCheck,
    ShoppingListItemOut,
    ShoppingListOut,
    StoreCoverageOut,
)
from app.services.auth_service import get_current_user
from app.services.shopping_list_service import (
    add_recipe_to_list,
    add_saved_recipes_to_list,
    best_stores_for_list,
    clear_list,
    get_shopping_list,
    remove_item,
    set_item_checked,
)

router = APIRouter(prefix="/shopping-list", tags=["Shopping list"])

UNAUTHORIZED = {401: {"model": ErrorResponse, "description": "Authentication required"}}
NOT_FOUND = {404: {"model": ErrorResponse, "description": "Not found"}}


@router.get("", response_model=ShoppingListOut, responses={**UNAUTHORIZED})
async def get_list_route(current_user: dict = Depends(get_current_user)) -> ShoppingListOut:
    """Return the authenticated user's shopping list."""
    data = await get_shopping_list(UUID(current_user["id"]))
    return ShoppingListOut.model_validate(data)


@router.post("/recipes/{slug}", response_model=AddRecipeResult, responses={**UNAUTHORIZED, **NOT_FOUND})
async def add_recipe_route(
    slug: str,
    current_user: dict = Depends(get_current_user),
) -> AddRecipeResult:
    """One tap: add a recipe's ingredients to the list (deduped across recipes)."""
    data = await add_recipe_to_list(UUID(current_user["id"]), slug)
    return AddRecipeResult.model_validate(data)


@router.post("/from-saved", response_model=AddFromSavedResult, responses={**UNAUTHORIZED})
async def add_from_saved_route(
    current_user: dict = Depends(get_current_user),
) -> AddFromSavedResult:
    """Build the list from every saved recipe's ingredients (combined, deduped)."""
    data = await add_saved_recipes_to_list(UUID(current_user["id"]))
    return AddFromSavedResult.model_validate(data)


@router.patch("/items/{item_id}", response_model=ShoppingListItemOut, responses={**UNAUTHORIZED, **NOT_FOUND})
async def check_item_route(
    item_id: UUID,
    payload: ItemCheck,
    current_user: dict = Depends(get_current_user),
) -> ShoppingListItemOut:
    """Check or uncheck a list item."""
    data = await set_item_checked(UUID(current_user["id"]), item_id, payload.checked)
    return ShoppingListItemOut.model_validate(data)


@router.delete("/items/{item_id}", response_model=ActionResponse, responses={**UNAUTHORIZED, **NOT_FOUND})
async def remove_item_route(
    item_id: UUID,
    current_user: dict = Depends(get_current_user),
) -> ActionResponse:
    """Remove a single item from the list."""
    await remove_item(UUID(current_user["id"]), item_id)
    return ActionResponse(status="removed", id=item_id)


@router.delete("", response_model=ActionResponse, responses={**UNAUTHORIZED})
async def clear_list_route(current_user: dict = Depends(get_current_user)) -> ActionResponse:
    """Empty the shopping list."""
    await clear_list(UUID(current_user["id"]))
    return ActionResponse(status="cleared")


@router.get("/stores", response_model=list[StoreCoverageOut], responses={**UNAUTHORIZED})
async def best_stores_route(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: float = Query(10, gt=0, le=500),
    current_user: dict = Depends(get_current_user),
) -> list[StoreCoverageOut]:
    """Stores ranked by how many list items they stock, then by proximity."""
    rows = await best_stores_for_list(UUID(current_user["id"]), lat, lng, radius_km)
    return [StoreCoverageOut.model_validate(row) for row in rows]
