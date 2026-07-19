"""Integration tests for POST /api/responses.

Run against in-memory SQLite by default, or real PostgreSQL when
TEST_DATABASE_URL is set (see conftest). They exercise the actual endpoint:
validation, transaction boundaries, scoring, idempotency, and rollback.

SQLite proves the application logic. It does NOT prove server-side constraint
enforcement, so the same suite must also pass against the staging PostgreSQL
database before deployment. Those fixtures truncate participant tables, so
TEST_DATABASE_URL must never point at production.
"""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import func, select, text

from conftest import make_submission

CASES = [f"C_TEST{i:08d}" for i in range(1, 11)]


def _winners(seeded: list[dict]) -> dict[str, str]:
    return {row["case_id"]: row["winning_team"] for row in seeded}


def test_health_does_not_require_the_database(client):
    assert client.get("/api/health").json() == {"status": "ok"}


# --------------------------------------------------------------------------- #
# Happy path
# --------------------------------------------------------------------------- #
def test_valid_submission_persists_and_scores(client, seeded_outcomes, db_session):
    winners = _winners(seeded_outcomes)
    # Predict the true winner for the first seven, the wrong one for the rest.
    predictions = [
        winners[c] if i < 7 else ("red" if winners[c] == "blue" else "blue")
        for i, c in enumerate(CASES)
    ]
    payload = make_submission(CASES, predictions)

    res = client.post("/api/responses", json=payload)
    assert res.status_code == 201, res.text
    body = res.json()

    assert body["score"] == {"answered": 10, "correct": 7, "incorrect": 3}
    assert len(body["results"]) == 10

    # Exactly one response row and exactly ten answer rows.
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_responses"))
    ) == 1
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_answers"))
    ) == 10


def test_results_are_returned_in_question_order(client, seeded_outcomes):
    res = client.post("/api/responses", json=make_submission(CASES))
    orders = [r["question_order"] for r in res.json()["results"]]
    assert orders == list(range(1, 11))


def test_totals_match_the_rows(client, seeded_outcomes):
    body = client.post("/api/responses", json=make_submission(CASES)).json()
    correct = sum(1 for r in body["results"] if r["correct"])
    assert body["score"]["correct"] == correct
    assert body["score"]["incorrect"] == 10 - correct
    assert body["score"]["answered"] == len(body["results"])


def test_correct_flag_equals_prediction_versus_winner(client, seeded_outcomes):
    body = client.post("/api/responses", json=make_submission(CASES)).json()
    for r in body["results"]:
        assert r["correct"] == (r["predicted_winner"] == r["winning_team"])


def test_all_correct(client, seeded_outcomes):
    winners = _winners(seeded_outcomes)
    payload = make_submission(CASES, [winners[c] for c in CASES])
    body = client.post("/api/responses", json=payload).json()
    assert body["score"] == {"answered": 10, "correct": 10, "incorrect": 0}


def test_all_incorrect(client, seeded_outcomes):
    winners = _winners(seeded_outcomes)
    payload = make_submission(
        CASES, ["red" if winners[c] == "blue" else "blue" for c in CASES]
    )
    body = client.post("/api/responses", json=payload).json()
    assert body["score"] == {"answered": 10, "correct": 0, "incorrect": 10}


# --------------------------------------------------------------------------- #
# Validation that needs the answer key
# --------------------------------------------------------------------------- #
def test_unknown_case_is_rejected(client, seeded_outcomes, db_session):
    payload = make_submission(CASES)
    payload["answers"][3]["case_id"] = "C_DOESNOTEXIST"

    res = client.post("/api/responses", json=payload)
    assert res.status_code == 422
    assert "unknown case_id" in res.text
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_responses"))
    ) == 0


def test_dataset_version_mismatch_is_rejected(client, seeded_outcomes, db_session):
    payload = make_submission(CASES)
    payload["survey"]["dataset_version"] = "pilot_v2"

    res = client.post("/api/responses", json=payload)
    assert res.status_code == 422
    assert "dataset_version mismatch" in res.text
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_responses"))
    ) == 0


def test_repeated_match_group_is_rejected(client, seeded_outcomes, db_engine, db_session):
    """Two cases from the same match must never appear in one survey.

    The client never sends match_group_id, so the server resolves it from the
    answer key — an independent check, not a restatement of client input.
    """
    with db_engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO survey_case_outcomes "
                "(case_id, match_group_id, cutoff_minute, dataset_version, winning_team)"
                " VALUES ('C_TESTDUPGROUP', 'M_TEST00000001', 20, 'pilot_v3', 'blue')"
                " ON CONFLICT (case_id) DO NOTHING"
            )
        )

    payload = make_submission(CASES)
    payload["answers"][5]["case_id"] = "C_TESTDUPGROUP"  # same group as case 1

    res = client.post("/api/responses", json=payload)
    assert res.status_code == 422
    assert "same match group" in res.text
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_responses"))
    ) == 0

    with db_engine.begin() as conn:
        conn.execute(
            text("DELETE FROM survey_case_outcomes WHERE case_id = 'C_TESTDUPGROUP'")
        )


@pytest.mark.parametrize(
    "mutate",
    [
        pytest.param(lambda p: p["answers"].pop(), id="nine_answers"),
        pytest.param(
            lambda p: p["answers"][1].update(question_order=1), id="duplicate_order"
        ),
        pytest.param(
            lambda p: p["answers"][1].update(case_id=p["answers"][0]["case_id"]),
            id="duplicate_case",
        ),
        pytest.param(
            lambda p: p["answers"][0].update(predicted_winner="purple"),
            id="invalid_team",
        ),
        pytest.param(
            lambda p: p["answers"][0].update(confidence=9), id="invalid_confidence"
        ),
        pytest.param(
            lambda p: p["participant"].update(rank="immortal"), id="invalid_rank"
        ),
        pytest.param(
            lambda p: p["participant"].update(region="atlantis"), id="invalid_region"
        ),
    ],
)
def test_invalid_submissions_write_nothing(client, seeded_outcomes, db_session, mutate):
    payload = make_submission(CASES)
    mutate(payload)

    res = client.post("/api/responses", json=payload)
    assert res.status_code == 422
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_responses"))
    ) == 0
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_answers"))
    ) == 0


def test_rollback_leaves_no_partial_rows(client, seeded_outcomes, db_session):
    """A failure after the response row is built must leave zero rows, not one."""
    payload = make_submission(CASES)
    payload["answers"][9]["case_id"] = "C_NOTINKEY"

    assert client.post("/api/responses", json=payload).status_code == 422
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_responses"))
    ) == 0
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_answers"))
    ) == 0


# --------------------------------------------------------------------------- #
# Idempotency
# --------------------------------------------------------------------------- #
def test_exact_retry_returns_stored_result_without_new_rows(
    client, seeded_outcomes, db_session
):
    payload = make_submission(CASES, response_id=str(uuid.uuid4()))

    first = client.post("/api/responses", json=payload)
    assert first.status_code == 201

    second = client.post("/api/responses", json=payload)
    assert second.status_code == 200
    assert second.json() == first.json()

    assert db_session.scalar(
        select(func.count()).select_from(text("survey_responses"))
    ) == 1
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_answers"))
    ) == 10


def test_retry_tolerates_reordered_answers(client, seeded_outcomes):
    payload = make_submission(CASES, response_id=str(uuid.uuid4()))
    first = client.post("/api/responses", json=payload)
    assert first.status_code == 201

    reordered = dict(payload)
    reordered["answers"] = list(reversed(payload["answers"]))
    second = client.post("/api/responses", json=reordered)

    assert second.status_code == 200
    assert second.json() == first.json()


def test_same_id_with_different_content_conflicts(
    client, seeded_outcomes, db_session
):
    rid = str(uuid.uuid4())
    payload = make_submission(CASES, response_id=rid)
    assert client.post("/api/responses", json=payload).status_code == 201

    altered = make_submission(CASES, response_id=rid)
    altered["answers"][0]["predicted_winner"] = (
        "red" if payload["answers"][0]["predicted_winner"] == "blue" else "blue"
    )

    res = client.post("/api/responses", json=altered)
    assert res.status_code == 409
    assert "different content" in res.text

    # The original submission is untouched.
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_responses"))
    ) == 1
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_answers"))
    ) == 10


def test_different_ids_create_separate_records(client, seeded_outcomes, db_session):
    for _ in range(2):
        res = client.post(
            "/api/responses", json=make_submission(CASES, response_id=str(uuid.uuid4()))
        )
        assert res.status_code == 201

    assert db_session.scalar(
        select(func.count()).select_from(text("survey_responses"))
    ) == 2
    assert db_session.scalar(
        select(func.count()).select_from(text("survey_answers"))
    ) == 20


def test_stored_answers_match_the_submission(client, seeded_outcomes, db_session):
    rid = str(uuid.uuid4())
    payload = make_submission(CASES, ["blue", "red"] * 5, response_id=rid)
    assert client.post("/api/responses", json=payload).status_code == 201

    rows = db_session.execute(
        text(
            "SELECT question_order, case_id, predicted_winner, confidence "
            "FROM survey_answers WHERE response_id = :rid ORDER BY question_order"
        ),
        {"rid": rid},
    ).all()

    assert len(rows) == 10
    assert [r[0] for r in rows] == list(range(1, 11))
    assert [r[1] for r in rows] == CASES
    assert [r[2] for r in rows] == ["blue", "red"] * 5


def test_participant_profile_is_stored_including_region(
    client, seeded_outcomes, db_session
):
    rid = str(uuid.uuid4())
    payload = make_submission(CASES, response_id=rid)
    payload["participant"]["region"] = "prefer_not_to_say"
    assert client.post("/api/responses", json=payload).status_code == 201

    row = db_session.execute(
        text(
            "SELECT rank, years_playing, main_role, playing_frequency, region, "
            "dataset_version, survey_protocol_version, consent_version "
            "FROM survey_responses WHERE response_id = :rid"
        ),
        {"rid": rid},
    ).one()

    assert row == (
        "gold",
        "3_5y",
        "mid",
        "weekly",
        "prefer_not_to_say",
        "pilot_v3",
        "final_feedback_v1",
        "v2",
    )
