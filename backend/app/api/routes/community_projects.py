from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.crud_router import build_crud_router
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import ROLE_PLATFORM_ADMIN, get_current_user, require_roles
from app.models import AdminAction, CommunityProject, Notification, ProjectImage, User
from app.schemas import (
    CommunityProjectCreate,
    CommunityProjectRead,
    CommunityProjectReview,
    CommunityProjectSubmit,
    CommunityProjectUpdate,
    ProjectImageCreate,
    ProjectImageRead,
    ProjectImageUpdate,
)
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(CommunityProject),
    create_schema=CommunityProjectCreate,
    update_schema=CommunityProjectUpdate,
    read_schema=CommunityProjectRead,
)


@router.post("/submit/new", response_model=CommunityProjectRead)
def submit_community_project(
    payload: CommunityProjectSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = CommunityProject(
        submitted_by=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        city=payload.city,
        latitude=payload.latitude,
        longitude=payload.longitude,
        target_amount=payload.target_amount,
        collected_amount=0,
        currency="XOF",
        status="pending",
        beneficiaries=payload.beneficiaries,
        justification=payload.justification,
    )
    db.add(project)
    db.flush()

    if payload.photos:
        for index, image_url in enumerate(payload.photos):
            db.add(
                ProjectImage(
                    project_id=project.id,
                    uploaded_by=current_user.id,
                    image_url=image_url,
                    caption="Photo de soumission",
                    type="cover" if index == 0 else "other",
                    verification_status="pending",
                )
            )

    db.commit()
    db.refresh(project)
    setattr(project, "photos", payload.photos)
    return project


@router.get("/public/approved", response_model=list[CommunityProjectRead])
def list_public_approved_projects(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    projects = list(
        db.scalars(
            select(CommunityProject)
            .where(CommunityProject.status == "approved")
            .order_by(CommunityProject.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )
    return [attach_project_extras(db, project) for project in projects]


@router.get("/mine/list", response_model=list[CommunityProjectRead])
def list_my_projects(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = list(
        db.scalars(
            select(CommunityProject)
            .where(
                or_(
                    CommunityProject.submitted_by == current_user.id,
                    CommunityProject.status == "approved",
                )
            )
            .order_by(CommunityProject.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )
    return [attach_project_extras(db, project) for project in projects]


@router.post("/{project_id}/review", response_model=CommunityProjectRead)
def review_community_project(
    project_id: UUID,
    payload: CommunityProjectReview,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([ROLE_PLATFORM_ADMIN])),
):
    project = db.get(CommunityProject, project_id)
    if project is None:
        raise NotFoundError("Projet communautaire introuvable.")

    project.status = payload.status
    db.add(project)
    db.add(
        AdminAction(
            admin_id=admin.id,
            target_user_id=project.submitted_by,
            project_id=project.id,
            action=f"community_project_{payload.status}",
            reason=payload.reason,
            metadata_={"reviewed_at": datetime.now(timezone.utc).isoformat()},
        )
    )
    if payload.status == "approved":
        db.add(
            Notification(
                user_id=project.submitted_by,
                project_id=project.id,
                type="project_approved",
                title="Projet valide",
                message="Votre projet communautaire a ete valide et apparait publiquement.",
                payload={"project_id": str(project.id)},
                status="unread",
                sent_at=datetime.now(timezone.utc),
            )
        )
    db.commit()
    db.refresh(project)
    return attach_project_extras(db, project)


def attach_project_extras(db: Session, project: CommunityProject) -> CommunityProject:
    images = list(
        db.scalars(
            select(ProjectImage)
            .where(ProjectImage.project_id == project.id)
            .order_by(ProjectImage.created_at.asc())
        ).all()
    )
    setattr(project, "photos", [image.image_url for image in images])
    return project


router.include_router(
    build_crud_router(
        service=CRUDService(ProjectImage),
        create_schema=ProjectImageCreate,
        update_schema=ProjectImageUpdate,
        read_schema=ProjectImageRead,
    ),
    prefix="/images",
    tags=["project_images"],
)
