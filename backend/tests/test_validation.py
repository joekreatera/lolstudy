"""Request-schema validation. Pure — no database, runs anywhere.

Everything here is decidable from the payload alone. Checks that need the
answer key (unknown case, dataset mismatch, repeated match group) live in
test_api.py because they require database rows.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.fingerprint import fingerprint_submission
from app.schemas import SubmissionIn
from conftest import make_submission

CASES = [f"C_TEST{i:08d}" for i in range(1, 11)]


def _parse(**kwargs) -> SubmissionIn:
    return SubmissionIn.model_validate(make_submission(CASES, **kwargs))


def test_valid_submission_parses():
    submission = _parse()
    assert len(submission.answers) == 10
    assert submission.participant.region == "euw"


def test_requires_exactly_ten_answers():
    payload = make_submission(CASES)
    payload["answers"] = payload["answers"][:9]
    with pytest.raises(ValidationError, match="exactly 10 answers"):
        SubmissionIn.model_validate(payload)

    payload = make_submission(CASES)
    payload["answers"].append(dict(payload["answers"][0], question_order=11))
    with pytest.raises(ValidationError):
        SubmissionIn.model_validate(payload)


def test_rejects_duplicate_question_order():
    payload = make_submission(CASES)
    payload["answers"][1]["question_order"] = 1
    with pytest.raises(ValidationError, match="question_order must be exactly"):
        SubmissionIn.model_validate(payload)


def test_rejects_question_order_out_of_range():
    payload = make_submission(CASES)
    payload["answers"][0]["question_order"] = 0
    with pytest.raises(ValidationError):
        SubmissionIn.model_validate(payload)


def test_rejects_duplicate_case_id():
    payload = make_submission(CASES)
    payload["answers"][1]["case_id"] = payload["answers"][0]["case_id"]
    with pytest.raises(ValidationError, match="duplicate case_id"):
        SubmissionIn.model_validate(payload)


def test_rejects_invalid_predicted_winner():
    payload = make_submission(CASES)
    payload["answers"][0]["predicted_winner"] = "purple"
    with pytest.raises(ValidationError):
        SubmissionIn.model_validate(payload)


@pytest.mark.parametrize("confidence", [0, 6, -1])
def test_rejects_confidence_out_of_range(confidence):
    payload = make_submission(CASES)
    payload["answers"][0]["confidence"] = confidence
    with pytest.raises(ValidationError):
        SubmissionIn.model_validate(payload)


@pytest.mark.parametrize(
    "field,value",
    [
        ("rank", "immortal"),
        ("years_playing", "20y"),
        ("main_role", "adc"),
        ("playing_frequency", "daily"),
    ],
)
def test_rejects_invalid_participant_value(field, value):
    payload = make_submission(CASES)
    payload["participant"][field] = value
    with pytest.raises(ValidationError):
        SubmissionIn.model_validate(payload)


@pytest.mark.parametrize("region", ["", "EUW", "atlantis", None])
def test_rejects_invalid_region(region):
    payload = make_submission(CASES)
    payload["participant"]["region"] = region
    with pytest.raises(ValidationError):
        SubmissionIn.model_validate(payload)


def test_accepts_prefer_not_to_say_region():
    """The opt-out is a real stored answer, not a missing value."""
    submission = _parse()
    payload = make_submission(CASES)
    payload["participant"]["region"] = "prefer_not_to_say"
    assert SubmissionIn.model_validate(payload).participant.region == (
        "prefer_not_to_say"
    )
    assert submission.participant.region == "euw"


def test_requires_participant_region():
    payload = make_submission(CASES)
    del payload["participant"]["region"]
    with pytest.raises(ValidationError):
        SubmissionIn.model_validate(payload)


def test_rejects_unconsented_submission():
    payload = make_submission(CASES)
    payload["consent"]["accepted"] = False
    with pytest.raises(ValidationError):
        SubmissionIn.model_validate(payload)


def test_rejects_finished_before_started():
    payload = make_submission(CASES)
    payload["survey"]["finished_at"] = payload["survey"]["started_at"]
    SubmissionIn.model_validate(payload)  # equal is allowed

    payload["survey"]["finished_at"] = "2026-07-18T11:00:00+00:00"
    with pytest.raises(ValidationError, match="finished_at must not precede"):
        SubmissionIn.model_validate(payload)


def test_rejects_unknown_fields():
    """extra='forbid' stops a client smuggling anything we do not store."""
    payload = make_submission(CASES)
    payload["participant"]["age"] = 30
    with pytest.raises(ValidationError):
        SubmissionIn.model_validate(payload)


# --------------------------------------------------------------------------- #
# Fingerprint
# --------------------------------------------------------------------------- #
def test_fingerprint_is_stable_for_identical_content():
    a = SubmissionIn.model_validate(make_submission(CASES, response_id="a" * 8 + "-0000-4000-8000-000000000000"))
    b = SubmissionIn.model_validate(make_submission(CASES, response_id="a" * 8 + "-0000-4000-8000-000000000000"))
    assert fingerprint_submission(a) == fingerprint_submission(b)


def test_fingerprint_changes_when_an_answer_changes():
    rid = "aaaaaaaa-0000-4000-8000-000000000000"
    base = make_submission(CASES, response_id=rid)
    changed = make_submission(CASES, response_id=rid)
    changed["answers"][0]["predicted_winner"] = "red"

    assert fingerprint_submission(
        SubmissionIn.model_validate(base)
    ) != fingerprint_submission(SubmissionIn.model_validate(changed))


def test_fingerprint_ignores_answer_array_order():
    """Reordering without changing content is the same submission."""
    rid = "aaaaaaaa-0000-4000-8000-000000000000"
    base = make_submission(CASES, response_id=rid)
    reordered = make_submission(CASES, response_id=rid)
    reordered["answers"].reverse()

    assert fingerprint_submission(
        SubmissionIn.model_validate(base)
    ) == fingerprint_submission(SubmissionIn.model_validate(reordered))


def test_fingerprint_changes_when_participant_changes():
    rid = "aaaaaaaa-0000-4000-8000-000000000000"
    base = make_submission(CASES, response_id=rid)
    changed = make_submission(CASES, response_id=rid)
    changed["participant"]["region"] = "kr"

    assert fingerprint_submission(
        SubmissionIn.model_validate(base)
    ) != fingerprint_submission(SubmissionIn.model_validate(changed))
