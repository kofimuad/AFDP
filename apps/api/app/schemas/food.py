from pydantic import BaseModel, Field

from app.schemas.shared import FoodSummary, IngredientSummary, RecipeLinkOut, VendorSummary


class FoodIngredientOut(BaseModel):
    """Food ingredient relationship payload."""

    ingredient: IngredientSummary
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


FoodOut = FoodSummary

