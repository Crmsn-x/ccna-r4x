import fs from 'node:fs';
import { validateQuestion } from '../src/domain/validators.ts';

const seed = JSON.parse(fs.readFileSync('data/questions.seed.json', 'utf8'));

console.log(`Schema version: ${seed.schemaVersion}`);
console.log(`Bank ID: ${seed.bankId}`);
console.log(`Total questions: ${seed.questions.length}`);

let invalidCount = 0;
for (const q of seed.questions) {
  const result = validateQuestion(q);
  if (!result.valid) {
    invalidCount++;
    console.error(`Invalid question Q${q.sourceNumber} (id: ${q.id}):`, result.errors);
  }
}

if (invalidCount === 0) {
  console.log('✓ All questions in seed passed validation!');
} else {
  console.error(`✗ ${invalidCount} questions failed validation!`);
  process.exit(1);
}
