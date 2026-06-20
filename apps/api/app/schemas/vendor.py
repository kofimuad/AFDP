from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.shared import FoodSummary, IngredientSummary, VendorSummary


class VendorAnalyticsTotals(BaseModel):
    """Headline counts for a vendor's dashboard."""

    views: int = 0
    search_appearances: int = 0
    dish_views: int = 0
    saves: int = 0


class VendorViewsPoint(BaseModel):
    """A single day in the views-this-week series."""

    label: str
    count: int = 0


class VendorAnalyticsOut(BaseModel):
    """Vendor-scoped analytics payload."""

    totals: VendorAnalyticsTotals
    views_this_week: list[VendorViewsPoint] = Field(default_factory=list)


class VendorRegisterIn(BaseModel):
    """Payload for public vendor self-registration."""

    name: str
    type: Literal["restaurant", "grocery_store"]
    address: str
    lat: float
    lng: float
    phone: str | None = None
    website: str | None = None
    image_url: str | None = None


class VendorUpdate(BaseModel):
    """Partial vendor update payload used by moderation flows."""

    name: str | None = None
    type: Literal["restaurant", "grocery_store"] | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    phone: str | None = None
    website: str | None = None
    image_url: str | None = None
    is_verified: bool | None = None
    is_featured: bool | None = None


class VendorSelfUpdate(BaseModel):
    """Fields a vendor owner may update on their own listing."""

    name: str | None = None
    type: Literal["restaurant", "grocery_store"] | None = None
    address: str | None = None
    phone: str | None = None
    website: str | None = None


class VendorItemUpdate(BaseModel):
    """Partial update to a vendor's dish (food name/description + item price)."""

    name: str | None = None
    description: str | None = None
    price: float | None = None


class VendorStockOut(BaseModel):
    """Result of toggling whether a store carries a catalog ingredient."""

    vendor_id: UUID
    ingredient_id: UUID
    stocked: bool


class VendorItemCreate(BaseModel):
    """Payload for attaching a food or ingredient to a vendor."""

    food_id: UUID | None = None
    ingredient_id: UUID | None = None
    price: float | None = None
    available: bool = True

    @model_validator(mode="after")
    def validate_exactly_one_item(self) -> "VendorItemCreate":
        if (self.food_id is None) == (self.ingredient_id is None):
            raise ValueError("exactly one of food_id or ingredient_id must be set")
        return self


class VendorItemOut(BaseModel):
    """Normalized vendor item response."""

    id: UUID
    vendor_id: UUID
    food_id: UUID | None = None
    ingredient_id: UUID | None = None
    food: FoodSummary | None = None
    ingredient: IngredientSummary | None = None
    price: float | None = None
    available: bool = True
    item_type: Literal["food", "ingredient"]

    model_config = ConfigDict(from_attributes=True)


class VendorOut(VendorSummary):
    """Vendor response model used by public and admin endpoints."""

    vendor_items: list[VendorItemOut] = Field(default_factory=list)


VendorCreate = VendorRegisterIn

