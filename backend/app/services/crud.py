from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.core.database import Base
from app.core.exceptions import NotFoundError

ModelT = TypeVar("ModelT", bound=Base)
CreateSchemaT = TypeVar("CreateSchemaT", bound=BaseModel)
UpdateSchemaT = TypeVar("UpdateSchemaT", bound=BaseModel)


class CRUDService(Generic[ModelT, CreateSchemaT, UpdateSchemaT]):
    def __init__(self, model: type[ModelT]) -> None:
        self.model = model

    def list(self, db: Session, *, limit: int = 50, offset: int = 0) -> list[ModelT]:
        statement: Select = select(self.model).offset(offset).limit(limit)
        return list(db.scalars(statement).all())

    def get(self, db: Session, item_id: UUID) -> ModelT:
        item = db.get(self.model, item_id)
        if item is None:
            raise NotFoundError(f"Ressource introuvable: {self.model.__tablename__}")
        return item

    def create(self, db: Session, payload: CreateSchemaT) -> ModelT:
        values = payload.model_dump(exclude_unset=True)
        if "metadata" in values and hasattr(self.model, "metadata_"):
            values["metadata_"] = values.pop("metadata")

        item = self.model(**values)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update(self, db: Session, item_id: UUID, payload: UpdateSchemaT) -> ModelT:
        item = self.get(db, item_id)
        values: dict[str, Any] = payload.model_dump(exclude_unset=True)

        if "metadata" in values and hasattr(item, "metadata_"):
            values["metadata_"] = values.pop("metadata")

        for field, value in values.items():
            setattr(item, field, value)

        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def delete(self, db: Session, item_id: UUID) -> None:
        item = self.get(db, item_id)
        db.delete(item)
        db.commit()
