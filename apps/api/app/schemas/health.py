from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response payload."""

    status: str
    database: str
    redis: str
    version: str
