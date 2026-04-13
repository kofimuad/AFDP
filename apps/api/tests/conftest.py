from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ["DATABASE_URL"] = "postgresql://postgres:afdp_dev_2024@localhost:5432/afdp"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app
from app.core.database import close_db_pool
from app.core.redis import close_redis


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    """Create an async test client against the FastAPI app."""

    await close_db_pool()
    await close_redis()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client

    await close_db_pool()
    await close_redis()

