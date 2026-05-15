from fastapi import APIRouter, Depends

from app.api.routes import (
    admin,
    auth,
    cnib,
    community_projects,
    contributions,
    guarantors,
    health,
    incidents,
    members,
    notifications,
    tontines,
    uploads,
    users,
    votes,
)
from app.core.security import ROLE_PLATFORM_ADMIN, get_current_user, require_roles

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
private = [Depends(get_current_user)]
api_router.include_router(users.router, prefix="/users", tags=["users"], dependencies=private)
api_router.include_router(cnib.router, prefix="/cnib", tags=["cnib"], dependencies=private)
api_router.include_router(tontines.router, prefix="/tontines", tags=["tontines"], dependencies=private)
api_router.include_router(members.router, prefix="/members", tags=["members"], dependencies=private)
api_router.include_router(contributions.router, prefix="/contributions", tags=["contributions"], dependencies=private)
api_router.include_router(guarantors.router, prefix="/guarantors", tags=["guarantors"], dependencies=private)
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"], dependencies=private)
api_router.include_router(votes.router, prefix="/votes", tags=["votes"], dependencies=private)
api_router.include_router(community_projects.router, prefix="/community-projects", tags=["community_projects"], dependencies=private)
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"], dependencies=private)
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"], dependencies=private)
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_roles([ROLE_PLATFORM_ADMIN]))],
)
