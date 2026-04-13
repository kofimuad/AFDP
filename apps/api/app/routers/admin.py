"""Admin router for moderation and operational endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Header

from app.schemas.admin import AdminStatsResponse
from app.schemas.error import ErrorResponse
from app.schemas.shared import ActionResponse
from app.schemas.vendor import VendorOut
from app.services.admin_service import get_admin_stats, require_admin_key
from app.services.vendor_service import delete_vendor, list_admin_vendors, toggle_vendor_feature, verify_vendor


def _admin_key_guard(x_admin_key: str | None = Header(default=None, alias="X-Admin-Key")) -> None:
    """Dependency that validates the admin API key."""

    require_admin_key(x_admin_key)


router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(_admin_key_guard)])

ADMIN_VENDOR_EXAMPLE = {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Lagos Grill Silver Spring",
    "slug": "lagos-grill-silver-spring",
    "type": "restaurant",
    "address": "8455 Colesville Rd, Silver Spring, MD",
    "lat": 38.9957,
    "lng": -77.0282,
    "phone": None,
    "website": None,
    "image_url": None,
    "is_verified": True,
    "is_featured": False,
    "created_at": "2026-04-12T00:00:00Z",
    "distance_km": None,
    "vendor_items": [],
}

ADMIN_STATS_EXAMPLE = {
    "total_vendors": 5,
    "total_restaurants": 3,
    "total_grocery_stores": 2,
    "total_foods": 3,
    "total_ingredients": 7,
    "total_searches": 42,
}


@router.get(
    "/vendors",
    response_model=list[VendorOut],
    responses={200: {"description": "Admin vendor list", "content": {"application/json": {"example": [ADMIN_VENDOR_EXAMPLE]}}}},
)
async def list_admin_vendors_route() -> list[VendorOut]:
    """List all vendors, including unverified entries."""

    return [VendorOut.model_validate(row) for row in await list_admin_vendors()]


@router.patch(
    "/vendors/{id}/verify",
    response_model=VendorOut,
    responses={200: {"description": "Verified vendor", "content": {"application/json": {"example": ADMIN_VENDOR_EXAMPLE}}}, 404: {"model": ErrorResponse}},
)
async def verify_vendor_route(id: UUID) -> VendorOut:
    """Mark a vendor as verified."""

    return VendorOut.model_validate(await verify_vendor(id))


@router.patch(
    "/vendors/{id}/feature",
    response_model=VendorOut,
    responses={200: {"description": "Toggled featured vendor", "content": {"application/json": {"example": ADMIN_VENDOR_EXAMPLE}}}, 404: {"model": ErrorResponse}},
)
async def toggle_vendor_feature_route(id: UUID) -> VendorOut:
    """Toggle the featured flag for a vendor."""

    return VendorOut.model_validate(await toggle_vendor_feature(id))


@router.delete(
    "/vendors/{id}",
    response_model=ActionResponse,
    responses={200: {"description": "Deleted vendor", "content": {"application/json": {"example": {"status": "deleted", "id": "11111111-1111-1111-1111-111111111111"}}}}, 404: {"model": ErrorResponse}},
)
async def delete_vendor_route(id: UUID) -> ActionResponse:
    """Delete a vendor record."""

    await delete_vendor(id)
    return ActionResponse(status="deleted", id=id)


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    responses={200: {"description": "Admin statistics", "content": {"application/json": {"example": ADMIN_STATS_EXAMPLE}}}},
)
async def admin_stats_route() -> AdminStatsResponse:
    """Return platform statistics for the admin dashboard."""

    return AdminStatsResponse.model_validate(await get_admin_stats())
