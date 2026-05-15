from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api.router import api_router
from app.core.config import settings
from app.core.error_handlers import register_error_handlers
from app.middlewares.request_context import RequestContextMiddleware


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description=(
            "API FasoTontine pour la gestion des utilisateurs, CNIB, tontines, "
            "cotisations, garants, incidents, votes, projets communautaires et notifications."
        ),
        contact={"name": "Bug Hunters"},
        openapi_tags=[
            {"name": "health", "description": "Statut de l'API et de la base de donnees."},
            {"name": "auth", "description": "Authentification demo par telephone/email, sans code SMS."},
            {"name": "users", "description": "Gestion des utilisateurs."},
            {"name": "cnib", "description": "Verification CNIB et OCR."},
            {"name": "tontines", "description": "Gestion des tontines."},
            {"name": "members", "description": "Membres et roles dans les tontines."},
            {"name": "contributions", "description": "Cotisations et paiements."},
            {"name": "guarantors", "description": "Garants et garanties."},
            {"name": "incidents", "description": "Retards, defauts, litiges et resolutions."},
            {"name": "votes", "description": "Votes communautaires et decisions de tontine."},
            {"name": "community_projects", "description": "Projets communautaires geolocalises."},
            {"name": "notifications", "description": "Notifications utilisateur."},
            {"name": "admin", "description": "Actions administratives et audit."},
        ],
    )

    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    register_error_handlers(app)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/", tags=["root"])
    def root() -> dict[str, str]:
        return {"name": settings.app_name, "status": "ready"}

    return app


app = create_app()
