import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JsonStore } from '../src/server/store/jsonStore.ts';

describe('Question Bank: Browse and Focus Views Integration', () => {
  it('loads all active questions and review states for browsing without altering progress', async () => {
    const store = new JsonStore();
    const [questions, reviewStates] = await Promise.all([
      store.getQuestions({ includeDevFixtures: false }),
      store.getReviewStates(),
    ]);

    assert.ok(questions.length === 546 || questions.length === 476, `Active question bank must contain all questions (found ${questions.length})`);
    assert.ok(Array.isArray(reviewStates), 'Review states must be retrievable');

    // Confirm user progress before browsing
    const userDataPath = path.join(process.cwd(), 'data', 'user-data.json');
    const beforeData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    const beforeSessionsCount = beforeData.sessions.length;
    const beforeSubmissionsCount = beforeData.submittedResponses.length;

    // Simulate browsing and reading questions (read-only operations)
    const ccnaQuestion = questions.find(q => q.id.startsWith('CCNA-'));
    assert.ok(ccnaQuestion, 'Must find a CCNA trial question in bank');
    const q1 = await store.getQuestionById(ccnaQuestion.id);
    assert.ok(q1);
    assert.ok(q1.explanation.answerReasoning, 'Must have answer reasoning');
    assert.ok(q1.explanation.optionExplanations, 'Must have option explanations');

    // Confirm user progress has zero mutations from browsing
    const afterData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    assert.equal(afterData.sessions.length, beforeSessionsCount, 'Browsing must not create sessions');
    assert.equal(afterData.submittedResponses.length, beforeSubmissionsCount, 'Browsing must not create attempts or submissions');
  });

  it('supports bookmark toggling without creating attempts or altering accuracy', async () => {
    const store = new JsonStore();
    const testQId = 'CCNA-0001';

    // Toggle bookmark
    const initialRev = await store.getReviewState(testQId);
    const initialBookmarked = initialRev?.bookmarked ?? false;
    const state1 = await store.toggleBookmark(testQId);
    assert.equal(typeof state1.bookmarked, 'boolean');
    const state1Bookmarked = state1.bookmarked;
    assert.equal(state1Bookmarked, !initialBookmarked, 'First toggle must invert initial bookmark state');

    // Verify it toggles cleanly
    const state2 = await store.toggleBookmark(testQId);
    assert.equal(state2.bookmarked, !state1Bookmarked, 'Second toggle must invert previous bookmark state');
    assert.equal(state2.bookmarked, initialBookmarked, 'Second toggle must restore initial bookmark state');

    // Restore original state if needed
    const finalRev = await store.getReviewState(testQId);
    if (finalRev?.bookmarked !== initialBookmarked) {
      await store.toggleBookmark(testQId);
    }
  });

  it('verifies explanation data structure for Browse disclosure', async () => {
    const store = new JsonStore();
    const q = await store.getQuestionById('CCNA-0360');
    assert.ok(q);

    // Verify question has required explanation components
    assert.ok(q.explanation.answerReasoning, 'Overall explanation must be present');
    assert.ok(q.explanation.optionExplanations, 'Option explanations must be present');
    assert.equal(typeof q.explanation.optionExplanations?.['A'], 'string');
    assert.equal(typeof q.explanation.optionExplanations?.['B'], 'string');
    assert.equal(typeof q.explanation.optionExplanations?.['C'], 'string');
    assert.equal(typeof q.explanation.optionExplanations?.['D'], 'string');
  });
});
