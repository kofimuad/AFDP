from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Normalized API error payload."""

    error: str
    detail: str
