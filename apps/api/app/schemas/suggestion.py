from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FoodSuggestionCreate(BaseModel):
    """A user's recommendation for a food to add to the catalog."""

    name: str
    description: str | None = None
    region: str | None = None
    image_url: str | None = None
    recipe_link: str | None = None
    note: str | None = None


class FoodSuggestionOut(BaseModel):
    """A food suggestion as seen by the submitter and the admin moderation queue."""

    id: UUID
    name: str
    description: str | None = None
    region: str | None = None
    image_url: str | None = None
    recipe_link: str | None = None
    note: str | None = None
    status: str
    suggested_by_email: str | None = None
    created_food_slug: str | None = None
    created_at: datetime | None = None
    reviewed_at: datetime | None = None
