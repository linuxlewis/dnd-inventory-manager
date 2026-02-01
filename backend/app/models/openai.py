"""Pydantic schemas for OpenAI connection."""

from datetime import datetime

from pydantic import BaseModel, Field


class OpenAIConnect(BaseModel):
    """Schema for connecting OpenAI API key."""

    api_key: str = Field(min_length=1, description="OpenAI API key")


class OpenAIStatus(BaseModel):
    """Schema for OpenAI connection status response."""

    connected: bool
    is_valid: bool | None = None
    connected_at: datetime | None = None
    last_used_at: datetime | None = None


class OpenAITestResponse(BaseModel):
    """Schema for OpenAI test response."""

    success: bool
    message: str | None = None


class ThumbnailResponse(BaseModel):
    """Schema for thumbnail generation response."""

    success: bool
    thumbnail_url: str | None = None
    message: str | None = None
