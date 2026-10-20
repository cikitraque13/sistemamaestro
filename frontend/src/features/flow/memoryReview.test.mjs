import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapMemoryReviewGroups,
  parseMemoryReviewError,
  questionHasMemoryReview
} from './memoryReview.mjs';

test('parses conflict groups without retaining answer text or arbitrary response fields', () => {
  const review = parseMemoryReviewError({
    code: 'project_memory_conflict',
    answer_text: 'must not be surfaced',
    groups: [
      { kind: 'conflict', question_ids: ['goal', 'budget'], answer: 'private' },
      { kind: 'uncertain', question_ids: ['market'] }
    ]
  });

  assert.deepEqual(review, {
    code: 'project_memory_conflict',
    groups: [
      { kind: 'conflict', questionIds: ['goal', 'budget'] },
      { kind: 'uncertain', questionIds: ['market'] }
    ]
  });
  assert.equal(JSON.stringify(review).includes('private'), false);
});

test('maps every returned ID only to current authorized questions and leaves unknown IDs unmapped', () => {
  const groups = parseMemoryReviewError({
    code: 'project_memory_uncertain',
    groups: [{ kind: 'uncertain', question_ids: ['goal', 'legacy'] }]
  }).groups;
  const mapped = mapMemoryReviewGroups(groups, [{ id: 'goal', question: 'Current goal?' }]);

  assert.deepEqual(mapped, [{
    kind: 'uncertain',
    mappedQuestions: [{ id: 'goal', question: 'Current goal?' }],
    unmappedIds: ['legacy']
  }]);
  assert.equal(questionHasMemoryReview(groups, 'goal'), true);
  assert.equal(questionHasMemoryReview(groups, 'budget'), false);
});

test('recognizes only stable memory review error codes', () => {
  assert.equal(parseMemoryReviewError({ code: 'unknown_error', message: 'hidden' }), null);
  assert.deepEqual(parseMemoryReviewError({ code: 'memory_review_legacy_unmapped', question_ids: ['old-id'] }), {
    code: 'memory_review_legacy_unmapped',
    questionIds: ['old-id']
  });
  assert.deepEqual(parseMemoryReviewError({ code: 'stale_project_revision', detail: 'ignored' }), {
    code: 'stale_project_revision'
  });
});
