from typing import Type
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import MessageResponse
from app.services import CRUDService


def build_crud_router(
    *,
    service: CRUDService,
    create_schema: Type[BaseModel],
    update_schema: Type[BaseModel],
    read_schema: Type[BaseModel],
) -> APIRouter:
    router = APIRouter()

    @router.get("", response_model=list[read_schema])
    def list_items(
        limit: int = Query(default=50, ge=1, le=100),
        offset: int = Query(default=0, ge=0),
        db: Session = Depends(get_db),
    ):
        return service.list(db, limit=limit, offset=offset)

    @router.post("", response_model=read_schema, status_code=status.HTTP_201_CREATED)
    def create_item(payload: create_schema, db: Session = Depends(get_db)):
        return service.create(db, payload)

    @router.get("/{item_id}", response_model=read_schema)
    def get_item(item_id: UUID, db: Session = Depends(get_db)):
        return service.get(db, item_id)

    @router.patch("/{item_id}", response_model=read_schema)
    def update_item(item_id: UUID, payload: update_schema, db: Session = Depends(get_db)):
        return service.update(db, item_id, payload)

    @router.delete("/{item_id}", response_model=MessageResponse)
    def delete_item(item_id: UUID, db: Session = Depends(get_db)):
        service.delete(db, item_id)
        return {"message": "Ressource supprimee avec succes."}

    return router
