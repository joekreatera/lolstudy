/**
 * Submits one completed survey to FastAPI and returns the scored result.
 *
 * Same-origin by design: the path is relative, so Vite proxies `/api` in
 * development and Nginx proxies it in production. There is no API base URL to
 * configure and no CORS preflight.
 *
 * Validation is a small handwritten check of the response shape, matching the
 * style of surveyDataset.ts — no Zod or other schema dependency.
 */

import type {
  SubmissionResult,
  SurveySubmission,
} from '../types/submission.ts';

/** A failure the participant can sensibly retry (network, timeout, 5xx). */
export class SubmissionError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'SubmissionError';
    this.retryable = retryable;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateResult(raw: unknown): SubmissionResult {
  if (!isObject(raw)) {
    throw new SubmissionError('server returned an unexpected response', false);
  }
  const score = raw['score'];
  const results = raw['results'];
  if (!isObject(score) || !Array.isArray(results)) {
    throw new SubmissionError('server response is missing the score', false);
  }
  for (const key of ['answered', 'correct', 'incorrect']) {
    if (typeof score[key] !== 'number') {
      throw new SubmissionError(`server score is missing "${key}"`, false);
    }
  }
  for (const row of results) {
    if (!isObject(row)) {
      throw new SubmissionError(
        'server returned a malformed result row',
        false
      );
    }
    if (
      typeof row['question_order'] !== 'number' ||
      typeof row['case_id'] !== 'string' ||
      typeof row['correct'] !== 'boolean' ||
      (row['predicted_winner'] !== 'blue' &&
        row['predicted_winner'] !== 'red') ||
      (row['winning_team'] !== 'blue' && row['winning_team'] !== 'red')
    ) {
      throw new SubmissionError(
        'server returned a malformed result row',
        false
      );
    }
  }
  return raw as unknown as SubmissionResult;
}

export async function submitSurvey(
  submission: SurveySubmission,
  signal?: AbortSignal
): Promise<SubmissionResult> {
  let response: Response;
  try {
    response = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
      signal,
    });
  } catch (cause) {
    // Network-level failure: nothing reached the server, so retrying is safe.
    throw new SubmissionError(
      `could not reach the server: ${(cause as Error).message}`,
      true
    );
  }

  if (response.ok) {
    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch (cause) {
      throw new SubmissionError(
        `server response was not valid JSON: ${(cause as Error).message}`,
        false
      );
    }
    return validateResult(parsed);
  }

  // 409: this response_id was already stored with different content. Retrying
  // the same payload cannot fix it, so it is not retryable.
  if (response.status === 409) {
    throw new SubmissionError(
      'this survey was already submitted with different answers',
      false
    );
  }

  // 4xx other than 409 means the payload itself is unacceptable.
  if (response.status >= 400 && response.status < 500) {
    throw new SubmissionError(
      `the server rejected the submission (HTTP ${response.status})`,
      false
    );
  }

  // 5xx: the server may recover; the same submission can be retried safely
  // because response_id makes the write idempotent.
  throw new SubmissionError(
    `the server could not save the submission (HTTP ${response.status})`,
    true
  );
}
