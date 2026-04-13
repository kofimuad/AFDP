from pydantic import BaseModel, Field

from app.schemas.shared import FoodSummary, IngredientSummary, VendorSummary


class SearchIngredientBundle(BaseModel):
    """Ingredient search bundle with nearby stores."""

    ingredient: IngredientSummary
    stores: list[VendorSummary] = Field(default_factory=list)


class SearchResponse(BaseModel):
    """Unified search response payload."""

    food_match: FoodSummary | None = None
    restaurants: list[VendorSummary] = Field(default_factory=list)
    ingredients: list[SearchIngredientBundle] = Field(default_factory=list)
    preparation_guide: str | None = None

