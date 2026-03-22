"""
CrisisSync — Application Configuration
All environment variables with sensible defaults for development.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from typing import List
import secrets


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "CrisisSync API"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # ── Security ──────────────────────────────────────────────────────────────
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24        # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://crisissync:crisissync@localhost:5432/crisissync"
    DATABASE_URL_SYNC: str = "postgresql://crisissync:crisissync@localhost:5432/crisissync"

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    
    @model_validator(mode="before")
    @classmethod
    def validate_urls(cls, data: dict) -> dict:
        """Handle Render/Railway DATABASE_URL transformation."""
        db_url = data.get("DATABASE_URL")
        if db_url and isinstance(db_url, str):
            # Derive sync URL for migrations if not explicitly set
            if "+asyncpg" not in db_url:
                data["DATABASE_URL_SYNC"] = db_url.replace("postgresql://", "postgres://", 1) if db_url.startswith("postgresql://") else db_url
                data["DATABASE_URL"] = db_url.replace("postgres://", "postgresql+asyncpg://", 1).replace("postgresql://", "postgresql+asyncpg://", 1)
            else:
                data["DATABASE_URL_SYNC"] = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)
        
        # Standardize Redis URL (Render sometimes provides rediss:// but some libs prefer redis:// if not truly SSL)
        redis_url = data.get("REDIS_URL")
        if redis_url and isinstance(redis_url, str) and redis_url.startswith("rediss://"):
             # Optional: handle TLS for redis if needed by the app
             pass
             
        return data
    CACHE_TTL_SECONDS: int = 300                      # 5 min default cache

    # ── Anthropic ─────────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"
    AI_MAX_TOKENS: int = 1024

    # ── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                return json.loads(v)
            return [i.strip() for i in v.split(",")]
        return v

    # ── File Upload ───────────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads/"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "crisissync-media"
    AWS_REGION: str = "us-east-1"

    # ── Notifications ─────────────────────────────────────────────────────────
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@crisissync.app"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
