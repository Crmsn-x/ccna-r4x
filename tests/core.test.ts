import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestion, validateUserDataStore } from '../src/domain/validators.ts';
import { markQuestion } from '../src/domain/marking.ts';
import { sanitizeQuestionForSession } from '../src/domain/sanitizer.ts';
import { calculateNextLeitnerState } from '../src/domain/scheduling.ts';
import { JsonStore } from '../src/server/store/jsonStore.ts';
import type {
  Question,
  Tag,
  ScopeFilterSnapshot,
  ClientAnswer,
  SingleChoicePayload,
  MultiChoicePayload,
  MatchingPayload,
  OrderingPayload,
} from '../src/domain/types.ts';
import {
  buildTaxonomyIndex,
  getDescendantTagIds,
  resolveScopeTagIds,
  filterQuestionsByScope,
  formatScopeSummary,
} from '../src/domain/taxonomy.ts';

describe('1. Runtime Validation', () => {
  it('rejects question with missing id or externalId', () => {
    const invalid = {
      bankId: 'bank-1',
      sourceNumber: 1,
      version: 1,
      status: 'unverified',
      type: 'single',
      prompt: 'Test prompt',
      payload: { options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }], correctOptionIds: ['1'] }
    };
    const res = validateQuestion(invalid);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.field === 'id'));
    assert.ok(res.errors.some(e => e.field === 'externalId'));
  });

  it('requires needsSourceReason when status is needs-source', () => {
    const q: Partial<Question> = {
      id: 'q1',
      bankId: 'b1',
      externalId: 'q001',
      sourceNumber: 1,
      version: 1,
      status: 'needs-source',
    };
    const res = validateQuestion(q);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.field === 'needsSourceReason'));
  });

  it('validates multi choice requiredSelections count matching correctOptionIds', () => {
    const q: unknown = {
      id: 'q2',
      bankId: 'b1',
      externalId: 'q002',
      sourceNumber: 2,
      version: 1,
      status: 'unverified',
      type: 'multi',
      prompt: 'Select two items',
      payload: {
        options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }, { id: '3', text: 'C' }],
        correctOptionIds: ['1'], // only 1, but requiredSelections is 2
        requiredSelections: 2
      }
    };
    const res = validateQuestion(q);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.field === 'payload.correctOptionIds'));
  });

  it('validates user data store schema and rejects unsupported versions', () => {
    const invalidStore = {
      schemaVersion: 999,
      userId: 'local',
      questions: []
    };
    const res = validateUserDataStore(invalidStore);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.field === 'schemaVersion'));
  });
});

describe('2. Deterministic Marking', () => {
  const singleQ: Question = {
    id: 'q-single',
    bankId: 'b1',
    externalId: 'q001',
    sourceNumber: 1,
    version: 1,
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z',
    type: 'single',
    status: 'unverified',
    prompt: 'What is port 80?',
    payload: {
      options: [{ id: 'opt-http', text: 'HTTP' }, { id: 'opt-ssh', text: 'SSH' }],
      correctOptionIds: ['opt-http']
    },
    explanation: { answerReasoning: 'HTTP uses TCP port 80', conceptRefresher: 'Standard ports' },
    assetReferences: [],
    tagIds: []
  };

  it('marks exact single answer as correct', () => {
    const res = markQuestion(singleQ, { type: 'single', selectedOptionId: 'opt-http' });
    assert.equal(res.isCorrect, true);
    assert.equal(res.score, 1);
  });

  it('marks wrong single answer as incorrect', () => {
    const res = markQuestion(singleQ, { type: 'single', selectedOptionId: 'opt-ssh' });
    assert.equal(res.isCorrect, false);
    assert.equal(res.score, 0);
  });

  const multiQ: Question = {
    id: 'q-multi',
    bankId: 'b1',
    externalId: 'q002',
    sourceNumber: 2,
    version: 1,
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z',
    type: 'multi',
    status: 'unverified',
    prompt: 'Select two transport protocols',
    payload: {
      options: [
        { id: 'opt-tcp', text: 'TCP' },
        { id: 'opt-ip', text: 'IP' },
        { id: 'opt-udp', text: 'UDP' }
      ],
      correctOptionIds: ['opt-tcp', 'opt-udp'],
      requiredSelections: 2
    },
    explanation: { answerReasoning: 'TCP and UDP are layer 4', conceptRefresher: 'Transport layer' },
    assetReferences: [],
    tagIds: []
  };

  it('marks multi answer with order-independent set comparison (all-or-nothing)', () => {
    const correctRes = markQuestion(multiQ, { type: 'multi', selectedOptionIds: ['opt-udp', 'opt-tcp'] });
    assert.equal(correctRes.isCorrect, true);

    const partialRes = markQuestion(multiQ, { type: 'multi', selectedOptionIds: ['opt-tcp', 'opt-ip'] });
    assert.equal(partialRes.isCorrect, false);
  });

  const orderingQ: Question = {
    id: 'q-order',
    bankId: 'b1',
    externalId: 'q003',
    sourceNumber: 3,
    version: 1,
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z',
    type: 'ordering',
    status: 'unverified',
    prompt: 'Order the steps',
    payload: {
      items: [
        { id: 'step-1', text: 'Step 1' },
        { id: 'step-2', text: 'Step 2' },
        { id: 'step-3', text: 'Step 3' }
      ],
      correctOrderIds: ['step-1', 'step-2', 'step-3']
    },
    explanation: { answerReasoning: '1 then 2 then 3', conceptRefresher: 'Sequential processes' },
    assetReferences: [],
    tagIds: []
  };

  it('marks ordering with exact sequence requirement', () => {
    const exact = markQuestion(orderingQ, { type: 'ordering', orderedItemIds: ['step-1', 'step-2', 'step-3'] });
    assert.equal(exact.isCorrect, true);

    const reversed = markQuestion(orderingQ, { type: 'ordering', orderedItemIds: ['step-3', 'step-2', 'step-1'] });
    assert.equal(reversed.isCorrect, false);
  });
});

describe('3. Answer Key Withholding (Sanitization)', () => {
  it('strips correctOptionIds and explanation from client session snapshot', () => {
    const fullQ: Question = {
      id: 'q-secret',
      bankId: 'b1',
      externalId: 'q005',
      sourceNumber: 5,
      version: 1,
      createdAt: '2026-10-28T00:00:00Z',
      updatedAt: '2026-10-28T00:00:00Z',
      type: 'single',
      status: 'unverified',
      prompt: 'Secret question',
      payload: {
        options: [{ id: 'opt-1', text: 'A' }, { id: 'opt-2', text: 'B' }],
        correctOptionIds: ['opt-1']
      },
      explanation: {
        answerReasoning: 'Confidential reasoning',
        conceptRefresher: 'Confidential refresher'
      },
      assetReferences: [],
      tagIds: ['tag-1']
    };

    const sanitized = sanitizeQuestionForSession(fullQ);
    assert.equal('explanation' in sanitized, false);
    assert.equal('correctOptionIds' in (sanitized.payload as Record<string, unknown>), false);
    assert.equal((sanitized.payload as { options: unknown[] }).options.length, 2);
  });
});

describe('4. Leitner Scheduling Boundaries', () => {
  const baseTime = new Date('2026-10-28T12:00:00Z');

  it('correct + confident advances box 1 to box 2 (+1 day)', () => {
    const res = calculateNextLeitnerState({
      currentBox: 1,
      isCorrect: true,
      confidence: 'confident',
      now: baseTime
    });
    assert.equal(res.nextBox, 2);
    assert.equal(res.intervalDays, 1);
  });

  it('correct + confident caps at box 5 (+21 days)', () => {
    const res = calculateNextLeitnerState({
      currentBox: 5,
      isCorrect: true,
      confidence: 'confident',
      now: baseTime
    });
    assert.equal(res.nextBox, 5);
    assert.equal(res.intervalDays, 21);
  });

  it('correct + unsure or guessed remains in current box', () => {
    const resUnsure = calculateNextLeitnerState({
      currentBox: 3,
      isCorrect: true,
      confidence: 'unsure',
      now: baseTime
    });
    assert.equal(resUnsure.nextBox, 3);
    assert.equal(resUnsure.intervalDays, 3);

    const resGuessed = calculateNextLeitnerState({
      currentBox: 3,
      isCorrect: true,
      confidence: 'guessed',
      now: baseTime
    });
    assert.equal(resGuessed.nextBox, 3);
  });

  it('incorrect resets to box 1 due today (+0 days)', () => {
    const res = calculateNextLeitnerState({
      currentBox: 4,
      isCorrect: false,
      confidence: 'confident',
      now: baseTime
    });
    assert.equal(res.nextBox, 1);
    assert.equal(res.intervalDays, 0);
  });
});

describe('5. Store Reliability & Idempotency', () => {
  it('loads seed questions correctly', async () => {
    const store = new JsonStore();
    const questions = await store.getQuestions();
    assert.ok(questions.length === 546 || questions.length === 476 || questions.length === 400 || questions.length === 276 || questions.length === 200 || questions.length === 76, `Expected 546, 476, 400, 276, 200, or 76 questions, found ${questions.length}`);

    // Check known items
    if (questions.length === 76) {
      const q6 = questions.find(q => q.sourceNumber === 6 || q.id === 'ccna-q006');
      assert.ok(q6);
      assert.equal(q6.type, 'single');
      assert.equal(q6.status, 'verified');

      const oldQ52 = questions.find(q => q.id === 'ccna-q052' || q.externalId === 'itn-m01-03-test-q052');
      assert.equal(oldQ52, undefined, 'Old Packet Tracer Q52 must not exist in bank');
    } else {
      const q6 = questions.find(q => q.sourceNumber === 6 || q.id === 'CCNA-0006');
      assert.ok(q6);
      assert.equal(q6.type, 'single');
      assert.equal(q6.status, 'verified');

      // No old Packet Tracer activity in bank
      const oldQ52 = questions.find(q => q.id === 'ccna-q052' || q.externalId === 'itn-m01-03-test-q052');
      assert.equal(oldQ52, undefined, 'Old Packet Tracer Q52 must not exist in bank');

      const q52 = questions.find(q => q.id === 'CCNA-0052');
      assert.ok(q52);
      assert.ok(q52.prompt.includes('IPv6 traffic over an IPv4 infrastructure'));
    }
  });

  it('submitting response is idempotent for same session and question', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'learn',
      contentTrack: 'verified',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 1 }
    });

    const qId = session.questionIds[0];
    const question = await store.getQuestionById(qId);
    assert.ok(question);

    let validAnswer: ClientAnswer;
    if (question.type === 'single') {
      const p = question.payload as SingleChoicePayload;
      validAnswer = { type: 'single', selectedOptionId: p.options[0].id };
    } else if (question.type === 'multi') {
      const p = question.payload as MultiChoicePayload;
      validAnswer = { type: 'multi', selectedOptionIds: [p.options[0].id] };
    } else if (question.type === 'matching') {
      const p = question.payload as MatchingPayload;
      validAnswer = { type: 'matching', mapping: { [p.prompts[0].id]: p.choices[0].id } };
    } else {
      const p = question.payload as OrderingPayload;
      validAnswer = { type: 'ordering', orderedItemIds: p.correctOrderIds };
    }

    const sub1 = await store.submitResponse({
      sessionId: session.id,
      questionId: qId,
      answer: validAnswer,
      confidence: 'confident'
    });

    // Retry submit same question
    const sub2 = await store.submitResponse({
      sessionId: session.id,
      questionId: qId,
      answer: validAnswer,
      confidence: 'confident'
    });

    assert.equal(sub1.submissionId, sub2.submissionId);
    assert.equal(sub1.submittedAt, sub2.submittedAt);
  });

  it('randomizes question selection and order on every session instance', async () => {
    const store = new JsonStore();
    const sessionOrderSignatures = new Set<string>();

    for (let i = 0; i < 5; i++) {
      const s = await store.createSession({
        mode: 'learn',
        contentTrack: 'verified',
        scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 10 },
      });
      sessionOrderSignatures.add(s.questionIds.join(','));
    }

    // Over 5 sessions of 10 questions each from a bank of 76 questions,
    // order signatures must be distinct due to randomization
    assert.ok(sessionOrderSignatures.size > 1, 'Different session instances must produce randomized orders');
  });
});

describe('6. Revision Workflow & Isolation', () => {
  it('strictly rejects draft content from entering normal assessment', async () => {
    const store = new JsonStore();
    await assert.rejects(
      async () => {
        await store.createSession({
          mode: 'assess',
          contentTrack: 'draft',
          scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 1 },
        });
      },
      /Draft content cannot enter a normal assessment/
    );
  });

  it('autosaved draft persists without marking or updating scheduling', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'assess',
      contentTrack: 'fixture',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 1 },
      timeLimitSeconds: 600,
    });

    const qId = session.questionIds[0];
    const draft = await store.saveDraftResponse({
      sessionId: session.id,
      questionId: qId,
      answer: { type: 'single', selectedOptionId: 'opt-1' },
      confidence: 'unsure',
      flagged: true,
      updatedAt: new Date().toISOString(),
    });

    assert.equal(draft.sessionId, session.id);
    assert.equal(draft.questionId, qId);

    // Verify retrieving draft
    const retrieved = await store.getDraftResponse(session.id, qId);
    assert.ok(retrieved);
    assert.equal(retrieved.confidence, 'unsure');
    assert.equal(retrieved.flagged, true);

    // Verify no submission was created by draft save
    const submissions = await store.getSubmittedResponses(session.id);
    assert.equal(submissions.length, 0);

    // Verify deadline was preserved
    const loadedSession = await store.getSession(session.id);
    assert.ok(loadedSession?.deadlineAt);
    assert.equal(loadedSession.timeLimitSeconds, 600);
  });

  it('unverified questions and dev fixtures do not create Leitner review states', async () => {
    const store = new JsonStore();
    
    // Test with dev fixture
    const fixtureSession = await store.createSession({
      mode: 'learn',
      contentTrack: 'fixture',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 1 },
    });

    const fixtureQId = fixtureSession.questionIds[0];
    const fixtureQ = await store.getQuestionById(fixtureQId);
    let fixtureAnswer: ClientAnswer = { type: 'single', selectedOptionId: 'opt-3' };
    if (fixtureQ?.type === 'multi') {
      fixtureAnswer = { type: 'multi', selectedOptionIds: ['opt-1', 'opt-2'] };
    }
    await store.submitResponse({
      sessionId: fixtureSession.id,
      questionId: fixtureQId,
      answer: fixtureAnswer,
      confidence: 'confident',
    });

    const fixtureReview = await store.getReviewState(fixtureQId);
    assert.equal(fixtureReview, null, 'Dev fixture must not generate Leitner review state');
  });

  it('finalizes assess session and calculates totals accurately', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'assess',
      contentTrack: 'fixture',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 2 },
    });

    // Finalize session
    const finalized = await store.finalizeSession(session.id);
    assert.equal(finalized.status, 'completed');
    assert.ok(finalized.finishedAt);
    assert.equal(finalized.totalQuestions, 2);
    assert.equal(typeof finalized.score, 'number');
  });
});

describe('7. Scope Resolution, Taxonomy, and Deduplication', () => {
  const dummyTags: Tag[] = [
    { id: 'dom-1', name: 'Domain 1', kind: 'domain' },
    { id: 'top-1', name: 'Topic 1.1', kind: 'topic', parentId: 'dom-1' },
    { id: 'top-2', name: 'Topic 1.2', kind: 'topic', parentId: 'dom-1' },
    { id: 'sub-1', name: 'Subtopic 1.1.a', kind: 'subtopic', parentId: 'top-1' },
    { id: 'sub-2', name: 'Subtopic 1.1.b', kind: 'subtopic', parentId: 'top-1' },
    { id: 'dom-2', name: 'Domain 2', kind: 'domain' },
    { id: 'top-3', name: 'Topic 2.1', kind: 'topic', parentId: 'dom-2' },
  ];

  it('builds taxonomy index and traverses parent-child relationships', () => {
    const index = buildTaxonomyIndex(dummyTags);
    assert.equal(index.childrenMap.get('dom-1')?.length, 2);
    assert.equal(index.childrenMap.get('top-1')?.length, 2);
    assert.equal(index.byKind.domain.length, 2);
    assert.equal(index.byKind.topic.length, 3);
  });

  it('getDescendantTagIds includes parent and all recursive descendants', () => {
    const descendants = getDescendantTagIds('dom-1', dummyTags);
    assert.ok(descendants.includes('dom-1'));
    assert.ok(descendants.includes('top-1'));
    assert.ok(descendants.includes('top-2'));
    assert.ok(descendants.includes('sub-1'));
    assert.ok(descendants.includes('sub-2'));
    assert.equal(descendants.includes('dom-2'), false);
  });

  it('resolves union of sibling topics and subtopics', () => {
    const scope: Partial<ScopeFilterSnapshot> = {
      scopeType: 'topic',
      topicTagIds: ['top-1', 'top-2'],
    };
    const resolved = resolveScopeTagIds(scope, dummyTags);
    assert.ok(resolved.includes('top-1'));
    assert.ok(resolved.includes('top-2'));
    assert.ok(resolved.includes('sub-1'));
    assert.ok(resolved.includes('sub-2'));
    assert.equal(resolved.includes('top-3'), false);
  });

  it('deduplicates multi-tagged questions when resolving scope', () => {
    const multiTaggedQ: Question = {
      id: 'q-multi-tag',
      bankId: 'b1',
      externalId: 'q-multi',
      sourceNumber: 10,
      version: 1,
      createdAt: '2026-10-28T00:00:00Z',
      updatedAt: '2026-10-28T00:00:00Z',
      type: 'single',
      status: 'unverified',
      prompt: 'Multi tag test',
      payload: { options: [{ id: '1', text: 'A' }], correctOptionIds: ['1'] },
      explanation: { answerReasoning: 'Reason', conceptRefresher: 'Refresher' },
      assetReferences: [],
      tagIds: ['dom-1', 'top-1', 'sub-1'],
    };

    const q2: Question = {
      id: 'q-dom2',
      bankId: 'b1',
      externalId: 'q-dom2',
      sourceNumber: 11,
      version: 1,
      createdAt: '2026-10-28T00:00:00Z',
      updatedAt: '2026-10-28T00:00:00Z',
      type: 'single',
      status: 'unverified',
      prompt: 'Domain 2 test',
      payload: { options: [{ id: '1', text: 'A' }], correctOptionIds: ['1'] },
      explanation: { answerReasoning: 'Reason', conceptRefresher: 'Refresher' },
      assetReferences: [],
      tagIds: ['dom-2', 'top-3'],
    };

    const scope: ScopeFilterSnapshot = {
      scopeType: 'domain',
      domainTagIds: ['dom-1'],
      selectionCriteria: 'all',
      requestedCount: 10,
    };

    const filtered = filterQuestionsByScope([multiTaggedQ, q2], scope, dummyTags);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'q-multi-tag');
  });

  it('formats scope summary accurately', () => {
    assert.equal(formatScopeSummary({ scopeType: 'all', selectionCriteria: 'all', requestedCount: 5 }, dummyTags), 'All Available Content');
    assert.equal(formatScopeSummary({ scopeType: 'domain', domainTagIds: ['dom-1'], selectionCriteria: 'all', requestedCount: 5 }, dummyTags), 'Exam Domain: Domain 1');
    assert.equal(formatScopeSummary({ scopeType: 'topic', topicTagIds: ['top-1'], selectionCriteria: 'all', requestedCount: 5 }, dummyTags), 'Topic 1.1');
    assert.equal(formatScopeSummary({ scopeType: 'topic', domainTagIds: ['dom-1'], topicTagIds: ['top-1'], selectionCriteria: 'all', requestedCount: 5 }, dummyTags), 'Domain 1 → Topic 1.1');
    assert.equal(formatScopeSummary({ scopeType: 'topic', domainTagIds: ['dom-1'], topicTagIds: ['top-1'], subtopicTagIds: ['sub-1'], selectionCriteria: 'all', requestedCount: 5 }, dummyTags), 'Domain 1 → Topic 1.1 → Subtopic 1.1.a');
  });
});

describe('8. Verification Consistency and Bank Integrity', () => {
  it('ensures no unverified question in seed has contradictory verification claims', async () => {
    const store = new JsonStore();
    const questions = await store.getQuestions({ includeDevFixtures: true });

    for (const q of questions) {
      if (q.status === 'unverified') {
        assert.equal(
          q.verificationRecord?.verified,
          false,
          `Question ${q.id} (Q${q.sourceNumber}) is marked unverified but verificationRecord.verified is true`
        );
      }
    }
  });

  it('ensures questions have explicit verified status and valid verification metadata', async () => {
    const store = new JsonStore();
    const questions = await store.getQuestions({ includeDevFixtures: false });
    const qFirst = questions[0];
    assert.ok(qFirst);
    assert.equal(qFirst.status, 'verified');
    assert.equal(qFirst.verificationRecord?.verified, true);
    assert.ok(qFirst.verificationRecord?.whatWasChecked);
  });

  it('ensures needs-source questions and legacy items are excluded from practice sessions', async () => {
    const store = new JsonStore();
    const all = await store.getQuestions({ includeDevFixtures: false });
    const needsSource = all.filter(q => q.status === 'needs-source');
    assert.equal(needsSource.length, 0, 'No questions require missing source material in trial bank');
    assert.equal(all.some(q => q.id === 'ccna-q052'), false, 'Old Packet Tracer Q52 must not exist in bank');

    // Creating a session should succeed and never select legacy Q52
    const session = await store.createSession({
      mode: 'learn',
      contentTrack: 'verified',
      scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 50 },
    });

    assert.ok(session.questionIds.length > 0);
    assert.equal(session.questionIds.includes('ccna-q052'), false, 'ccna-q052 must not be in session');
  });

  it('isolates dev fixtures from standard queries', async () => {
    const store = new JsonStore();
    const normalQuestions = await store.getQuestions({ includeDevFixtures: false });
    assert.ok(normalQuestions.every(q => !q.isDevFixture));

    const withFixtures = await store.getQuestions({ includeDevFixtures: true });
    const fixtures = withFixtures.filter(q => q.isDevFixture);
    assert.equal(fixtures.length, 2);
  });
});


