from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import SessionLocal

router = APIRouter()


@router.get("")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "fasotontine-api"}


@router.get("/db")
def database_health_check() -> dict[str, str]:
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "reachable"}
