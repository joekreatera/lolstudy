/**
 * Loads and validates the public survey dataset (`/survey_cases.json`).
 *
 * Validation is a small handwritten runtime validator — no Zod or other schema
 * dependency. The dataset is fetched exactly once; the caller holds the result
 * in React state and never refetches.
 */

import { CASES_PER_PARTICIPANT } from '../content.ts';
import type {
  SurveyCase,
  SurveyDataset,
  SurveySnapshot,
} from '../types/dataset.ts';

export class DatasetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatasetValidationError';
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  container: Record<string, unknown>,
  field: string,
  where: string
): string {
  const value = container[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new DatasetValidationError(`${where}: missing or empty "${field}"`);
  }
  return value;
}

/**
 * Shallow structural check of one snapshot: the eight required sections with
 * the right container types, plus the two metadata fields the UI depends on
 * everywhere (cutoff minute, asset version). Rendering components still guard
 * deeper optional values themselves.
 */
function validateSnapshot(
  snapshot: Record<string, unknown>,
  where: string
): SurveySnapshot {
  const metadata = snapshot['metadata'];
  if (!isObject(metadata)) {
    throw new DatasetValidationError(`${where}: missing "metadata" object`);
  }
  const cutoff = metadata['cutoff_minute'];
  if (typeof cutoff !== 'number' || !Number.isFinite(cutoff)) {
    throw new DatasetValidationError(
      `${where}: metadata.cutoff_minute must be a number`
    );
  }
  requireString(metadata, 'item_catalog_version', `${where}: metadata`);

  if (!isObject(snapshot['blue_team'])) {
    throw new DatasetValidationError(`${where}: missing "blue_team" object`);
  }
  if (!isObject(snapshot['red_team'])) {
    throw new DatasetValidationError(`${where}: missing "red_team" object`);
  }
  if (!Array.isArray(snapshot['participants'])) {
    throw new DatasetValidationError(
      `${where}: "participants" must be an array`
    );
  }
  if (!isObject(snapshot['role_matchups'])) {
    throw new DatasetValidationError(
      `${where}: missing "role_matchups" object`
    );
  }
  if (!Array.isArray(snapshot['events_until_cutoff'])) {
    throw new DatasetValidationError(
      `${where}: "events_until_cutoff" must be an array`
    );
  }
  if (!isObject(snapshot['team_diffs'])) {
    throw new DatasetValidationError(`${where}: missing "team_diffs" object`);
  }
  if (!Array.isArray(snapshot['quality_flags'])) {
    throw new DatasetValidationError(
      `${where}: "quality_flags" must be an array`
    );
  }

  // Deeper field access is typed (types/dataset.ts) and guarded in components.
  return snapshot as unknown as SurveySnapshot;
}

/**
 * Validate an already-parsed JSON value into a typed SurveyDataset, or throw a
 * DatasetValidationError with a clear, participant-safe message.
 */
export function validateDataset(raw: unknown): SurveyDataset {
  if (!isObject(raw)) {
    throw new DatasetValidationError('dataset root is not a JSON object');
  }

  const dataset_version = requireString(raw, 'dataset_version', 'dataset');
  const schema_version = requireString(raw, 'schema_version', 'dataset');
  const parser_version = requireString(raw, 'parser_version', 'dataset');

  const case_count = raw['case_count'];
  if (typeof case_count !== 'number' || !Number.isInteger(case_count)) {
    throw new DatasetValidationError(
      'dataset: "case_count" must be an integer'
    );
  }

  const rawCases = raw['cases'];
  if (!Array.isArray(rawCases)) {
    throw new DatasetValidationError('dataset: "cases" must be an array');
  }
  if (rawCases.length !== case_count) {
    throw new DatasetValidationError(
      `dataset: case_count (${case_count}) does not match cases length (${rawCases.length})`
    );
  }

  const seenCaseIds = new Set<string>();
  const groupIds = new Set<string>();
  const cases: SurveyCase[] = [];

  rawCases.forEach((rawCase, index) => {
    const where = `case #${index}`;
    if (!isObject(rawCase)) {
      throw new DatasetValidationError(`${where}: not a JSON object`);
    }
    const case_id = requireString(rawCase, 'case_id', where);
    const match_group_id = requireString(rawCase, 'match_group_id', where);

    const rawSnapshot = rawCase['snapshot'];
    if (!isObject(rawSnapshot)) {
      throw new DatasetValidationError(
        `${where}: missing or invalid "snapshot"`
      );
    }
    const snapshot = validateSnapshot(rawSnapshot, where);

    if (seenCaseIds.has(case_id)) {
      throw new DatasetValidationError(`duplicate case_id "${case_id}"`);
    }
    seenCaseIds.add(case_id);
    groupIds.add(match_group_id);

    cases.push({ case_id, match_group_id, snapshot });
  });

  if (groupIds.size < CASES_PER_PARTICIPANT) {
    throw new DatasetValidationError(
      `dataset has only ${groupIds.size} unique match_group_id value(s); ` +
        `at least ${CASES_PER_PARTICIPANT} are required to build a survey`
    );
  }

  return { dataset_version, schema_version, parser_version, case_count, cases };
}

/**
 * Fetch `/survey_cases.json` once, check the HTTP status, parse, and validate.
 * Throws DatasetValidationError (validation) or Error (network/parse).
 */
export async function loadSurveyDataset(
  signal?: AbortSignal
): Promise<SurveyDataset> {
  const response = await fetch('/survey_cases.json', { signal });
  if (!response.ok) {
    throw new Error(
      `failed to load survey dataset: HTTP ${response.status} ${response.statusText}`
    );
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch (cause) {
    throw new Error(
      `survey dataset is not valid JSON: ${(cause as Error).message}`
    );
  }

  return validateDataset(parsed);
}
