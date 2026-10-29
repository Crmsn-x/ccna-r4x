import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestion, validateUserDataStore } from '../src/domain/validators.ts';
import { markQuestion } from '../src/domain/marking.ts';
import { sanitizeQuestionForSession } from '../src/domain/sanitizer.ts';
import { calculateNextLeitnerState } from '../src/domain/scheduling.ts';
import { JsonStore } from '../src/server/store/jsonStore.ts';
import type { Question } from '../src/domain/types.ts';

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
    assert.equal(questions.length, 75); // 75 source questions (dev fixtures excluded by default)

    // Check known items
    const q5 = questions.find(q => q.sourceNumber === 5);
    assert.ok(q5);
    assert.equal(q5.status, 'needs-source');

    const q52 = questions.find(q => q.sourceNumber === 52);
    assert.ok(q52);
    assert.equal(q52.status, 'needs-source');

    const q74 = questions.find(q => q.sourceNumber === 74);
    assert.ok(q74);
    assert.ok(q74.cleanupNotes?.includes('Fire optic cable'));
  });

  it('submitting response is idempotent for same session and question', async () => {
    const store = new JsonStore();
    const session = await store.createSession({
      mode: 'learn',
      contentTrack: 'draft',
      scopeFilter: { selectionCriteria: 'all', requestedCount: 1 }
    });

    const qId = session.questionIds[0];
    const sub1 = await store.submitResponse({
      sessionId: session.id,
      questionId: qId,
      answer: { type: 'single', selectedOptionId: 'opt-3' },
      confidence: 'confident'
    });

    // Retry submit same question
    const sub2 = await store.submitResponse({
      sessionId: session.id,
      questionId: qId,
      answer: { type: 'single', selectedOptionId: 'opt-3' },
      confidence: 'confident'
    });

    assert.equal(sub1.submissionId, sub2.submissionId);
    assert.equal(sub1.submittedAt, sub2.submittedAt);
  });
});
