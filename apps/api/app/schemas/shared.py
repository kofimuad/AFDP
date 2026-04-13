from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FoodSummary(BaseModel):
    """Shared food payload used across detail and search responses."""

    id: UUID
    name: str
    slug: str
    description: str | None = None
    image_url: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class IngredientSummary(BaseModel):
    """Shared ingredient payload used across detail and search responses."""

    id: UUID
    name: str
    slug: str
    image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class VendorSummary(BaseModel):
    """Shared vendor payload used across list, detail, and search responses."""

    id: UUID
    name: str
    slug: str
    type: str
    address: str
    lat: float | None = None
    lng: float | None = None
    phone: str | None = None
    website: str | None = None
    image_url: str | None = None
    is_verified: bool = False
    is_featured: bool = False
    created_at: datetime | None = None
    distance_km: float | None = Field(default=None)

    model_config = ConfigDict(from_attributes=True)


class ActionResponse(BaseModel):
    """Generic action response used by delete and moderation endpoints."""

    status: str
    id: UUID | None = None
