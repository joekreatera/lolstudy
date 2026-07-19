import { useState } from 'react';
import { useContent } from '../i18n/context.ts';
import StepContainer from '../components/StepContainer.tsx';
import PrimaryButton from '../components/PrimaryButton.tsx';

interface ConsentStepProps {
  onAccept: (acceptedAt: string) => void;
}

export default function ConsentStep({ onAccept }: ConsentStepProps) {
  const [checked, setChecked] = useState(false);
  const consentContent = useContent().consent;

  return (
    <StepContainer title={consentContent.title}>
      <div className="space-y-4 text-slate-300">
        {consentContent.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-3 text-slate-200">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-1 h-5 w-5"
        />
        <span>{consentContent.checkboxLabel}</span>
      </label>

      <div className="mt-8">
        <PrimaryButton
          onClick={() => onAccept(new Date().toISOString())}
          disabled={!checked}
        >
          {consentContent.continueLabel}
        </PrimaryButton>
      </div>
    </StepContainer>
  );
}
