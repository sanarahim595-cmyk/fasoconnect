from fastapi import APIRouter

from app.api.crud_router import build_crud_router
from app.models import User
from app.schemas import UserCreate, UserRead, UserUpdate
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(User),
    create_schema=UserCreate,
    update_schema=UserUpdate,
    read_schema=UserRead,
)
