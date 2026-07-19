/**
 * Types for the public survey dataset (`survey_cases.json`), matching the real
 * exported schema (0.6.0).
 *
 * PRIVACY / RESEARCH NOTE — intentionally NOT typed here, so no component can
 * depend on them even though they exist in the raw JSON:
 *   - metadata.game_duration_seconds  (post-cutoff future information)
 *   - metadata.schema_version / parser_version / frame_timestamp_ms
 *   - events[].event_id               (embeds the raw Riot match identifier)
 *   - participants[].participant_id
 *   - role_matchups[..].blue/red.participant_id
 *   - participant kda string, quality_flags
 * The UI must never render any of those fields.
 *
 * RANK — participant Solo/Duo rank IS intentional experimental input: humans and
 * LLMs receive exactly the same rank information, so it is typed and rendered.
 * Still forbidden and deliberately absent from this contract:
 *   - team rank_summary   (removed upstream; never reintroduce or recompute it)
 *   - any team aggregate: average/median rank, rank score, Blue-minus-Red rank
 *   - Flex queue, wins/losses, LP history, rank retrieval timestamps
 *   - player identity: PUUID, summoner ID, Riot ID, player name
 */

export type TeamSide = 'blue' | 'red';

export type RoleKey = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';

export interface SnapshotMetadata {
  region: string;
  platform: string;
  queue_id: number;
  queue_name: string;
  game_mode: string;
  game_type: string;
  game_version: string;
  patch: string;
  cutoff_minute: number;
  cutoff_seconds: number;
  /** Exact Data Dragon version for this case's champion/item assets. */
  item_catalog_version: string;
}

export interface TeamState {
  champions: string[];
  gold: number;
  level_sum: number;
  avg_level: number;
  cs: number;
  kills: number;
  deaths: number;
  assists: number;
  towers: number;
  dragons: number;
  heralds: number;
  barons: number;
  inhibitors: number;
  first_blood: boolean;
  first_tower: boolean;
  first_dragon: boolean;
}

export interface ItemEntry {
  item_id: number;
  name: string;
  category: string;
  gold_total: number;
  count: number;
}

/**
 * One ranked queue's standing. `division` is always "I" for apex tiers — never
 * render it directly; use `display`, which upstream already normalizes to
 * "Master" / "Grandmaster" / "Challenger".
 *
 * `wins` / `losses` are RAW counts and must stay raw: no win rate, total games,
 * or ratio is ever derived from them.
 */
export interface QueueRank {
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
  display: string;
}

/**
 * Public participant rank (schema 0.6.1), queue-aware.
 *
 * A `null` queue means the player has no entry in that ranked queue — it is
 * NOT unavailable, and a Flex-only player keeps their Flex record. Both queues
 * null means unranked in both. `available: false` is the defensive lookup-
 * failure shape, absent from the current dataset.
 *
 * Deliberately absent: rank score, team aggregates, and any cross-queue or
 * cross-player comparison.
 */
export type PublicRank =
  | { available: true; solo_duo: QueueRank | null; flex: QueueRank | null }
  | { available: false };

export interface ParticipantState {
  team: TeamSide;
  role: RoleKey;
  champion: string;
  gold: number;
  level: number;
  cs: number;
  kills: number;
  deaths: number;
  assists: number;
  items: {
    inventory: ItemEntry[];
  };
  rank: PublicRank;
}

export interface RoleDiffs {
  gold_blue_minus_red: number;
  level_blue_minus_red: number;
  cs_blue_minus_red: number;
  kills_blue_minus_red: number;
  deaths_blue_minus_red: number;
  assists_blue_minus_red: number;
}

export interface RoleMatchup {
  blue: { champion: string };
  red: { champion: string };
  diffs: RoleDiffs;
}

export type RoleMatchups = Record<RoleKey, RoleMatchup>;

export interface MapPosition {
  x: number;
  y: number;
}

interface EventBase {
  timestamp_ms: number;
  minute: number;
  team: TeamSide;
  description: string;
}

export interface KillEvent extends EventBase {
  type: 'champion_kill';
  killer_champion: string;
  victim_champion: string;
  assist_champions: string[];
  /** Raw map coordinates; prefer position_normalized for display. */
  position?: MapPosition;
  /** Normalized [0,1] coordinates, origin bottom-left (Riot convention). */
  position_normalized?: MapPosition;
}

export interface TowerEvent extends EventBase {
  type: 'tower_kill';
}

export interface InhibitorEvent extends EventBase {
  type: 'inhibitor_kill';
}

export interface DragonEvent extends EventBase {
  type: 'dragon';
  monster_type: string;
}

export interface HeraldEvent extends EventBase {
  type: 'herald';
  monster_type: string;
}

export type SnapshotEvent =
  KillEvent | TowerEvent | InhibitorEvent | DragonEvent | HeraldEvent;

export interface TeamDiffs {
  gold_blue_minus_red: number;
  level_blue_minus_red: number;
  avg_level_blue_minus_red: number;
  cs_blue_minus_red: number;
  kills_blue_minus_red: number;
  assists_blue_minus_red: number;
  towers_blue_minus_red: number;
  dragons_blue_minus_red: number;
  heralds_blue_minus_red: number;
  barons_blue_minus_red: number;
  inhibitors_blue_minus_red: number;
}

export interface SurveySnapshot {
  metadata: SnapshotMetadata;
  blue_team: TeamState;
  red_team: TeamState;
  participants: ParticipantState[];
  role_matchups: RoleMatchups;
  events_until_cutoff: SnapshotEvent[];
  team_diffs: TeamDiffs;
}

export interface SurveyCase {
  case_id: string;
  /**
   * Opaque, deterministic identifier shared by the (up to four) snapshots of
   * the same original match. Used only for grouping and duplicate-match
   * prevention — never rendered.
   */
  match_group_id: string;
  snapshot: SurveySnapshot;
}

export interface SurveyDataset {
  dataset_version: string;
  schema_version: string;
  parser_version: string;
  case_count: number;
  cases: SurveyCase[];
}

/** Display order and labels for the five roles. */
export const ROLE_ORDER: readonly RoleKey[] = [
  'TOP',
  'JUNGLE',
  'MIDDLE',
  'BOTTOM',
  'UTILITY',
];

export const ROLE_LABELS: Record<RoleKey, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'Bot',
  UTILITY: 'Support',
};
