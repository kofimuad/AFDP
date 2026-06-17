from pydantic import BaseModel, Field


class RecipeIngredientIn(BaseModel):
    """An ingredient line when creating a recipe via the admin path."""

    name: str
    quantity: float | None = None
    unit: str | None = None
    quantity_note: str | None = None


class RecipeCreate(BaseModel):
    """Admin payload to add a recipe to the dish repository.

    Regions, cuisines, and ingredients are matched by name and created if new,
    so admins can grow the catalog without pre-seeding reference data.
    """

    name: str
    description: str | None = None
    image_url: str | None = None
    region: str | None = None
    cuisines: list[str] = Field(default_factory=list)
    prep_minutes: int | None = None
    cook_minutes: int | None = None
    servings: int | None = None
    ingredients: list[RecipeIngredientIn] = Field(default_factory=list)
