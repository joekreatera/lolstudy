/**
 * Pure client-side selection of the cases a participant will answer.
 *
 * Guarantees:
 *   - exactly `count` cases (default 10);
 *   - `count` distinct match_group_id values (never two snapshots from the same
 *     match);
 *   - the cutoff minute varies naturally, because one snapshot is chosen at
 *     random per selected match;
 *   - the source array is never mutated;
 *   - an unbiased Fisher–Yates shuffle (never `.sort(() => Math.random()-0.5)`).
 *
 * Selection is random per participant. This does NOT guarantee identical total
 * exposure for every case across all participants; for the initial one-week
 * study, random assignment is sufficient. Do not add backend assignment unless
 * later evidence shows it is necessary.
 */

import { CASES_PER_PARTICIPANT } from '../content.ts';
import type { SurveyCase } from '../types/dataset.ts';

export class SelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SelectionError';
  }
}

/** Returns a random number in [0, 1). Injectable for deterministic tests. */
export type Rng = () => number;

/** In-place Fisher–Yates shuffle on a copy-owned array. */
function shuffleInPlace<T>(array: T[], rng: Rng): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

export function selectSurveyCases(
  cases: readonly SurveyCase[],
  count: number = CASES_PER_PARTICIPANT,
  rng: Rng = Math.random
): SurveyCase[] {
  // 1. Group cases by match_group_id (without mutating the source).
  const groups = new Map<string, SurveyCase[]>();
  for (const c of cases) {
    const existing = groups.get(c.match_group_id);
    if (existing) {
      existing.push(c);
    } else {
      groups.set(c.match_group_id, [c]);
    }
  }

  if (groups.size < count) {
    throw new SelectionError(
      `not enough unique matches: need ${count}, have ${groups.size}`
    );
  }

  // 2. Shuffle the unique match groups and take the first `count`.
  const groupIds = shuffleInPlace([...groups.keys()], rng).slice(0, count);

  // 3. Pick one random snapshot from each selected match.
  const selected: SurveyCase[] = groupIds.map((groupId) => {
    const groupCases = groups.get(groupId)!;
    const pick = Math.floor(rng() * groupCases.length);
    return groupCases[pick];
  });

  // 4. Shuffle the result to avoid ordering artifacts.
  shuffleInPlace(selected, rng);

  // 5. Verify invariants defensively.
  if (selected.length !== count) {
    throw new SelectionError(
      `expected ${count} cases, produced ${selected.length}`
    );
  }
  const uniqueGroups = new Set(selected.map((c) => c.match_group_id));
  if (uniqueGroups.size !== count) {
    throw new SelectionError(
      'selected cases contain a duplicate match_group_id'
    );
  }
  const uniqueCaseIds = new Set(selected.map((c) => c.case_id));
  if (uniqueCaseIds.size !== count) {
    throw new SelectionError('selected cases contain a duplicate case_id');
  }

  return selected;
}
