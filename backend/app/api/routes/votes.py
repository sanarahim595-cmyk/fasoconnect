from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.crud_router import build_crud_router
from app.core.database import get_db
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.core.security import get_current_user
from app.models import Notification, TontineMember, Vote, VoteOption, VoteResponse
from app.schemas import (
    ExpiredVotesResult,
    InternalVoteCreate,
    VoteCreate,
    VoteAnswerCreate,
    VoteOptionCreate,
    VoteOptionRead,
    VoteOptionUpdate,
    VoteRead,
    VoteResponseCreate,
    VoteResponseRead,
    VoteResponseUpdate,
    VoteResultsRead,
    VoteUpdate,
)
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(Vote),
    create_schema=VoteCreate,
    update_schema=VoteUpdate,
    read_schema=VoteRead,
)
router.include_router(
    build_crud_router(
        service=CRUDService(VoteOption),
        create_schema=VoteOptionCreate,
        update_schema=VoteOptionUpdate,
        read_schema=VoteOptionRead,
    ),
    prefix="/options",
    tags=["vote_options"],
)
router.include_router(
    build_crud_router(
        service=CRUDService(VoteResponse),
        create_schema=VoteResponseCreate,
        update_schema=VoteResponseUpdate,
        read_schema=VoteResponseRead,
    ),
    prefix="/responses",
    tags=["vote_responses"],
)


@router.post("/internal/create", response_model=VoteResultsRead, status_code=status.HTTP_201_CREATED)
def create_internal_vote(
    payload: InternalVoteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vote = Vote(
        tontine_id=payload.tontine_id,
        community_project_id=payload.community_project_id,
        created_by=current_user.id,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        status=payload.status,
        opens_at=datetime.now(timezone.utc),
        closes_at=payload.deadline,
        allow_multiple_choices=payload.allow_multiple_choices,
    )
    db.add(vote)
    db.flush()

    for position, label in enumerate(payload.options):
        cleaned = label.strip()
        if not cleaned:
            raise ValidationError("Chaque option de vote doit avoir un libelle.")
        db.add(VoteOption(vote_id=vote.id, label=cleaned, position=position))

    if vote.tontine_id:
        member_user_ids = db.scalars(select(TontineMember.user_id).where(TontineMember.tontine_id == vote.tontine_id)).all()
        for user_id in set(member_user_ids):
            db.add(
                Notification(
                    user_id=user_id,
                    tontine_id=vote.tontine_id,
                    type="new_vote",
                    title="Nouveau vote ouvert",
                    message=vote.title,
                    payload={"vote_id": str(vote.id), "deadline": payload.deadline.isoformat()},
                    status="unread",
                    sent_at=datetime.now(timezone.utc),
                )
            )

    db.commit()
    return build_vote_results(db, vote.id)


@router.post("/{vote_id}/respond", response_model=VoteResponseRead, status_code=status.HTTP_201_CREATED)
def respond_to_vote(
    vote_id: UUID,
    payload: VoteAnswerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vote = get_vote_or_404(db, vote_id)
    close_vote_if_expired(db, vote)
    if vote.status != "open":
        raise ConflictError("Ce vote est ferme.")

    option = db.get(VoteOption, payload.option_id)
    if option is None or option.vote_id != vote.id:
        raise ValidationError("Option de vote invalide.")

    if not vote.allow_multiple_choices:
        existing = db.scalars(
            select(VoteResponse).where(
                VoteResponse.vote_id == vote.id,
                VoteResponse.voter_id == current_user.id,
            )
        ).first()
        if existing:
            raise ConflictError("Vous avez deja repondu a ce vote.")

    response = VoteResponse(
        vote_id=vote.id,
        option_id=option.id,
        voter_id=current_user.id,
        tontine_member_id=payload.tontine_member_id,
        comment=payload.comment,
        voted_at=datetime.now(timezone.utc),
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


@router.get("/{vote_id}/results", response_model=VoteResultsRead)
def get_vote_results(vote_id: UUID, db: Session = Depends(get_db)):
    vote = get_vote_or_404(db, vote_id)
    close_vote_if_expired(db, vote)
    return build_vote_results(db, vote.id)


@router.post("/expired/close", response_model=ExpiredVotesResult)
def close_expired_votes(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    votes = list(db.scalars(select(Vote).where(Vote.status == "open", Vote.closes_at.is_not(None), Vote.closes_at <= now)).all())
    for vote in votes:
        vote.status = "closed"
        db.add(vote)
    db.commit()
    return {"closed_votes": len(votes)}


def get_vote_or_404(db: Session, vote_id: UUID) -> Vote:
    vote = db.get(Vote, vote_id)
    if vote is None:
        raise NotFoundError("Vote introuvable.")
    return vote


def close_vote_if_expired(db: Session, vote: Vote) -> None:
    now = datetime.now(timezone.utc)
    if vote.status == "open" and vote.closes_at and vote.closes_at <= now:
        vote.status = "closed"
        db.add(vote)
        db.commit()
        db.refresh(vote)


def build_vote_results(db: Session, vote_id: UUID) -> dict:
    vote = get_vote_or_404(db, vote_id)
    rows = db.execute(
        select(VoteOption, func.count(VoteResponse.id))
        .outerjoin(VoteResponse, VoteResponse.option_id == VoteOption.id)
        .where(VoteOption.vote_id == vote.id)
        .group_by(VoteOption.id)
        .order_by(VoteOption.position.asc())
    ).all()
    total = sum(count for _option, count in rows)

    return {
        "vote_id": vote.id,
        "title": vote.title,
        "description": vote.description,
        "type": vote.type,
        "status": vote.status,
        "deadline": vote.closes_at,
        "results_visible": True,
        "total_responses": total,
        "options": [
            {
                "option_id": option.id,
                "label": option.label,
                "description": option.description,
                "position": option.position,
                "responses": count,
                "percentage": round((count / total) * 100, 1) if total else 0,
            }
            for option, count in rows
        ],
    }
