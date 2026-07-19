"""Request/response schemas.

The request model mirrors the frontend `SurveySubmission` exactly (see
frontend/src/types/submission.ts). Frontend validation is a usability feature,
never a trust boundary: everything enforced in the browser is re-enforced here.

What this module can check is everything that is decidable from the payload
alone — shape, enums, counts, ordering, internal duplicates, timestamps. Checks
that need the database (cases must exist, dataset must match, no repeated
match group) live in app/main.py where the outcome rows are available.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .enums import (
    ANSWERS_PER_RESPONSE,
    CONFIDENCE_MAX,
    CONFIDENCE_MIN,
    MAIN_ROLES,
    PLAYING_FREQUENCIES,
    RANKS,
    REGIONS,
    TEAMS,
    YEARS_PLAYING,
)

Team = Literal[TEAMS]  # type: ignore[valid-type]
Rank = Literal[RANKS]  # type: ignore[valid-type]
YearsPlaying = Literal[YEARS_PLAYING]  # type: ignore[valid-type]
MainRole = Literal[MAIN_ROLES]  # type: ignore[valid-type]
PlayingFrequency = Literal[PLAYING_FREQUENCIES]  # type: ignore[valid-type]
Region = Literal[REGIONS]  # type: ignore[valid-type]

Confidence = Annotated[int, Field(ge=CONFIDENCE_MIN, le=CONFIDENCE_MAX)]
QuestionOrder = Annotated[int, Field(ge=1, le=ANSWERS_PER_RESPONSE)]


class ConsentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    accepted: Literal[True]
    accepted_at: datetime
    consent_version: str = Field(min_length=1, max_length=32)


class ParticipantIn(BaseModel):
    """The five participant-profile answers. All required; `region`'s
    `prefer_not_to_say` is an explicit answer, not a missing value."""

    model_config = ConfigDict(extra="forbid")

    rank: Rank
    years_playing: YearsPlaying
    main_role: MainRole
    playing_frequency: PlayingFrequency
    region: Region


class SurveyMetaIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_version: str = Field(min_length=1, max_length=64)
    survey_protocol_version: str = Field(min_length=1, max_length=64)
    started_at: datetime
    finished_at: datetime

    @model_validator(mode="after")
    def _check_order(self) -> "SurveyMetaIn":
        if self.finished_at < self.started_at:
            raise ValueError("finished_at must not precede started_at")
        return self


class AnswerIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question_order: QuestionOrder
    case_id: str = Field(min_length=1, max_length=64)
    predicted_winner: Team
    confidence: Confidence
    shown_at: datetime
    answered_at: datetime
    response_time_ms: int = Field(ge=0)

    @model_validator(mode="after")
    def _check_order(self) -> "AnswerIn":
        if self.answered_at < self.shown_at:
            raise ValueError("answered_at must not precede shown_at")
        return self


class SubmissionIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    response_id: uuid.UUID
    consent: ConsentIn
    participant: ParticipantIn
    survey: SurveyMetaIn
    answers: list[AnswerIn]

    @model_validator(mode="after")
    def _check_answers(self) -> "SubmissionIn":
        count = len(self.answers)
        if count != ANSWERS_PER_RESPONSE:
            raise ValueError(
                f"expected exactly {ANSWERS_PER_RESPONSE} answers, got {count}"
            )

        orders = [a.question_order for a in self.answers]
        if sorted(orders) != list(range(1, ANSWERS_PER_RESPONSE + 1)):
            raise ValueError(
                f"question_order must be exactly 1..{ANSWERS_PER_RESPONSE} "
                "with no repeats"
            )

        case_ids = [a.case_id for a in self.answers]
        if len(set(case_ids)) != count:
            raise ValueError("answers contain a duplicate case_id")

        return self


# --------------------------------------------------------------------------- #
# Response
# --------------------------------------------------------------------------- #
class QuestionResultOut(BaseModel):
    question_order: int
    case_id: str
    predicted_winner: Team
    winning_team: Team
    correct: bool


class ScoreOut(BaseModel):
    answered: int
    correct: int
    incorrect: int


class SubmissionOut(BaseModel):
    """Returned only after the submission is committed. Results are always
    ordered by question_order."""

    response_id: uuid.UUID
    score: ScoreOut
    results: list[QuestionResultOut]
