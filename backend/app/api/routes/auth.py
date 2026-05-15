from datetime import datetime, timezone

import re

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ValidationError
from app.core.security import (
    OTP_SIMULE,
    ROLE_USER,
    create_access_token,
    get_current_user,
    hash_secret,
    verify_secret,
)
from app.models import CnibVerification, User
from app.schemas import AuthLoginRequest, AuthResponse, RegistrationWithCnibResponse, UserCreate, UserRead
from app.services.ocr import CNIB_NOT_DETECTED_MESSAGE, CnibOCRService
from app.services.secure_upload import validate_cnib_document_upload

router = APIRouter()
ocr_service = CnibOCRService()
CNIB_NUMBER_PATTERN = re.compile(r"^[A-Z0-9]{6,24}$")


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    raise ValidationError("La CNIB est obligatoire. Utilisez /auth/register-with-cnib.")


@router.post(
    "/register-with-cnib",
    response_model=RegistrationWithCnibResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_with_cnib(
    full_name: str = Form(..., min_length=3),
    phone: str = Form(..., min_length=6),
    email: str | None = Form(default=None),
    password_or_otp: str = Form(..., min_length=4),
    city: str = Form(..., min_length=2),
    cnib_number: str = Form(..., min_length=6, max_length=24),
    cnib_file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
):
    normalized_cnib_number = re.sub(r"[^A-Z0-9]", "", cnib_number.upper())
    if not CNIB_NUMBER_PATTERN.fullmatch(normalized_cnib_number):
        raise ValidationError("Numero CNIB invalide. Utilisez uniquement 6 a 24 lettres ou chiffres.")

    contact_filters = [User.phone == phone]
    if email:
        contact_filters.append(User.email == email)
    existing_user = db.scalars(select(User).where(or_(*contact_filters))).first()
    if existing_user:
        raise ValidationError("Un compte existe deja avec ce telephone ou cet email.")

    ocr_result = None
    if cnib_file and cnib_file.filename:
        try:
            content = await validate_cnib_document_upload(cnib_file)
        except ValidationError as exc:
            raise ValidationError("Document CNIB invalide. Utilisez JPG, PNG, WebP ou PDF.") from exc
        ocr_result = ocr_service.extract_cnib_number(
            content=content,
            filename=cnib_file.filename,
        )

    names = [part for part in full_name.strip().split(" ") if part]
    first_name = names[0]
    last_name = " ".join(names[1:]) or names[0]
    secret_hash = hash_secret(password_or_otp)

    user = User(
        phone=phone,
        email=email,
        first_name=first_name,
        last_name=last_name,
        password_hash=secret_hash,
        city=city,
        role=ROLE_USER,
        status="pending_verification",
    )
    db.add(user)
    db.flush()

    cnib_status = "verified"
    cnib = CnibVerification(
        user_id=user.id,
        cnib_number=normalized_cnib_number,
        ocr_provider=ocr_result.provider if ocr_result else "manual_entry",
        ocr_raw={
            "confidence": ocr_result.confidence if ocr_result else 1,
            "raw_text": ocr_result.raw_text if ocr_result else "",
            "filename": cnib_file.filename if cnib_file else None,
            "content_type": cnib_file.content_type if cnib_file else None,
            "entered_cnib_number": normalized_cnib_number,
            "ocr_cnib_number": ocr_result.cnib_number if ocr_result else None,
            "requires_manual_number_confirmation": False,
            "auto_verified_for_demo": True,
        },
        status=cnib_status,
    )
    db.add(cnib)
    db.commit()
    db.refresh(user)
    db.refresh(cnib)

    return {
        "user": user,
        "cnib": cnib,
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "requires_manual_review": False,
    }


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip()
    user = db.scalars(
        select(User).where(or_(User.phone == identifier, User.email == identifier))
    ).first()
    if user is None:
        raise ValidationError("Identifiants invalides.")
    if user.status in {"blocked", "suspended", "deleted"}:
        raise ValidationError("Compte inactif ou bloque.")

    if payload.method == "password" and not verify_secret(payload.password_or_otp, user.password_hash):
        raise ValidationError("Identifiants invalides.")

    if payload.method == "otp" and payload.password_or_otp != OTP_SIMULE:
        raise ValidationError("OTP invalide.")

    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "user": user,
        "access_token": create_access_token(user),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout")
def logout():
    return {"message": "Déconnexion effectuée côté client. Supprimez le jeton de session."}
