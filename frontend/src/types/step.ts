/**
 * The survey is a fixed linear wizard. `Step` enumerates the screens in the
 * order the participant moves through them. A single piece of state in `App`
 * holds the current step; each step owns its own forward transition, and there
 * is intentionally no router and no backward navigation during the survey.
 */
export enum Step {
  Consent = 'CONSENT',
  Participant = 'PARTICIPANT',
  Instructions = 'INSTRUCTIONS',
  Survey = 'SURVEY',
  Finished = 'FINISHED',
}
