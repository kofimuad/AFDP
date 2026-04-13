from pydantic import BaseModel, Field

from app.schemas.shared import FoodSummary, IngredientSummary, VendorSummary


class FoodIngredientOut(BaseModel):
    """Food ingredient relationship payload."""

    ingredient: IngredientSummary
    quantity_note: str | None = None


class FoodDetailOut(FoodSummary):
    """Food detail payload including ingredients and sellers."""

    ingredients: list[FoodIngredientOut] = Field(default_factory=list)
    restaurants: list[VendorSummary] = Field(default_factory=list)
    stores: list[VendorSummary] = Field(default_factory=list)


FoodOut = FoodSummary

