import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JsonStore } from '../src/server/store/jsonStore.ts';
import { markQuestion } from '../src/domain/marking.ts';
import { importEthernet70 } from '../scripts/import_ethernet_70.mjs';
import type { SingleChoicePayload, MultiChoicePayload, MatchingPayload } from '../src/domain/types.ts';

describe('CCNA Revise: Ethernet Concepts 70 Questions Single Import Verification', () => {
  it('imports exactly 70 unique Ethernet module questions and verifies counts', async () => {
    const result = await importEthernet70();
    assert.equal(result.importedCount, 70, 'Must import exactly 70 questions');
    assert.equal(result.uniqueIdsCount, 70, 'All 70 question IDs must be unique');
    assert.equal(result.totalActiveQuestions, 546, 'Total active questions must be 546 (476 existing + 70 new)');

    const store = new JsonStore();
    const activeQuestions = await store.getQuestions({ includeDevFixtures: false });
    assert.equal(activeQuestions.length, 546, 'Store must return exactly 546 active questions');

    const ethernetQuestions = activeQuestions.filter(q => q.id.startsWith('ITN-M4-7-'));
    assert.equal(ethernetQuestions.length, 70, 'Must contain all 70 Ethernet Concepts questions');

    const ids = new Set(activeQuestions.map(q => q.id));
    assert.equal(ids.size, 546, 'All 546 question IDs must be globally unique');
  });

  it('confirms 10 excluded source questions are absent', async () => {
    const store = new JsonStore();
    const excludedIds = [
      'ITN-M4-7-035',
      'ITN-M4-7-047',
      'ITN-M4-7-052',
      'ITN-M4-7-055',
      'ITN-M4-7-070',
      'ITN-M4-7-072',
      'ITN-M4-7-073',
      'ITN-M4-7-076',
      'ITN-M4-7-077',
      'ITN-M4-7-079',
    ];

    for (const exId of excludedIds) {
      const q = await store.getQuestionById(exId);
      assert.equal(q, null, `Excluded question "${exId}" must not be present in question bank`);
    }
  });

  it('verifies question type breakdown: 45 single, 24 multi, 1 matching', async () => {
    const store = new JsonStore();
    const activeQuestions = await store.getQuestions({ includeDevFixtures: false });
    const ethQuestions = activeQuestions.filter(q => q.id.startsWith('ITN-M4-7-'));

    const singles = ethQuestions.filter(q => q.type === 'single');
    const multis = ethQuestions.filter(q => q.type === 'multi');
    const matchings = ethQuestions.filter(q => q.type === 'matching');

    assert.equal(singles.length, 45, 'Must have exactly 45 single_choice questions');
    assert.equal(multis.length, 24, 'Must have exactly 24 multiple_choice questions');
    assert.equal(matchings.length, 1, 'Must have exactly 1 matching question');
  });

  it('supports variable option counts (e.g. 5 options on single choice)', async () => {
    const store = new JsonStore();
    const q4 = await store.getQuestionById('ITN-M4-7-004');
    assert.ok(q4, 'Question ITN-M4-7-004 must be present');
    assert.equal(q4.type, 'single');

    const payload = q4.payload as SingleChoicePayload;
    assert.equal(payload.options.length, 5, 'ITN-M4-7-004 must have exactly 5 options (A, B, C, D, E)');
    assert.deepEqual(
      payload.options.map(o => o.id),
      ['A', 'B', 'C', 'D', 'E'],
      'Option IDs must be A, B, C, D, E'
    );
    assert.deepEqual(payload.correctOptionIds, ['B'], 'Correct option must be B');
  });

  it('evaluates exact-set scoring for multiple-choice questions', async () => {
    const store = new JsonStore();
    const q6 = await store.getQuestionById('ITN-M4-7-006');
    assert.ok(q6);
    assert.equal(q6.type, 'multi');

    const payload = q6.payload as MultiChoicePayload;
    assert.equal(payload.options.length, 6, 'Must have 6 options');
    assert.equal(payload.requiredSelections, 3, 'Must require exactly 3 selections');
    assert.deepEqual(payload.correctOptionIds.sort(), ['A', 'C', 'D'], 'Correct answers are A, C, D');

    // 1. Exact match (order independent)
    const exactResult = markQuestion(q6, {
      type: 'multi',
      selectedOptionIds: ['D', 'A', 'C'],
    });
    assert.equal(exactResult.isCorrect, true, 'Exact set must be marked correct');

    // 2. Partial match
    const partialResult = markQuestion(q6, {
      type: 'multi',
      selectedOptionIds: ['A', 'C', 'B'],
    });
    assert.equal(partialResult.isCorrect, false, 'Partial / incorrect set must be marked incorrect');

    // 3. Different wrong option
    const wrongResult = markQuestion(q6, {
      type: 'multi',
      selectedOptionIds: ['B', 'E', 'F'],
    });
    assert.equal(wrongResult.isCorrect, false, 'Completely wrong set must be marked incorrect');
  });

  it('evaluates matching question structure and scoring', async () => {
    const store = new JsonStore();
    const q5 = await store.getQuestionById('ITN-M4-7-005');
    assert.ok(q5);
    assert.equal(q5.type, 'matching');

    const payload = q5.payload as MatchingPayload;
    assert.equal(payload.prompts.length, 6, 'Matching question must have 6 prompts');
    assert.equal(payload.choices.length, 3, 'Matching question must have 3 choices (copper, fiber, wireless)');
    assert.equal(payload.allowChoiceReuse, true, 'Choice reuse must be allowed');

    // Exact matching submission
    const correctResult = markQuestion(q5, {
      type: 'matching',
      mapping: {
        m1: 'copper',
        m2: 'copper',
        m3: 'fiber',
        m4: 'fiber',
        m5: 'wireless',
        m6: 'wireless',
      },
    });
    assert.equal(correctResult.isCorrect, true, 'Correct matching pairs must score correct');

    // Incomplete or swapped matching
    const wrongResult = markQuestion(q5, {
      type: 'matching',
      mapping: {
        m1: 'fiber', // incorrect
        m2: 'copper',
        m3: 'fiber',
        m4: 'fiber',
        m5: 'wireless',
        m6: 'wireless',
      },
    });
    assert.equal(wrongResult.isCorrect, false, 'Mismatched pair must score incorrect');
  });

  it('resolves all six question image assets and confirms valid references', async () => {
    const projectRoot = process.cwd();
    const expectedAssets = [
      'itn-m4-7-005.jpeg',
      'itn-m4-7-010.jpeg',
      'itn-m4-7-012.jpeg',
      'itn-m4-7-030.png',
      'itn-m4-7-045.png',
      'itn-m4-7-046.png',
    ];

    for (const assetFile of expectedAssets) {
      const diskPath = path.join(projectRoot, 'public', 'question-assets', 'ethernet-concepts', assetFile);
      assert.ok(fs.existsSync(diskPath), `Asset ${assetFile} must exist at ${diskPath}`);
      const stats = fs.statSync(diskPath);
      assert.ok(stats.size > 0, `Asset ${assetFile} must not be empty`);
    }

    const store = new JsonStore();
    const assetQuestionIds = [
      'ITN-M4-7-005',
      'ITN-M4-7-010',
      'ITN-M4-7-012',
      'ITN-M4-7-030',
      'ITN-M4-7-045',
      'ITN-M4-7-046',
    ];

    for (const qId of assetQuestionIds) {
      const q = await store.getQuestionById(qId);
      assert.ok(q, `Question ${qId} must exist`);
      assert.ok(q.assetReferences.length > 0, `Question ${qId} must have assetReferences`);
      const refUrl = q.assetReferences[0].url;
      const refDiskPath = path.join(projectRoot, 'public', refUrl);
      assert.ok(fs.existsSync(refDiskPath), `Asset URL ${refUrl} must resolve to an existing file`);
    }
  });

  it('preserves verificationStatus and trialOnly metadata', async () => {
    const store = new JsonStore();
    const ethQuestions = (await store.getQuestions({ includeDevFixtures: false }))
      .filter(q => q.id.startsWith('ITN-M4-7-'));

    for (const q of ethQuestions) {
      assert.ok(q.verificationStatus, `Question ${q.id} must preserve verificationStatus`);
      assert.equal(q.trialOnly, true, `Question ${q.id} must preserve trialOnly=true`);
      assert.ok(q.explanation.answerReasoning, `Question ${q.id} must have answerReasoning`);
      assert.ok(q.tagIds.length >= 2, `Question ${q.id} must have official blueprint domain and topic tags`);
    }
  });

  it('confirms re-running import is completely idempotent', async () => {
    const store = new JsonStore();
    const beforeCount = (await store.getQuestions({ includeDevFixtures: false })).length;

    // Run import a second time
    const result2 = await importEthernet70();
    assert.equal(result2.importedCount, 70);

    const afterCount = (await store.getQuestions({ includeDevFixtures: false })).length;
    assert.equal(beforeCount, afterCount, 'Re-importing must not change count or create duplicate IDs');
    assert.equal(afterCount, 546, 'Total count must remain 546');
  });

  it('ensures user progress and review states remain intact', async () => {
    const store = new JsonStore();
    const reviewStates = await store.getReviewStates();
    assert.ok(Array.isArray(reviewStates), 'Review states must be intact');

    const userDataPath = path.join(process.cwd(), 'data', 'user-data.json');
    const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    assert.ok(Array.isArray(userData.sessions), 'Sessions array must be intact');
    assert.ok(Array.isArray(userData.submittedResponses), 'Submitted responses must be intact');
  });
});
