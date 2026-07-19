"""Scoring: the single place correctness is decided.

Pure functions over already-resolved data — no database, no framework, no I/O.
The endpoint persists a submission first and only then calls in here, so a
score can never be produced for data that was not committed.

Correctness is `predicted_winner == winning_team` and nothing else. It is
computed on demand and never stored, so there is exactly one source of truth
for the study's dependent variable.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class QuestionResult:
    question_order: int
    case_id: str
    predicted_winner: str
    winning_team: str

    @property
    def correct(self) -> bool:
        return self.predicted_winner == self.winning_team


@dataclass(frozen=True)
class Score:
    answered: int
    correct: int
    incorrect: int


class ScoringError(Exception):
    """Raised when an answer cannot be scored (no outcome for its case)."""


def score_answers(
    answers: list[tuple[int, str, str]],
    outcomes: dict[str, str],
) -> tuple[Score, list[QuestionResult]]:
    """Score `(question_order, case_id, predicted_winner)` triples.

    `outcomes` maps case_id -> winning_team. A case missing from that mapping is
    a hard error: silently treating it as incorrect would corrupt the study's
    accuracy measure. Results come back sorted by question_order so the API
    response order is deterministic regardless of input order.
    """
    results: list[QuestionResult] = []

    for question_order, case_id, predicted_winner in answers:
        winning_team = outcomes.get(case_id)
        if winning_team is None:
            raise ScoringError(f"no outcome for case {case_id}")
        results.append(
            QuestionResult(
                question_order=question_order,
                case_id=case_id,
                predicted_winner=predicted_winner,
                winning_team=winning_team,
            )
        )

    results.sort(key=lambda r: r.question_order)
    correct = sum(1 for r in results if r.correct)
    score = Score(
        answered=len(results), correct=correct, incorrect=len(results) - correct
    )
    return score, results
