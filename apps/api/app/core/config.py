from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "AFDP API"
    app_version: str = "1.0.0"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql://postgres@localhost:5432/afdp"
    database_min_pool_size: int = 1
    database_max_pool_size: int = 10

    redis_url: str = "redis://localhost:6379/0"
    search_cache_ttl_seconds: int = 300
    admin_api_key: str = ""

    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    mapbox_access_token: str = ""
    neon_database_url: str = ""
    upstash_redis_url: str = ""
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def normalize_origins(cls, value: str) -> str:
        return value or "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings singleton."""

    return Settings()
