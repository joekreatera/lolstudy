"""FastAPI application entry point.

Two endpoints, both participant-facing:

    GET  /api/health     liveness
    POST /api/responses  submit one completed survey, get the score back

Frontend and backend are served same-origin behind Nginx in production, so no
CORS configuration is required and none is added.

The score is disclosed only after the submission has been committed. A
participant therefore cannot learn any outcome by abandoning the survey, by
replaying a request, or by inspecting anything the browser holds: the answer key
lives solely in `survey_case_outcomes`.
"""

from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .db import get_session
from .fingerprint import fingerprint_submission
from .models import SurveyAnswer, SurveyCaseOutcome, SurveyResponse
from .schemas import SubmissionIn, SubmissionOut
from .scoring import score_answers

app = FastAPI(title="LoL Predictor Survey API")


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness check used by deployment and monitoring.

    Deliberately does not touch the database: this answers "is the process
    up", which is all Nginx and systemd need. It exposes no version, no
    configuration, and no connection detail.
    """
    return {"status": "ok"}


def _load_outcomes(
    session: Session, case_ids: list[str]
) -> dict[str, SurveyCaseOutcome]:
    rows = session.scalars(
        select(SurveyCaseOutcome).where(SurveyCaseOutcome.case_id.in_(case_ids))
    ).all()
    return {row.case_id: row for row in rows}


def _validate_against_outcomes(
    submission: SubmissionIn, outcomes: dict[str, SurveyCaseOutcome]
) -> None:
    """Checks that need the answer key. 422 on any failure, nothing written."""
    missing = [a.case_id for a in submission.answers if a.case_id not in outcomes]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"unknown case_id(s): {', '.join(sorted(missing))}",
        )

    mismatched = sorted(
        {
            outcomes[a.case_id].dataset_version
            for a in submission.answers
            if outcomes[a.case_id].dataset_version != submission.survey.dataset_version
        }
    )
    if mismatched:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"dataset_version mismatch: submission claims "
                f"{submission.survey.dataset_version!r}, cases belong to "
                f"{', '.join(repr(v) for v in mismatched)}"
            ),
        )

    # Re-verifies the frontend's no-repeated-match rule server-side. The client
    # never sends match_group_id, so this is an independent check, not a
    # restatement of something it told us.
    groups = [outcomes[a.case_id].match_group_id for a in submission.answers]
    if len(set(groups)) != len(groups):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="answers contain two cases from the same match group",
        )


def _build_result(
    submission_id, answers: list[tuple[int, str, str]], outcomes: dict[str, str]
) -> SubmissionOut:
    score, results = score_answers(answers, outcomes)
    return SubmissionOut(
        response_id=submission_id,
        score={  # type: ignore[arg-type]
            "answered": score.answered,
            "correct": score.correct,
            "incorrect": score.incorrect,
        },
        results=[  # type: ignore[arg-type]
            {
                "question_order": r.question_order,
                "case_id": r.case_id,
                "predicted_winner": r.predicted_winner,
                "winning_team": r.winning_team,
                "correct": r.correct,
            }
            for r in results
        ],
    )


def _resolve_existing(
    session: Session,
    submission: SubmissionIn,
    fingerprint: str,
    response: Response,
) -> SubmissionOut:
    """Answer a submission whose `response_id` is already stored.

    Exact retry -> 200 with the stored result and no new rows.
    Different content under the same id -> 409, nothing written.
    """
    existing = session.get(SurveyResponse, submission.response_id)
    if existing is None:  # pragma: no cover - only reachable if a row vanishes
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="response disappeared while resolving a retry",
        )

    if existing.payload_fingerprint != fingerprint:
        # Same idempotency key, different content: refuse rather than overwrite
        # or silently create a second research record.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "response_id already exists with different content; "
                "resubmitting altered answers is not permitted"
            ),
        )

    stored = session.scalars(
        select(SurveyAnswer)
        .where(SurveyAnswer.response_id == submission.response_id)
        .order_by(SurveyAnswer.question_order)
    ).all()
    outcomes = _load_outcomes(session, [a.case_id for a in stored])

    response.status_code = status.HTTP_200_OK
    return _build_result(
        submission.response_id,
        [(a.question_order, a.case_id, a.predicted_winner) for a in stored],
        {cid: row.winning_team for cid, row in outcomes.items()},
    )


@app.post(
    "/api/responses",
    response_model=SubmissionOut,
    status_code=status.HTTP_201_CREATED,
)
def submit_response(
    submission: SubmissionIn,
    response: Response,
    session: Session = Depends(get_session),
) -> SubmissionOut:
    """Persist one completed survey and return its score.

    Everything happens in a single transaction. If any part fails the whole
    submission is rolled back and no score is returned, so a participant never
    sees results for data that was not stored.
    """
    fingerprint = fingerprint_submission(submission)

    if session.get(SurveyResponse, submission.response_id) is not None:
        return _resolve_existing(session, submission, fingerprint, response)

    outcomes = _load_outcomes(session, [a.case_id for a in submission.answers])
    _validate_against_outcomes(submission, outcomes)

    session.add(
        SurveyResponse(
            response_id=submission.response_id,
            rank=submission.participant.rank,
            years_playing=submission.participant.years_playing,
            main_role=submission.participant.main_role,
            playing_frequency=submission.participant.playing_frequency,
            region=submission.participant.region,
            dataset_version=submission.survey.dataset_version,
            survey_protocol_version=submission.survey.survey_protocol_version,
            consent_version=submission.consent.consent_version,
            consent_accepted_at=submission.consent.accepted_at,
            survey_started_at=submission.survey.started_at,
            survey_finished_at=submission.survey.finished_at,
            payload_fingerprint=fingerprint,
        )
    )
    session.add_all(
        SurveyAnswer(
            response_id=submission.response_id,
            question_order=a.question_order,
            case_id=a.case_id,
            predicted_winner=a.predicted_winner,
            confidence=a.confidence,
            shown_at=a.shown_at,
            answered_at=a.answered_at,
            response_time_ms=a.response_time_ms,
        )
        for a in submission.answers
    )

    try:
        session.commit()
    except IntegrityError:
        # Two attempts raced past the existence check above (double-click, or a
        # retry arriving while the first request is still in flight). The
        # primary key on response_id makes exactly one of them win; the loser
        # rolls back and is answered from the row the winner committed.
        session.rollback()
        return _resolve_existing(session, submission, fingerprint, response)

    # Scored only after a successful commit.
    return _build_result(
        submission.response_id,
        [(a.question_order, a.case_id, a.predicted_winner) for a in submission.answers],
        {cid: row.winning_team for cid, row in outcomes.items()},
    )
