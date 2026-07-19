import { useContent } from '../i18n/context.ts';
import StepContainer from '../components/StepContainer.tsx';
import PrimaryButton from '../components/PrimaryButton.tsx';

export type DatasetStatus = 'loading' | 'ready' | 'error';

interface InstructionsStepProps {
  datasetStatus: DatasetStatus;
  /** Technical detail, shown only in development mode. */
  errorDetail?: string;
  onStart: () => void;
}

export default function InstructionsStep({
  datasetStatus,
  errorDetail,
  onStart,
}: InstructionsStepProps) {
  const instructionsContent = useContent().instructions;

  return (
    <StepContainer title={instructionsContent.title}>
      <div className="space-y-4 text-slate-300">
        {instructionsContent.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <div>
          <p>{instructionsContent.mayIncludeIntro}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {instructionsContent.mayInclude.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-slate-400">
          {instructionsContent.reconstructionNote}
        </p>
      </div>

      <div className="mt-10">
        {datasetStatus === 'loading' && (
          <p className="text-slate-400">{instructionsContent.loadingLabel}</p>
        )}

        {datasetStatus === 'error' && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-red-300">
            <p>{instructionsContent.loadErrorLabel}</p>
            {import.meta.env.DEV && errorDetail && (
              <p className="mt-2 font-mono text-xs text-red-500">
                {errorDetail}
              </p>
            )}
          </div>
        )}

        {datasetStatus === 'ready' && (
          <PrimaryButton onClick={onStart}>
            {instructionsContent.startLabel}
          </PrimaryButton>
        )}
      </div>
    </StepContainer>
  );
}
