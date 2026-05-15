from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    error: dict


class MessageResponse(BaseModel):
    message: str


class TimestampedRead(ORMModel):
    id: UUID
    created_at: datetime
    updated_at: datetime


class PaginationParams(BaseModel):
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
