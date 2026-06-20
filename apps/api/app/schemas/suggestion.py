from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SuggestionIngredient(BaseModel):
    """A single ingredient line on a food suggestion.

    Free-text by design: a user typing "2 cups" or "to taste" shouldn't be
    forced into structured numbers. The amount becomes the food_ingredients
    quantity_note when the suggestion is accepted.
    """

    name: str
    quantity_note: str | None = None


class FoodSuggestionCreate(BaseModel):
    """A user's recommendation for a food to add to the catalog."""

    name: str
    description: str | None = None
    region: str | None = None
    image_url: str | None = None
    recipe_link: str | None = None
    note: str | None = None
    ingredients: list[SuggestionIngredient] = Field(default_factory=list)


class FoodSuggestionUpdate(BaseModel):
    """Admin edits to a pending suggestion before accepting/declining it.

    All fields optional — only what's provided is changed. ``ingredients`` is
    replaced wholesale when present (None leaves the existing list untouched).
    """

    name: str | None = None
    description: str | None = None
    region: str | None = None
    image_url: str | None = None
    recipe_link: str | None = None
    note: str | None = None
    ingredients: list[SuggestionIngredient] | None = None


class FoodSuggestionOut(BaseModel):
    """A food suggestion as seen by the submitter and the admin moderation queue."""

    id: UUID
    name: str
    description: str | None = None
    region: str | None = None
    image_url: str | None = None
    recipe_link: str | None = None
    note: str | None = None
    ingredients: list[SuggestionIngredient] = Field(default_factory=list)
    status: str
    suggested_by_email: str | None = None
    created_food_slug: str | None = None
    created_at: datetime | None = None
    reviewed_at: datetime | None = None
