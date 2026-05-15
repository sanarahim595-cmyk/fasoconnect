from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.crud_router import build_crud_router
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ValidationError
from app.core.security import get_current_user
from app.models import AdminAction, CnibVerification, CommunityProject, Contribution, Notification, Tontine, User
from app.schemas import AdminActionCreate, AdminActionRead, AdminActionUpdate
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(AdminAction),
    create_schema=AdminActionCreate,
    update_schema=AdminActionUpdate,
    read_schema=AdminActionRead,
)


@router.get("/stats/overview")
def get_platform_overview(db: Session = Depends(get_db)):
    return {
        "users_count": db.scalar(select(func.count(User.id))) or 0,
        "tontines_count": db.scalar(select(func.count(Tontine.id))) or 0,
        "submitted_projects_count": db.scalar(select(func.count(CommunityProject.id))) or 0,
        "approved_projects_count": db.scalar(select(func.count(CommunityProject.id)).where(CommunityProject.status == "approved")) or 0,
        "contributions_count": db.scalar(select(func.count(Contribution.id))) or 0,
    }


@router.get("/users/list")
def list_platform_users(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    users = list(db.scalars(select(User).order_by(User.created_at.desc()).offset(offset).limit(limit)).all())
    rows = []
    for user in users:
        cnib = db.scalars(
            select(CnibVerification)
            .where(CnibVerification.user_id == user.id)
            .order_by(CnibVerification.created_at.desc())
        ).first()
        rows.append(
            {
                "id": user.id,
                "full_name": f"{user.first_name} {user.last_name}",
                "phone": user.phone,
                "email": user.email,
                "role": user.role,
                "status": user.status,
                "created_at": user.created_at,
                "cnib_id": cnib.id if cnib else None,
                "cnib_number": cnib.cnib_number if cnib else None,
                "cnib_status": cnib.status if cnib else "missing",
            }
        )
    return rows


@router.get("/projects/submitted")
def list_submitted_projects(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    projects = list(
        db.scalars(
            select(CommunityProject)
            .order_by(CommunityProject.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )
    return projects


@router.post("/projects/{project_id}/decision")
def decide_project(
    project_id: UUID,
    status: str,
    reason: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user),
):
    if status not in {"approved", "rejected", "changes_requested"}:
        raise ValidationError("Decision invalide.")

    project = db.get(CommunityProject, project_id)
    if project is None:
        raise NotFoundError("Projet communautaire introuvable.")

    project.status = "pending" if status == "changes_requested" else status
    db.add(project)
    log_admin_action(
        db,
        admin=admin,
        action=f"project_{status}",
        target_user_id=project.submitted_by,
        project_id=project.id,
        reason=reason,
    )
    db.add(
        Notification(
            user_id=project.submitted_by,
            project_id=project.id,
            type="project_review",
            title="Decision sur votre projet",
            message=project_decision_message(status),
            payload={"project_id": str(project.id), "decision": status, "reason": reason},
            status="unread",
            sent_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    db.refresh(project)
    return project


@router.post("/cnib/{cnib_id}/review")
def review_cnib_verification(
    cnib_id: UUID,
    status: str,
    reason: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user),
):
    if status not in {"verified", "rejected", "manual_review"}:
        raise ValidationError("Statut CNIB invalide.")

    cnib = db.get(CnibVerification, cnib_id)
    if cnib is None:
        raise NotFoundError("Verification CNIB introuvable.")

    cnib.status = status
    cnib.reviewed_by = admin.id
    cnib.reviewed_at = datetime.now(timezone.utc)
    cnib.rejection_reason = reason if status == "rejected" else None
    user = db.get(User, cnib.user_id)
    if user and status == "verified":
        user.status = "active"
        db.add(user)
    elif user and status == "rejected":
        user.status = "rejected"
        db.add(user)

    db.add(cnib)
    log_admin_action(
        db,
        admin=admin,
        action=f"cnib_{status}",
        target_user_id=cnib.user_id,
        reason=reason,
        metadata={"cnib_id": str(cnib.id), "cnib_number": cnib.cnib_number},
    )
    db.commit()
    db.refresh(cnib)
    return cnib


def log_admin_action(
    db: Session,
    *,
    admin: User,
    action: str,
    target_user_id: UUID | None = None,
    project_id: UUID | None = None,
    reason: str | None = None,
    metadata: dict | None = None,
) -> None:
    db.add(
        AdminAction(
            admin_id=admin.id,
            target_user_id=target_user_id,
            project_id=project_id,
            action=action,
            reason=reason,
            metadata_=metadata or {},
        )
    )


def project_decision_message(status: str) -> str:
    if status == "approved":
        return "Votre projet a ete valide et apparait publiquement."
    if status == "rejected":
        return "Votre projet a ete refuse. Il reste visible uniquement par vous et l'administration."
    return "Une modification est demandee avant validation du projet."
