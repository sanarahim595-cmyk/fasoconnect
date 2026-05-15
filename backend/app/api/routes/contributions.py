from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.crud_router import build_crud_router
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.models import Contribution
from app.schemas import ContributionCreate, ContributionMarkPaid, ContributionRead, ContributionUpdate
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(Contribution),
    create_schema=ContributionCreate,
    update_schema=ContributionUpdate,
    read_schema=ContributionRead,
)


@router.get("/expected", response_model=list[ContributionRead])
def list_expected_payments(
    tontine_id: UUID | None = Query(default=None),
    member_id: UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    statement = select(Contribution).where(Contribution.status.in_(["pending", "late"]))
    if tontine_id:
        statement = statement.where(Contribution.tontine_id == tontine_id)
    if member_id:
        statement = statement.where(Contribution.member_id == member_id)

    return list(db.scalars(statement.order_by(Contribution.due_date.asc()).offset(offset).limit(limit)).all())


@router.get("/history", response_model=list[ContributionRead])
def list_contribution_history(
    tontine_id: UUID | None = Query(default=None),
    member_id: UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    statement = select(Contribution)
    if tontine_id:
        statement = statement.where(Contribution.tontine_id == tontine_id)
    if member_id:
        statement = statement.where(Contribution.member_id == member_id)

    return list(db.scalars(statement.order_by(Contribution.due_date.desc()).offset(offset).limit(limit)).all())


@router.post("/{contribution_id}/mark-paid", response_model=ContributionRead)
def mark_contribution_as_paid(
    contribution_id: UUID,
    payload: ContributionMarkPaid,
    db: Session = Depends(get_db),
):
    contribution = db.get(Contribution, contribution_id)
    if contribution is None:
        raise NotFoundError("Cotisation introuvable.")

    contribution.amount_paid = payload.amount_paid
    contribution.paid_at = payload.paid_at or datetime.now(timezone.utc)
    contribution.receipt_url = payload.proof_url
    contribution.payment_method = "preuve_manuelle"
    contribution.status = "paid"

    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return contribution
