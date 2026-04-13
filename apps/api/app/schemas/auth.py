from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    vendor_id: str | None = None
    created_at: datetime | None = None
    profile_image_url: str | None = None


class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)


class UserRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8)


class VendorRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8)
    business_name: str
    business_type: Literal["restaurant", "grocery_store"]
    address: str
    lat: float
    lng: float
    phone: str | None = None
    website: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str