from fastapi import status


class FasoTontineError(Exception):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "fasotontine_error"

    def __init__(self, message: str, *, details: dict | None = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(message)


class NotFoundError(FasoTontineError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class ConflictError(FasoTontineError):
    status_code = status.HTTP_409_CONFLICT
    code = "conflict"


class ValidationError(FasoTontineError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    code = "validation_error"
