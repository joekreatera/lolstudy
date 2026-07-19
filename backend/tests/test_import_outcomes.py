"""Outcome-import validation.

The artifact-validation tests are pure and run anywhere. The upsert/conflict
tests are marked `postgres_only`: they assert on real ON CONFLICT behaviour and
must run against PostgreSQL to mean anything.
"""

from __future__ import annotations

import json

import pytest

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from conftest import postgres_only  # noqa: E402

from import_case_outcomes import (  # noqa: E402
    ImportError_,
    check_published_coverage,
    load_artifact,
    validate_groups,
)


def _outcomes(groups: int = 2, winner: str = "blue") -> list[dict]:
    rows = []
    for g in range(1, groups + 1):
        for cutoff in (5, 10, 15, 20):
            rows.append(
                {
                    "case_id": f"C_G{g:04d}M{cutoff:02d}",
                    "match_group_id": f"M_{g:012d}",
                    "cutoff_minute": cutoff,
                    "winning_team": winner,
                }
            )
    return rows


def _artifact(tmp_path, outcomes, **overrides):
    container = {
        "dataset_version": "pilot_v3",
        "schema_version": "1.0.0",
        "outcome_count": len(outcomes),
        "outcomes": outcomes,
    }
    container.update(overrides)
    path = tmp_path / "case_outcomes.json"
    path.write_text(json.dumps(container), encoding="utf-8")
    return path


# --------------------------------------------------------------------------- #
# Artifact validation (pure)
# --------------------------------------------------------------------------- #
def test_valid_artifact_loads(tmp_path):
    outcomes = load_artifact(_artifact(tmp_path, _outcomes()), "pilot_v3")
    assert len(outcomes) == 8
    assert validate_groups(outcomes) == {"M_000000000001": 4, "M_000000000002": 4}


def test_rejects_dataset_version_mismatch(tmp_path):
    path = _artifact(tmp_path, _outcomes(), dataset_version="pilot_v2")
    with pytest.raises(ImportError_, match="dataset_version"):
        load_artifact(path, "pilot_v3")


def test_rejects_unsupported_schema_version(tmp_path):
    path = _artifact(tmp_path, _outcomes(), schema_version="2.0.0")
    with pytest.raises(ImportError_, match="schema_version"):
        load_artifact(path, "pilot_v3")


def test_rejects_missing_file(tmp_path):
    with pytest.raises(ImportError_, match="not found"):
        load_artifact(tmp_path / "nope.json", "pilot_v3")


def test_rejects_invalid_winning_team(tmp_path):
    outcomes = _outcomes()
    outcomes[0]["winning_team"] = "purple"
    with pytest.raises(ImportError_, match="invalid winning_team"):
        load_artifact(_artifact(tmp_path, outcomes), "pilot_v3")


def test_rejects_invalid_cutoff(tmp_path):
    outcomes = _outcomes()
    outcomes[0]["cutoff_minute"] = 7
    with pytest.raises(ImportError_, match="invalid cutoff_minute"):
        load_artifact(_artifact(tmp_path, outcomes), "pilot_v3")


def test_rejects_duplicate_case_id(tmp_path):
    outcomes = _outcomes()
    outcomes[1]["case_id"] = outcomes[0]["case_id"]
    with pytest.raises(ImportError_, match="duplicate case_id"):
        load_artifact(_artifact(tmp_path, outcomes), "pilot_v3")


def test_rejects_missing_field(tmp_path):
    outcomes = _outcomes()
    del outcomes[0]["match_group_id"]
    with pytest.raises(ImportError_, match="missing"):
        load_artifact(_artifact(tmp_path, outcomes), "pilot_v3")


def test_rejects_group_short_a_cutoff(tmp_path):
    outcomes = _outcomes()[:-1]  # group 2 has only three cutoffs
    with pytest.raises(ImportError_, match="cutoffs"):
        validate_groups(outcomes)


def test_rejects_duplicate_cutoff_in_group(tmp_path):
    outcomes = _outcomes(groups=1)
    outcomes[3]["cutoff_minute"] = 5  # now two rows at cutoff 5
    with pytest.raises(ImportError_, match="two rows at cutoff"):
        validate_groups(outcomes)


def test_rejects_mixed_winner_within_a_group():
    outcomes = _outcomes(groups=1)
    outcomes[2]["winning_team"] = "red"
    with pytest.raises(ImportError_, match="conflicting winners"):
        validate_groups(outcomes)


# --------------------------------------------------------------------------- #
# Published coverage
# --------------------------------------------------------------------------- #
def test_coverage_accepts_exact_match(tmp_path):
    outcomes = _outcomes()
    published = tmp_path / "survey_cases.json"
    published.write_text(
        json.dumps({"cases": [{"case_id": o["case_id"]} for o in outcomes]}),
        encoding="utf-8",
    )
    assert check_published_coverage(outcomes, published) == 8


def test_coverage_rejects_uncovered_published_case(tmp_path):
    outcomes = _outcomes()
    published = tmp_path / "survey_cases.json"
    published.write_text(
        json.dumps(
            {"cases": [{"case_id": o["case_id"]} for o in outcomes] + [{"case_id": "C_X"}]}
        ),
        encoding="utf-8",
    )
    with pytest.raises(ImportError_, match="no outcome"):
        check_published_coverage(outcomes, published)


def test_coverage_rejects_extra_outcome(tmp_path):
    outcomes = _outcomes()
    published = tmp_path / "survey_cases.json"
    published.write_text(
        json.dumps({"cases": [{"case_id": o["case_id"]} for o in outcomes[:-1]]}),
        encoding="utf-8",
    )
    with pytest.raises(ImportError_, match="not in the published dataset"):
        check_published_coverage(outcomes, published)


def test_coverage_is_skipped_when_published_file_absent(tmp_path):
    assert check_published_coverage(_outcomes(), tmp_path / "absent.json") is None


# --------------------------------------------------------------------------- #
# Database-backed upsert (PostgreSQL required)
# --------------------------------------------------------------------------- #
@postgres_only
def test_upsert_inserts_then_reports_unchanged(db_session):
    from sqlalchemy import text

    from import_case_outcomes import upsert

    outcomes = _outcomes(groups=1)
    db_session.execute(
        text("DELETE FROM survey_case_outcomes WHERE case_id LIKE 'C_G%'")
    )
    db_session.commit()

    inserted, unchanged, conflicts = upsert(db_session, outcomes, "pilot_v3")
    db_session.commit()
    assert (inserted, unchanged, conflicts) == (4, 0, [])

    inserted, unchanged, conflicts = upsert(db_session, outcomes, "pilot_v3")
    db_session.commit()
    assert (inserted, unchanged, conflicts) == (0, 4, [])

    db_session.execute(
        text("DELETE FROM survey_case_outcomes WHERE case_id LIKE 'C_G%'")
    )
    db_session.commit()


@postgres_only
def test_upsert_reports_conflicting_winner_instead_of_overwriting(db_session):
    from sqlalchemy import text

    from import_case_outcomes import upsert

    outcomes = _outcomes(groups=1, winner="blue")
    db_session.execute(
        text("DELETE FROM survey_case_outcomes WHERE case_id LIKE 'C_G%'")
    )
    db_session.commit()
    upsert(db_session, outcomes, "pilot_v3")
    db_session.commit()

    flipped = _outcomes(groups=1, winner="red")
    inserted, unchanged, conflicts = upsert(db_session, flipped, "pilot_v3")
    assert inserted == 0 and unchanged == 0
    assert len(conflicts) == 4
    db_session.rollback()

    stored = db_session.execute(
        text(
            "SELECT DISTINCT winning_team FROM survey_case_outcomes "
            "WHERE case_id LIKE 'C_G%'"
        )
    ).scalars().all()
    assert stored == ["blue"]  # unchanged

    db_session.execute(
        text("DELETE FROM survey_case_outcomes WHERE case_id LIKE 'C_G%'")
    )
    db_session.commit()
