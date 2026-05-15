from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.crud_router import build_crud_router
from app.core.database import get_db
from app.models import CnibVerification
from app.schemas import CnibVerificationCreate, CnibVerificationRead, CnibVerificationUpdate
from app.services import CRUDService

cnib_service = CRUDService(CnibVerification)
router: APIRouter = build_crud_router(
    service=cnib_service,
    create_schema=CnibVerificationCreate,
    update_schema=CnibVerificationUpdate,
    read_schema=CnibVerificationRead,
)


@router.post("/{item_id}/manual-validate", response_model=CnibVerificationRead)
def manual_validate_cnib(
    item_id: UUID,
    reviewed_by: UUID,
    approved: bool = True,
    rejection_reason: str | None = None,
    db: Session = Depends(get_db),
):
    cnib = cnib_service.get(db, item_id)
    cnib.status = "verified" if approved else "rejected"
    cnib.reviewed_by = reviewed_by
    cnib.reviewed_at = datetime.now(timezone.utc)
    cnib.rejection_reason = None if approved else rejection_reason
    db.add(cnib)
    db.commit()
    db.refresh(cnib)
    return cnib
