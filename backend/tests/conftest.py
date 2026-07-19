"""Shared test fixtures.

The suite runs against two backends:

  * No TEST_DATABASE_URL -> in-memory SQLite. Every test still runs, exercising
    the real endpoint: schema validation, transaction boundaries, scoring,
    idempotency, 409 conflict, and rollback. This is what runs on a developer
    machine with no PostgreSQL.
  * TEST_DATABASE_URL set -> real PostgreSQL (the staging database on the
    droplet). Same tests, plus `postgres_only` tests for behaviour SQLite
    cannot prove.

SQLite is a genuine but weaker check: server-side CHECK constraints and foreign
keys behave differently, so DB-level enforcement is only truly verified against
PostgreSQL. Tests that depend on it are marked `postgres_only`.

The PostgreSQL fixtures truncate participant tables, so TEST_DATABASE_URL must
never point at production.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
USING_POSTGRES = bool(TEST_DATABASE_URL)

postgres_only = pytest.mark.skipif(
    not USING_POSTGRES,
    reason="requires real PostgreSQL; set TEST_DATABASE_URL",
)

# app.config validates DATABASE_URL at import time. Give it a syntactically
# valid PostgreSQL URL even for the SQLite run — the test engine below is
# built separately and no connection is ever made to this address.
os.environ["DATABASE_URL"] = (
    TEST_DATABASE_URL or "postgresql+psycopg://unused:unused@localhost:5432/unused"
)

BASE_TIME = datetime(2026, 7, 18, 12, 0, 0, tzinfo=timezone.utc)


def make_answer(order: int, case_id: str, predicted: str = "blue") -> dict:
    shown = BASE_TIME + timedelta(minutes=order)
    return {
        "question_order": order,
        "case_id": case_id,
        "predicted_winner": predicted,
        "confidence": 3,
        "shown_at": shown.isoformat(),
        "answered_at": (shown + timedelta(seconds=20)).isoformat(),
        "response_time_ms": 20000,
    }


def make_submission(
    case_ids: list[str],
    predictions: list[str] | None = None,
    response_id: str | None = None,
    **overrides,
) -> dict:
    """A complete, valid submission for the given case IDs."""
    predictions = predictions or ["blue"] * len(case_ids)
    payload = {
        "response_id": response_id or str(uuid.uuid4()),
        "consent": {
            "accepted": True,
            "accepted_at": BASE_TIME.isoformat(),
            "consent_version": "v2",
        },
        "participant": {
            "rank": "gold",
            "years_playing": "3_5y",
            "main_role": "mid",
            "playing_frequency": "weekly",
            "region": "euw",
        },
        "survey": {
            "dataset_version": "pilot_v3",
            "survey_protocol_version": "final_feedback_v1",
            "started_at": BASE_TIME.isoformat(),
            "finished_at": (BASE_TIME + timedelta(minutes=11)).isoformat(),
        },
        "answers": [
            make_answer(i + 1, cid, predictions[i]) for i, cid in enumerate(case_ids)
        ],
    }
    payload.update(overrides)
    return payload


# --------------------------------------------------------------------------- #
# Engine
# --------------------------------------------------------------------------- #
@pytest.fixture(scope="session")
def db_engine():
    from sqlalchemy import create_engine, event
    from sqlalchemy.pool import StaticPool

    from app.models import Base

    if USING_POSTGRES:
        engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True, future=True)
    else:
        # One shared in-memory database for the whole session.
        engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            future=True,
        )

        # SQLite ignores foreign keys unless asked, which would let the
        # unknown-case test pass for the wrong reason.
        @event.listens_for(engine, "connect")
        def _fk_on(dbapi_connection, _record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def db_session(db_engine):
    from sqlalchemy.orm import Session

    with Session(db_engine) as session:
        yield session


def _truncate(engine) -> None:
    from sqlalchemy import text

    with engine.begin() as conn:
        if USING_POSTGRES:
            conn.execute(text("TRUNCATE survey_answers, survey_responses CASCADE"))
        else:
            conn.execute(text("DELETE FROM survey_answers"))
            conn.execute(text("DELETE FROM survey_responses"))


@pytest.fixture
def clean_db(db_engine):
    """Remove participant data between tests; the answer key is preserved."""
    _truncate(db_engine)
    yield
    _truncate(db_engine)


@pytest.fixture
def seeded_outcomes(db_engine):
    """Twelve cases in twelve distinct match groups, with known winners.

    Case IDs are prefixed `C_TEST` so they cannot collide with the real
    imported answer key if this ever runs against a shared database.
    """
    from sqlalchemy import text

    rows = [
        {
            "case_id": f"C_TEST{i:08d}",
            "match_group_id": f"M_TEST{i:08d}",
            "cutoff_minute": [5, 10, 15, 20][i % 4],
            "dataset_version": "pilot_v3",
            "winning_team": "blue" if i % 2 else "red",
        }
        for i in range(1, 13)
    ]

    _truncate(db_engine)
    with db_engine.begin() as conn:
        conn.execute(text("DELETE FROM survey_case_outcomes WHERE case_id LIKE 'C_TEST%'"))
        for row in rows:
            conn.execute(
                text(
                    "INSERT INTO survey_case_outcomes "
                    "(case_id, match_group_id, cutoff_minute, dataset_version, "
                    " winning_team) VALUES "
                    "(:case_id, :match_group_id, :cutoff_minute, :dataset_version,"
                    " :winning_team)"
                ),
                row,
            )
    yield rows
    _truncate(db_engine)
    with db_engine.begin() as conn:
        conn.execute(text("DELETE FROM survey_case_outcomes WHERE case_id LIKE 'C_TEST%'"))


@pytest.fixture
def client(db_engine, clean_db):
    """TestClient with the request session bound to the test engine."""
    from fastapi.testclient import TestClient
    from sqlalchemy.orm import sessionmaker

    from app.db import get_session
    from app.main import app

    TestSession = sessionmaker(bind=db_engine, autoflush=False, expire_on_commit=False)

    def override():
        session = TestSession()
        try:
            yield session
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    app.dependency_overrides[get_session] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
