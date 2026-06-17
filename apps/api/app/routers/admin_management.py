"""Admin management router: JWT-guarded user/vendor administration."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.services.admin_management_service import (
    list_all_vendors,
    list_users,
    set_user_active,
    update_user_role,
    update_vendor_plan,
)
from app.schemas.food import FoodDetailOut
from app.schemas.recipe import RecipeCreate
from app.services.auth_service import require_admin
from app.services.food_service import create_recipe
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
