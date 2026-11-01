import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JsonStore } from '../src/server/store/jsonStore.ts';
import { markQuestion } from '../src/domain/marking.ts';
import { sanitizeQuestionForSession } from '../src/domain/sanitizer.ts';
import { importTrial200 } from '../scripts/import_trial_200.mjs';

describe('1. 400 CCNA Questions Trial Import Verification', () => {
  it('imports the 400 questions across Batch 1 and Batch 2 and validates integrity', async () => {
    const result = await importTrial200();
    assert.equal(result.rejectedCount, 0, 'Must have 0 rejected records');
    assert.equal(result.totalTrialQuestions, 400, 'Total trial questions must be exactly 400');
    assert.equal(result.totalActiveQuestions, 476, 'Total active questions must be exactly 476');
  });

  it('ensures all 476 distinct active questions are available in the question bank', async () => {
    const store = new JsonStore();
    const activeQuestions = await store.getQuestions({ includeDevFixtures: false });
    assert.equal(activeQuestions.length, 476, 'Active question bank must contain exactly 476 questions (76 ITN + 400 CCNA)');

    const ids = new Set(activeQuestions.map(q => q.id));
    assert.equal(ids.size, 476, 'All 476 active question IDs must be distinct');

    const trialQuestions = activeQuestions.filter(q => q.id.startsWith('CCNA-'));
    assert.equal(trialQuestions.length, 400, 'All 400 CCNA trial questions are present');

    const itnQuestions = activeQuestions.filter(q => q.id.startsWith('ccna-'));
    assert.equal(itnQuestions.length, 76, 'All 76 ITN questions are preserved');
  });

  it('confirms re-running the import is idempotent and does not create duplicates', async () => {
    const store = new JsonStore();
    const beforeCount = (await store.getQuestions({ includeDevFixtures: false })).length;

    // Run import a second time
    const secondResult = await importTrial200();
    assert.equal(secondResult.rejectedCount, 0);

    const afterCount = (await store.getQuestions({ includeDevFixtures: false })).length;
    assert.equal(beforeCount, afterCount, 'Re-importing must not change question count or create duplicates');
    assert.equal(afterCount, 476, 'Active count remains 476');
  });

  it('validates every trial question has 4 options, a valid correct answer, and complete explanations', async () => {
    const store = new JsonStore();
    const questions = await store.getQuestions({ includeDevFixtures: false });
    const trialQuestions = questions.filter(q => q.id.startsWith('CCNA-'));
    assert.equal(trialQuestions.length, 400, 'All 400 trial questions must be validated');

    for (const q of trialQuestions) {
      assert.equal(q.type, 'single', `Question ${q.id} must be single choice`);
      const payload = q.payload as { options: { id: string; text: string }[]; correctOptionIds: string[] };
      assert.equal(payload.options.length, 4, `Question ${q.id} must have exactly 4 options`);

      const optionIds = payload.options.map(o => o.id);
      assert.deepEqual(optionIds.sort(), ['A', 'B', 'C', 'D'], `Question ${q.id} options must be A, B, C, D`);

      assert.equal(payload.correctOptionIds.length, 1, `Question ${q.id} must have 1 correct answer`);
      const correctId = payload.correctOptionIds[0];
      assert.ok(optionIds.includes(correctId), `Question ${q.id} correct answer "${correctId}" must exist in options`);

      assert.ok(q.explanation.answerReasoning?.trim(), `Question ${q.id} must have overall answer reasoning`);
      assert.ok(q.explanation.optionExplanations, `Question ${q.id} must have optionExplanations`);

      for (const optId of ['A', 'B', 'C', 'D']) {
        const optExp = q.explanation.optionExplanations[optId];
        assert.ok(optExp && optExp.trim().length > 0, `Question ${q.id} option "${optId}" must have non-empty explanation`);
      }
    }
  });

  it('verifies domainTopic: null questions remain accessible without invented domains', async () => {
    const store = new JsonStore();
    const questions = await store.getQuestions({ includeDevFixtures: false });
    const nullTopicQuestions = questions.filter(q => q.tagIds.length === 0);
    assert.equal(nullTopicQuestions.length, 249, 'Expected 249 questions with domainTopic: null (49 in batch 1 + 200 in batch 2)');

    for (const q of nullTopicQuestions) {
      assert.deepEqual(q.tagIds, [], `Question ${q.id} with null topic must have empty tagIds, not invented domains`);
    }
  });
});

describe('2. Learn Mode Functionality with 400 Questions', () => {
  it('creates Learn mode session with randomized sampling from 200 questions', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'learn',
      contentTrack: 'verified',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 10 },
    });

    assert.equal(session.mode, 'learn');
    assert.equal(session.questionIds.length, 10);
    assert.equal(session.questionSnapshots.length, 10);

    // Verify snapshots withhold answer keys
    for (const snap of session.questionSnapshots) {
      assert.equal('explanation' in snap, false, 'Pre-submission snapshot must withhold explanation');
      assert.equal('correctOptionIds' in (snap.payload as any), false, 'Snapshot must withhold correctOptionIds');
    }
  });

  it('evaluates correct answer submission and reveals immediate feedback and explanations', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'learn',
      contentTrack: 'verified',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 3 },
    });

    const qId = session.questionIds.find(id => id.startsWith('CCNA-')) || session.questionIds[0];
    const question = await store.getQuestionById(qId);
    assert.ok(question);

    const payload = question.payload as { correctOptionIds: string[]; options: { id: string }[] };
    const correctOptId = payload.correctOptionIds[0];

    const submission = await store.submitResponse({
      sessionId: session.id,
      questionId: qId,
      answer: { type: 'single', selectedOptionId: correctOptId },
      confidence: 'confident',
    });

    assert.equal(submission.markingResult.isCorrect, true, 'Submission of correct option must be marked correct');
    assert.equal(submission.markingResult.score, 1, 'Score must be 1 point');
    assert.ok(submission.markingResult.explanation, 'Marking result must release explanation in Learn mode');
    if (question.id.startsWith('CCNA-')) {
      assert.equal(
        submission.markingResult.explanation.correctAnswerLetter,
        correctOptId,
        'Explanation must reference correct option letter'
      );
    }
  });

  it('evaluates wrong answer submission and reveals corresponding option explanation', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'learn',
      contentTrack: 'verified',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 10 },
    });

    const qId = session.questionIds.find(id => id.startsWith('CCNA-')) || session.questionIds[0];
    const question = await store.getQuestionById(qId);
    assert.ok(question);

    const payload = question.payload as { correctOptionIds: string[]; options: { id: string }[] };
    const correctOptId = payload.correctOptionIds[0];
    const wrongOptId = payload.options.find(o => o.id !== correctOptId)!.id;

    const submission = await store.submitResponse({
      sessionId: session.id,
      questionId: qId,
      answer: { type: 'single', selectedOptionId: wrongOptId },
      confidence: 'unsure',
    });

    assert.equal(submission.markingResult.isCorrect, false, 'Wrong option must be marked incorrect');
    assert.equal(submission.markingResult.score, 0, 'Score must be 0 points');
    assert.ok(submission.markingResult.explanation, 'Explanation must be revealed');
    assert.ok(
      submission.markingResult.explanation.optionExplanations?.[wrongOptId],
      'Specific option explanation for the chosen wrong option must be present'
    );
  });
});

describe('3. Exam Mode Functionality with 400 Questions', () => {
  it('creates Exam mode session withholding all answers and explanations during examination', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'assess',
      contentTrack: 'verified',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 5 },
      timeLimitSeconds: 1800,
    });

    assert.equal(session.mode, 'assess');
    assert.equal(session.questionIds.length, 5);

    // Sanitize check
    for (const snap of session.questionSnapshots) {
      assert.equal('explanation' in snap, false);
      assert.equal('correctOptionIds' in (snap.payload as any), false);
    }
  });

  it('preserves draft responses during question navigation and scores exam accurately on finalization', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'assess',
      contentTrack: 'verified',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 4 },
    });

    const qId1 = session.questionIds[0];
    const q1 = await store.getQuestionById(qId1);
    assert.ok(q1);
    const correctOptions1 = (q1.payload as any).correctOptionIds;
    const answer1 = q1.type === 'single'
      ? { type: 'single' as const, selectedOptionId: correctOptions1[0] }
      : { type: 'multi' as const, selectedOptionIds: correctOptions1 };

    // Save draft for Q1
    await store.saveDraftResponse({
      sessionId: session.id,
      questionId: qId1,
      answer: answer1,
      confidence: 'confident',
      flagged: true,
      updatedAt: new Date().toISOString(),
    });

    // Reload draft to verify preservation during navigation
    const reloadedDraft = await store.getDraftResponse(session.id, qId1);
    assert.ok(reloadedDraft);
    assert.equal(reloadedDraft.flagged, true);
    if (q1.type === 'single') {
      assert.equal((reloadedDraft.answer as any).selectedOptionId, correctOptions1[0]);
    } else {
      assert.deepEqual((reloadedDraft.answer as any).selectedOptionIds, correctOptions1);
    }

    // Submit Q1 (correct)
    await store.submitResponse({
      sessionId: session.id,
      questionId: qId1,
      answer: answer1,
      confidence: 'confident',
    });

    // Submit Q2 (incorrect)
    const qId2 = session.questionIds[1];
    const q2 = await store.getQuestionById(qId2);
    assert.ok(q2);
    const correctSet2 = new Set((q2.payload as any).correctOptionIds);
    const wrongOpt2 = (q2.payload as any).options.find((o: any) => !correctSet2.has(o.id))?.id || (q2.payload as any).options[0].id;
    const answer2 = q2.type === 'single'
      ? { type: 'single' as const, selectedOptionId: wrongOpt2 }
      : { type: 'multi' as const, selectedOptionIds: [wrongOpt2] };

    await store.submitResponse({
      sessionId: session.id,
      questionId: qId2,
      answer: answer2,
      confidence: 'unsure',
    });

    // Finalize exam
    const finalized = await store.finalizeSession(session.id);
    assert.equal(finalized.status, 'completed');
    assert.equal(finalized.totalQuestions, 4);
    assert.equal(finalized.score, 1, 'Only Q1 was correct, so total score must be 1');
    assert.equal(finalized.unansweredCount, 2, '2 questions were left unanswered');
  });
});

describe('4. Batch 2 Dedicated Verification: Explanations, Accuracy & User Progress', () => {
  it('preserves exact technical accuracy and per-option explanations on Batch 2 questions', async () => {
    const store = new JsonStore();
    
    // Check CCNA-0360 (First question of Batch 2)
    const q360 = await store.getQuestionById('CCNA-0360');
    assert.ok(q360, 'CCNA-0360 must exist in question bank');
    assert.equal(q360.prompt, 'When OSPF learns multiple paths to a network, how does it select a route?');
    const payload360 = q360.payload as { options: { id: string; text: string }[]; correctOptionIds: string[] };
    assert.deepEqual(payload360.correctOptionIds, ['C']);
    assert.equal(payload360.options[2].id, 'C');
    assert.equal(payload360.options[2].text, 'It divides a reference bandwidth of 100 Mbps by the actual bandwidth of the exiting interface to calculate the route with the lowest cost.');
    assert.equal(q360.explanation.optionExplanations?.['C'], 'OSPF chooses the path with the lowest total OSPF cost. A traditional Cisco default interface cost is reference bandwidth (100 Mb/s by default) divided by interface bandwidth; the reference is configurable.');
    assert.equal(q360.explanation.optionExplanations?.['B'], "Hop count is RIP's principal metric, not OSPF's.");

    // Check CCNA-0421 (VRRP MAC address)
    const q421 = await store.getQuestionById('CCNA-0421');
    assert.ok(q421, 'CCNA-0421 must exist in question bank');
    const payload421 = q421.payload as { options: { id: string; text: string }[]; correctOptionIds: string[] };
    assert.deepEqual(payload421.correctOptionIds, ['A']);
    assert.equal(payload421.options[0].text, '0000.5E00.010a');
    assert.equal(q421.explanation.optionExplanations?.['C'], '00:00:0C:07:AC:XX is the familiar Cisco HSRP v1 MAC prefix.');

    // Check CCNA-1316 (Last question of Batch 2)
    const q1316 = await store.getQuestionById('CCNA-1316');
    assert.ok(q1316, 'CCNA-1316 must exist in question bank');
    assert.equal(q1316.prompt, 'Which Windows command is used instead of the route print command to display the contents of the IP routing table?');
    const payload1316 = q1316.payload as { options: { id: string; text: string }[]; correctOptionIds: string[] };
    assert.deepEqual(payload1316.correctOptionIds, ['B']);
    assert.equal(q1316.explanation.optionExplanations?.['B'], 'On Windows, netstat -r displays the routing table similarly to route print, whereas ipconfig displays interface addresses and DNS settings.');
  });

  it('executes Learn Mode with Batch 2 questions revealing correct and per-option explanations', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'learn',
      contentTrack: 'verified',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 2 },
    });

    // Test answering CCNA-0360 with wrong option 'B' in Learn Mode
    const wrongSub = await store.submitResponse({
      sessionId: session.id,
      questionId: 'CCNA-0360',
      answer: { type: 'single', selectedOptionId: 'B' },
      confidence: 'unsure',
    });

    assert.equal(wrongSub.markingResult.isCorrect, false);
    assert.equal(wrongSub.markingResult.score, 0);
    assert.ok(wrongSub.markingResult.explanation);
    assert.equal(wrongSub.markingResult.explanation.correctAnswerLetter, 'C');
    assert.equal(wrongSub.markingResult.explanation.optionExplanations?.['B'], "Hop count is RIP's principal metric, not OSPF's.");
    assert.equal(wrongSub.markingResult.explanation.optionExplanations?.['C'], 'OSPF chooses the path with the lowest total OSPF cost. A traditional Cisco default interface cost is reference bandwidth (100 Mb/s by default) divided by interface bandwidth; the reference is configurable.');

    // Test answering CCNA-0421 with correct option 'A' in Learn Mode
    const correctSub = await store.submitResponse({
      sessionId: session.id,
      questionId: 'CCNA-0421',
      answer: { type: 'single', selectedOptionId: 'A' },
      confidence: 'confident',
    });

    assert.equal(correctSub.markingResult.isCorrect, true);
    assert.equal(correctSub.markingResult.score, 1);
    assert.ok(correctSub.markingResult.explanation);
    assert.equal(correctSub.markingResult.explanation.correctAnswerLetter, 'A');
    assert.equal(correctSub.markingResult.explanation.optionExplanations?.['A'], 'IPv4 VRRP uses virtual MAC addresses beginning 00:00:5E:00:01, followed by the VRID in hexadecimal; the address ending 0A represents VRID 10.');
  });

  it('ensures user progress records in user-data.json remain completely intact', async () => {
    const userDataPath = path.join(process.cwd(), 'data', 'user-data.json');
    assert.ok(fs.existsSync(userDataPath), 'user-data.json must exist');

    const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    assert.ok(Array.isArray(userData.sessions), 'sessions must be an array');
    assert.ok(userData.sessions.length > 0, 'existing sessions must not be wiped');
    assert.ok(typeof userData.reviewStates === 'object' && Object.keys(userData.reviewStates).length > 0, 'existing review states must be preserved');
  });
});
