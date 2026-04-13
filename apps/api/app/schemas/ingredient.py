from pydantic import BaseModel, Field

from app.schemas.shared import IngredientSummary, VendorSummary


class IngredientDetailOut(IngredientSummary):
    """Ingredient detail payload including seller locations."""

    stores: list[VendorSummary] = Field(default_factory=list)


IngredientOut = IngredientSummary

