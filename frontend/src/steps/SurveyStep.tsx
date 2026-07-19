import { useEffect, useRef, useState } from 'react';
import type { SurveyCase } from '../types/dataset.ts';
import type {
  Confidence,
  PredictedWinner,
  SurveyAnswer,
} from '../types/submission.ts';
import SnapshotView from '../components/snapshot/SnapshotView.tsx';
import PredictionPanel from '../components/snapshot/PredictionPanel.tsx';

interface SurveyStepProps {
  cases: SurveyCase[];
  onComplete: (answers: SurveyAnswer[]) => void;
}

export default function SurveyStep({ cases, onComplete }: SurveyStepProps) {
  const [index, setIndex] = useState(0);
  const [winner, setWinner] = useState<PredictedWinner | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);

  // Per-case timing. shownAt is set when the case becomes visible.
  const shownAt = useRef<{ iso: string; ms: number }>({ iso: '', ms: 0 });
  const answers = useRef<SurveyAnswer[]>([]);

  useEffect(() => {
    shownAt.current = { iso: new Date().toISOString(), ms: Date.now() };
    window.scrollTo(0, 0);
  }, [index]);

  const current = cases[index];
  const total = cases.length;
  const isLast = index === total - 1;
  const canConfirm = winner !== null && confidence !== null;

  const confirm = () => {
    if (!canConfirm) return;
    const answeredMs = Date.now();
    answers.current.push({
      question_order: index + 1,
      case_id: current.case_id,
      predicted_winner: winner,
      confidence,
      shown_at: shownAt.current.iso,
      answered_at: new Date(answeredMs).toISOString(),
      response_time_ms: answeredMs - shownAt.current.ms,
    });

    // Clear controls before advancing.
    setWinner(null);
    setConfidence(null);

    if (isLast) {
      onComplete(answers.current);
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="w-full max-w-5xl py-6">
      {import.meta.env.DEV && (
        <p className="mb-2 font-mono text-xs text-slate-600">
          {current.case_id}
        </p>
      )}

      <SnapshotView
        snapshot={current.snapshot}
        questionNumber={index + 1}
        totalQuestions={total}
      />

      {/* Prediction — the final action, a distinct panel below the dashboard. */}
      <div className="mt-3">
        <PredictionPanel
          winner={winner}
          confidence={confidence}
          onWinnerChange={setWinner}
          onConfidenceChange={setConfidence}
          onConfirm={confirm}
          isLast={isLast}
          fieldKey={String(index)}
        />
      </div>
    </div>
  );
}
