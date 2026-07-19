import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Step } from './types/step.ts';
import { CONSENT_VERSION, SURVEY_PROTOCOL_VERSION } from './content.ts';
import type { SurveyCase, SurveyDataset } from './types/dataset.ts';
import type {
  ParticipantAnswers,
  SubmissionResult,
  SurveyAnswer,
  SurveySubmission,
} from './types/submission.ts';
import { loadSurveyDataset } from './services/surveyDataset.ts';
import { selectSurveyCases } from './services/selectSurveyCases.ts';
import { SubmissionError, submitSurvey } from './services/submitSurvey.ts';
import LanguageSwitcher from './components/LanguageSwitcher.tsx';
import ConsentStep from './steps/ConsentStep.tsx';
import ParticipantStep from './steps/ParticipantStep.tsx';
import InstructionsStep from './steps/InstructionsStep.tsx';
import type { DatasetStatus } from './steps/InstructionsStep.tsx';
import SurveyStep from './steps/SurveyStep.tsx';
import FinishedStep from './steps/FinishedStep.tsx';

interface DatasetState {
  status: DatasetStatus;
  dataset: SurveyDataset | null;
  error?: string;
}

interface ConsentState {
  accepted: true;
  acceptedAt: string;
}

/**
 * The completion screen's three states. Correctness is only ever available in
 * `ready`, which is reached only after the backend has committed the
 * submission.
 */
export type ResultState =
  | { status: 'submitting' }
  | { status: 'ready'; result: SubmissionResult }
  | { status: 'error'; message: string; retryable: boolean };

export default function App() {
  const [step, setStep] = useState<Step>(Step.Consent);

  // Dataset is loaded once, near startup, and held in state (never refetched).
  const [datasetState, setDatasetState] = useState<DatasetState>({
    status: 'loading',
    dataset: null,
  });

  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [participant, setParticipant] = useState<ParticipantAnswers | null>(
    null
  );
  const [selectedCases, setSelectedCases] = useState<SurveyCase[]>([]);
  const [surveyStartedAt, setSurveyStartedAt] = useState<string | null>(null);
  const [surveyFinishedAt, setSurveyFinishedAt] = useState<string | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [resultState, setResultState] = useState<ResultState | null>(null);

  /**
   * Minted once when the survey finishes and reused for every retry, so a
   * retried submission updates nothing and duplicates nothing server-side.
   */
  const responseId = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadSurveyDataset(controller.signal)
      .then((dataset) => setDatasetState({ status: 'ready', dataset }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setDatasetState({
          status: 'error',
          dataset: null,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => controller.abort();
  }, []);

  const submission: SurveySubmission | null = useMemo(() => {
    if (
      !consent ||
      !participant ||
      !datasetState.dataset ||
      !surveyStartedAt ||
      !surveyFinishedAt ||
      !responseId.current
    ) {
      return null;
    }
    return {
      response_id: responseId.current,
      consent: {
        accepted: true,
        accepted_at: consent.acceptedAt,
        consent_version: CONSENT_VERSION,
      },
      participant,
      survey: {
        dataset_version: datasetState.dataset.dataset_version,
        survey_protocol_version: SURVEY_PROTOCOL_VERSION,
        started_at: surveyStartedAt,
        finished_at: surveyFinishedAt,
      },
      answers,
    };
  }, [
    consent,
    participant,
    datasetState.dataset,
    surveyStartedAt,
    surveyFinishedAt,
    answers,
  ]);

  const send = useCallback(async (payload: SurveySubmission) => {
    setResultState({ status: 'submitting' });
    try {
      setResultState({ status: 'ready', result: await submitSurvey(payload) });
    } catch (err: unknown) {
      setResultState({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
        retryable: err instanceof SubmissionError ? err.retryable : true,
      });
    }
  }, []);

  const handleRetry = () => {
    if (submission) void send(submission);
  };

  const handleConsent = (acceptedAt: string) => {
    setConsent({ accepted: true, acceptedAt });
    setStep(Step.Participant);
  };

  const handleParticipant = (values: ParticipantAnswers) => {
    setParticipant(values);
    setStep(Step.Instructions);
  };

  const handleStartSurvey = () => {
    if (datasetState.status !== 'ready' || !datasetState.dataset) return;
    setSelectedCases(selectSurveyCases(datasetState.dataset.cases));
    setSurveyStartedAt(new Date().toISOString());
    setStep(Step.Survey);
  };

  const handleSurveyComplete = (collected: SurveyAnswer[]) => {
    const finishedAt = new Date().toISOString();
    setAnswers(collected);
    setSurveyFinishedAt(finishedAt);
    setStep(Step.Finished);

    if (!consent || !participant || !datasetState.dataset || !surveyStartedAt) {
      setResultState({
        status: 'error',
        message: 'the survey is incomplete and cannot be submitted',
        retryable: false,
      });
      return;
    }

    // Mint the idempotency key once, here. Every retry reuses it.
    responseId.current ??= crypto.randomUUID();

    // Built from the values in hand rather than the memo, which has not yet
    // recomputed for the state set above.
    void send({
      response_id: responseId.current,
      consent: {
        accepted: true,
        accepted_at: consent.acceptedAt,
        consent_version: CONSENT_VERSION,
      },
      participant,
      survey: {
        dataset_version: datasetState.dataset.dataset_version,
        survey_protocol_version: SURVEY_PROTOCOL_VERSION,
        started_at: surveyStartedAt,
        finished_at: finishedAt,
      },
      answers: collected,
    });
  };

  const handleDevReset = () => {
    setConsent(null);
    setParticipant(null);
    setSelectedCases([]);
    setSurveyStartedAt(null);
    setSurveyFinishedAt(null);
    setAnswers([]);
    setResultState(null);
    responseId.current = null;
    setStep(Step.Consent);
  };

  return (
    <div className="flex min-h-screen flex-col bg-abyss-950 text-slate-200">
      {/* Thin chrome bar. Shares `main`'s max width and padding so the switcher
          lines up with the content's right edge at every breakpoint, and sits
          in normal flow rather than floating over the step title. */}
      <header className="mx-auto flex w-full max-w-5xl justify-end px-4 pt-3 sm:px-6">
        <LanguageSwitcher />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-start justify-center px-4 sm:px-6">
        {step === Step.Consent && <ConsentStep onAccept={handleConsent} />}

        {step === Step.Participant && (
          <ParticipantStep onComplete={handleParticipant} />
        )}

        {step === Step.Instructions && (
          <InstructionsStep
            datasetStatus={datasetState.status}
            errorDetail={datasetState.error}
            onStart={handleStartSurvey}
          />
        )}

        {step === Step.Survey && (
          <SurveyStep cases={selectedCases} onComplete={handleSurveyComplete} />
        )}

        {step === Step.Finished && (
          <FinishedStep
            submission={submission}
            resultState={resultState}
            cases={selectedCases}
            onRetry={handleRetry}
            onDevReset={import.meta.env.DEV ? handleDevReset : undefined}
          />
        )}
      </main>
    </div>
  );
}
