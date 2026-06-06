"""Public engagement-event tracking (e.g. menu-item clicks).

Lightweight endpoint the web client calls to record interactions that aren't
already captured by a page-load GET. Writes are fire-and-forget via the same
log_view_event used elsewhere, so a failure never breaks the UI.
"""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel

from app.services.analytics_service import log_view_event
from app.services.auth_service import get_optional_user

router = APIRouter(prefix="/events", tags=["Events"])


class ViewEventIn(BaseModel):
    entity_type: Literal["vendor", "food", "ingredient"]
    entity_id: UUID


@router.post("/view", status_code=202)
async def track_view(
    payload: ViewEventIn,
    background_tasks: BackgroundTasks,
    current_user: dict | None = Depends(get_optional_user),
) -> dict[str, str]:
    """Record a view/engagement event for an entity (menu click, etc.)."""
    background_tasks.add_task(
        log_view_event,
        entity_type=payload.entity_type,
        entity_id=str(payload.entity_id),
        user_id=current_user["id"] if current_user else None,
    )
    return {"status": "accepted"}
