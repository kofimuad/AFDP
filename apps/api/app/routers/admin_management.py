"""Admin management router: JWT-guarded user/vendor administration."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.services.admin_management_service import (
    create_food_admin,
    delete_food_admin,
    list_all_vendors,
    list_foods_admin,
    list_users,
    set_user_active,
    update_food_admin,
    update_user_role,
    update_vendor_plan,
)
from app.schemas.admin import AdminStatsResponse
from app.schemas.food import AdminFoodOut, FoodCreateIn, FoodDetailOut, FoodUpdateIn
from app.schemas.recipe import RecipeCreate
from app.schemas.suggestion import FoodSuggestionOut
from app.services.admin_service import get_admin_stats
from app.services.auth_service import require_admin
from app.services.food_service import create_recipe
from app.services.suggestion_service import accept_suggestion, decline_suggestion, list_suggestions_admin
from app.services.vendor_service import (
    delete_vendor,
    set_vendor_delivery,
    toggle_vendor_feature,
    verify_vendor,
)

router = APIRouter(prefix="/admin/manage", tags=["Admin"])


class RoleUpdate(BaseModel):
    role: str


class ActiveUpdate(BaseModel):
    is_active: bool


class PlanUpdate(BaseModel):
    plan: str


class DeliveryUpdate(BaseModel):
    # Tri-state: true (delivers), false (no delivery), null (unknown).
    delivery_available: bool | None = None


@router.get("/stats", response_model=AdminStatsResponse)
async def platform_stats_route(_: dict = Depends(require_admin)) -> AdminStatsResponse:
    """Platform totals (vendor breakdown + catalog size) for the admin dashboard.

    JWT-guarded mirror of /admin/stats (which is X-Admin-Key / ops-only), so the
    dashboard can surface the data without a static server key in the browser.
    """
    return AdminStatsResponse.model_validate(await get_admin_stats())


@router.get("/users")
async def list_users_route(
    q: str | None = Query(default=None),
    role: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    _: dict = Depends(require_admin),
):
    return await list_users(q=q, role=role, page=page, page_size=page_size)


@router.patch("/users/{user_id}/role")
async def update_user_role_route(
    user_id: UUID,
    payload: RoleUpdate,
    _: dict = Depends(require_admin),
):
    return await update_user_role(user_id, payload.role)


@router.patch("/users/{user_id}/active")
async def update_user_active_route(
    user_id: UUID,
    payload: ActiveUpdate,
    _: dict = Depends(require_admin),
):
    return await set_user_active(user_id, payload.is_active)


@router.get("/vendors")
async def list_vendors_route(
    q: str | None = Query(default=None),
    is_verified: bool | None = Query(default=None),
    plan: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    _: dict = Depends(require_admin),
):
    return await list_all_vendors(q=q, is_verified=is_verified, plan=plan, page=page, page_size=page_size)


@router.post("/recipes", response_model=FoodDetailOut)
async def create_recipe_route(
    payload: RecipeCreate,
    _: dict = Depends(require_admin),
) -> FoodDetailOut:
    """Admin path to add a recipe to the dish repository (upsert by slug)."""
    data = await create_recipe(payload)
    return FoodDetailOut.model_validate(data)


# ── Food catalog management (SCRUM-53) ─────────────────────────────────────


@router.get("/foods", response_model=list[AdminFoodOut])
async def list_foods_route(
    q: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    _: dict = Depends(require_admin),
) -> list[AdminFoodOut]:
    rows = await list_foods_admin(q=q, page=page, page_size=page_size)
    return [AdminFoodOut.model_validate(r) for r in rows]


@router.post("/foods", response_model=AdminFoodOut, status_code=201)
async def create_food_route(
    payload: FoodCreateIn,
    _: dict = Depends(require_admin),
) -> AdminFoodOut:
    return AdminFoodOut.model_validate(await create_food_admin(payload))


@router.patch("/foods/{slug}", response_model=AdminFoodOut)
async def update_food_route(
    slug: str,
    payload: FoodUpdateIn,
    _: dict = Depends(require_admin),
) -> AdminFoodOut:
    return AdminFoodOut.model_validate(await update_food_admin(slug, payload))


@router.delete("/foods/{slug}")
async def delete_food_route(slug: str, _: dict = Depends(require_admin)):
    await delete_food_admin(slug)
    return {"status": "deleted", "slug": slug}


# ── Food suggestion moderation (mirrors vendor verify/approve) ──────────────


@router.get("/food-suggestions", response_model=list[FoodSuggestionOut])
async def list_food_suggestions_route(
    status: str | None = Query(default="pending"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    _: dict = Depends(require_admin),
) -> list[FoodSuggestionOut]:
    rows = await list_suggestions_admin(status, page, page_size)
    return [FoodSuggestionOut.model_validate(r) for r in rows]


@router.patch("/food-suggestions/{suggestion_id}/accept", response_model=FoodSuggestionOut)
async def accept_food_suggestion_route(
    suggestion_id: UUID,
    _: dict = Depends(require_admin),
) -> FoodSuggestionOut:
    """Accept a suggestion → creates the catalog food (SCRUM-64 path)."""
    return FoodSuggestionOut.model_validate(await accept_suggestion(suggestion_id))


@router.patch("/food-suggestions/{suggestion_id}/decline", response_model=FoodSuggestionOut)
async def decline_food_suggestion_route(
    suggestion_id: UUID,
    _: dict = Depends(require_admin),
) -> FoodSuggestionOut:
    """Decline a suggestion → archived."""
    return FoodSuggestionOut.model_validate(await decline_suggestion(suggestion_id))


@router.patch("/vendors/{vendor_id}/verify")
async def verify_vendor_route(vendor_id: UUID, _: dict = Depends(require_admin)):
    return await verify_vendor(vendor_id)


@router.patch("/vendors/{vendor_id}/feature")
async def feature_vendor_route(vendor_id: UUID, _: dict = Depends(require_admin)):
    return await toggle_vendor_feature(vendor_id)


@router.patch("/vendors/{vendor_id}/delivery")
async def set_vendor_delivery_route(
    vendor_id: UUID,
    payload: DeliveryUpdate,
    _: dict = Depends(require_admin),
):
    """Admin override of a vendor's delivery status (true / false / null=unknown)."""
    return await set_vendor_delivery(vendor_id, payload.delivery_available)


@router.patch("/vendors/{vendor_id}/plan")
async def update_vendor_plan_route(
    vendor_id: UUID,
    payload: PlanUpdate,
    _: dict = Depends(require_admin),
):
    return await update_vendor_plan(vendor_id, payload.plan)


@router.delete("/vendors/{vendor_id}")
async def delete_vendor_route(vendor_id: UUID, _: dict = Depends(require_admin)):
    await delete_vendor(vendor_id)
    return {"status": "deleted", "id": str(vendor_id)}
