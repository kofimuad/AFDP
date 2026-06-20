"""User-facing food suggestion endpoints (recommend a dish)."""

from uuid import UUID

from fastapi import APIRouter, Depends

from app.schemas.error import ErrorResponse
from app.schemas.suggestion import FoodSuggestionCreate, FoodSuggestionOut
from app.services.auth_service import get_current_user
from app.services.suggestion_service import create_suggestion, list_my_suggestions

router = APIRouter(prefix="/food-suggestions", tags=["Suggestions"])

UNAUTHORIZED = {401: {"model": ErrorResponse, "description": "Authentication required"}}


@router.post("", response_model=FoodSuggestionOut, status_code=201, responses={**UNAUTHORIZED})
async def submit_suggestion_route(
    payload: FoodSuggestionCreate,
    current_user: dict = Depends(get_current_user),
) -> FoodSuggestionOut:
    """Recommend a food for the catalog (goes to the admin moderation queue)."""
    data = await create_suggestion(UUID(current_user["id"]), payload)
    return FoodSuggestionOut.model_validate(data)


@router.get("/mine", response_model=list[FoodSuggestionOut], responses={**UNAUTHORIZED})
async def my_suggestions_route(
    current_user: dict = Depends(get_current_user),
) -> list[FoodSuggestionOut]:
    """List the current user's suggestions and their moderation status."""
    rows = await list_my_suggestions(UUID(current_user["id"]))
    return [FoodSuggestionOut.model_validate(r) for r in rows]
