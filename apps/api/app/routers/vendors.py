"""Vendor router handling public discovery, onboarding, and item management."""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile

from app.schemas.error import ErrorResponse
from app.schemas.vendor import VendorItemCreate, VendorItemOut, VendorItemUpdate, VendorOut, VendorRegisterIn, VendorSelfUpdate
from app.services.analytics_service import log_view_event
from app.services.auth_service import get_optional_user, require_vendor
from app.services.cloudinary_service import upload_image
from app.services.vendor_service import (
    add_vendor_dish,
    add_vendor_grocery,
    add_vendor_item,
    get_vendor_detail,
    get_vendor_by_id,
    list_vendors,
    register_vendor,
    remove_vendor_item,
    update_vendor,
    update_vendor_image,
    update_vendor_item,
)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get(
    "/me",
    response_model=VendorOut,
    responses={
        200: {"description": "Authenticated vendor detail"},
        404: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
    },
)
async def get_my_vendor_route(
    current_user: dict = Depends(require_vendor),
) -> VendorOut:
    """Return the authenticated vendor's own listing with all items."""
    vendor_id = current_user.get("vendor_id")
    if not vendor_id:
        raise HTTPException(
            status_code=404,
            detail="No vendor listing found for this account",
        )
    payload = await get_vendor_by_id(UUID(vendor_id))
    full = await get_vendor_detail(slug=payload["slug"])
    return VendorOut.model_validate(full)

VENDOR_EXAMPLE = {
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
    "distance_km": 2.14,
    "vendor_items": [],
}

VENDOR_ITEM_EXAMPLE = {
    "id": "22222222-2222-2222-2222-222222222222",
    "vendor_id": "11111111-1111-1111-1111-111111111111",
    "food_id": "33333333-3333-3333-3333-333333333333",
    "ingredient_id": None,
    "food": {
        "id": "33333333-3333-3333-3333-333333333333",
        "name": "Jollof Rice",
        "slug": "jollof-rice",
        "description": "Smoky tomato-based rice dish popular across West Africa.",
        "image_url": "https://images.example.com/jollof-rice.jpg",
        "created_at": "2026-04-12T00:00:00Z",
    },
    "ingredient": None,
    "price": 14.99,
    "available": True,
    "item_type": "food",
}

LIST_EXAMPLE = [VENDOR_EXAMPLE]


@router.get(
    "",
    response_model=list[VendorOut],
    responses={200: {"description": "Vendor list", "content": {"application/json": {"example": LIST_EXAMPLE}}}},
)
async def list_vendor_route(
    type_: str | None = Query(default=None, alias="type", pattern="^(restaurant|grocery_store)$"),
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    radius_km: float = Query(10, gt=0),
    is_featured: bool | None = Query(default=None),
    is_verified: bool | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> list[VendorOut]:
    """List vendors with optional filters and pagination."""

    rows = await list_vendors(
        type_=type_,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        is_featured=is_featured,
        is_verified=is_verified,
        page=page,
        page_size=page_size,
    )
    return [VendorOut.model_validate(row) for row in rows]


@router.get(
    "/{slug}",
    response_model=VendorOut,
    responses={
        200: {"description": "Vendor detail", "content": {"application/json": {"example": {**VENDOR_EXAMPLE, "vendor_items": [VENDOR_ITEM_EXAMPLE]}}}},
        404: {"model": ErrorResponse, "content": {"application/json": {"example": {"error": "not_found", "detail": "Vendor not found"}}}},
    },
)
async def get_vendor_route(
    slug: str,
    background_tasks: BackgroundTasks,
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    current_user: dict | None = Depends(get_optional_user),
) -> VendorOut:
    """Return a vendor detail record by slug."""

    payload = await get_vendor_detail(slug=slug, lat=lat, lng=lng)
    background_tasks.add_task(
        log_view_event,
        entity_type="vendor",
        entity_id=str(payload["id"]),
        user_id=current_user["id"] if current_user else None,
    )
    return VendorOut.model_validate(payload)


@router.post(
    "/register",
    response_model=VendorOut,
    responses={200: {"description": "Created vendor", "content": {"application/json": {"example": VENDOR_EXAMPLE}}}},
)
async def register_vendor_route(payload: VendorRegisterIn) -> VendorOut:
    """Register a new vendor publicly."""

    return VendorOut.model_validate(await register_vendor(payload))


@router.post(
    "/{id}/items",
    response_model=VendorItemOut,
    responses={200: {"description": "Created vendor item", "content": {"application/json": {"example": VENDOR_ITEM_EXAMPLE}}}},
)
async def add_vendor_item_route(id: UUID, payload: VendorItemCreate) -> VendorItemOut:
    """Attach a food or ingredient to a vendor."""

    return VendorItemOut.model_validate(await add_vendor_item(id, payload))


@router.post(
    "/{id}/image",
    response_model=VendorOut,
    responses={
        200: {"description": "Updated vendor", "content": {"application/json": {"example": VENDOR_EXAMPLE}}},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def upload_vendor_image_route(
    id: UUID,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_vendor),
) -> VendorOut:
    """Upload a listing image for a vendor. Owner (or admin) only."""

    if current_user["role"] != "admin" and current_user.get("vendor_id") != str(id):
        raise HTTPException(status_code=403, detail="Not authorized for this vendor")

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 5MB or smaller")

    try:
        url = await upload_image(contents, folder="afdp/vendors", public_id=str(id))
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Image upload failed") from exc

    return VendorOut.model_validate(await update_vendor_image(id, url))


@router.patch(
    "/{id}",
    response_model=VendorOut,
    responses={
        200: {"description": "Updated vendor", "content": {"application/json": {"example": VENDOR_EXAMPLE}}},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def update_vendor_route(
    id: UUID,
    payload: VendorSelfUpdate,
    current_user: dict = Depends(require_vendor),
) -> VendorOut:
    """Update a vendor's own profile fields. Owner (or admin) only."""

    if current_user["role"] != "admin" and current_user.get("vendor_id") != str(id):
        raise HTTPException(status_code=403, detail="Not authorized for this vendor")

    fields = payload.model_dump(exclude_unset=True)
    updated = await update_vendor(id, fields)
    full = await get_vendor_detail(slug=updated["slug"])
    return VendorOut.model_validate(full)


@router.post(
    "/{id}/dishes",
    response_model=VendorItemOut,
    responses={
        200: {"description": "Created dish", "content": {"application/json": {"example": VENDOR_ITEM_EXAMPLE}}},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
async def add_vendor_dish_route(
    id: UUID,
    name: str = Form(..., min_length=1),
    description: str | None = Form(default=None),
    price: float | None = Form(default=None),
    available: bool = Form(default=True),
    file: UploadFile | None = File(default=None),
    current_user: dict = Depends(require_vendor),
) -> VendorItemOut:
    """Add a dish to a vendor: finds-or-creates a food in the catalog, uploads image."""

    if current_user["role"] != "admin" and current_user.get("vendor_id") != str(id):
        raise HTTPException(status_code=403, detail="Not authorized for this vendor")

    image_url: str | None = None
    if file is not None:
        content_type = (file.content_type or "").lower()
        if content_type and content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=415, detail="Unsupported image type")
        contents = await file.read()
        if contents:
            if len(contents) > MAX_IMAGE_BYTES:
                raise HTTPException(status_code=413, detail="Image must be 5MB or smaller")
            try:
                from uuid import uuid4 as _uuid4
                image_url = await upload_image(contents, folder="afdp/foods", public_id=_uuid4().hex)
            except Exception as exc:
                raise HTTPException(status_code=502, detail="Image upload failed") from exc

    return VendorItemOut.model_validate(
        await add_vendor_dish(
            id,
            name=name,
            description=description,
            price=price,
            available=available,
            image_url=image_url,
        )
    )


@router.post(
    "/{id}/groceries",
    response_model=VendorItemOut,
    responses={
        200: {"description": "Created grocery item", "content": {"application/json": {"example": VENDOR_ITEM_EXAMPLE}}},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
async def add_vendor_grocery_route(
    id: UUID,
    name: str = Form(..., min_length=1),
    price: float | None = Form(default=None),
    available: bool = Form(default=True),
    file: UploadFile | None = File(default=None),
    current_user: dict = Depends(require_vendor),
) -> VendorItemOut:
    """Add a grocery item to a vendor: finds-or-creates an ingredient in the catalog, uploads image."""

    if current_user["role"] != "admin" and current_user.get("vendor_id") != str(id):
        raise HTTPException(status_code=403, detail="Not authorized for this vendor")

    image_url: str | None = None
    if file is not None:
        content_type = (file.content_type or "").lower()
        if content_type and content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=415, detail="Unsupported image type")
        contents = await file.read()
        if contents:
            if len(contents) > MAX_IMAGE_BYTES:
                raise HTTPException(status_code=413, detail="Image must be 5MB or smaller")
            try:
                from uuid import uuid4 as _uuid4
                image_url = await upload_image(contents, folder="afdp/ingredients", public_id=_uuid4().hex)
            except Exception as exc:
                raise HTTPException(status_code=502, detail="Image upload failed") from exc

    return VendorItemOut.model_validate(
        await add_vendor_grocery(
            id,
            name=name,
            price=price,
            available=available,
            image_url=image_url,
        )
    )


@router.delete(
    "/{id}/items/{item_id}",
    response_model=dict[str, str],
    responses={
        200: {"description": "Deleted vendor item", "content": {"application/json": {"example": {"status": "deleted", "id": "22222222-2222-2222-2222-222222222222"}}}},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def remove_vendor_item_route(
    id: UUID,
    item_id: UUID,
    current_user: dict = Depends(require_vendor),
) -> dict[str, str]:
    """Remove an item from a vendor. Owner (or admin) only."""

    if current_user["role"] != "admin" and current_user.get("vendor_id") != str(id):
        raise HTTPException(status_code=403, detail="Not authorized for this vendor")

    await remove_vendor_item(id, item_id)
    return {"status": "deleted", "id": str(item_id)}


@router.patch(
    "/{id}/items/{item_id}",
    response_model=VendorItemOut,
    responses={
        200: {"description": "Updated vendor item", "content": {"application/json": {"example": VENDOR_ITEM_EXAMPLE}}},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def update_vendor_item_route(
    id: UUID,
    item_id: UUID,
    payload: VendorItemUpdate,
    current_user: dict = Depends(require_vendor),
) -> VendorItemOut:
    """Update a vendor's dish: name/description on the food, price on the item. Owner (or admin) only."""

    if current_user["role"] != "admin" and current_user.get("vendor_id") != str(id):
        raise HTTPException(status_code=403, detail="Not authorized for this vendor")

    fields = payload.model_dump(exclude_unset=True)
    return VendorItemOut.model_validate(await update_vendor_item(id, item_id, fields))
