import { useMemo } from 'react';
import {
  buildConfidenceOptions,
  buildWinnerOptions,
} from '../../content/index.ts';
import { useContent } from '../../i18n/context.ts';
import { TeamDot } from './ui.tsx';
import PrimaryButton from '../PrimaryButton.tsx';
import type { Confidence, PredictedWinner } from '../../types/submission.ts';

interface PredictionPanelProps {
  winner: PredictedWinner | null;
  confidence: Confidence | null;
  onWinnerChange: (w: PredictedWinner) => void;
  onConfidenceChange: (c: Confidence) => void;
  onConfirm: () => void;
  isLast: boolean;
  /** Changes with the case so each question's radio group is independent. */
  fieldKey: string;
}

/**
 * The final action of the dashboard: two equal-weight team choices and a 1–5
 * confidence scale, backed by native radios. No default selection, no implied
 * preference, no celebratory styling. Visually distinct panel, same interface.
 */
export default function PredictionPanel({
  winner,
  confidence,
  onWinnerChange,
  onConfidenceChange,
  onConfirm,
  isLast,
  fieldKey,
}: PredictionPanelProps) {
  const content = useContent();
  const surveyContent = content.survey;
  const snapshotContent = content.snapshot;
  const canConfirm = winner !== null && confidence !== null;

  // Labels follow the language; `value` is always the literal payload value.
  const winnerOptions = useMemo(() => buildWinnerOptions(content), [content]);
  const confidenceOptions = useMemo(
    () => buildConfidenceOptions(content),
    [content]
  );

  return (
    <section className="rounded-xl border border-abyss-600 bg-abyss-900 p-4 sm:p-5">
      <h2 className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
        {snapshotContent.predictionTitle}
      </h2>

      {/* Team choice */}
      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-slate-200">
          {surveyContent.winnerQuestion}
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {winnerOptions.map((opt) => {
            const side = opt.value as PredictedWinner;
            const selected = winner === side;
            // Full literal class strings so Tailwind generates them.
            const selectedClasses =
              side === 'blue'
                ? 'peer-checked:border-blue-400 peer-checked:bg-blue-500/10 peer-checked:ring-1 peer-checked:ring-blue-400 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400'
                : 'peer-checked:border-red-400 peer-checked:bg-red-500/10 peer-checked:ring-1 peer-checked:ring-red-400 peer-focus-visible:ring-2 peer-focus-visible:ring-red-400';
            return (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  name={`winner-${fieldKey}`}
                  className="peer sr-only"
                  checked={selected}
                  onChange={() => onWinnerChange(side)}
                />
                <span
                  className={`flex items-center justify-center gap-2 rounded-lg border border-abyss-700 bg-abyss-850 px-4 py-4 text-base font-semibold text-slate-100 ${selectedClasses}`}
                >
                  <TeamDot side={side} />
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Confidence */}
      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-medium text-slate-200">
          {surveyContent.confidenceQuestion}
        </legend>
        <div className="grid grid-cols-5 gap-2">
          {confidenceOptions.map((opt) => {
            const selected = confidence === opt.value;
            return (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  name={`confidence-${fieldKey}`}
                  className="peer sr-only"
                  checked={selected}
                  onChange={() => onConfidenceChange(opt.value)}
                  aria-label={opt.label}
                />
                <span className="flex items-center justify-center rounded-lg border border-abyss-700 bg-abyss-850 py-3 text-base font-semibold text-slate-100 tabular-nums peer-checked:border-slate-300 peer-checked:bg-abyss-700 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-300">
                  {opt.value}
                </span>
              </label>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
          <span>{surveyContent.confidenceLowHint}</span>
          <span>{surveyContent.confidenceHighHint}</span>
        </div>
      </fieldset>

      <div className="mt-6">
        <PrimaryButton onClick={onConfirm} disabled={!canConfirm}>
          {isLast
            ? surveyContent.confirmFinalLabel
            : surveyContent.confirmLabel}
        </PrimaryButton>
      </div>
    </section>
  );
}
