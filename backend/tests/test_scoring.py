"""Scoring logic. Pure — no database, runs anywhere."""

from __future__ import annotations

import pytest

from app.scoring import ScoringError, score_answers


def _answers(predictions: list[str]) -> list[tuple[int, str, str]]:
    return [(i + 1, f"C_{i}", p) for i, p in enumerate(predictions)]


def _outcomes(winners: list[str]) -> dict[str, str]:
    return {f"C_{i}": w for i, w in enumerate(winners)}


def test_mixed_submission_totals():
    score, results = score_answers(
        _answers(["blue"] * 10),
        _outcomes(["blue"] * 7 + ["red"] * 3),
    )
    assert score.answered == 10
    assert score.correct == 7
    assert score.incorrect == 3
    assert sum(1 for r in results if r.correct) == score.correct
    assert sum(1 for r in results if not r.correct) == score.incorrect


def test_all_correct():
    score, results = score_answers(
        _answers(["blue", "red", "blue"]), _outcomes(["blue", "red", "blue"])
    )
    assert (score.correct, score.incorrect) == (3, 0)
    assert all(r.correct for r in results)


def test_all_incorrect():
    score, results = score_answers(
        _answers(["blue", "red", "blue"]), _outcomes(["red", "blue", "red"])
    )
    assert (score.correct, score.incorrect) == (0, 3)
    assert not any(r.correct for r in results)


def test_correct_is_exactly_prediction_equals_winner():
    _, results = score_answers(
        _answers(["blue", "red", "blue", "red"]),
        _outcomes(["blue", "blue", "red", "red"]),
    )
    for r in results:
        assert r.correct == (r.predicted_winner == r.winning_team)


def test_totals_always_sum_to_answered():
    score, _ = score_answers(
        _answers(["blue"] * 10), _outcomes(["blue", "red"] * 5)
    )
    assert score.correct + score.incorrect == score.answered == 10


def test_results_are_sorted_by_question_order():
    shuffled = [(3, "C_a", "blue"), (1, "C_b", "red"), (2, "C_c", "blue")]
    outcomes = {"C_a": "blue", "C_b": "red", "C_c": "red"}
    _, results = score_answers(shuffled, outcomes)
    assert [r.question_order for r in results] == [1, 2, 3]


def test_missing_outcome_is_an_error_not_an_incorrect_answer():
    """Scoring a case with no known winner would corrupt the accuracy measure."""
    with pytest.raises(ScoringError, match="no outcome for case"):
        score_answers([(1, "C_unknown", "blue")], {"C_other": "blue"})


def test_empty_input_scores_zero():
    score, results = score_answers([], {})
    assert (score.answered, score.correct, score.incorrect) == (0, 0, 0)
    assert results == []
