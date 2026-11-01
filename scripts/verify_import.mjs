import fs from 'node:fs';
import path from 'node:path';
import { JsonStore } from '../src/server/store/jsonStore.ts';
import { markQuestion } from '../src/domain/marking.ts';
import { sanitizeQuestionForSession } from '../src/domain/sanitizer.ts';

async function runVerification() {
  console.log('=== STARTING FULL IMPORT INTEGRATION VERIFICATION ===\n');

  const store = new JsonStore();

  // 1. Resulting Question Counts
  const normalQuestions = await store.getQuestions({ includeDevFixtures: false });
  console.log(`1. Total Active Questions in Bank: ${normalQuestions.length}`);
  if (normalQuestions.length !== 76 && normalQuestions.length !== 200) {
    throw new Error(`Expected either 76 or 200 active questions, found ${normalQuestions.length}`);
  }

  const isTrial200 = normalQuestions.length === 200;
  console.log(`   Bank mode detected: ${isTrial200 ? '200 CCNA Trial Questions' : '76 Modules 1–3 Exam Questions'}`);

  const typeCounts = { single: 0, multi: 0, matching: 0, ordering: 0 };
  for (const q of normalQuestions) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
  }
  console.log('   Type breakdown:', typeCounts);

  if (!isTrial200) {
    if (typeCounts.single !== 59 || typeCounts.multi !== 10 || typeCounts.matching !== 5 || typeCounts.ordering !== 2) {
      throw new Error(`Type breakdown mismatch! Expected 59 single, 10 multi, 5 matching, 2 ordering.`);
    }
  } else {
    if (typeCounts.single !== 200) {
      throw new Error(`Type breakdown mismatch! Expected 200 single.`);
    }
  }

  // Verify Packet Tracer Q52 is completely removed
  const oldQ52 = normalQuestions.find(q => q.id === 'ccna-q052' || q.externalId === 'itn-m01-03-test-q052' || (q.bankId === 'ccna1-v7-modules-01-03' && q.sourceNumber === 52));
  console.log(`   Old Packet Tracer Q52 presence in bank: ${oldQ52 ? 'FOUND (ERROR)' : 'NONE (CORRECT - strictly removed)'}`);
  if (oldQ52) throw new Error('Old Packet Tracer Q52 must not exist in active question bank');

  if (isTrial200) {
    const q52 = normalQuestions.find(q => q.id === 'CCNA-0052');
    console.log(`   Trial CCNA-0052 presence in bank: ${q52 ? 'FOUND (CORRECT)' : 'MISSING (ERROR)'}`);
    if (!q52) throw new Error('CCNA-0052 must exist in 200 question trial bank');
  }

  // Verify needs-source count is 0
  const needsSource = normalQuestions.filter(q => q.status === 'needs-source');
  console.log(`   Needs-source questions count: ${needsSource.length} (CORRECT - 0)`);
  if (needsSource.length !== 0) throw new Error('Expected 0 needs-source questions');

  // Verify verified count
  const verifiedCount = normalQuestions.filter(q => q.status === 'verified').length;
  console.log(`   Verified active questions count: ${verifiedCount} (CORRECT - ${normalQuestions.length})`);
  if (verifiedCount !== normalQuestions.length) throw new Error(`All ${normalQuestions.length} questions must have status verified`);

  // 2. Exhibits Verification
  console.log('\n2. Exhibits Verification:');
  const exhibits = normalQuestions.filter(q => q.assetReferences && q.assetReferences.length > 0);
  console.log(`   Questions with exhibits: ${exhibits.length}`);
  for (const q of exhibits) {
    for (const a of q.assetReferences) {
      const publicPath = path.join(process.cwd(), 'public', a.url.replace(/^\//, ''));
      const exists = fs.existsSync(publicPath);
      console.log(`   - Q${q.sourceNumber || q.id} (${q.id}) asset "${a.id}": ${a.url} -> file exists: ${exists}`);
      if (!exists) throw new Error(`Missing exhibit file for ${a.url}`);
    }
  }

  // 3. Question Types & Marking Verification
  console.log('\n3. Question Types & Marking Verification:');
  
  if (!isTrial200) {
    // 3a. Q24 (Ordering with distractor item)
    const q24 = normalQuestions.find(q => q.sourceNumber === 24);
    console.log(`   - Q24 found: ${!!q24}, type: ${q24?.type}`);
    if (!q24 || q24.type !== 'ordering') throw new Error('Q24 must be ordering');
    const q24Payload = q24.payload;
    console.log(`     Items count: ${q24Payload.items.length}, correctOrderIds:`, q24Payload.correctOrderIds, `distractors:`, q24Payload.distractorItemIds);
    // Mark Q24 with correct sequence
    const q24MarkCorrect = markQuestion(q24, { type: 'ordering', orderedItemIds: q24Payload.correctOrderIds });
    console.log(`     Mark with correct order: isCorrect = ${q24MarkCorrect.isCorrect}, score = ${q24MarkCorrect.score}`);
    if (!q24MarkCorrect.isCorrect) throw new Error('Q24 correct order failed marking');
    // Mark Q24 with wrong sequence
    const q24MarkWrong = markQuestion(q24, { type: 'ordering', orderedItemIds: ['s1', 's2', 's3', 's4'] });
    console.log(`     Mark with wrong order (including distractor): isCorrect = ${q24MarkWrong.isCorrect}`);
    if (q24MarkWrong.isCorrect) throw new Error('Q24 wrong order incorrectly marked as correct');

    // 3b. Q27 (Matching with reusable categories and Not used statement)
    const q27 = normalQuestions.find(q => q.sourceNumber === 27);
    console.log(`   - Q27 found: ${!!q27}, type: ${q27?.type}`);
    if (!q27 || q27.type !== 'matching') throw new Error('Q27 must be matching');
    const q27Payload = q27.payload;
    console.log(`     Prompts count: ${q27Payload.prompts.length}, Choices count: ${q27Payload.choices.length}`);
    console.log(`     AllowChoiceReuse: ${q27Payload.allowChoiceReuse}, AllowNoMatch: ${q27Payload.allowNoMatch}`);
    console.log(`     Prompt 7 correct choice: ${q27Payload.correctMapping['p7']} (CORRECT: null / Not used)`);
    if (q27Payload.correctMapping['p7'] !== null) throw new Error('Q27 prompt 7 must map to null (Not used)');
    const q27MarkCorrect = markQuestion(q27, { type: 'matching', mapping: q27Payload.correctMapping });
    console.log(`     Mark with correct mapping: isCorrect = ${q27MarkCorrect.isCorrect}`);
    if (!q27MarkCorrect.isCorrect) throw new Error('Q27 correct mapping failed marking');

    // 3c. Q10 (Multi-choice exact set)
    const q10 = normalQuestions.find(q => q.sourceNumber === 10);
    console.log(`   - Q10 found: ${!!q10}, type: ${q10?.type}`);
    const q10Payload = q10.payload;
    console.log(`     RequiredSelections: ${q10Payload.requiredSelections}, Correct options:`, q10Payload.correctOptionIds);
    const q10MarkCorrect = markQuestion(q10, { type: 'multi', selectedOptionIds: [...q10Payload.correctOptionIds].reverse() });
    console.log(`     Mark with correct options (reversed order): isCorrect = ${q10MarkCorrect.isCorrect}`);
    if (!q10MarkCorrect.isCorrect) throw new Error('Q10 multi-choice set marking failed');
    const q10MarkPartial = markQuestion(q10, { type: 'multi', selectedOptionIds: [q10Payload.correctOptionIds[0], 'o1'] });
    console.log(`     Mark with partial/incorrect option: isCorrect = ${q10MarkPartial.isCorrect}`);
    if (q10MarkPartial.isCorrect) throw new Error('Q10 partial selection must be marked incorrect (all-or-nothing)');
  } else {
    // Check trial questions marking
    const sampleQ = normalQuestions[0];
    console.log(`   - Testing trial question: ${sampleQ.id}`);
    const correctOpt = sampleQ.payload.correctOptionIds[0];
    const markCorrect = markQuestion(sampleQ, { type: 'single', selectedOptionId: correctOpt });
    console.log(`     Mark with correct option: isCorrect = ${markCorrect.isCorrect}`);
    if (!markCorrect.isCorrect) throw new Error('Trial sample question correct marking failed');

    const wrongOpt = sampleQ.payload.options.find(o => o.id !== correctOpt).id;
    const markWrong = markQuestion(sampleQ, { type: 'single', selectedOptionId: wrongOpt });
    console.log(`     Mark with wrong option: isCorrect = ${markWrong.isCorrect}`);
    if (markWrong.isCorrect) throw new Error('Trial sample question wrong marking incorrectly succeeded');
  }

  // 4. Answer Key Withholding (Sanitization)
  console.log('\n4. Answer Key Withholding & Explanation Timing:');
  const sampleForSanitization = normalQuestions[0];
  const snap1 = sanitizeQuestionForSession(sampleForSanitization);
  console.log(`   - Question ${sampleForSanitization.id} snapshot has explanation: ${'explanation' in snap1} (CORRECT - withheld)`);
  console.log(`   - Question ${sampleForSanitization.id} snapshot has correctOptionIds: ${'correctOptionIds' in (snap1.payload)} (CORRECT - withheld)`);
  if ('explanation' in snap1 || 'correctOptionIds' in snap1.payload) {
    throw new Error('Pre-submission snapshot must withhold answer keys and explanations');
  }

  // 5. Session Flow: Learn vs Assess
  console.log('\n5. Session Flow Verification:');
  // 5a. Learn session
  const learnSession = await store.createSession({
    mode: 'learn',
    contentTrack: 'verified',
    scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 3 }
  });
  console.log(`   - Created Learn session "${learnSession.id}" with ${learnSession.questionIds.length} questions`);
  const qId1 = learnSession.questionIds[0];
  const q1Record = await store.getQuestionById(qId1);
  const optId1 = q1Record.payload.options ? q1Record.payload.options[0].id : undefined;
  
  // Submit in learn mode
  let learnSub;
  if (q1Record.type === 'single') {
    learnSub = await store.submitResponse({
      sessionId: learnSession.id,
      questionId: qId1,
      answer: { type: 'single', selectedOptionId: optId1 },
      confidence: 'confident',
    });
  } else if (q1Record.type === 'multi') {
    learnSub = await store.submitResponse({
      sessionId: learnSession.id,
      questionId: qId1,
      answer: { type: 'multi', selectedOptionIds: [q1Record.payload.options[0].id, q1Record.payload.options[1].id] },
      confidence: 'confident',
    });
  } else if (q1Record.type === 'matching') {
    learnSub = await store.submitResponse({
      sessionId: learnSession.id,
      questionId: qId1,
      answer: { type: 'matching', mapping: { [q1Record.payload.prompts[0].id]: q1Record.payload.choices[0].id } },
      confidence: 'confident',
    });
  } else {
    learnSub = await store.submitResponse({
      sessionId: learnSession.id,
      questionId: qId1,
      answer: { type: 'ordering', orderedItemIds: q1Record.payload.correctOrderIds },
      confidence: 'confident',
    });
  }
  console.log(`   - Learn mode submitted response: correctness revealed = ${typeof learnSub.markingResult.isCorrect === 'boolean'}`);
  console.log(`   - Learn mode submitted response has explanation: ${!!learnSub.markingResult.explanation}`);
  if (typeof learnSub.markingResult.isCorrect !== 'boolean' || !learnSub.markingResult.explanation) {
    throw new Error('Learn mode must reveal correctness and explanations immediately after submission');
  }

  // 5b. Assessment session
  const assessSession = await store.createSession({
    mode: 'assess',
    contentTrack: 'verified',
    scopeFilter: { scopeType: 'all', selectionCriteria: 'all', requestedCount: 2 },
    timeLimitSeconds: 1200,
  });
  console.log(`   - Created Assess session "${assessSession.id}" with time limit ${assessSession.timeLimitSeconds}s`);
  const aQId = assessSession.questionIds[0];
  const aQRecord = await store.getQuestionById(aQId);
  let aAnswer;
  if (aQRecord.type === 'single') {
    aAnswer = { type: 'single', selectedOptionId: aQRecord.payload.options[0].id };
  } else if (aQRecord.type === 'multi') {
    aAnswer = { type: 'multi', selectedOptionIds: [aQRecord.payload.options[0].id] };
  } else if (aQRecord.type === 'matching') {
    aAnswer = { type: 'matching', mapping: { [aQRecord.payload.prompts[0].id]: aQRecord.payload.choices[0].id } };
  } else {
    aAnswer = { type: 'ordering', orderedItemIds: aQRecord.payload.correctOrderIds };
  }
  
  // Draft response
  const draft = await store.saveDraftResponse({
    sessionId: assessSession.id,
    questionId: aQId,
    answer: aAnswer,
    confidence: 'confident',
    flagged: true,
  });
  console.log(`   - Saved draft in assess session, flagged: ${draft.flagged}`);

  // Reload draft to verify persistence
  const reloadedDraft = await store.getDraftResponse(assessSession.id, aQId);
  console.log(`   - Reloaded draft: matches saved answer = ${reloadedDraft?.answer?.type === aAnswer.type}`);
  if (!reloadedDraft || reloadedDraft.flagged !== true) {
    throw new Error('Draft persistence / reload failed');
  }

  // Finalize assessment
  const finalizedAssess = await store.finalizeSession(assessSession.id);
  console.log(`   - Finalized assessment session: status = "${finalizedAssess.status}", total = ${finalizedAssess.totalQuestions}, score = ${finalizedAssess.score}`);
  if (finalizedAssess.status !== 'completed') {
    throw new Error('Assess session finalization failed');
  }

  // 6. Idempotent Reimport Verification
  console.log('\n6. Idempotent Reimport Verification:');
  const questionsBeforeReimport = (await store.getQuestions({ includeDevFixtures: false })).length;
  // Re-run appropriate import
  const { execSync } = await import('node:child_process');
  if (isTrial200) {
    execSync('node scripts/import_trial_200.mjs', { stdio: 'pipe' });
  } else {
    execSync('node scripts/import_questions.mjs', { stdio: 'pipe' });
  }
  const questionsAfterReimport = (await store.getQuestions({ includeDevFixtures: false })).length;
  console.log(`   - Questions before: ${questionsBeforeReimport}, after reimport: ${questionsAfterReimport}`);
  if (questionsBeforeReimport !== questionsAfterReimport) {
    throw new Error('Reimport is not idempotent');
  }

  console.log('\n=== ALL 6 INTEGRATION CHECKS PASSED PERFECTLY ===');
}

runVerification().catch(err => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
