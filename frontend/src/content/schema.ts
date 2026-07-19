/**
 * The language-independent spine of every answerable question.
 *
 * Option VALUES and question ORDER live here once and are never translated.
 * Each language supplies only labels, keyed by these values, so a translation
 * cannot rename, reorder, add, or drop a stored answer — the worst a bad
 * translation can do is show the wrong words. A missing or misspelled label
 * key is a compile error, not a runtime surprise.
 *
 * These values are the API contract: they are what `/api/responses` receives.
 * Changing one is a backend/database change, not a copy change.
 */

/** Fixed presentation order of the five participant questions. */
export const PARTICIPANT_QUESTION_ORDER = [
  'rank',
  'years_playing',
  'main_role',
  'playing_frequency',
  'region',
] as const;

export type ParticipantKey = (typeof PARTICIPANT_QUESTION_ORDER)[number];

/**
 * Stored option values per question, in presentation order.
 *
 * LAN/LAS and the individual SEA shards stay merged: the study will not have
 * the sample size to separate them, and every Riot shard still maps to exactly
 * one option. `prefer_not_to_say` is a real stored answer, never a missing one.
 */
export const PARTICIPANT_OPTION_VALUES = {
  rank: [
    'unranked',
    'iron',
    'bronze',
    'silver',
    'gold',
    'platinum',
    'emerald',
    'diamond',
    'master',
    'grandmaster',
    'challenger',
  ],
  years_playing: ['lt_1y', '1_2y', '3_5y', '6_9y', '10y_plus'],
  main_role: ['top', 'jungle', 'mid', 'bot', 'support', 'fill'],
  playing_frequency: [
    'lt_monthly',
    'few_monthly',
    'weekly',
    '2_4_weekly',
    '5_plus_weekly',
  ],
  region: [
    'na',
    'euw',
    'eune',
    'kr',
    'br',
    'latam',
    'oce',
    'tr',
    'ru',
    'jp',
    'sea',
    'me',
    'other',
    'prefer_not_to_say',
  ],
} as const satisfies Record<ParticipantKey, readonly string[]>;

/** The stored values for one question, as a union. */
export type ParticipantOptionValue<K extends ParticipantKey> =
  (typeof PARTICIPANT_OPTION_VALUES)[K][number];

/**
 * Every option of every question needs a label in every language. Expressed as
 * an exact `Record` per question so a language bundle cannot omit one.
 */
export type ParticipantOptionLabels = {
  [K in ParticipantKey]: Record<ParticipantOptionValue<K>, string>;
};

/** The two predicted-winner values sent to the API. */
export const WINNER_VALUES = ['blue', 'red'] as const;
export type WinnerValue = (typeof WINNER_VALUES)[number];

/** The 1–5 confidence scale sent to the API. */
export const CONFIDENCE_VALUES = [1, 2, 3, 4, 5] as const;
export type ConfidenceValue = (typeof CONFIDENCE_VALUES)[number];

/** The five lane/role keys used by the snapshot's matchup section. */
export const ROLE_KEYS = [
  'TOP',
  'JUNGLE',
  'MIDDLE',
  'BOTTOM',
  'UTILITY',
] as const;
export type RoleLabelKey = (typeof ROLE_KEYS)[number];
