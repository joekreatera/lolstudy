/**
 * Compatibility surface for non-React consumers.
 *
 * Participant-facing copy now lives in `content/` and is selected per language
 * through `useContent()`. This module re-exports the language-independent
 * constants plus the ENGLISH option lists, which is what the `scripts/verify-*`
 * checks and any other non-rendering caller need: they assert on stored
 * values, question order and version strings, none of which vary by language.
 *
 * Components must not import copy from here — they would pin themselves to
 * English. Import `useContent()` instead.
 */

import { CONTENT, buildParticipantQuestions } from './content/index.ts';

export {
  CASES_PER_PARTICIPANT,
  CONSENT_VERSION,
  SURVEY_PROTOCOL_VERSION,
  buildConfidenceOptions,
  buildParticipantQuestions,
  buildWinnerOptions,
  CONTENT,
} from './content/index.ts';

export type {
  ContentBundle,
  ParticipantQuestion,
  QuestionOption,
} from './content/index.ts';

/** English participant questions — stored values are language-independent. */
export const participantQuestions = buildParticipantQuestions(CONTENT.en);
