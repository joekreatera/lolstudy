"""Allowed values for every stored categorical field.

Single source of truth, shared by the Pydantic request schemas, the SQLAlchemy
CHECK constraints, and the tests. These mirror the frontend option values in
`frontend/src/content.ts` exactly — the stored value is the machine value, never
the display label.

If an option is added or renamed in the frontend, it must be changed here AND in
an Alembic migration (the CHECK constraints are generated from these tuples).
"""

from __future__ import annotations

# --- Participant profile (frontend: participantQuestions) ------------------- #

RANKS = (
    "unranked",
    "iron",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "emerald",
    "diamond",
    "master",
    "grandmaster",
    "challenger",
)

YEARS_PLAYING = ("lt_1y", "1_2y", "3_5y", "6_9y", "10y_plus")

MAIN_ROLES = ("top", "jungle", "mid", "bot", "support", "fill")

PLAYING_FREQUENCIES = (
    "lt_monthly",
    "few_monthly",
    "weekly",
    "2_4_weekly",
    "5_plus_weekly",
)

# `prefer_not_to_say` is a real stored value, never NULL: the participant
# answered, they declined to disclose. Analysis must treat it as its own level.
REGIONS = (
    "na",
    "euw",
    "eune",
    "kr",
    "br",
    "latam",
    "oce",
    "tr",
    "ru",
    "jp",
    "sea",
    "me",
    "other",
    "prefer_not_to_say",
)

# --- Prediction ------------------------------------------------------------- #

TEAMS = ("blue", "red")

CONFIDENCE_MIN = 1
CONFIDENCE_MAX = 5

# --- Survey structure ------------------------------------------------------- #

ANSWERS_PER_RESPONSE = 10
CUTOFF_MINUTES = (5, 10, 15, 20)


def sql_in_list(values: tuple[str, ...]) -> str:
    """Render a tuple as a SQL IN-list for a CHECK constraint."""
    return ", ".join(f"'{v}'" for v in values)
