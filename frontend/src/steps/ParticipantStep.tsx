import { useMemo, useState } from 'react';
import { buildParticipantQuestions } from '../content/index.ts';
import { useContent } from '../i18n/context.ts';
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
  const content = useContent();

  // Rebuilt when the language changes, but only the labels differ: the keys
  // and option values come from the schema, so `draft` — which stores values —
  // stays valid across a switch and no answer is lost.
  const participantQuestions = useMemo(
    () => buildParticipantQuestions(content),
    [content]
  );

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
    <StepContainer title={content.participant.title}>
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
          {content.participant.submitLabel}
        </PrimaryButton>
      </div>
    </StepContainer>
  );
}
