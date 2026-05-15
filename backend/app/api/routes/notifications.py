from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.crud_router import build_crud_router
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import get_current_user
from app.models import Notification, User
from app.schemas import NotificationCreate, NotificationRead, NotificationUpdate
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(Notification),
    create_schema=NotificationCreate,
    update_schema=NotificationUpdate,
    read_schema=NotificationRead,
)


@router.get("/mine/list", response_model=list[NotificationRead])
def list_my_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        statement = statement.where(Notification.status == "unread")
    return list(db.scalars(statement.order_by(Notification.created_at.desc()).offset(offset).limit(limit)).all())


@router.get("/mine/unread-count")
def get_unread_notifications_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.scalar(select(func.count(Notification.id)).where(Notification.user_id == current_user.id, Notification.status == "unread")) or 0
    return {"unread_count": count}


@router.post("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = get_owned_notification(db, notification_id, current_user)
    notification.status = "read"
    notification.read_at = datetime.now(timezone.utc)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/mine/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = list(db.scalars(select(Notification).where(Notification.user_id == current_user.id, Notification.status == "unread")).all())
    now = datetime.now(timezone.utc)
    for notification in notifications:
        notification.status = "read"
        notification.read_at = now
        db.add(notification)
    db.commit()
    return {"updated": len(notifications)}


def get_owned_notification(db: Session, notification_id: UUID, user: User) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != user.id:
        raise NotFoundError("Notification introuvable.")
    return notification
