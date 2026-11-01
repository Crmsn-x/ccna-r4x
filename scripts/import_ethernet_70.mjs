import fs from 'node:fs';
import path from 'node:path';
import { validateQuestion } from '../src/domain/validators.ts';
import { classifyQuestionToBlueprint, allOfficialTags } from './apply_official_ccna_blueprint.mjs';

const projectRoot = process.cwd();
export const ethernetImportPath = path.join(projectRoot, 'ingestion', 'ccna_ethernet_concepts_70_single_import.json');
const seedPath = path.join(projectRoot, 'data', 'questions.seed.json');
const backupsDir = path.join(projectRoot, 'data', 'backups');

export async function importEthernet70(sourceFile = ethernetImportPath) {
  console.log(`\n======================================================`);
  console.log(`=== IMPORTING ETHERNET CONCEPTS: 70 QUESTIONS ===`);
  console.log(`======================================================`);
  console.log(`Source file: ${sourceFile}`);

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found at: ${sourceFile}`);
  }

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

  if (pkg.questions.length !== 70) {
    throw new Error(`Expected exactly 70 questions in source file, but found ${pkg.questions.length}`);
  }

  // 1. Validate assets on disk
  const expectedAssets = [
    '/question-assets/ethernet-concepts/itn-m4-7-005.jpeg',
    '/question-assets/ethernet-concepts/itn-m4-7-010.jpeg',
    '/question-assets/ethernet-concepts/itn-m4-7-012.jpeg',
    '/question-assets/ethernet-concepts/itn-m4-7-030.png',
    '/question-assets/ethernet-concepts/itn-m4-7-045.png',
    '/question-assets/ethernet-concepts/itn-m4-7-046.png',
  ];

  for (const assetPath of expectedAssets) {
    const fullDiskPath = path.join(projectRoot, 'public', assetPath);
    if (!fs.existsSync(fullDiskPath)) {
      throw new Error(`Required asset missing on disk: ${fullDiskPath}`);
    }
  }
  console.log(`✓ All ${expectedAssets.length} question assets verified on disk.`);

  // 2. Validate Questions Integrity
  const validationErrors = [];
  const uniqueIds = new Set();
  const nowIso = new Date().toISOString();
  const canonicalQuestions = [];

  for (let idx = 0; idx < pkg.questions.length; idx++) {
    const q = pkg.questions[idx];
    const loc = `Question [${idx}] (id: ${q.id || 'MISSING'})`;

    if (!q.id || typeof q.id !== 'string' || !q.id.trim()) {
      validationErrors.push(`${loc}: Missing or invalid id`);
      continue;
    }
    if (uniqueIds.has(q.id)) {
      validationErrors.push(`${loc}: Duplicate question id "${q.id}"`);
      continue;
    }
    uniqueIds.add(q.id);

    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
      validationErrors.push(`${loc}: Missing question prompt`);
    }

    if (!q.explanation || typeof q.explanation !== 'string' || !q.explanation.trim()) {
      validationErrors.push(`${loc}: Missing overall explanation`);
    }

    // Determine canonical question type
    let canonicalType;
    let payload;

    if (q.type === 'single_choice') {
      canonicalType = 'single';
      if (!Array.isArray(q.options) || q.options.length < 2) {
        validationErrors.push(`${loc}: single_choice must have at least 2 options`);
      }
      if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length !== 1) {
        validationErrors.push(`${loc}: single_choice must have exactly 1 correct answer`);
      }
      payload = {
        options: (q.options || []).map(o => ({ id: o.id, text: o.text })),
        correctOptionIds: q.correctAnswers || [],
        requiredSelections: 1,
      };
    } else if (q.type === 'multiple_choice') {
      canonicalType = 'multi';
      if (!Array.isArray(q.options) || q.options.length < 3) {
        validationErrors.push(`${loc}: multiple_choice must have at least 3 options`);
      }
      const required = q.requiredSelectionCount || q.correctAnswers?.length || 2;
      if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length !== required) {
        validationErrors.push(`${loc}: multiple_choice correctAnswers count (${q.correctAnswers?.length}) does not match required (${required})`);
      }
      payload = {
        options: (q.options || []).map(o => ({ id: o.id, text: o.text })),
        correctOptionIds: q.correctAnswers || [],
        requiredSelections: required,
      };
    } else if (q.type === 'matching') {
      canonicalType = 'matching';
      if (!Array.isArray(q.matchingTargets) || q.matchingTargets.length < 2) {
        validationErrors.push(`${loc}: matching question must have matchingTargets`);
      }
      if (!Array.isArray(q.matchingPairs) || q.matchingPairs.length < 2) {
        validationErrors.push(`${loc}: matching question must have matchingPairs`);
      }
      const prompts = (q.matchingPairs || []).map(p => ({ id: p.id, text: p.prompt }));
      const choices = (q.matchingTargets || []).map(t => ({ id: t.id, text: t.text }));
      const correctMapping = Object.fromEntries(
        (q.matchingPairs || []).map(p => [p.id, p.correctTargetId])
      );
      payload = {
        prompts,
        choices,
        correctMapping,
        correctMatches: (q.matchingPairs || []).map(p => ({ promptId: p.id, choiceId: p.correctTargetId })),
        allowChoiceReuse: true,
      };
    } else {
      validationErrors.push(`${loc}: Unsupported question type "${q.type}"`);
      continue;
    }

    // Taxonomy blueprint mapping
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

    // Asset references
    const assetReferences = [];
    const rawAssets = [...(q.referenceAssets || []), ...(q.exhibitAssets || [])];
    rawAssets.forEach((a, aIdx) => {
      assetReferences.push({
        id: `asset-${q.id}-${aIdx + 1}`,
        type: 'image',
        url: a.src,
        caption: a.alt,
        altText: a.alt,
        originalFileName: path.basename(a.src),
      });
    });

    // Incorrect rationales
    let incorrectRationales = [];
    if (canonicalType === 'single') {
      const correct = q.correctAnswers[0];
      incorrectRationales = (q.options || [])
        .filter(o => o.id !== correct)
        .map(o => ({
          optionIdOrKey: o.id,
          reason: q.optionExplanations?.[o.id] || `Option ${o.id} is incorrect.`,
        }));
    } else if (canonicalType === 'multi') {
      const correctSet = new Set(q.correctAnswers || []);
      incorrectRationales = (q.options || [])
        .filter(o => !correctSet.has(o.id))
        .map(o => ({
          optionIdOrKey: o.id,
          reason: q.optionExplanations?.[o.id] || `Option ${o.id} is incorrect.`,
        }));
    }

    const canonicalRecord = {
      id: q.id,
      bankId: 'ccna-200-301',
      externalId: q.id,
      sourceNumber: q.sourceQuestionNumber || idx + 1,
      version: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      type: canonicalType,
      status: 'verified',
      prompt: q.question,
      payload,
      explanation: {
        answerReasoning: q.explanation,
        conceptRefresher: q.optionExplanations?.[q.correctAnswers?.[0]] || '',
        correctAnswerLetter: q.correctAnswers?.join(', ') || '',
        optionExplanations: q.optionExplanations || {},
        incorrectRationales,
        summary: {
          text: q.explanation,
          origin: 'source-key',
          sourceRefs: [],
        },
      },
      assetReferences,
      tagIds,
      duplicateGroupId: null,
      verificationRecord: {
        verified: true,
        verifiedAt: '2026-11-01',
        whatWasChecked: q.verificationStatus,
        notes: 'CCNA 1 v7 Modules 4-7 Ethernet Concepts provisional review',
        trialOnly: q.trialOnly ?? true,
      },
      verificationStatus: q.verificationStatus,
      trialOnly: q.trialOnly ?? true,
      sourceAnswer: q.sourceAnswer,
      source: q.source,
    };

    const val = validateQuestion(canonicalRecord);
    if (!val.valid) {
      validationErrors.push(`${loc} canonical validation failed: ${val.errors.map(e => e.message).join('; ')}`);
    } else {
      canonicalQuestions.push(canonicalRecord);
    }
  }

  if (validationErrors.length > 0) {
    console.error(`Validation failed with ${validationErrors.length} errors:`);
    validationErrors.slice(0, 15).forEach(e => console.error(`  - ${e}`));
    throw new Error(`Data validation failed with ${validationErrors.length} errors. Aborting import.`);
  }

  console.log(`✓ All 70 questions passed strict canonical validation.`);
  console.log(`✓ All 70 question IDs are confirmed unique.`);

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

  // 4. Upsert questions into questions.seed.json
  let existingQuestions = [];
  let existingTags = [];

  if (fs.existsSync(seedPath)) {
    const currentSeed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    existingQuestions = currentSeed.questions || [];
    existingTags = currentSeed.tags || [];
  }

  // Build question map keyed on id for idempotent upsert
  const questionMap = new Map();
  for (const q of existingQuestions) {
    questionMap.set(q.id, q);
  }
  for (const q of canonicalQuestions) {
    questionMap.set(q.id, q);
  }

  // Build tag map
  const tagMap = new Map();
  for (const t of existingTags) tagMap.set(t.id, t);
  for (const t of allOfficialTags) tagMap.set(t.id, t);

  const mergedQuestions = Array.from(questionMap.values());
  const activeQuestions = mergedQuestions.filter(q => !q.isDevFixture);

  const updatedSeed = {
    schemaVersion: 1,
    bankId: 'ccna-composite-bank',
    bankName: 'CCNA Comprehensive Question Bank',
    purpose: 'CCNA 200-301 composite question bank including Ethernet Concepts',
    source: 'CCNA 200-301 + CCNA 1 v7 Modules 4-7 Ethernet Concepts',
    questionCount: activeQuestions.length,
    notes: 'Preserves prior trial questions, ITN modules 1-3, and newly ingested Ethernet Concepts questions.',
    tags: Array.from(tagMap.values()),
    questions: mergedQuestions,
  };

  // Atomic write
  const tempPath = path.join(projectRoot, 'data', `questions.seed.tmp.${Date.now()}.json`);
  fs.writeFileSync(tempPath, JSON.stringify(updatedSeed, null, 2), 'utf8');
  try {
    fs.renameSync(tempPath, seedPath);
  } catch {
    fs.copyFileSync(tempPath, seedPath);
    fs.unlinkSync(tempPath);
  }

  console.log(`✓ Successfully updated questions.seed.json`);
  console.log(`✓ Total active questions in question bank: ${activeQuestions.length}`);
  console.log(`======================================================\n`);

  return {
    importedCount: canonicalQuestions.length,
    totalActiveQuestions: activeQuestions.length,
    uniqueIdsCount: uniqueIds.size,
  };
}

if (process.argv[1] && process.argv[1].endsWith('import_ethernet_70.mjs')) {
  importEthernet70().catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
  });
}
