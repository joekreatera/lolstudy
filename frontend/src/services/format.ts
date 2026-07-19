/** Small neutral formatting helpers shared by the snapshot components. */

import type { PublicRank, QueueRank } from '../types/dataset.ts';

/** 40144 → "40,144". */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Queue labels. Both queues are always named explicitly in the UI. */
export const QUEUE_LABELS = { solo_duo: 'Solo/Duo', flex: 'Flex' } as const;

export type QueueKey = keyof typeof QUEUE_LABELS;

/** Shown when a whole rank lookup failed (defensive; absent from current data). */
export const RANK_UNAVAILABLE_TEXT = 'Rank unavailable';

/** Shown when the player has no entry in that specific ranked queue. */
export const QUEUE_UNRANKED_TEXT = 'Unranked';

/**
 * One queue's standing as a neutral line:
 *   ranked   → "Emerald IV · 85 LP" / "Challenger · 3,155 LP"
 *   no entry → "Unranked"
 *
 * Always uses the upstream-normalized `display`, which correctly omits the
 * division for apex tiers ("Master", not "Master I"). Never derives a tier
 * ordering, comparison, or aggregate.
 */
export function formatQueueRank(queueRank: QueueRank | null): string {
  if (!queueRank) return QUEUE_UNRANKED_TEXT;
  return `${queueRank.display} · ${formatNumber(queueRank.lp)} LP`;
}

/**
 * Raw win/loss record: "W: 123 · L: 98" (grouped thousands, e.g. "W: 1,204").
 * Returns null when there is no ranked entry — a missing record is never
 * rendered as "W: 0 · L: 0". No rate, ratio, or total is ever computed.
 */
export function formatQueueRecord(queueRank: QueueRank | null): string | null {
  if (!queueRank) return null;
  return `W: ${formatNumber(queueRank.wins)} · L: ${formatNumber(queueRank.losses)}`;
}

/**
 * The leading label for one queue row, e.g. "Solo/Duo:" — always explicit so
 * neither queue can be mistaken for the other.
 */
export function formatQueueLabel(queue: QueueKey): string {
  return `${QUEUE_LABELS[queue]}:`;
}

/**
 * Text for one queue row when the whole lookup is unavailable vs. per-queue.
 * Kept here so no component re-implements the rank/unranked wording.
 */
export function formatQueueStanding(rank: PublicRank, queue: QueueKey): string {
  if (!rank.available) return RANK_UNAVAILABLE_TEXT;
  return formatQueueRank(rank[queue]);
}

/**
 * Signed difference with the fixed Blue − Red convention: 1935 → "+1,935",
 * -42 → "−42", 0 → "0". Optional fixed decimals for averages.
 */
export function formatSigned(value: number, decimals = 0): string {
  const abs = Math.abs(value);
  const text =
    decimals > 0 ? abs.toFixed(decimals) : abs.toLocaleString('en-US');
  if (value > 0) return `+${text}`;
  if (value < 0) return `−${text}`;
  return decimals > 0 ? value.toFixed(decimals) : '0';
}

/** Milliseconds → "m:ss" (228681 → "3:48"). */
export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
