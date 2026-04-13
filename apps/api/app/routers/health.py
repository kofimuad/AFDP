"""Health router exposing infrastructure status checks."""

from fastapi import APIRouter

from app.schemas.health import HealthResponse
from app.services.health_service import check_health

router = APIRouter(prefix="/health", tags=["Health"])

HEALTH_EXAMPLE = {
    "status": "ok",
    "database": "connected",
    "redis": "connected",
    "version": "1.0.0",
}


@router.get(
    "",
    response_model=HealthResponse,
    responses={200: {"description": "Health check result", "content": {"application/json": {"example": HEALTH_EXAMPLE}}}},
)
async def health() -> HealthResponse:
    """Report database and Redis connectivity."""

    return HealthResponse.model_validate(await check_health())
