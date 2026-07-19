import { finishedContent, CASES_PER_PARTICIPANT } from '../content.ts';
import type { SurveyCase } from '../types/dataset.ts';
import type { SurveySubmission } from '../types/submission.ts';
import type { ResultState } from '../App.tsx';
import StepContainer from '../components/StepContainer.tsx';
import ResultRow from '../components/ResultRow.tsx';
import PrimaryButton from '../components/PrimaryButton.tsx';

interface FinishedStepProps {
  /** The assembled submission. Used for the retry payload and a dev check. */
  submission: SurveySubmission | null;
  /** Submission progress. Results exist only once the server has committed. */
  resultState: ResultState | null;
  /** The participant's ten cases, for the cutoff minute on each row. */
  cases: SurveyCase[];
  onRetry: () => void;
  /** Dev-only reset, wired by App behind import.meta.env.DEV. */
  onDevReset?: () => void;
}

export default function FinishedStep({
  submission,
  resultState,
  cases,
  onRetry,
  onDevReset,
}: FinishedStepProps) {
  const answerCount = submission?.answers.length ?? 0;
  const complete =
    submission !== null &&
    answerCount === CASES_PER_PARTICIPANT &&
    Boolean(submission.consent.accepted) &&
    Boolean(submission.participant.rank) &&
    Boolean(submission.participant.region) &&
    Boolean(submission.survey.started_at) &&
    Boolean(submission.survey.finished_at);

  const cutoffByCaseId = new Map(
    cases.map((c) => [c.case_id, c.snapshot.metadata.cutoff_minute])
  );

  return (
    <StepContainer title={finishedContent.title}>
      <div className="space-y-4 text-slate-300">
        {finishedContent.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {resultState?.status === 'submitting' && (
        <p className="mt-8 text-sm text-slate-400" role="status">
          {finishedContent.submittingLabel}
        </p>
      )}

      {resultState?.status === 'error' && (
        <div
          className="mt-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"
          role="alert"
        >
          <p className="font-medium text-amber-200">
            {finishedContent.errorTitle}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {finishedContent.errorHelp}
          </p>
          {import.meta.env.DEV && (
            <p className="mt-2 font-mono text-xs text-slate-500">
              {resultState.message}
            </p>
          )}
          {resultState.retryable && (
            <div className="mt-4">
              <PrimaryButton onClick={onRetry}>
                {finishedContent.retryLabel}
              </PrimaryButton>
            </div>
          )}
        </div>
      )}

      {resultState?.status === 'ready' && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-100">
            {finishedContent.resultsTitle}
          </h2>
          <p className="mt-1 text-slate-300">
            {finishedContent.scoreSummary(
              resultState.result.score.correct,
              resultState.result.score.incorrect
            )}
          </p>

          <h3 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate-400">
            {finishedContent.breakdownTitle}
          </h3>
          <ul className="mt-3 space-y-2">
            {resultState.result.results.map((result) => (
              <ResultRow
                key={result.question_order}
                result={result}
                cutoffMinute={cutoffByCaseId.get(result.case_id)}
              />
            ))}
          </ul>
        </section>
      )}

      {import.meta.env.DEV && (
        <div className="mt-10 rounded-lg border border-abyss-700 bg-abyss-900 p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Dev confirmation</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Answers collected: {answerCount} / {CASES_PER_PARTICIPANT}
            </li>
            <li>Local submission complete: {complete ? 'yes' : 'no'}</li>
            <li>Submission status: {resultState?.status ?? 'not started'}</li>
          </ul>
          {onDevReset && (
            <button
              type="button"
              onClick={onDevReset}
              className="mt-4 rounded border border-abyss-700 px-4 py-1 text-slate-300 hover:bg-abyss-800"
            >
              Reset (dev)
            </button>
          )}
        </div>
      )}
    </StepContainer>
  );
}
