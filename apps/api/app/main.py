from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings
from app.core.database import close_db_pool, init_db_pool
from app.core.redis import close_redis, init_redis
from contextlib import asynccontextmanager
from app.routers import admin, admin_management, analytics, foods, health, ingredients, search, vendors
from app.routers import auth as auth_router

settings = get_settings()


# --- FastAPI lifespan context manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_db_pool()
    except Exception:
        pass
    try:
        await init_redis()
    except Exception:
        pass
    yield
    # Shutdown
    try:
        await close_db_pool()
    except Exception:
        pass
    try:
        await close_redis()
    except Exception:
        pass

app = FastAPI(
    title="AFDP API",
    version=settings.app_version,
    description="African Food Discovery Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Search", "description": "Food and vendor discovery endpoints."},
        {"name": "Vendors", "description": "Vendor discovery and onboarding endpoints."},
        {"name": "Foods", "description": "Food catalog endpoints."},
        {"name": "Ingredients", "description": "Ingredient catalog endpoints."},
        {"name": "Admin", "description": "Administrative moderation endpoints."},
        {"name": "Health", "description": "Infrastructure health checks."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", "/app/uploads"))
try:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
except PermissionError:
    UPLOADS_DIR = Path(tempfile.mkdtemp(prefix="afdp-uploads-"))
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


def _validation_detail(errors: list[dict]) -> str:
    """Convert validation errors into a human readable message."""

    messages: list[str] = []
    for error in errors:
        location = ".".join(str(part) for part in error.get("loc", []))
        message = error.get("msg", "Invalid input")
        if location:
            messages.append(f"{location}: {message}")
        else:
            messages.append(message)
    return "; ".join(messages)




@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    error_code = "http_error"
    if exc.status_code == 404:
        error_code = "not_found"
    elif exc.status_code == 401:
        error_code = "unauthorized"
    elif exc.status_code == 422:
        error_code = "validation_error"

    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error_code, "detail": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": "validation_error", "detail": _validation_detail(exc.errors())},
    )


_allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",")]


def _cors_headers(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin")
    if origin and origin in _allowed_origins:
        return {
            "access-control-allow-origin": origin,
            "access-control-allow-credentials": "true",
            "vary": "Origin",
        }
    return {}


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    import logging
    logging.getLogger("uvicorn.error").exception("Unhandled exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "detail": "An unexpected error occurred"},
        headers=_cors_headers(request),
    )


app.include_router(search.router, prefix=settings.api_v1_prefix)
app.include_router(vendors.router, prefix=settings.api_v1_prefix)
app.include_router(foods.router, prefix=settings.api_v1_prefix)
app.include_router(ingredients.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(analytics.router, prefix=settings.api_v1_prefix)
app.include_router(admin_management.router, prefix=settings.api_v1_prefix)
app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(
    auth_router.router,
    prefix="/api/v1",
    tags=["Auth"]
)
