/**
 * All participant-facing copy and question definitions live here so wording can
 * change without touching component logic. Stored values are stable and
 * machine-readable; labels are display-only.
 */

/** Number of prediction cases each participant answers. */
export const CASES_PER_PARTICIPANT = 10;

/**
 * Research provenance, stored with every submission so any row in the database
 * can be traced to the exact protocol and consent text that produced it.
 *
 * `SURVEY_PROTOCOL_VERSION` changes when the participant's experience changes
 * (this version added the post-submission results summary).
 * `CONSENT_VERSION` changes when the consent or instruction wording changes.
 * `dataset_version` is NOT here — it is read from the loaded dataset.
 */
export const SURVEY_PROTOCOL_VERSION = 'final_feedback_v1';
export const CONSENT_VERSION = 'v2';

export const consentContent = {
  title: 'Before you begin',
  paragraphs: [
    'This is a university research study about predicting the outcome of League of Legends matches from partial, in-game information.',
    'Participation is completely voluntary and your responses are anonymous. We do not collect any Riot account information.',
    `The survey contains ${CASES_PER_PARTICIPANT} prediction cases and takes about 5–10 minutes.`,
    'You may stop at any time by closing the page.',
  ],
  checkboxLabel: 'I have read the information and agree to participate.',
  continueLabel: 'Continue',
};

export const instructionsContent = {
  title: 'How the survey works',
  paragraphs: [
    `You will see ${CASES_PER_PARTICIPANT} partial game states. Every case comes from a different match.`,
    'Each case is a snapshot of the game at a specific minute. Based only on what you see, predict whether Blue Team or Red Team will eventually win the match.',
    'No correctness feedback is shown while answering. After all ten predictions have been successfully submitted, a final results summary is displayed.',
    'Once you confirm an answer and move forward, it cannot be changed.',
  ],
  mayIncludeIntro: 'Each case may show information such as:',
  mayInclude: [
    'player statistics',
    'team statistics',
    'objectives',
    'items',
    'event information',
  ],
  reconstructionNote:
    'Item inventories are reconstructed from match data and may occasionally be slightly inaccurate.',
  startLabel: 'Start survey',
};

export const finishedContent = {
  title: 'Thank you',
  paragraphs: [
    'Your responses have been recorded. Thank you for taking part in this study.',
    'You can now close this page.',
  ],
  submittingLabel: 'Saving your responses…',
  errorTitle: 'Your responses could not be saved',
  errorHelp:
    'Your answers are still on this page. Please try again — do not close this tab.',
  retryLabel: 'Try again',
  resultsTitle: 'Your results',
  breakdownTitle: 'Question breakdown',
  correctLabel: 'Correct',
  incorrectLabel: 'Incorrect',
  /** e.g. "7 correct · 3 incorrect" */
  scoreSummary: (correct: number, incorrect: number) =>
    `${correct} correct · ${incorrect} incorrect`,
  questionLabel: (n: number) => `Question ${n}`,
  minuteLabel: (minute: number) => `${minute} min`,
  predictionLabel: 'Prediction',
  winnerLabel: 'Winner',
  /** Screen-reader sentence; keeps each row understandable on its own. */
  rowAccessibleLabel: (
    n: number,
    predicted: string,
    winner: string,
    correct: boolean
  ) =>
    `Question ${n}: you predicted ${predicted}, ${winner} won. ` +
    `${correct ? 'Correct' : 'Incorrect'}.`,
};

export const surveyContent = {
  progressLabel: (current: number, total: number) =>
    `Question ${current} of ${total}`,
  cutoffLabel: (minute: number) => `Game state at minute ${minute}`,
  winnerQuestion: 'Which team will win this match?',
  confidenceQuestion: 'How confident are you?',
  confirmLabel: 'Confirm and continue',
  confirmFinalLabel: 'Confirm and finish',
};

/** Copy for the snapshot visualization. All neutral; no outcome wording. */
export const snapshotContent = {
  gameStateLabel: 'Game state',
  teamOverviewTitle: 'Team overview',
  laneMatchupsTitle: 'Lane matchups',
  killMapTitle: 'Kill map',
  eventTimelineTitle: 'Event timeline',
  blueTeamLabel: 'Blue Team',
  redTeamLabel: 'Red Team',
  deltaExplanation: 'Δ = Blue − Red',
  firstObjectivesTitle: 'First objectives',
  firstBloodLabel: 'First blood',
  firstTowerLabel: 'First tower',
  firstDragonLabel: 'First dragon',
  noneOwnerLabel: '—',
  noItemsLabel: 'No items',
  noEventsLabel: 'No events recorded by this minute.',
  playerUnavailableLabel: 'Player data unavailable',
  killMapLegendBlue: '● Blue team kill',
  killMapLegendRed: '◆ Red team kill',
  predictionTitle: 'Your prediction',
};

/** One selectable option: a stable machine value plus a display label. */
export interface QuestionOption {
  value: string;
  label: string;
}

export interface ParticipantQuestion {
  /** Key into ParticipantAnswers. */
  key: 'rank' | 'years_playing' | 'main_role' | 'playing_frequency' | 'region';
  question: string;
  options: QuestionOption[];
}

export const participantContent = {
  title: 'A few questions about you',
  submitLabel: 'Continue',
};

export const participantQuestions: ParticipantQuestion[] = [
  {
    key: 'rank',
    question: 'What is your current or most recent League of Legends rank?',
    options: [
      { value: 'unranked', label: 'Unranked' },
      { value: 'iron', label: 'Iron' },
      { value: 'bronze', label: 'Bronze' },
      { value: 'silver', label: 'Silver' },
      { value: 'gold', label: 'Gold' },
      { value: 'platinum', label: 'Platinum' },
      { value: 'emerald', label: 'Emerald' },
      { value: 'diamond', label: 'Diamond' },
      { value: 'master', label: 'Master' },
      { value: 'grandmaster', label: 'Grandmaster' },
      { value: 'challenger', label: 'Challenger' },
    ],
  },
  {
    key: 'years_playing',
    question: 'How long have you played League of Legends?',
    options: [
      { value: 'lt_1y', label: 'Less than 1 year' },
      { value: '1_2y', label: '1–2 years' },
      { value: '3_5y', label: '3–5 years' },
      { value: '6_9y', label: '6–9 years' },
      { value: '10y_plus', label: '10 or more years' },
    ],
  },
  {
    key: 'main_role',
    question: 'What is your main role?',
    options: [
      { value: 'top', label: 'Top' },
      { value: 'jungle', label: 'Jungle' },
      { value: 'mid', label: 'Mid' },
      { value: 'bot', label: 'Bot / ADC' },
      { value: 'support', label: 'Support' },
      { value: 'fill', label: 'Fill / No main role' },
    ],
  },
  {
    key: 'playing_frequency',
    question: 'How often do you currently play League of Legends?',
    options: [
      { value: 'lt_monthly', label: 'Less than once per month' },
      { value: 'few_monthly', label: 'A few times per month' },
      { value: 'weekly', label: 'About once per week' },
      { value: '2_4_weekly', label: '2–4 days per week' },
      { value: '5_plus_weekly', label: '5 or more days per week' },
    ],
  },
  {
    // LAN/LAS and the individual SEA shards are merged: the study will not have
    // the sample size to separate them, and every Riot shard still maps to
    // exactly one option. `prefer_not_to_say` is a real stored answer, never a
    // missing value.
    key: 'region',
    question: 'What region/server do you primarily play League of Legends on?',
    options: [
      { value: 'na', label: 'North America (NA)' },
      { value: 'euw', label: 'Europe West (EUW)' },
      { value: 'eune', label: 'Europe Nordic & East (EUNE)' },
      { value: 'kr', label: 'Korea (KR)' },
      { value: 'br', label: 'Brazil (BR)' },
      { value: 'latam', label: 'Latin America (LAN / LAS)' },
      { value: 'oce', label: 'Oceania (OCE)' },
      { value: 'tr', label: 'Türkiye (TR)' },
      { value: 'ru', label: 'Russia (RU)' },
      { value: 'jp', label: 'Japan (JP)' },
      { value: 'sea', label: 'Southeast Asia (SG / PH / TH / VN / TW)' },
      { value: 'me', label: 'Middle East (ME)' },
      { value: 'other', label: 'Other' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
  },
];

export const confidenceOptions: { value: 1 | 2 | 3 | 4 | 5; label: string }[] =
  [
    { value: 1, label: '1 — Very unsure' },
    { value: 2, label: '2' },
    { value: 3, label: '3 — Somewhat sure' },
    { value: 4, label: '4' },
    { value: 5, label: '5 — Very sure' },
  ];

export const winnerOptions: { value: 'blue' | 'red'; label: string }[] = [
  { value: 'blue', label: 'Blue Team' },
  { value: 'red', label: 'Red Team' },
];
