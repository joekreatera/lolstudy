/**
 * The submission contract — the object assembled in the browser and POSTed to
 * FastAPI at `/api/responses`, plus the scored result that comes back.
 *
 * Deliberately excluded: `match_group_id` (the server resolves it from its own
 * answer key, so the no-repeated-match rule is verified independently rather
 * than taken on trust), the full snapshot, and any user agent / IP / device /
 * browser metadata.
 *
 * The participant option types are string-literal unions rather than bare
 * `string` so the frontend and the backend enums (backend/app/enums.py) cannot
 * silently drift apart. Both must change together.
 */

export type PredictedWinner = 'blue' | 'red';
export type Confidence = 1 | 2 | 3 | 4 | 5;

export type Rank =
  | 'unranked'
  | 'iron'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'emerald'
  | 'diamond'
  | 'master'
  | 'grandmaster'
  | 'challenger';

export type YearsPlaying = 'lt_1y' | '1_2y' | '3_5y' | '6_9y' | '10y_plus';

export type MainRole = 'top' | 'jungle' | 'mid' | 'bot' | 'support' | 'fill';

export type PlayingFrequency =
  'lt_monthly' | 'few_monthly' | 'weekly' | '2_4_weekly' | '5_plus_weekly';

export type Region =
  | 'na'
  | 'euw'
  | 'eune'
  | 'kr'
  | 'br'
  | 'latam'
  | 'oce'
  | 'tr'
  | 'ru'
  | 'jp'
  | 'sea'
  | 'me'
  | 'other'
  | 'prefer_not_to_say';

export interface SurveyAnswer {
  /** 1-based position in this participant's survey. */
  question_order: number;
  case_id: string;
  predicted_winner: PredictedWinner;
  confidence: Confidence;
  shown_at: string; // ISO timestamp when the case became visible
  answered_at: string; // ISO timestamp when the answer was confirmed
  response_time_ms: number;
}

export interface ParticipantAnswers {
  rank: Rank;
  years_playing: YearsPlaying;
  main_role: MainRole;
  playing_frequency: PlayingFrequency;
  region: Region;
}

export interface SurveySubmission {
  /**
   * Generated in the browser (crypto.randomUUID) when the survey finishes and
   * reused for every retry, so an uncertain network result can be retried
   * without creating a duplicate research record. A server-generated id could
   * not do this: the retry would mint a second one.
   */
  response_id: string;
  consent: {
    accepted: true;
    accepted_at: string;
    consent_version: string;
  };
  participant: ParticipantAnswers;
  survey: {
    dataset_version: string;
    survey_protocol_version: string;
    started_at: string;
    finished_at: string;
  };
  answers: SurveyAnswer[];
}

/**
 * One scored question, as returned by the backend. `winning_team` exists only
 * here, in the response to a committed submission — never in the public
 * dataset and never in the browser before the survey has been submitted.
 */
export interface QuestionResult {
  question_order: number;
  case_id: string;
  predicted_winner: PredictedWinner;
  winning_team: PredictedWinner;
  /**
   * Authoritative, from the server. Not recomputed in the browser: one source
   * of truth for the study's dependent variable.
   */
  correct: boolean;
}

export interface Score {
  answered: number;
  correct: number;
  incorrect: number;
}

export interface SubmissionResult {
  response_id: string;
  score: Score;
  results: QuestionResult[];
}
