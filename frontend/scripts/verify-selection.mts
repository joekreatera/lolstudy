/**
 * Deterministic verification of the pure selection + validation logic.
 * Run with: npm run verify   (uses tsx; no browser, no test framework).
 *
 * Exits non-zero on the first failed assertion.
 */

import {
  selectSurveyCases,
  SelectionError,
} from '../src/services/selectSurveyCases.ts';
import {
  validateDataset,
  DatasetValidationError,
} from '../src/services/surveyDataset.ts';
import type { SurveyCase, SurveyDataset } from '../src/types/dataset.ts';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean): void {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.error(`  FAIL ${name}`);
  }
}

function expectThrow(name: string, fn: () => unknown, type: Function): void {
  try {
    fn();
    failed++;
    console.error(`  FAIL ${name} (expected throw, none thrown)`);
  } catch (err) {
    check(name, err instanceof type);
  }
}

/** A small seeded RNG (mulberry32) so selection is deterministic in tests. */
function seededRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Minimal snapshot that satisfies the shallow structural validator. Deep
 * content is irrelevant to selection/validation logic under test.
 */
function makeSnapshot(cutoffMinute: number): SurveyCase['snapshot'] {
  return {
    metadata: {
      cutoff_minute: cutoffMinute,
      item_catalog_version: '16.13.1',
    },
    blue_team: {},
    red_team: {},
    participants: [],
    role_matchups: {},
    events_until_cutoff: [],
    team_diffs: {},
    quality_flags: [],
  } as unknown as SurveyCase['snapshot'];
}

function makeCases(numMatches: number, snapsPerMatch = 4): SurveyCase[] {
  const cutoffs = [5, 10, 15, 20];
  const cases: SurveyCase[] = [];
  for (let m = 0; m < numMatches; m++) {
    const group = `M_${m.toString(16).padStart(12, '0').toUpperCase()}`;
    for (let s = 0; s < snapsPerMatch; s++) {
      cases.push({
        case_id: `C_${m}_${s}`,
        match_group_id: group,
        snapshot: makeSnapshot(cutoffs[s % 4]),
      });
    }
  }
  return cases;
}

function makeDataset(cases: SurveyCase[]): SurveyDataset {
  return {
    dataset_version: 'test_v1',
    schema_version: '0.6.0',
    parser_version: '0.6.1',
    case_count: cases.length,
    cases,
  };
}

// --- Selection --------------------------------------------------------------
console.log('selectSurveyCases:');
{
  const source = makeCases(25);
  const before = JSON.stringify(source);
  const selected = selectSurveyCases(source, 10, seededRng(42));

  check('returns exactly 10 cases', selected.length === 10);
  check(
    'returns 10 unique match_group_id values',
    new Set(selected.map((c) => c.match_group_id)).size === 10
  );
  check(
    'returns 10 unique case_id values',
    new Set(selected.map((c) => c.case_id)).size === 10
  );
  check('does not mutate the source array', JSON.stringify(source) === before);
  check('source length unchanged', source.length === 100);

  const again = selectSurveyCases(source, 10, seededRng(42));
  check(
    'same seed produces same selection (deterministic)',
    JSON.stringify(again.map((c) => c.case_id)) ===
      JSON.stringify(selected.map((c) => c.case_id))
  );

  // Repeated runs across many seeds must always hold the invariants.
  let invariantsHold = true;
  for (let seed = 0; seed < 200; seed++) {
    const s = selectSurveyCases(source, 10, seededRng(seed));
    if (
      s.length !== 10 ||
      new Set(s.map((c) => c.match_group_id)).size !== 10
    ) {
      invariantsHold = false;
      break;
    }
  }
  check('invariants hold across 200 seeds', invariantsHold);
}

expectThrow(
  'throws when fewer than 10 unique matches exist',
  () => selectSurveyCases(makeCases(9), 10, seededRng(1)),
  SelectionError
);

// --- Validation -------------------------------------------------------------
console.log('validateDataset:');
{
  const valid = makeDataset(makeCases(12));
  const result = validateDataset(valid);
  check('accepts a valid dataset', result.cases.length === 48);
}

expectThrow(
  'rejects a non-object root',
  () => validateDataset(42),
  DatasetValidationError
);
expectThrow(
  'rejects case_count / cases length mismatch',
  () => validateDataset({ ...makeDataset(makeCases(12)), case_count: 999 }),
  DatasetValidationError
);
expectThrow(
  'rejects a case missing match_group_id',
  () => {
    const ds = makeDataset(makeCases(12)) as unknown as {
      cases: Record<string, unknown>[];
    };
    delete ds.cases[0].match_group_id;
    validateDataset(ds);
  },
  DatasetValidationError
);
expectThrow(
  'rejects a case with empty case_id',
  () => {
    const ds = makeDataset(makeCases(12));
    ds.cases[0].case_id = '';
    validateDataset(ds);
  },
  DatasetValidationError
);
expectThrow(
  'rejects a case missing snapshot',
  () => {
    const ds = makeDataset(makeCases(12)) as unknown as {
      cases: Record<string, unknown>[];
    };
    delete ds.cases[0].snapshot;
    validateDataset(ds);
  },
  DatasetValidationError
);
expectThrow(
  'rejects duplicate case_id',
  () => {
    const ds = makeDataset(makeCases(12));
    ds.cases[1].case_id = ds.cases[0].case_id;
    validateDataset(ds);
  },
  DatasetValidationError
);
expectThrow(
  'rejects fewer than 10 unique match groups',
  () => validateDataset(makeDataset(makeCases(9))),
  DatasetValidationError
);

// --- Result -----------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
