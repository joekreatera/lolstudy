/**
 * One scored question on the completion screen.
 *
 * Two visual systems are kept deliberately separate:
 *   - TEAM identity uses the existing blue/red palette (which team is which).
 *   - CORRECTNESS uses emerald / amber. Amber, not red, because red already
 *     means "Red Team" on this same row; reusing it would make "Winner: Red"
 *     and "Incorrect" visually indistinguishable.
 *
 * Status is never conveyed by colour alone: every row carries the literal word
 * Correct or Incorrect plus a decorative (aria-hidden) icon, and the whole row
 * has one screen-reader sentence so it stands on its own out of context.
 */

import { finishedContent, winnerOptions } from '../content.ts';
import type { PredictedWinner, QuestionResult } from '../types/submission.ts';

interface ResultRowProps {
  result: QuestionResult;
  /** Cutoff minute for this case, joined locally from the selected cases. */
  cutoffMinute?: number;
}

const teamLabel = (team: PredictedWinner) =>
  winnerOptions.find((o) => o.value === team)?.label ?? team;

const teamClass = (team: PredictedWinner) =>
  team === 'blue' ? 'text-sky-300' : 'text-rose-300';

function StatusIcon({ correct }: { correct: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {correct ? (
        <polyline points="3,8.5 6.5,12 13,4" />
      ) : (
        <path d="M4 4l8 8M12 4l-8 8" />
      )}
    </svg>
  );
}

export default function ResultRow({ result, cutoffMinute }: ResultRowProps) {
  const { question_order, predicted_winner, winning_team, correct } = result;

  const status = correct
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    : 'border-amber-500/40 bg-amber-500/10 text-amber-300';

  return (
    <li
      className="rounded-lg border border-abyss-700 bg-abyss-900 p-3 sm:flex sm:items-center sm:gap-4"
      // One sentence for assistive tech; the visual pieces below are hidden
      // from it so the row is not read out twice.
      aria-label={finishedContent.rowAccessibleLabel(
        question_order,
        teamLabel(predicted_winner),
        teamLabel(winning_team),
        correct
      )}
    >
      <div aria-hidden="true" className="contents">
        <p className="text-sm font-medium text-slate-200 sm:w-32 sm:shrink-0">
          {finishedContent.questionLabel(question_order)}
          {cutoffMinute !== undefined && (
            <span className="text-slate-500">
              {' · '}
              {finishedContent.minuteLabel(cutoffMinute)}
            </span>
          )}
        </p>

        <div className="mt-2 space-y-1 text-sm sm:mt-0 sm:flex sm:flex-1 sm:gap-6 sm:space-y-0">
          <p className="text-slate-400">
            {finishedContent.predictionLabel}:{' '}
            <span className={teamClass(predicted_winner)}>
              {teamLabel(predicted_winner)}
            </span>
          </p>
          <p className="text-slate-400">
            {finishedContent.winnerLabel}:{' '}
            <span className={teamClass(winning_team)}>
              {teamLabel(winning_team)}
            </span>
          </p>
        </div>

        <p
          className={`mt-2 inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium sm:mt-0 sm:shrink-0 ${status}`}
        >
          <StatusIcon correct={correct} />
          {correct
            ? finishedContent.correctLabel
            : finishedContent.incorrectLabel}
        </p>
      </div>
    </li>
  );
}
