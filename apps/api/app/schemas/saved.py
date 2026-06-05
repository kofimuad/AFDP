"""Schemas for the per-user saved collection (M6 SCRUM-37)."""

from pydantic import BaseModel, Field

from app.schemas.shared import FoodSummary, VendorSummary


class SavedCollectionOut(BaseModel):
    """The authenticated user's saved dishes and places."""

    foods: list[FoodSummary] = Field(default_factory=list)
    vendors: list[VendorSummary] = Field(default_factory=list)
