/**
 * Central Data Dragon (public static CDN) asset URL construction.
 *
 * The version used for every asset is the snapshot's own
 * `metadata.item_catalog_version`, which the exporter records as the exact
 * Data Dragon catalog the case was built against. This guarantees each
 * champion and item exists in the referenced version (verified against the
 * live CDN: new champions 403 in older versions and vice versa).
 *
 * No Riot API calls, no API keys, no runtime champion.json fetch — only
 * versioned, immutable, browser-cached image URLs.
 */

import type { QueueRank } from '../types/dataset.ts';

const DDRAGON_CDN = 'https://ddragon.leagueoflegends.com/cdn';

/** The ten Solo/Duo tiers that have an official ranked emblem. */
export type RankedTier =
  | 'IRON'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'EMERALD'
  | 'DIAMOND'
  | 'MASTER'
  | 'GRANDMASTER'
  | 'CHALLENGER';

/**
 * Locally bundled emblems (`frontend/public/rank-emblems/`), taken from Riot's
 * official `ranked-emblems-latest.zip` "Rank=<Tier>" set — the only variant in
 * that package covering all ten tiers in one consistent style. Never hotlinked.
 *
 * The source files place each emblem on a 1000x1000 canvas with very different
 * amounts of transparent padding (Iron fills 38% of the height, Challenger
 * 78%), which would have made higher tiers render visibly larger. The bundled
 * files therefore have that empty padding cropped and the artwork uniformly
 * scaled onto one 128x128 canvas, so every tier occupies the same box. No
 * pixel is recolored or distorted.
 */
const RANK_EMBLEM_TIERS = new Set<string>([
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'EMERALD',
  'DIAMOND',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER',
]);

/**
 * Local emblem URL for a tier name, or `null` for a missing/unknown tier.
 * Purely a lookup: it derives no ordering, comparison, or aggregate.
 */
export function rankEmblemUrlForTier(tier: string | null): string | null {
  if (!tier) return null;
  const key = tier.toUpperCase();
  if (!RANK_EMBLEM_TIERS.has(key)) return null;
  return `/rank-emblems/${key.toLowerCase()}.png`;
}

/**
 * Local emblem URL for ONE ranked queue, resolved independently of any other
 * queue. Returns `null` when the player has no entry in that queue (the
 * official package has no neutral emblem — Iron must never stand in for
 * Unranked), or when the tier is unrecognized.
 *
 * Reads the structured `tier` field only — never parsed from `display`.
 */
export function rankEmblemUrl(queueRank: QueueRank | null): string | null {
  return rankEmblemUrlForTier(queueRank ? queueRank.tier : null);
}

/**
 * Dataset champion IDs whose Data Dragon *asset filename* differs. Verified:
 * `FiddleSticks.png` returns 403; the CDN file is `Fiddlesticks.png`.
 */
const CHAMPION_ASSET_ID_FIXES: Record<string, string> = {
  FiddleSticks: 'Fiddlesticks',
};

/**
 * Dataset champion IDs whose human display name is not derivable by splitting
 * camel case (apostrophes, renames, punctuation).
 */
const CHAMPION_DISPLAY_NAMES: Record<string, string> = {
  MonkeyKing: 'Wukong',
  DrMundo: 'Dr. Mundo',
  Kaisa: "Kai'Sa",
  Khazix: "Kha'Zix",
  Chogath: "Cho'Gath",
  RekSai: "Rek'Sai",
  KogMaw: "Kog'Maw",
  Velkoz: "Vel'Koz",
  Leblanc: 'LeBlanc',
  KSante: "K'Sante",
  Belveth: "Bel'Veth",
  Renata: 'Renata Glasc',
  Nunu: 'Nunu & Willump',
  FiddleSticks: 'Fiddlesticks',
};

/** Readable labels for the platforms present in the dataset. */
const PLATFORM_LABELS: Record<string, string> = {
  EUW1: 'EUW',
  KR: 'KR',
  NA1: 'NA',
  LA1: 'LAN',
};

/** Champion icon URL for the given Data Dragon version. */
export function championIconUrl(version: string, championId: string): string {
  const assetId = CHAMPION_ASSET_ID_FIXES[championId] ?? championId;
  return `${DDRAGON_CDN}/${version}/img/champion/${assetId}.png`;
}

/** Item icon URL for the given Data Dragon version. */
export function itemIconUrl(version: string, itemId: number): string {
  return `${DDRAGON_CDN}/${version}/img/item/${itemId}.png`;
}

/** Summoner's Rift minimap image for the given Data Dragon version. */
export function minimapUrl(version: string): string {
  return `${DDRAGON_CDN}/${version}/img/map/map11.png`;
}

/**
 * Human display name for a dataset champion ID. Known special cases first,
 * then a camel-case split fallback ("TwistedFate" → "Twisted Fate",
 * "JarvanIV" → "Jarvan IV").
 */
export function championDisplayName(championId: string): string {
  const special = CHAMPION_DISPLAY_NAMES[championId];
  if (special) return special;
  return championId.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/** Short initials for the neutral fallback block when an icon fails. */
export function championInitials(championId: string): string {
  const words = championDisplayName(championId).split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return championDisplayName(championId).slice(0, 2);
}

/** Readable region label from the dataset platform code. */
export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}
