from fastapi import APIRouter, Depends, File, UploadFile

from app.core.security import get_current_user
from app.models import User
from app.services.secure_upload import store_image, validate_image_upload

router = APIRouter()


@router.post("/images")
async def upload_secure_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content = await validate_image_upload(image)
    url = store_image(content, content_type=image.content_type or "", folder=str(current_user.id))
    return {"url": url, "content_type": image.content_type}
