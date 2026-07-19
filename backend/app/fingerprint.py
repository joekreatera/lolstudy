"""Payload fingerprinting for idempotent retries.

A participant whose submission fails with an uncertain network result must be
able to retry. The browser reuses the same `response_id`, so the server needs to
tell two cases apart:

  same id + same content      -> the retry of a submission we already stored
  same id + different content -> a conflict; refuse rather than overwrite

The fingerprint covers exactly the research content: the participant profile,
the ten answers, and the version/consent fields. It deliberately EXCLUDES
`submitted_at` (server wall clock, different on every attempt). Answers are
sorted by question_order so a client that reorders the array without changing
any answer still produces the same fingerprint.
"""

from __future__ import annotations

import hashlib
import json

from .schemas import SubmissionIn


def fingerprint_submission(submission: SubmissionIn) -> str:
    """Stable SHA-256 hex digest of a submission's research content."""
    canonical = {
        "response_id": str(submission.response_id),
        "consent": {
            "accepted": submission.consent.accepted,
            "accepted_at": submission.consent.accepted_at.isoformat(),
            "consent_version": submission.consent.consent_version,
        },
        "participant": submission.participant.model_dump(),
        "survey": {
            "dataset_version": submission.survey.dataset_version,
            "survey_protocol_version": submission.survey.survey_protocol_version,
            "started_at": submission.survey.started_at.isoformat(),
            "finished_at": submission.survey.finished_at.isoformat(),
        },
        "answers": [
            {
                "question_order": a.question_order,
                "case_id": a.case_id,
                "predicted_winner": a.predicted_winner,
                "confidence": a.confidence,
                "shown_at": a.shown_at.isoformat(),
                "answered_at": a.answered_at.isoformat(),
                "response_time_ms": a.response_time_ms,
            }
            for a in sorted(submission.answers, key=lambda a: a.question_order)
        ],
    }
    encoded = json.dumps(canonical, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()
