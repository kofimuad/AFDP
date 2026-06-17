from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.shared import IngredientSummary, VendorSummary


class ShoppingListItemOut(BaseModel):
    """A single checkable line on the user's shopping list."""

    id: UUID
    ingredient: IngredientSummary
    quantity_note: str | None = None
    checked: bool = False
    # Name/slug of the recipe this item first came from, if any.
    source_food_name: str | None = None
    source_food_slug: str | None = None


class ShoppingListOut(BaseModel):
    """The user's full shopping list with progress counts."""

    items: list[ShoppingListItemOut] = Field(default_factory=list)
    total: int = 0
    checked_count: int = 0


class AddRecipeResult(BaseModel):
    """Result of adding a recipe's ingredients to the list."""

    food_slug: str
    food_name: str
    added: int  # newly-added ingredients (already-present ones are skipped)
    total: int  # list size after adding


class AddFromSavedResult(BaseModel):
    """Result of building the shopping list from all saved recipes."""

    recipes: int  # how many saved dishes contributed
    added: int    # newly-added ingredients
    total: int    # list size after adding


class ItemCheck(BaseModel):
    checked: bool


class StoreCoverageOut(BaseModel):
    """A store ranked by how many shopping-list items it stocks, then proximity."""

    store: VendorSummary
    items_covered: int
    total_items: int
    covered_ingredient_ids: list[UUID] = Field(default_factory=list)
