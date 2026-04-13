from __future__ import annotations

from typing import Any


def bind_param(params: list[Any], value: Any) -> str:
    """Append a SQL parameter value and return its asyncpg placeholder."""

    params.append(value)
    return f"${len(params)}"
