import secrets

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="FasoTontine API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    backend_cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        alias="BACKEND_CORS_ORIGINS",
    )
    database_url: str = Field(
        default="postgresql+psycopg://postgres@localhost:5432/fasotontine",
        alias="DATABASE_URL",
    )
    debug: bool = Field(default=False, alias="FASOTONTINE_DEBUG")
    secret_key: str | None = Field(default=None, alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=1440, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    upload_dir: str = Field(default=".runtime/uploads", alias="UPLOAD_DIR")
    max_upload_size_bytes: int = Field(default=5 * 1024 * 1024, alias="MAX_UPLOAD_SIZE_BYTES")
    allowed_image_types: str = Field(default="image/jpeg,image/png,image/webp", alias="ALLOWED_IMAGE_TYPES")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def image_content_types(self) -> set[str]:
        return {item.strip() for item in self.allowed_image_types.split(",") if item.strip()}

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        if not self.secret_key:
            if self.app_env.lower() == "production":
                raise ValueError("SECRET_KEY est obligatoire en production.")
            self.secret_key = secrets.token_urlsafe(48)
        if self.app_env.lower() == "production" and "*" in self.cors_origins:
            raise ValueError("BACKEND_CORS_ORIGINS ne doit pas contenir '*' en production.")
        return self


settings = Settings()
