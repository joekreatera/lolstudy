"""Portable column types.

Production is PostgreSQL only. This exists so the test suite can exercise the
real endpoint — validation, transaction boundaries, idempotency, rollback —
against an in-memory SQLite database on a machine with no PostgreSQL, instead
of skipping those tests entirely.

The type resolves to a native `UUID` on PostgreSQL and to `CHAR(36)` elsewhere,
so the production schema is unchanged and the Alembic migration still emits a
real `UUID` column.

SQLite is a weaker check than PostgreSQL (no server-side type enforcement, and
foreign keys are off unless enabled per connection). Tests that must prove
database-level behaviour still run against real PostgreSQL.
"""

from __future__ import annotations

import uuid

from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR, TypeDecorator


class GUID(TypeDecorator):
    """UUID on PostgreSQL, CHAR(36) everywhere else. Always a `uuid.UUID` in
    Python, whichever backend is in use."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(str(value))
        if dialect.name == "postgresql":
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))
