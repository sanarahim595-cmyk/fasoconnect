from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.crud_router import build_crud_router
from app.core.database import get_db
from app.core.exceptions import ValidationError
from app.models import Guarantor, Notification, TontineMember, User
from app.schemas import MemberInviteCreate, MemberInviteRead, TontineMemberCreate, TontineMemberRead, TontineMemberUpdate
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(TontineMember),
    create_schema=TontineMemberCreate,
    update_schema=TontineMemberUpdate,
    read_schema=TontineMemberRead,
)


@router.post("/invite-with-guarantor", response_model=MemberInviteRead, status_code=status.HTTP_201_CREATED)
def invite_member_with_guarantor(payload: MemberInviteCreate, db: Session = Depends(get_db)):
    if not payload.phone and not payload.email:
        raise ValidationError("Le membre doit avoir un téléphone ou un email.")
    if not payload.guarantor_phone and not payload.guarantor_email:
        raise ValidationError("Un garant est obligatoire pour ajouter un membre.")
    if payload.phone and payload.guarantor_phone and payload.phone == payload.guarantor_phone:
        raise ValidationError("Le garant doit être différent du membre.")
    if payload.email and payload.guarantor_email and payload.email == payload.guarantor_email:
        raise ValidationError("Le garant doit être différent du membre.")

    invited_user = get_or_create_user(
        db,
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
    )
    guarantor_user = get_or_create_user(
        db,
        full_name=payload.guarantor_full_name,
        phone=payload.guarantor_phone,
        email=payload.guarantor_email,
    )

    member = TontineMember(
        tontine_id=payload.tontine_id,
        user_id=invited_user.id,
        role=payload.role,
        status="up_to_date",
        validated_at=datetime.now(timezone.utc),
    )
    db.add(member)
    db.flush()

    guarantor = Guarantor(
        tontine_id=payload.tontine_id,
        member_id=member.id,
        guarantor_user_id=guarantor_user.id,
        relationship=payload.relationship,
        accepted_at=datetime.now(timezone.utc),
        status="accepted",
    )
    db.add(guarantor)
    db.add(
        Notification(
            user_id=invited_user.id,
            tontine_id=payload.tontine_id,
            type="member_added",
            title="Vous avez ete ajoute a une tontine",
            message="Votre inscription dans la tontine a ete enregistree avec un garant.",
            payload={"member_id": str(member.id), "guarantor_id": str(guarantor.id)},
            status="unread",
            sent_at=datetime.now(timezone.utc),
        )
    )
    db.add(
        Notification(
            user_id=guarantor_user.id,
            tontine_id=payload.tontine_id,
            type="guarantor_assigned",
            title="Vous etes garant",
            message="Vous avez ete associe comme garant d'un membre de tontine.",
            payload={"member_id": str(member.id), "guarantor_id": str(guarantor.id)},
            status="unread",
            sent_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    db.refresh(invited_user)
    db.refresh(guarantor_user)
    db.refresh(member)
    db.refresh(guarantor)

    return {
        "member": member,
        "guarantor": guarantor,
        "invited_user": invited_user,
        "guarantor_user": guarantor_user,
        "message": "Membre ajouté avec garant obligatoire.",
    }


def get_or_create_user(db: Session, *, full_name: str, phone: str | None, email: str | None) -> User:
    filters = []
    if phone:
        filters.append(User.phone == phone)
    if email:
        filters.append(User.email == email)

    user = db.scalars(select(User).where(or_(*filters))).first() if filters else None
    if user:
        return user

    names = [part for part in full_name.strip().split(" ") if part]
    user = User(
        phone=phone,
        email=email,
        first_name=names[0],
        last_name=" ".join(names[1:]) or names[0],
        status="pending_verification",
    )
    db.add(user)
    db.flush()
    return user
