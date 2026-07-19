"""Application configuration.

Values come from the environment (or a local `.env`), never from code. The
settings object is built once at import time so a missing or malformed
`DATABASE_URL` fails at startup with a clear message rather than at the first
participant submission.

No secret is ever logged or returned by the API: `DATABASE_URL` is read here
and passed straight to the engine. If you add a debug endpoint, do not echo it.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # SQLAlchemy URL, e.g. postgresql+psycopg://user:pass@host:5432/dbname
    # Managed hosts usually also need ?sslmode=require.
    database_url: str = Field(alias="DATABASE_URL")

    app_env: str = Field(default="development", alias="APP_ENV")

    @field_validator("database_url")
    @classmethod
    def _require_postgres(cls, value: str) -> str:
        """Fail fast on an empty or non-PostgreSQL URL.

        The schema relies on PostgreSQL behaviour (UUID, TIMESTAMPTZ,
        ON CONFLICT), so silently accepting SQLite would only defer the error.
        """
        if not value or not value.strip():
            raise ValueError("DATABASE_URL must not be empty")
        if not value.startswith(("postgresql://", "postgresql+psycopg://")):
            raise ValueError(
                "DATABASE_URL must be a PostgreSQL URL "
                "(postgresql:// or postgresql+psycopg://)"
            )
        # Normalize to the psycopg 3 driver so the URL works whichever form the
        # deployment platform hands us.
        if value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance. Tests override the env before first call."""
    return Settings()  # type: ignore[call-arg]
