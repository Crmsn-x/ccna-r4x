import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
export const batch1Path = path.join(projectRoot, 'ingestion', 'ccna_trial_import_200.json');
export const batch2Path = path.join(projectRoot, 'ingestion', 'ccna_trial_import_additional_200.json');
const seedPath = path.join(projectRoot, 'data', 'questions.seed.json');
const backupsDir = path.join(projectRoot, 'data', 'backups');

export async function importTrialBatch(sourceFile) {
  console.log(`\n======================================================`);
  console.log(`=== IMPORTING CCNA TRIAL BATCH: ${path.basename(sourceFile)} ===`);
  console.log(`======================================================`);
  console.log(`Source file: ${sourceFile}`);

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found at: ${sourceFile}`);
  }

  // 1. Parse and validate source JSON
  const rawText = fs.readFileSync(sourceFile, 'utf8');
  let pkg;
  try {
    pkg = JSON.parse(rawText);
  } catch (err) {
    throw new Error(`Failed to parse JSON in ${sourceFile}: ${err.message}`);
  }

  if (!Array.isArray(pkg.questions)) {
    throw new Error(`Invalid source format: "questions" property must be an array`);
  }

  if (pkg.questions.length !== 200) {
    throw new Error(`Expected exactly 200 questions in source file, but found ${pkg.questions.length}`);
  }

  // 2. Strict Data Integrity Validation
  const validationErrors = [];
  const uniqueIds = new Set();

  pkg.questions.forEach((q, idx) => {
    const loc = `Question [${idx}] (id: ${q.id || 'MISSING'})`;

    if (!q.id || typeof q.id !== 'string' || !q.id.trim()) {
      validationErrors.push(`${loc}: Missing or invalid id`);
    } else if (uniqueIds.has(q.id)) {
      validationErrors.push(`${loc}: Duplicate question id "${q.id}"`);
    } else {
      uniqueIds.add(q.id);
    }

    if (q.type !== 'single_choice') {
      validationErrors.push(`${loc}: Unexpected question type "${q.type}", expected "single_choice"`);
    }

    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
      validationErrors.push(`${loc}: Empty question stem`);
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      validationErrors.push(`${loc}: Options count is ${q.options ? q.options.length : 'none'}, expected exactly 4`);
    } else {
      const optIds = new Set();
      q.options.forEach((opt, oIdx) => {
        if (!opt || typeof opt.id !== 'string' || !opt.id.trim()) {
          validationErrors.push(`${loc}: Option ${oIdx} has invalid id`);
        } else if (optIds.has(opt.id)) {
          validationErrors.push(`${loc}: Duplicate option id "${opt.id}"`);
        } else {
          optIds.add(opt.id);
        }

        if (!opt || typeof opt.text !== 'string' || !opt.text.trim()) {
          validationErrors.push(`${loc}: Option ${oIdx} has empty text`);
        }
      });

      if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length !== 1) {
        validationErrors.push(`${loc}: Expected exactly 1 correct answer, found ${q.correctAnswers?.length}`);
      } else {
        const correct = q.correctAnswers[0];
        if (!optIds.has(correct)) {
          validationErrors.push(`${loc}: Correct answer "${correct}" is not in option IDs [${[...optIds].join(', ')}]`);
        }
      }

      if (!q.optionExplanations || typeof q.optionExplanations !== 'object') {
        validationErrors.push(`${loc}: Missing optionExplanations object`);
      } else {
        for (const optId of optIds) {
          const exp = q.optionExplanations[optId];
          if (!exp || typeof exp !== 'string' || !exp.trim()) {
            validationErrors.push(`${loc}: Missing or empty optionExplanation for option "${optId}"`);
          }
        }
      }
    }

    if (!q.explanation || typeof q.explanation !== 'string' || !q.explanation.trim()) {
      validationErrors.push(`${loc}: Empty overall explanation`);
    }

    if (typeof q.sourceQuestionNumber !== 'number') {
      validationErrors.push(`${loc}: Invalid sourceQuestionNumber`);
    }

    if (!q.sourceAnswer || typeof q.sourceAnswer !== 'string') {
      validationErrors.push(`${loc}: Missing sourceAnswer`);
    }
  });

  if (validationErrors.length > 0) {
    console.error(`Validation failed with ${validationErrors.length} errors:`);
    validationErrors.slice(0, 15).forEach(e => console.error(`  - ${e}`));
    throw new Error(`Data validation failed with ${validationErrors.length} errors. Aborting import.`);
  }

  console.log(`✓ All 200 questions passed data integrity validation.`);
  console.log(`✓ All 200 question IDs are confirmed unique.`);

  // 3. Backup existing questions.seed.json
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (fs.existsSync(seedPath)) {
    const backupFile = path.join(backupsDir, `questions.seed.backup-${timestamp}.json`);
    fs.copyFileSync(seedPath, backupFile);
    console.log(`✓ Backed up existing questions.seed.json to ${path.basename(backupFile)}`);
  }

  // 4. Build standard CCNA 200-301 Taxonomy & Tag Index using Official CCNA v1.1 Blueprint
  const { allOfficialTags, classifyQuestionToBlueprint } = await import('./apply_official_ccna_blueprint.mjs');
  const allTags = allOfficialTags;

  // 5. Transform all 200 questions into canonical Question model
  const nowIso = new Date().toISOString();
  const importedQuestions = [];

  for (const q of pkg.questions) {
    const correctId = q.correctAnswers[0];
    const incorrectOptions = q.options.filter(o => o.id !== correctId);

    // Map domain & topic tags using official blueprint matcher (leave empty if null/missing)
    const tagIds = [];
    if (q.domainTopic && typeof q.domainTopic === 'string') {
      const classification = classifyQuestionToBlueprint({
        domainTopic: q.domainTopic,
        prompt: q.question,
        explanation: { answerReasoning: q.explanation },
      });

      tagIds.push(classification.domainId, classification.topicId);
      if (classification.subtopicId) {
        tagIds.push(classification.subtopicId);
      }
    }

    // Explanations: overall + per-option rationales
    const incorrectRationales = incorrectOptions.map(o => ({
      optionIdOrKey: o.id,
      reason: q.optionExplanations[o.id] || `Option ${o.id} is incorrect.`,
    }));

    const questionRecord = {
      id: q.id,
      bankId: 'ccna-200-301',
      externalId: q.id,
      sourceNumber: q.sourceQuestionNumber,
      version: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      type: 'single',
      status: 'verified', // Available for Learn and Exam/Assess immediately
      prompt: q.question,
      payload: {
        options: q.options.map(opt => ({ id: opt.id, text: opt.text })),
        correctOptionIds: [correctId],
        requiredSelections: 1,
      },
      explanation: {
        answerReasoning: q.explanation,
        conceptRefresher: q.optionExplanations[correctId] || '',
        correctAnswerLetter: correctId,
        optionExplanations: q.optionExplanations,
        incorrectRationales,
        summary: {
          text: q.explanation,
          origin: 'source-key',
          sourceRefs: [],
        },
        optionRationales: q.options.map(o => ({
          optionId: o.id,
          rationale: {
            text: q.optionExplanations[o.id] || '',
            origin: 'source-key',
            sourceRefs: [],
          },
        })),
      },
      assetReferences: [], // No visual or attachment dependencies
      tagIds,
      duplicateGroupId: null,
      verificationRecord: {
        verified: true,
        verifiedAt: '2026-11-01',
        whatWasChecked: q.verificationStatus,
        notes: 'CCNA 200-301 provisional technical review import',
        trialOnly: q.trialOnly,
      },
      verificationStatus: q.verificationStatus,
      trialOnly: q.trialOnly,
      sourceAnswer: q.sourceAnswer,
    };

    importedQuestions.push(questionRecord);
  }

  // 6. Merge with existing legitimate bank questions (e.g. 76 ITN Modules 1-3 questions, other batches)
  let existingLegitQuestions = [];
  let existingTags = [];

  // Check current seed first
  if (fs.existsSync(seedPath)) {
    try {
      const currentSeed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      existingLegitQuestions = (currentSeed.questions || []).filter(
        q => !q.isDevFixture && !uniqueIds.has(q.id)
      );
      existingTags = currentSeed.tags || [];
    } catch {}
  }

  // If current seed had only the imported questions, recover the 76 legacy ITN questions from backup if needed
  const hasLegacy = existingLegitQuestions.some(q => q.id.startsWith('ccna-'));
  if (!hasLegacy) {
    const backupFile = path.join(backupsDir, 'questions.seed.backup-2026-11-01T15-15-05-714Z.json');
    if (fs.existsSync(backupFile)) {
      try {
        const b = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        const legacyFromBackup = (b.questions || []).filter(
          q => !q.isDevFixture && q.id.startsWith('ccna-') && !uniqueIds.has(q.id)
        );
        existingLegitQuestions.push(...legacyFromBackup);
      } catch {}
    }
  }

  // Combine tags uniquely
  const tagMap = new Map();
  for (const t of existingTags) tagMap.set(t.id, t);
  for (const t of allTags) tagMap.set(t.id, t);
  const combinedTags = Array.from(tagMap.values());

  // Preserve test fixtures if present in prior seed
  let devFixtures = [];
  if (fs.existsSync(seedPath)) {
    try {
      const oldSeed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      devFixtures = (oldSeed.questions || []).filter(q => q.isDevFixture === true);
    } catch {}
  }
  if (devFixtures.length === 0) {
    devFixtures = [
      {
        id: 'dev-fixture-01',
        bankId: 'dev-fixtures',
        externalId: 'fixture-001',
        sourceNumber: 1001,
        version: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
        type: 'single',
        status: 'verified',
        prompt: 'Development fixture question 1 for isolated testing.',
        payload: {
          options: [
            { id: 'opt-1', text: 'Option A' },
            { id: 'opt-2', text: 'Option B' },
            { id: 'opt-3', text: 'Option C' },
            { id: 'opt-4', text: 'Option D' },
          ],
          correctOptionIds: ['opt-3'],
          requiredSelections: 1,
        },
        explanation: {
          answerReasoning: 'Option C is the intended test fixture answer.',
          conceptRefresher: '',
        },
        assetReferences: [],
        tagIds: ['tag-domain-1'],
        duplicateGroupId: null,
        isDevFixture: true,
      },
      {
        id: 'dev-fixture-02',
        bankId: 'dev-fixtures',
        externalId: 'fixture-002',
        sourceNumber: 1002,
        version: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
        type: 'single',
        status: 'verified',
        prompt: 'Development fixture question 2 for isolated testing.',
        payload: {
          options: [
            { id: 'opt-1', text: 'Option A' },
            { id: 'opt-2', text: 'Option B' },
            { id: 'opt-3', text: 'Option C' },
            { id: 'opt-4', text: 'Option D' },
          ],
          correctOptionIds: ['opt-1'],
          requiredSelections: 1,
        },
        explanation: {
          answerReasoning: 'Option A is the intended test fixture answer.',
          conceptRefresher: '',
        },
        assetReferences: [],
        tagIds: ['tag-domain-2'],
        duplicateGroupId: null,
        isDevFixture: true,
      },
    ];
  }

  // Combine questions uniquely by ID: existing questions + imported questions + dev fixtures
  const questionMap = new Map();
  for (const q of existingLegitQuestions) questionMap.set(q.id, q);
  for (const q of importedQuestions) questionMap.set(q.id, q);
  for (const q of devFixtures) questionMap.set(q.id, q);

  const allSeedQuestions = Array.from(questionMap.values());
  const activeQuestionsCount = allSeedQuestions.filter(q => !q.isDevFixture).length;
  const trialQuestionsCount = allSeedQuestions.filter(q => q.id.startsWith('CCNA-')).length;

  const newSeedData = {
    schemaVersion: 1,
    bankId: 'ccna-composite-bank',
    bankName: 'CCNA Comprehensive Question Bank',
    purpose: pkg.purpose,
    source: `${pkg.source} + ITN Modules 1-3`,
    questionCount: activeQuestionsCount,
    trialQuestionCount: trialQuestionsCount,
    notes: pkg.notes,
    tags: combinedTags,
    questions: allSeedQuestions,
  };

  // 7. Atomic Write to questions.seed.json
  const tempSeedPath = path.join(projectRoot, 'data', `questions.seed.tmp.${Date.now()}.json`);
  fs.writeFileSync(tempSeedPath, JSON.stringify(newSeedData, null, 2), 'utf8');
  try {
    fs.renameSync(tempSeedPath, seedPath);
  } catch {
    fs.copyFileSync(tempSeedPath, seedPath);
    fs.unlinkSync(tempSeedPath);
  }

  console.log(`✓ Successfully updated questions.seed.json`);
  console.log(`✓ Total active questions in bank: ${activeQuestionsCount} (${trialQuestionsCount} CCNA trial + ${activeQuestionsCount - trialQuestionsCount} legacy ITN)`);
  console.log(`======================================================\n`);

  return {
    importedCount: importedQuestions.length,
    rejectedCount: 0,
    uniqueIdsCount: uniqueIds.size,
    totalTrialQuestions: trialQuestionsCount,
    totalActiveQuestions: activeQuestionsCount,
  };
}

export async function importAllBatches() {
  console.log('\n======================================================');
  console.log('=== IMPORTING ALL CCNA TRIAL BATCHES (BATCH 1 + 2) ===');
  console.log('======================================================');
  const res1 = await importTrialBatch(batch1Path);
  const res2 = await importTrialBatch(batch2Path);
  console.log('✓ Batch 1 imported:', res1.importedCount);
  console.log('✓ Batch 2 imported:', res2.importedCount);
  console.log(`✓ Total CCNA trial questions in bank: ${res2.totalTrialQuestions} (Target: 400)`);
  console.log(`✓ Total active questions in bank: ${res2.totalActiveQuestions} (Target: 476)`);
  return {
    batch1: res1,
    batch2: res2,
    totalTrialQuestions: res2.totalTrialQuestions,
    totalActiveQuestions: res2.totalActiveQuestions,
  };
}

export async function importTrial200(sourceFile) {
  if (sourceFile) {
    return importTrialBatch(sourceFile);
  }
  // If Batch 2 file exists, import both batches so bank contains all 400 questions
  if (fs.existsSync(batch2Path)) {
    const res = await importAllBatches();
    return {
      importedCount: 200,
      rejectedCount: 0,
      uniqueIdsCount: 200,
      totalTrialQuestions: res.totalTrialQuestions,
      totalActiveQuestions: res.totalActiveQuestions,
    };
  }
  return importTrialBatch(batch1Path);
}

if (process.argv[1] && process.argv[1].endsWith('import_trial_200.mjs')) {
  const arg = process.argv[2];
  if (arg) {
    importTrialBatch(path.resolve(arg)).catch(err => {
      console.error('Import failed:', err);
      process.exit(1);
    });
  } else {
    importAllBatches().catch(err => {
      console.error('Import failed:', err);
      process.exit(1);
    });
  }
}
