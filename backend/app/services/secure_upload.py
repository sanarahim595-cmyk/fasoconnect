from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationError

EXTENSIONS_BY_CONTENT_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

CNIB_DOCUMENT_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}


async def validate_image_upload(file: UploadFile, *, required: bool = True) -> bytes:
    content = await file.read()
    if required and not content:
        raise ValidationError("Fichier image obligatoire.")
    if len(content) > settings.max_upload_size_bytes:
        raise ValidationError("Fichier trop volumineux. Taille maximale autorisee: 5 Mo.")
    if file.content_type not in settings.image_content_types:
        raise ValidationError("Format image non autorise. Utilisez JPG, PNG ou WebP.")
    if not has_valid_image_signature(content, file.content_type):
        raise ValidationError("Image invalide ou corrompue.")
    return content


async def validate_cnib_document_upload(file: UploadFile, *, required: bool = True) -> bytes:
    content = await file.read()
    if required and not content:
        raise ValidationError("Document CNIB obligatoire.")
    if len(content) > settings.max_upload_size_bytes:
        raise ValidationError("Fichier trop volumineux. Taille maximale autorisee: 5 Mo.")
    if file.content_type not in CNIB_DOCUMENT_CONTENT_TYPES:
        raise ValidationError("Format CNIB non autorise. Utilisez JPG, PNG, WebP ou PDF.")
    if file.content_type == "application/pdf":
        if not content.startswith(b"%PDF-"):
            raise ValidationError("PDF invalide ou corrompu.")
        return content
    if not has_valid_image_signature(content, file.content_type):
        raise ValidationError("Image invalide ou corrompue.")
    return content


def has_valid_image_signature(content: bytes, content_type: str | None) -> bool:
    if content_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return content.startswith(b"RIFF") and b"WEBP" in content[:16]
    return False


def store_image(content: bytes, *, content_type: str, folder: str) -> str:
    extension = EXTENSIONS_BY_CONTENT_TYPE.get(content_type)
    if not extension:
        raise ValidationError("Format image non autorise.")
    target_dir = Path(settings.upload_dir).resolve() / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    path = target_dir / filename
    path.write_bytes(content)
    return f"/uploads/{folder}/{filename}"
