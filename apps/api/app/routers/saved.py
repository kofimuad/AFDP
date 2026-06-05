"""Saved-collection router: per-user saved dishes and places (M6 SCRUM-37)."""

from uuid import UUID

from fastapi import APIRouter, Depends

from app.schemas.error import ErrorResponse
from app.schemas.saved import SavedCollectionOut
from app.schemas.shared import ActionResponse
from app.services.auth_service import get_current_user
from app.services.saved_service import (
    get_saved_collection,
    save_food,
    save_vendor,
    unsave_food,
    unsave_vendor,
)

router = APIRouter(prefix="/saved", tags=["Saved"])

UNAUTHORIZED = {401: {"model": ErrorResponse, "description": "Authentication required"}}
NOT_FOUND = {404: {"model": ErrorResponse, "description": "Item not found"}}


@router.get(
    "",
    response_model=SavedCollectionOut,
    responses={200: {"description": "The user's saved dishes and places"}, **UNAUTHORIZED},
)
async def get_saved_route(
    current_user: dict = Depends(get_current_user),
) -> SavedCollectionOut:
    """Return the authenticated user's saved dishes and places."""

    data = await get_saved_collection(UUID(current_user["id"]))
    return SavedCollectionOut.model_validate(data)


@router.post(
    "/foods/{slug}",
    response_model=ActionResponse,
    responses={200: {"description": "Dish saved"}, **UNAUTHORIZED, **NOT_FOUND},
)
async def save_food_route(
    slug: str,
    current_user: dict = Depends(get_current_user),
) -> ActionResponse:
    """Save a dish to the user's collection (idempotent)."""

    food_id = await save_food(UUID(current_user["id"]), slug)
    return ActionResponse(status="saved", id=food_id)


@router.delete(
    "/foods/{slug}",
    response_model=ActionResponse,
    responses={200: {"description": "Dish removed"}, **UNAUTHORIZED, **NOT_FOUND},
)
async def unsave_food_route(
    slug: str,
    current_user: dict = Depends(get_current_user),
) -> ActionResponse:
    """Remove a dish from the user's collection (idempotent)."""

    food_id = await unsave_food(UUID(current_user["id"]), slug)
    return ActionResponse(status="removed", id=food_id)


@router.post(
    "/vendors/{slug}",
    response_model=ActionResponse,
    responses={200: {"description": "Place saved"}, **UNAUTHORIZED, **NOT_FOUND},
)
async def save_vendor_route(
    slug: str,
    current_user: dict = Depends(get_current_user),
) -> ActionResponse:
    """Save a place (vendor) to the user's collection (idempotent)."""

    vendor_id = await save_vendor(UUID(current_user["id"]), slug)
    return ActionResponse(status="saved", id=vendor_id)


@router.delete(
    "/vendors/{slug}",
    response_model=ActionResponse,
    responses={200: {"description": "Place removed"}, **UNAUTHORIZED, **NOT_FOUND},
)
async def unsave_vendor_route(
    slug: str,
    current_user: dict = Depends(get_current_user),
) -> ActionResponse:
    """Remove a place from the user's collection (idempotent)."""

    vendor_id = await unsave_vendor(UUID(current_user["id"]), slug)
    return ActionResponse(status="removed", id=vendor_id)
