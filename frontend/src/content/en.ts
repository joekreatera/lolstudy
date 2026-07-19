/**
 * English copy — the reference bundle.
 *
 * `ContentBundle` is derived from this object's inferred type, so every other
 * language is checked against it structurally: a missing key, a renamed key, or
 * a helper with the wrong parameters fails `tsc`. Add a string here first, then
 * the compiler will tell you which bundles still need it.
 *
 * Only display text lives here. Stored answer values are in `schema.ts`, and
 * anything read from the dataset (champion names, item names, event
 * descriptions, patch, queue) is never routed through this file.
 */

import type {
  ConfidenceValue,
  ParticipantKey,
  ParticipantOptionLabels,
  RoleLabelKey,
  WinnerValue,
} from './schema.ts';

/** Number of prediction cases each participant answers. */
export const CASES_PER_PARTICIPANT = 10;

export const en = {
  /** Localized <title> and <html lang>. */
  documentTitle: 'LoL Predictor Survey',
  htmlLang: 'en',

  language: {
    /** Accessible name of the switcher group. */
    switcherLabel: 'Language',
    /** Accessible name per option; the button face uses `short`. */
    names: { en: 'English', es: 'Spanish' } as Record<'en' | 'es', string>,
    short: { en: 'EN', es: 'ES' } as Record<'en' | 'es', string>,
  },

  consent: {
    title: 'Before you begin',
    paragraphs: [
      'This is a university research study about predicting the outcome of League of Legends matches from partial, in-game information.',
      'Participation is completely voluntary and your responses are anonymous. We do not collect any Riot account information.',
      `The survey contains ${CASES_PER_PARTICIPANT} prediction cases and takes about 5–10 minutes.`,
      'You may stop at any time by closing the page.',
    ],
    checkboxLabel: 'I have read the information and agree to participate.',
    continueLabel: 'Continue',
  },

  instructions: {
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
    loadingLabel: 'Preparing the survey…',
    loadErrorLabel:
      'We could not load the survey right now. Please try again later.',
  },

  participant: {
    title: 'A few questions about you',
    submitLabel: 'Continue',
    questions: {
      rank: 'What is your current or most recent League of Legends rank?',
      years_playing: 'How long have you played League of Legends?',
      main_role: 'What is your main role?',
      playing_frequency: 'How often do you currently play League of Legends?',
      region: 'What region/server do you primarily play League of Legends on?',
    } as Record<ParticipantKey, string>,
    /**
     * Official tier names stay in English in both languages: they are proper
     * nouns in the client and every player reads them that way.
     */
    options: {
      rank: {
        unranked: 'Unranked',
        iron: 'Iron',
        bronze: 'Bronze',
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum',
        emerald: 'Emerald',
        diamond: 'Diamond',
        master: 'Master',
        grandmaster: 'Grandmaster',
        challenger: 'Challenger',
      },
      years_playing: {
        lt_1y: 'Less than 1 year',
        '1_2y': '1–2 years',
        '3_5y': '3–5 years',
        '6_9y': '6–9 years',
        '10y_plus': '10 or more years',
      },
      main_role: {
        top: 'Top',
        jungle: 'Jungle',
        mid: 'Mid',
        bot: 'Bot / ADC',
        support: 'Support',
        fill: 'Fill / No main role',
      },
      playing_frequency: {
        lt_monthly: 'Less than once per month',
        few_monthly: 'A few times per month',
        weekly: 'About once per week',
        '2_4_weekly': '2–4 days per week',
        '5_plus_weekly': '5 or more days per week',
      },
      region: {
        na: 'North America (NA)',
        euw: 'Europe West (EUW)',
        eune: 'Europe Nordic & East (EUNE)',
        kr: 'Korea (KR)',
        br: 'Brazil (BR)',
        latam: 'Latin America (LAN / LAS)',
        oce: 'Oceania (OCE)',
        tr: 'Türkiye (TR)',
        ru: 'Russia (RU)',
        jp: 'Japan (JP)',
        sea: 'Southeast Asia (SG / PH / TH / VN / TW)',
        me: 'Middle East (ME)',
        other: 'Other',
        prefer_not_to_say: 'Prefer not to say',
      },
    } as ParticipantOptionLabels,
  },

  survey: {
    progressLabel: (current: number, total: number) =>
      `Question ${current} of ${total}`,
    cutoffLabel: (minute: number) => `Game state at minute ${minute}`,
    winnerQuestion: 'Which team will win this match?',
    confidenceQuestion: 'How confident are you?',
    confirmLabel: 'Confirm and continue',
    confirmFinalLabel: 'Confirm and finish',
    winnerLabels: { blue: 'Blue Team', red: 'Red Team' } as Record<
      WinnerValue,
      string
    >,
    /** Accessible name for each confidence radio. */
    confidenceLabels: {
      1: '1 — Very unsure',
      2: '2',
      3: '3 — Somewhat sure',
      4: '4',
      5: '5 — Very sure',
    } as Record<ConfidenceValue, string>,
    confidenceLowHint: '1 — Very unsure',
    confidenceHighHint: '5 — Very sure',
  },

  finished: {
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
  },

  /** Snapshot visualization. All neutral; no outcome wording. */
  snapshot: {
    gameStateLabel: 'Game state',
    teamOverviewTitle: 'Team overview',
    laneMatchupsTitle: 'Lane matchups',
    killMapTitle: 'Kill map',
    eventTimelineTitle: 'Event timeline',
    /** Panel heading combining the two above. */
    mapAndTimelineTitle: 'Kill map & event timeline',
    blueTeamLabel: 'Blue Team',
    redTeamLabel: 'Red Team',
    versusLabel: 'VS',
    deltaExplanation: 'Δ = Blue − Red',
    firstObjectivesTitle: 'First objectives',
    firstBloodLabel: 'First blood',
    firstTowerLabel: 'First tower',
    firstDragonLabel: 'First dragon',
    objectivesTitle: 'Objectives',
    noneOwnerLabel: '—',
    noItemsLabel: 'No items',
    noEventsLabel: 'No events recorded by this minute.',
    playerUnavailableLabel: 'Player data unavailable',
    killMapLegendBlue: '● Blue team kill',
    killMapLegendRed: '◆ Red team kill',
    predictionTitle: 'Your prediction',
    /** Prefix before dataset-supplied champion names; names stay unchanged. */
    assistsLabel: 'Assists',
    /** e.g. "42 events through 20:00" */
    eventSummary: (count: number, clock: string) =>
      `${count} ${count === 1 ? 'event' : 'events'} through ${clock}`,
    /** Precedes the dataset's patch string, which is never translated. */
    patchLabel: 'Patch',

    metrics: {
      gold: 'Gold',
      kda: 'K / D / A',
      kdaSrLabel: 'Kills, deaths, assists',
      cs: 'CS',
      csSrLabel: 'Creep score',
      avgLevel: 'Avg level',
      avgLevelSrLabel: 'Average level',
      level: 'Level',
      /** Screen-reader suffix after a player's inline K/D/A figure. */
      kdaInlineSrLabel: 'kills, deaths, assists',
    },

    objectives: {
      towers: 'Towers',
      inhibitors: 'Inhibitors',
      dragons: 'Dragons',
      heralds: 'Heralds',
      barons: 'Barons',
    },

    roles: {
      TOP: 'Top',
      JUNGLE: 'Jungle',
      MIDDLE: 'Mid',
      BOTTOM: 'Bot',
      UTILITY: 'Support',
    } as Record<RoleLabelKey, string>,

    rank: {
      /** Whole rank lookup failed (defensive; absent from current data). */
      unavailable: 'Rank unavailable',
      /** No entry in that specific ranked queue. */
      unranked: 'Unranked',
      /** Wins / losses abbreviations for the record line. */
      wins: 'W',
      losses: 'L',
    },

    /** Gold-cost suffix in an item's accessible name. */
    itemGoldSuffix: 'g',
  },
};

/**
 * The shape every language must satisfy. Derived from English so the reference
 * copy and the contract can never disagree.
 */
export type ContentBundle = typeof en;
