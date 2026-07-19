"""Import the private case-outcome artifact into PostgreSQL.

    python scripts/import_case_outcomes.py [--file PATH] [--dataset-version V]
                                           [--published PATH] [--dry-run]

Run once, by hand, as part of deployment. It is never invoked by the
application: the API reads outcomes from `survey_case_outcomes` only, so the
artifact can (and should) be deleted from disk after a successful import.

Everything is validated in memory BEFORE any write, and the whole import runs in
one transaction, so a rejected artifact leaves the table exactly as it was.

The artifact is private research data. Do not commit it, do not copy it into
frontend/public or frontend/dist, and delete it from the server once imported.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

# Allow `python scripts/import_case_outcomes.py` from the backend directory.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.db import SessionLocal  # noqa: E402
from app.enums import CUTOFF_MINUTES, TEAMS  # noqa: E402
from app.models import SurveyCaseOutcome  # noqa: E402

DEFAULT_ARTIFACT = Path(__file__).resolve().parents[1] / "data" / "case_outcomes.json"
DEFAULT_PUBLISHED = (
    Path(__file__).resolve().parents[2] / "dataset" / "survey_cases.json"
)
SUPPORTED_SCHEMA_VERSIONS = {"1.0.0"}
EXPECTED_CUTOFFS = frozenset(CUTOFF_MINUTES)


class ImportError_(Exception):
    """Validation failure. Never carries credentials or connection details."""


def load_artifact(path: Path, expected_dataset_version: str) -> list[dict]:
    """Read and structurally validate the artifact. No database access."""
    if not path.exists():
        raise ImportError_(f"artifact not found: {path}")

    try:
        container = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ImportError_(f"artifact is not valid JSON: {exc}")

    dataset_version = container.get("dataset_version")
    if dataset_version != expected_dataset_version:
        raise ImportError_(
            f"artifact dataset_version {dataset_version!r} != expected "
            f"{expected_dataset_version!r}"
        )

    schema_version = container.get("schema_version")
    if schema_version not in SUPPORTED_SCHEMA_VERSIONS:
        raise ImportError_(
            f"unsupported artifact schema_version {schema_version!r} "
            f"(supported: {', '.join(sorted(SUPPORTED_SCHEMA_VERSIONS))})"
        )

    outcomes = container.get("outcomes")
    if not isinstance(outcomes, list) or not outcomes:
        raise ImportError_("artifact has no 'outcomes' array")

    seen: set[str] = set()
    for idx, row in enumerate(outcomes):
        if not isinstance(row, dict):
            raise ImportError_(f"outcome #{idx}: not a JSON object")
        for field in ("case_id", "match_group_id", "cutoff_minute", "winning_team"):
            if field not in row:
                raise ImportError_(f"outcome #{idx}: missing {field!r}")
        if row["winning_team"] not in TEAMS:
            raise ImportError_(
                f"outcome #{idx}: invalid winning_team {row['winning_team']!r}"
            )
        if row["cutoff_minute"] not in EXPECTED_CUTOFFS:
            raise ImportError_(
                f"outcome #{idx}: invalid cutoff_minute {row['cutoff_minute']!r}"
            )
        if row["case_id"] in seen:
            raise ImportError_(f"duplicate case_id {row['case_id']} in artifact")
        seen.add(row["case_id"])

    return outcomes


def validate_groups(outcomes: list[dict]) -> dict[str, int]:
    """Enforce the cross-row invariants no column CHECK can express.

    A match group must have exactly four cutoffs and ONE winner shared by all of
    them. This is the primary enforcement point for that rule; the standing
    assertion query below is the post-import safety net.
    """
    groups: dict[str, dict[int, str]] = defaultdict(dict)
    for row in outcomes:
        gid, cutoff = row["match_group_id"], row["cutoff_minute"]
        if cutoff in groups[gid]:
            raise ImportError_(f"match group {gid} has two rows at cutoff {cutoff}")
        groups[gid][cutoff] = row["winning_team"]

    for gid, by_cutoff in sorted(groups.items()):
        if set(by_cutoff) != EXPECTED_CUTOFFS:
            raise ImportError_(
                f"match group {gid} has cutoffs {sorted(by_cutoff)}; "
                f"expected {sorted(EXPECTED_CUTOFFS)}"
            )
        if len({*by_cutoff.values()}) != 1:
            raise ImportError_(
                f"match group {gid} has conflicting winners across its cutoffs"
            )

    return {gid: len(c) for gid, c in groups.items()}


def check_published_coverage(outcomes: list[dict], published_path: Path) -> int | None:
    """Cross-check the artifact against the published dataset, both directions.

    Skipped with a warning if the public dataset is not present (it is
    gitignored and may not be deployed alongside the backend).
    """
    if not published_path.exists():
        return None

    container = json.loads(published_path.read_text(encoding="utf-8"))
    published = {c["case_id"] for c in container.get("cases", [])}
    artifact = {row["case_id"] for row in outcomes}

    missing = published - artifact
    if missing:
        raise ImportError_(
            f"{len(missing)} published case(s) have no outcome "
            f"(e.g. {sorted(missing)[0]})"
        )
    extra = artifact - published
    if extra:
        raise ImportError_(
            f"{len(extra)} outcome(s) are not in the published dataset "
            f"(e.g. {sorted(extra)[0]})"
        )
    return len(published)


def upsert(
    session: Session, outcomes: list[dict], dataset_version: str
) -> tuple[int, int, list[str]]:
    """Insert new rows, leave identical rows alone, reject changed winners.

    Returns (inserted, unchanged, conflicts). A conflict means the database
    already holds a DIFFERENT winner for a case — overwriting it would silently
    rewrite the answer key under responses already collected against it, so the
    whole import is aborted by the caller instead.
    """
    existing = {
        row.case_id: row
        for row in session.scalars(select(SurveyCaseOutcome)).all()
    }

    inserted = unchanged = 0
    conflicts: list[str] = []

    for row in outcomes:
        current = existing.get(row["case_id"])
        if current is None:
            session.add(
                SurveyCaseOutcome(
                    case_id=row["case_id"],
                    match_group_id=row["match_group_id"],
                    cutoff_minute=row["cutoff_minute"],
                    dataset_version=dataset_version,
                    winning_team=row["winning_team"],
                )
            )
            inserted += 1
        elif (
            current.winning_team == row["winning_team"]
            and current.match_group_id == row["match_group_id"]
            and current.cutoff_minute == row["cutoff_minute"]
        ):
            unchanged += 1
        else:
            conflicts.append(row["case_id"])

    return inserted, unchanged, conflicts


def assert_same_winner_per_group(session: Session) -> list[str]:
    """Standing post-import assertion. Must return an empty list.

    Mirrors the documented verification query:
        SELECT match_group_id FROM survey_case_outcomes
        GROUP BY match_group_id
        HAVING COUNT(*) <> 4 OR COUNT(DISTINCT winning_team) <> 1;
    """
    bad = session.execute(
        select(SurveyCaseOutcome.match_group_id)
        .group_by(SurveyCaseOutcome.match_group_id)
        .having(
            (func.count() != len(EXPECTED_CUTOFFS))
            | (func.count(func.distinct(SurveyCaseOutcome.winning_team)) != 1)
        )
    ).scalars().all()
    return list(bad)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--file", default=str(DEFAULT_ARTIFACT))
    parser.add_argument("--published", default=str(DEFAULT_PUBLISHED))
    parser.add_argument("--dataset-version", default="pilot_v3")
    parser.add_argument(
        "--dry-run", action="store_true", help="validate and report; write nothing"
    )
    args = parser.parse_args(argv)

    try:
        outcomes = load_artifact(Path(args.file), args.dataset_version)
        groups = validate_groups(outcomes)
        published_count = check_published_coverage(outcomes, Path(args.published))
    except ImportError_ as exc:
        print(f"Import FAILED (validation): {exc}", file=sys.stderr)
        return 1

    cutoffs_per_group = sorted({n for n in groups.values()})

    print("Artifact validation")
    print(f"  Cases read:            {len(outcomes)}")
    print(f"  Match groups:          {len(groups)}")
    print(f"  Cutoffs per group:     {cutoffs_per_group}")
    print("  Duplicate case IDs:    0")
    print(
        "  Published coverage:    "
        + (
            f"{published_count} case(s), exact match"
            if published_count is not None
            else "skipped (published dataset not found)"
        )
    )

    if args.dry_run:
        print("\nDry run - nothing written.")
        return 0

    session = SessionLocal()
    try:
        inserted, unchanged, conflicts = upsert(
            session, outcomes, args.dataset_version
        )
        if conflicts:
            session.rollback()
            print(
                f"\nImport FAILED: {len(conflicts)} case(s) already hold a "
                f"different winner (e.g. {conflicts[0]}). Nothing was written.",
                file=sys.stderr,
            )
            return 1

        session.commit()

        bad_groups = assert_same_winner_per_group(session)
        total = session.scalar(select(func.count()).select_from(SurveyCaseOutcome))
    except Exception as exc:  # noqa: BLE001 - reported without credentials
        session.rollback()
        print(f"\nImport FAILED (database): {type(exc).__name__}", file=sys.stderr)
        return 1
    finally:
        session.close()

    print("\nImport result")
    print(f"  Inserted:              {inserted}")
    print(f"  Unchanged:             {unchanged}")
    print("  Conflicts:             0")
    print(f"  Rows in table:         {total}")
    print(f"  Same-winner assertion: {'FAILED' if bad_groups else 'passed'}")

    if bad_groups:
        print(
            f"\nPost-import assertion FAILED for {len(bad_groups)} group(s): "
            f"{', '.join(bad_groups[:5])}",
            file=sys.stderr,
        )
        return 1

    print(
        "\nOutcomes now live in PostgreSQL. Delete the artifact from this server:\n"
        f"  shred -u {args.file}   (or: rm -f {args.file})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
