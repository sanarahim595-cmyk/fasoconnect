from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.api.crud_router import build_crud_router
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import get_current_user
from app.models import Contribution, Guarantor, Incident, Notification, TontineMember, User
from app.schemas import (
    IncidentCreate,
    IncidentRead,
    IncidentUpdate,
    OverdueScanResult,
    PaymentIncidentAction,
    PaymentProblemRead,
)
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(Incident),
    create_schema=IncidentCreate,
    update_schema=IncidentUpdate,
    read_schema=IncidentRead,
)


@router.post("/overdue/scan", response_model=OverdueScanResult)
def scan_overdue_contributions(
    tontine_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
):
    today = date.today()
    statement = select(Contribution).where(Contribution.status == "pending", Contribution.due_date < today)
    if tontine_id:
        statement = statement.where(Contribution.tontine_id == tontine_id)

    overdue_contributions = list(db.scalars(statement).all())
    marked_late = 0
    incidents_created = 0
    notifications_created = 0

    for contribution in overdue_contributions:
        member = db.get(TontineMember, contribution.member_id)
        if member and member.status != "late":
            member.status = "late"
            db.add(member)
            marked_late += 1

        if contribution.status != "late":
            contribution.status = "late"
            db.add(contribution)

        existing_incident = db.scalars(
            select(Incident).where(
                Incident.contribution_id == contribution.id,
                Incident.type == "late_payment",
                Incident.status.in_(["open", "investigating", "guarantor_notified", "escalated"]),
            )
        ).first()
        if existing_incident:
            continue

        guarantor = db.scalars(
            select(Guarantor).where(
                Guarantor.member_id == contribution.member_id,
                Guarantor.tontine_id == contribution.tontine_id,
                Guarantor.status.in_(["accepted", "called"]),
            )
        ).first()

        incident = Incident(
            tontine_id=contribution.tontine_id,
            member_id=contribution.member_id,
            contribution_id=contribution.id,
            guarantor_id=guarantor.id if guarantor else None,
            type="late_payment",
            severity="medium",
            title="Cotisation en retard",
            description=f"Cotisation du cycle {contribution.cycle_number} echue le {contribution.due_date}.",
            amount=contribution.amount_due,
            status="open",
        )
        db.add(incident)
        incidents_created += 1

        if member:
            db.add(
                Notification(
                    user_id=member.user_id,
                    tontine_id=contribution.tontine_id,
                    type="late_payment",
                    title="Cotisation en retard",
                    message="Votre cotisation a depasse la date prevue. Merci de regulariser la dette.",
                    payload={"contribution_id": str(contribution.id), "incident_type": "late_payment"},
                    status="unread",
                    sent_at=datetime.now(timezone.utc),
                )
            )
            notifications_created += 1

        if guarantor:
            db.add(
                Notification(
                    user_id=guarantor.guarantor_user_id,
                    tontine_id=contribution.tontine_id,
                    type="guarantor_alert",
                    title="Garant associe a un retard",
                    message="Un membre que vous garantissez a une cotisation en retard.",
                    payload={"contribution_id": str(contribution.id), "incident_type": "late_payment"},
                    status="unread",
                    sent_at=datetime.now(timezone.utc),
                )
            )
            notifications_created += 1

    db.commit()
    return {
        "scanned": len(overdue_contributions),
        "marked_late": marked_late,
        "incidents_created": incidents_created,
        "notifications_created": notifications_created,
    }


@router.get("/payment-problems/list", response_model=list[PaymentProblemRead])
def list_payment_problems(
    tontine_id: UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    guarantor_user = aliased(User)
    statement = (
        select(Incident, Contribution, TontineMember, User, Guarantor, guarantor_user)
        .join(Contribution, Incident.contribution_id == Contribution.id)
        .join(TontineMember, Incident.member_id == TontineMember.id)
        .join(User, TontineMember.user_id == User.id)
        .outerjoin(Guarantor, Incident.guarantor_id == Guarantor.id)
        .outerjoin(guarantor_user, Guarantor.guarantor_user_id == guarantor_user.id)
        .where(Incident.type == "late_payment")
        .order_by(Incident.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if tontine_id:
        statement = statement.where(Incident.tontine_id == tontine_id)

    rows = db.execute(statement).all()
    return [
        {
            "incident_id": incident.id,
            "tontine_id": incident.tontine_id,
            "member_id": incident.member_id,
            "contribution_id": incident.contribution_id,
            "guarantor_id": incident.guarantor_id,
            "member_name": f"{member_user.first_name} {member_user.last_name}",
            "member_contact": member_user.phone or member_user.email,
            "guarantor_name": f"{guarantor_user_item.first_name} {guarantor_user_item.last_name}" if guarantor_user_item else None,
            "guarantor_contact": (guarantor_user_item.phone or guarantor_user_item.email) if guarantor_user_item else None,
            "due_date": contribution.due_date,
            "amount_due": contribution.amount_due,
            "amount_paid": contribution.amount_paid,
            "contribution_status": contribution.status,
            "incident_status": incident.status,
            "title": incident.title,
            "description": incident.description,
            "created_at": incident.created_at,
            "resolved_at": incident.resolved_at,
        }
        for incident, contribution, _member, member_user, _guarantor, guarantor_user_item in rows
    ]


@router.post("/{incident_id}/payment-status", response_model=IncidentRead)
def update_payment_incident_status(
    incident_id: UUID,
    payload: PaymentIncidentAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise NotFoundError("Incident introuvable.")

    contribution = db.get(Contribution, incident.contribution_id) if incident.contribution_id else None
    member = db.get(TontineMember, incident.member_id) if incident.member_id else None
    guarantor = db.get(Guarantor, incident.guarantor_id) if incident.guarantor_id else None

    if payload.status == "debt_resolved":
        incident.status = "resolved"
        incident.resolved_by = current_user.id
        incident.resolved_at = datetime.now(timezone.utc)
        if contribution:
            contribution.status = "paid"
            if contribution.amount_paid <= 0:
                contribution.amount_paid = contribution.amount_due
            if contribution.paid_at is None:
                contribution.paid_at = datetime.now(timezone.utc)
            db.add(contribution)
        if member:
            member.status = "up_to_date"
            db.add(member)
    elif payload.status == "debt_pending":
        incident.status = "open"
        incident.resolved_by = None
        incident.resolved_at = None
        if contribution:
            contribution.status = "late"
            db.add(contribution)
        if member:
            member.status = "late"
            db.add(member)
    else:
        incident.status = "guarantor_notified"
        if guarantor:
            guarantor.status = "called"
            db.add(guarantor)
            db.add(
                Notification(
                    user_id=guarantor.guarantor_user_id,
                    tontine_id=incident.tontine_id,
                    type="guarantor_called",
                    title="Garant sollicite",
                    message=payload.note or "Vous etes sollicite pour une dette de tontine en retard.",
                    payload={"incident_id": str(incident.id), "contribution_id": str(incident.contribution_id)},
                    status="unread",
                    sent_at=datetime.now(timezone.utc),
                )
            )

    if payload.note:
        incident.description = f"{incident.description or ''}\nNote admin: {payload.note}".strip()

    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident
