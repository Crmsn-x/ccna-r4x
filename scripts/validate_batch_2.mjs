import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const newSourcePath = path.join(projectRoot, 'ingestion', 'ccna_trial_import_additional_200.json');
const seedPath = path.join(projectRoot, 'data', 'questions.seed.json');

console.log('Validating Batch 2 source file:', newSourcePath);

if (!fs.existsSync(newSourcePath)) {
  console.error('File not found:', newSourcePath);
  process.exit(1);
}

const rawText = fs.readFileSync(newSourcePath, 'utf8');
let pkg;
try {
  pkg = JSON.parse(rawText);
} catch (e) {
  console.error('JSON parse error:', e.message);
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const batch1Path = path.join(projectRoot, 'ingestion', 'ccna_trial_import_200.json');
const batch1 = JSON.parse(fs.readFileSync(batch1Path, 'utf8'));
const priorBatchIds = new Set(batch1.questions.map(q => q.id));
const legacyIds = new Set(seed.questions.filter(q => q.id.startsWith('ccna-')).map(q => q.id));

console.log('Batch 1 source questions count:', batch1.questions.length);
console.log('Legacy (ccna-xxx) count in seed:', legacyIds.size);
console.log('Dev fixtures count in seed:', seed.questions.filter(q => q.isDevFixture).length);
console.log('Questions declared in Batch 2 JSON:', pkg.questions ? pkg.questions.length : 0);

const errors = [];
const newIds = new Set();

if (!Array.isArray(pkg.questions)) {
  errors.push('pkg.questions is not an array');
} else if (pkg.questions.length !== 200) {
  errors.push(`Expected exactly 200 questions in Batch 2, found ${pkg.questions.length}`);
} else {
  pkg.questions.forEach((q, idx) => {
    const loc = `Question [${idx}] (${q.id || 'NO-ID'})`;

    if (!q.id || typeof q.id !== 'string' || !q.id.trim()) {
      errors.push(`${loc}: Missing or empty id`);
    } else if (newIds.has(q.id)) {
      errors.push(`${loc}: Duplicate id within Batch 2: "${q.id}"`);
    } else {
      newIds.add(q.id);
    }

    if (priorBatchIds.has(q.id)) {
      errors.push(`${loc}: ID collision with Batch 1 question: "${q.id}"`);
    }
    if (legacyIds.has(q.id)) {
      errors.push(`${loc}: ID collision with legacy question: "${q.id}"`);
    }

    if (q.type !== 'single_choice') {
      errors.push(`${loc}: Unexpected question type "${q.type}", expected "single_choice"`);
    }

    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
      errors.push(`${loc}: Empty question stem`);
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`${loc}: Options count is ${q.options ? q.options.length : 0}, expected exactly 4`);
    } else {
      const optIds = new Set();
      q.options.forEach((opt, oIdx) => {
        if (!opt || !opt.id || typeof opt.id !== 'string' || !opt.id.trim()) {
          errors.push(`${loc}: Option ${oIdx} has invalid id`);
        } else if (optIds.has(opt.id)) {
          errors.push(`${loc}: Duplicate option id "${opt.id}"`);
        } else {
          optIds.add(opt.id);
        }

        if (!opt || !opt.text || typeof opt.text !== 'string' || !opt.text.trim()) {
          errors.push(`${loc}: Option "${opt ? opt.id : oIdx}" has empty text`);
        }
      });

      if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length !== 1) {
        errors.push(`${loc}: Expected exactly 1 correct answer, found ${q.correctAnswers?.length}`);
      } else {
        const correct = q.correctAnswers[0];
        if (!optIds.has(correct)) {
          errors.push(`${loc}: Correct answer "${correct}" is not in options [${[...optIds].join(', ')}]`);
        }
      }

      if (!q.optionExplanations || typeof q.optionExplanations !== 'object') {
        errors.push(`${loc}: Missing optionExplanations object`);
      } else {
        for (const optId of optIds) {
          const exp = q.optionExplanations[optId];
          if (!exp || typeof exp !== 'string' || !exp.trim()) {
            errors.push(`${loc}: Missing or empty explanation for option "${optId}"`);
          }
        }
      }
    }

    if (!q.explanation || typeof q.explanation !== 'string' || !q.explanation.trim()) {
      errors.push(`${loc}: Empty overall explanation`);
    }

    if (typeof q.sourceQuestionNumber !== 'number') {
      errors.push(`${loc}: Invalid sourceQuestionNumber`);
    }

    if (!q.sourceAnswer || typeof q.sourceAnswer !== 'string') {
      errors.push(`${loc}: Missing sourceAnswer`);
    }

    if (/refer to the exhibit|shown in the exhibit|in the exhibit below|exhibit indicates/i.test(q.question)) {
      errors.push(`${loc}: Mentions unavailable exhibit or diagram`);
    }
  });
}

console.log('\n--- VALIDATION SUMMARY ---');
console.log('Total new unique IDs:', newIds.size);
console.log('Total validation errors:', errors.length);

if (errors.length > 0) {
  console.error('\nErrors found:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('\n✓ PERFECT: All 200 questions in ccna_trial_import_additional_200.json passed all validation rules!');
  process.exit(0);
}
