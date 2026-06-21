from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.shared import FoodSummary, IngredientSummary, RecipeLinkOut, VendorSummary


class FoodIngredientOut(BaseModel):
    """Food ingredient relationship payload."""

    ingredient: IngredientSummary
    # Structured amount (when curated) + the free-text note as a fallback/extra.
    quantity: float | None = None
    unit: str | None = None
    quantity_note: str | None = None


class FoodDetailOut(FoodSummary):
    """Food detail payload including ingredients, sellers, and recipe links."""

    ingredients: list[FoodIngredientOut] = Field(default_factory=list)
    restaurants: list[VendorSummary] = Field(default_factory=list)
    stores: list[VendorSummary] = Field(default_factory=list)
    recipe_links: list[RecipeLinkOut] = Field(default_factory=list)


class IngredientStoresOut(BaseModel):
    """Per-ingredient nearby store availability for a dish's shopping list."""

    ingredient: IngredientSummary
    quantity_note: str | None = None
    available_nearby: bool = False
    stores: list[VendorSummary] = Field(default_factory=list)
    # Nearest stores worldwide when none are within the requested radius.
    fallback_stores: list[VendorSummary] = Field(default_factory=list)


class AdminIngredientIn(BaseModel):
    """An ingredient line on the admin food create/edit form.

    Free-text amount (quantity_note) to match the rest of the catalog — African
    quantities are often non-numeric ("to taste", "a handful").
    """

    name: str
    quantity_note: str | None = None


class AdminFoodOut(BaseModel):
    """A catalog food as seen in the admin management table."""

    id: UUID
    name: str
    slug: str
    description: str | None = None
    region: str | None = None
    image_url: str | None = None
    recipe_link: str | None = None
    ingredients: list[AdminIngredientIn] = Field(default_factory=list)
    created_at: datetime | None = None


class FoodCreateIn(BaseModel):
    """Admin payload to add a food to the catalog."""

    name: str
    description: str | None = None
    region: str | None = None
    image_url: str | None = None
    recipe_link: str | None = None
    ingredients: list[AdminIngredientIn] = Field(default_factory=list)


class FoodUpdateIn(BaseModel):
    """Admin payload to edit a food. Omitted fields are left unchanged.

    ``ingredients`` is None to leave the list alone; a provided list (even empty)
    replaces the food's ingredients wholesale.
    """

    name: str | None = None
    description: str | None = None
    region: str | None = None
    image_url: str | None = None
    recipe_link: str | None = None
    ingredients: list[AdminIngredientIn] | None = None


FoodOut = FoodSummary

