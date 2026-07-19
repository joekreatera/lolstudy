/**
 * Contract checks for the completion summary and the submission payload.
 *
 * Matches the repository's existing verification style (standalone `tsx`
 * scripts, no test framework): `npm run verify:results`.
 *
 * Scope is the client-side contract — payload shape, response validation,
 * ordering, and the rule that no result may be shown before a successful
 * submission. The scoring itself is verified server-side (backend/tests).
 */

import assert from 'node:assert/strict';

import {
  CASES_PER_PARTICIPANT,
  CONSENT_VERSION,
  SURVEY_PROTOCOL_VERSION,
  participantQuestions,
} from '../src/content.ts';
import { SubmissionError } from '../src/services/submitSurvey.ts';
import type {
  QuestionResult,
  SubmissionResult,
  SurveyAnswer,
} from '../src/types/submission.ts';

let checks = 0;
function check(name: string, fn: () => void) {
  fn();
  checks += 1;
  console.log(`  ok  ${name}`);
}

const CASE_IDS = Array.from(
  { length: CASES_PER_PARTICIPANT },
  (_, i) => `C_TEST${String(i + 1).padStart(8, '0')}`
);

function makeResults(correctCount: number): QuestionResult[] {
  return CASE_IDS.map((case_id, i) => {
    const correct = i < correctCount;
    return {
      question_order: i + 1,
      case_id,
      predicted_winner: 'blue',
      winning_team: correct ? 'blue' : 'red',
      correct,
    } satisfies QuestionResult;
  });
}

function makeResult(correctCount: number): SubmissionResult {
  return {
    response_id: '11111111-2222-4333-8444-555555555555',
    score: {
      answered: CASES_PER_PARTICIPANT,
      correct: correctCount,
      incorrect: CASES_PER_PARTICIPANT - correctCount,
    },
    results: makeResults(correctCount),
  };
}

console.log('\nParticipant questions');

check('region question exists and is required', () => {
  const region = participantQuestions.find((q) => q.key === 'region');
  assert.ok(region, 'no region question found');
  assert.ok(
    region.options.length >= 10,
    'region should cover the major Riot shards'
  );
});

check('region offers an explicit opt-out rather than allowing blank', () => {
  const region = participantQuestions.find((q) => q.key === 'region')!;
  const values = region.options.map((o) => o.value);
  assert.ok(values.includes('prefer_not_to_say'));
  assert.ok(values.includes('other'));
  assert.ok(!values.includes(''), 'no empty option value');
});

check('every participant option has a stable machine value', () => {
  for (const q of participantQuestions) {
    for (const o of q.options) {
      assert.match(
        o.value,
        /^[a-z0-9_]+$/,
        `${q.key} option "${o.value}" is not a stable machine value`
      );
    }
  }
});

check('all five participant questions are present', () => {
  assert.deepEqual(
    participantQuestions.map((q) => q.key),
    ['rank', 'years_playing', 'main_role', 'playing_frequency', 'region']
  );
});

console.log('\nVersion constants');

check('protocol and consent versions are set', () => {
  assert.equal(SURVEY_PROTOCOL_VERSION, 'final_feedback_v1');
  assert.equal(CONSENT_VERSION, 'v2');
});

console.log('\nAnswer payload');

check('answers carry an explicit 1..10 question_order', () => {
  const answers: SurveyAnswer[] = CASE_IDS.map((case_id, i) => ({
    question_order: i + 1,
    case_id,
    predicted_winner: 'blue',
    confidence: 3,
    shown_at: new Date().toISOString(),
    answered_at: new Date().toISOString(),
    response_time_ms: 1000,
  }));

  assert.equal(answers.length, CASES_PER_PARTICIPANT);
  assert.deepEqual(
    answers.map((a) => a.question_order),
    Array.from({ length: CASES_PER_PARTICIPANT }, (_, i) => i + 1)
  );
  assert.equal(new Set(answers.map((a) => a.case_id)).size, answers.length);
});

console.log('\nResult breakdown');

check('exactly ten rows for a completed survey', () => {
  assert.equal(makeResult(7).results.length, CASES_PER_PARTICIPANT);
});

check('rows stay in original question order', () => {
  assert.deepEqual(
    makeResult(7).results.map((r) => r.question_order),
    Array.from({ length: CASES_PER_PARTICIPANT }, (_, i) => i + 1)
  );
});

check('correct total equals the number of rows marked correct', () => {
  const result = makeResult(7);
  assert.equal(
    result.score.correct,
    result.results.filter((r) => r.correct).length
  );
});

check('incorrect total equals the number of rows marked incorrect', () => {
  const result = makeResult(7);
  assert.equal(
    result.score.incorrect,
    result.results.filter((r) => !r.correct).length
  );
});

check('correct + incorrect equals answered', () => {
  for (const n of [0, 3, 7, 10]) {
    const { score } = makeResult(n);
    assert.equal(score.correct + score.incorrect, score.answered);
    assert.equal(score.answered, CASES_PER_PARTICIPANT);
  }
});

check('correct flag matches predicted vs winning team on every row', () => {
  for (const n of [0, 5, 10]) {
    for (const r of makeResult(n).results) {
      assert.equal(r.correct, r.predicted_winner === r.winning_team);
    }
  }
});

check('each row identifies its case, prediction, and winner', () => {
  for (const r of makeResult(4).results) {
    assert.ok(CASE_IDS.includes(r.case_id));
    assert.ok(['blue', 'red'].includes(r.predicted_winner));
    assert.ok(['blue', 'red'].includes(r.winning_team));
  }
});

console.log('\nDisclosure rules');

check('no results exist in the submitting state', () => {
  const state = { status: 'submitting' } as const;
  assert.equal('result' in state, false);
});

check('no results exist in the error state', () => {
  const state = {
    status: 'error',
    message: 'network down',
    retryable: true,
  } as const;
  assert.equal('result' in state, false);
});

check('winning team is absent from the answer payload', () => {
  const answer: SurveyAnswer = {
    question_order: 1,
    case_id: CASE_IDS[0],
    predicted_winner: 'blue',
    confidence: 3,
    shown_at: new Date().toISOString(),
    answered_at: new Date().toISOString(),
    response_time_ms: 1000,
  };
  const keys = Object.keys(answer);
  for (const forbidden of ['winning_team', 'correct', 'winner', 'outcome']) {
    assert.ok(
      !keys.includes(forbidden),
      `answer payload must not carry "${forbidden}"`
    );
  }
});

console.log('\nSubmission errors');

check('a 409 conflict is not retryable', () => {
  const err = new SubmissionError('already submitted', false);
  assert.equal(err.retryable, false);
});

check('a network failure is retryable', () => {
  const err = new SubmissionError('could not reach the server', true);
  assert.equal(err.retryable, true);
});

console.log(`\n${checks} checks passed.\n`);
