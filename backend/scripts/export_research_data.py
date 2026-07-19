"""Export collected responses as analysis-ready CSV.

    python scripts/export_research_data.py [--out DIR]

Produces two files:

    responses.csv   one row per participant
    answers.csv     ten rows per participant, joined to the answer key

Correctness is DERIVED in the query (`predicted_winner = winning_team`), never
read from a stored column, so the export cannot disagree with the API.

This is private research data containing participant responses. The output
directory is gitignored; do not commit the files, and do not copy them into any
static root. The script never prints the database URL or any credential.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text  # noqa: E402

from app.db import SessionLocal  # noqa: E402

DEFAULT_OUT = Path(__file__).resolve().parents[1] / "exports"

RESPONSES_SQL = text(
    """
    SELECT response_id,
           rank,
           years_playing,
           main_role,
           playing_frequency,
           region,
           dataset_version,
           survey_protocol_version,
           consent_version,
           consent_accepted_at,
           survey_started_at,
           survey_finished_at,
           submitted_at
    FROM survey_responses
    ORDER BY submitted_at, response_id
    """
)

ANSWERS_SQL = text(
    """
    SELECT a.response_id,
           a.question_order,
           a.case_id,
           o.match_group_id,
           o.cutoff_minute,
           a.predicted_winner,
           a.confidence,
           o.winning_team,
           (a.predicted_winner = o.winning_team) AS correct,
           a.response_time_ms,
           a.shown_at,
           a.answered_at
    FROM survey_answers a
    JOIN survey_case_outcomes o ON o.case_id = a.case_id
    ORDER BY a.response_id, a.question_order
    """
)


def write_csv(path: Path, rows, header: list[str]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(header)
        count = 0
        for row in rows:
            writer.writerow(list(row))
            count += 1
    return count


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    args = parser.parse_args(argv)

    out_dir = Path(args.out)
    session = SessionLocal()
    try:
        responses = session.execute(RESPONSES_SQL)
        n_responses = write_csv(
            out_dir / "responses.csv", responses, list(responses.keys())
        )

        answers = session.execute(ANSWERS_SQL)
        n_answers = write_csv(out_dir / "answers.csv", answers, list(answers.keys()))
    except Exception as exc:  # noqa: BLE001 - reported without credentials
        print(f"Export FAILED (database): {type(exc).__name__}", file=sys.stderr)
        return 1
    finally:
        session.close()

    print("Research export complete")
    print(f"  responses.csv: {n_responses} row(s)")
    print(f"  answers.csv:   {n_answers} row(s)")
    print(f"  Output:        {out_dir}")

    expected = n_responses * 10
    if n_answers != expected:
        print(
            f"\nWARNING: expected {expected} answer rows for {n_responses} "
            f"response(s), found {n_answers}. Investigate before analysis.",
            file=sys.stderr,
        )
        return 1

    print("\nPRIVATE research data - do not commit, publish, or copy to a web root.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
