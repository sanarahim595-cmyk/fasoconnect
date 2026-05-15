import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Iterable
from uuid import UUID

from fastapi import Depends, Header, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import FasoTontineError
from app.models import User

ROLE_USER = "utilisateur"
ROLE_TONTINE_ADMIN = "administrateur_tontine"
ROLE_PLATFORM_ADMIN = "administrateur_plateforme"
OTP_SIMULE = "123456"


class UnauthorizedError(FasoTontineError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthorized"


class ForbiddenError(FasoTontineError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "forbidden"


def hash_secret(value: str) -> str:
    salt = secrets.token_hex(16)
    rounds = 260_000
    digest = hashlib.pbkdf2_hmac("sha256", value.encode("utf-8"), salt.encode("ascii"), rounds)
    return f"pbkdf2_sha256${rounds}${salt}${digest.hex()}"


def verify_secret(value: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    if hashed.startswith("pbkdf2_sha256$"):
        try:
            _algorithm, rounds, salt, digest = hashed.split("$", 3)
            computed = hashlib.pbkdf2_hmac("sha256", value.encode("utf-8"), salt.encode("ascii"), int(rounds)).hex()
            return hmac.compare_digest(computed, digest)
        except ValueError:
            return False
    legacy_sha256 = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_sha256, hashed)


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()),
    }
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = f"{_b64encode(json.dumps(header).encode())}.{_b64encode(json.dumps(payload).encode())}"
    signature = hmac.new(settings.secret_key.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64encode(signature)}"


def decode_access_token(token: str) -> dict:
    try:
        header_part, payload_part, signature_part = token.split(".")
        signing_input = f"{header_part}.{payload_part}"
        expected = hmac.new(settings.secret_key.encode(), signing_input.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64encode(expected), signature_part):
            raise UnauthorizedError("Session invalide.")
        payload = json.loads(_b64decode(payload_part))
        if int(payload["exp"]) < int(datetime.now(timezone.utc).timestamp()):
            raise UnauthorizedError("Session expiree.")
        return payload
    except FasoTontineError:
        raise
    except Exception as exc:
        raise UnauthorizedError("Session invalide.") from exc


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Authentification requise.")
    payload = decode_access_token(authorization.split(" ", 1)[1])
    user = db.get(User, UUID(payload["sub"]))
    if user is None:
        raise UnauthorizedError("Utilisateur introuvable.")
    return user


def require_roles(roles: Iterable[str]):
    allowed = set(roles)

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise ForbiddenError("Role insuffisant pour acceder a cette ressource.")
        return user

    return dependency
