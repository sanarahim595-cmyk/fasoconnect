from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

from app.core.config import settings
from app.core.exceptions import FasoTontineError


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(FasoTontineError)
    async def handle_app_error(_: Request, exc: FasoTontineError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "request_validation_error",
                    "message": "Les donnees envoyees sont invalides.",
                    "details": {"errors": exc.errors()},
                }
            },
        )

    @app.exception_handler(IntegrityError)
    async def handle_integrity_error(_: Request, __: IntegrityError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": {
                    "code": "database_integrity_error",
                    "message": "Cette operation viole une contrainte de la base de donnees.",
                    "details": {},
                }
            },
        )

    @app.exception_handler(OperationalError)
    async def handle_operational_error(_: Request, __: OperationalError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": {
                    "code": "database_unavailable",
                    "message": "Base de donnees indisponible. Verifiez DATABASE_URL et PostgreSQL.",
                    "details": {},
                }
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "internal_server_error",
                    "message": "Une erreur inattendue est survenue.",
                    "details": {"type": exc.__class__.__name__} if settings.debug else {},
                }
            },
        )
