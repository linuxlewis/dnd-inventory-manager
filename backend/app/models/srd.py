"""Pydantic models for SRD (System Reference Document) items.

These models are for API responses only - SRD data is loaded from JSON files.
"""

from typing import Any

from sqlmodel import SQLModel


class SrdItemRead(SQLModel):
    """Schema for SRD item response.

    Flexible schema that accepts any SRD item properties.
    Core fields are typed; additional properties stored in `properties`.
    """

    name: str
    type: str | None = None
    category: str | None = None
    description: str | None = None
    weight: float | None = None
    cost: str | None = None
    properties: dict[str, Any] | None = None

    model_config = {"extra": "allow"}
