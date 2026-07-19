"""Database connection setup.

One engine per process, one session per request. The schema is owned by Alembic
migrations: nothing here calls `create_all()`, so a deployment can never
silently diverge from its migration history.
"""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings

_settings = get_settings()

engine = create_engine(
    _settings.database_url,
    # Managed PostgreSQL drops idle connections; check liveness before handing
    # a pooled connection to a request rather than failing the request.
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session() -> Iterator[Session]:
    """FastAPI dependency: a session per request, always closed.

    Transaction control belongs to the endpoint, which commits exactly once
    after a submission is fully validated and written. On any exception the
    session is rolled back so a partial submission can never be observed.
    """
    session = SessionLocal()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
