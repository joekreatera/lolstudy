import { useState } from 'react';
import { participantContent, participantQuestions } from '../content.ts';
import type { ParticipantAnswers } from '../types/submission.ts';
import StepContainer from '../components/StepContainer.tsx';
import RadioGroup from '../components/RadioGroup.tsx';
import PrimaryButton from '../components/PrimaryButton.tsx';

interface ParticipantStepProps {
  onComplete: (answers: ParticipantAnswers) => void;
}

type Draft = Record<string, string | undefined>;

export default function ParticipantStep({ onComplete }: ParticipantStepProps) {
  const [draft, setDraft] = useState<Draft>({});

  const allAnswered = participantQuestions.every((q) => draft[q.key]);

  const submit = () => {
    if (!allAnswered) return;
    // The option values come from participantQuestions, so they are already
    // constrained to the union members; the assertions only tell TypeScript
    // what the required-field gate above has already guaranteed.
    onComplete({
      rank: draft['rank'] as ParticipantAnswers['rank'],
      years_playing: draft[
        'years_playing'
      ] as ParticipantAnswers['years_playing'],
      main_role: draft['main_role'] as ParticipantAnswers['main_role'],
      playing_frequency: draft[
        'playing_frequency'
      ] as ParticipantAnswers['playing_frequency'],
      region: draft['region'] as ParticipantAnswers['region'],
    });
  };

  return (
    <StepContainer title={participantContent.title}>
      <div className="space-y-10">
        {participantQuestions.map((q) => (
          <RadioGroup
            key={q.key}
            name={q.key}
            legend={q.question}
            options={q.options}
            value={draft[q.key] ?? null}
            onChange={(value) => setDraft((d) => ({ ...d, [q.key]: value }))}
          />
        ))}
      </div>

      <div className="mt-10">
        <PrimaryButton onClick={submit} disabled={!allAnswered}>
          {participantContent.submitLabel}
        </PrimaryButton>
      </div>
    </StepContainer>
  );
}
