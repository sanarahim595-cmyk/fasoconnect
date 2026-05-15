from fastapi import APIRouter

from app.api.crud_router import build_crud_router
from app.models import Guarantor
from app.schemas import GuarantorCreate, GuarantorRead, GuarantorUpdate
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(Guarantor),
    create_schema=GuarantorCreate,
    update_schema=GuarantorUpdate,
    read_schema=GuarantorRead,
)
