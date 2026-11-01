import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('ingestion/ccna_trial_import_200.json', 'utf8'));

console.log('Top level properties:', Object.keys(data));
console.log('Question count reported in JSON:', data.questionCount);
console.log('Questions array length:', data.questions.length);

const errors = [];
const ids = new Set();

data.questions.forEach((q, idx) => {
  const prefix = `Q[${idx}] (id: ${q.id})`;
  
  // ID check
  if (!q.id || typeof q.id !== 'string' || !q.id.trim()) {
    errors.push(`${prefix}: missing or empty ID`);
  } else if (ids.has(q.id)) {
    errors.push(`${prefix}: duplicate ID "${q.id}"`);
  } else {
    ids.add(q.id);
  }

  // Type check
  if (q.type !== 'single_choice') {
    errors.push(`${prefix}: unexpected type "${q.type}", expected "single_choice"`);
  }

  // Question stem
  if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
    errors.push(`${prefix}: empty question stem`);
  }

  // Options check
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push(`${prefix}: options count is ${q.options ? q.options.length : 'none'}, expected 4`);
  } else {
    const optIds = new Set();
    q.options.forEach((opt, oIdx) => {
      if (!opt.id || typeof opt.id !== 'string') {
        errors.push(`${prefix}: option[${oIdx}] has invalid id`);
      } else if (optIds.has(opt.id)) {
        errors.push(`${prefix}: duplicate option id "${opt.id}"`);
      } else {
        optIds.add(opt.id);
      }

      if (!opt.text || typeof opt.text !== 'string' || !opt.text.trim()) {
        errors.push(`${prefix}: option[${oIdx}] has empty text`);
      }
    });

    // Correct answers
    if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length !== 1) {
      errors.push(`${prefix}: correctAnswers count is ${q.correctAnswers?.length}, expected 1`);
    } else {
      const correct = q.correctAnswers[0];
      if (!optIds.has(correct)) {
        errors.push(`${prefix}: correct answer "${correct}" not in option IDs [${[...optIds].join(', ')}]`);
      }
    }

    // Option explanations
    if (!q.optionExplanations || typeof q.optionExplanations !== 'object') {
      errors.push(`${prefix}: missing or invalid optionExplanations`);
    } else {
      for (const optId of optIds) {
        const exp = q.optionExplanations[optId];
        if (!exp || typeof exp !== 'string' || !exp.trim()) {
          errors.push(`${prefix}: missing or empty optionExplanation for option "${optId}"`);
        }
      }
    }
  }

  // Overall explanation
  if (!q.explanation || typeof q.explanation !== 'string' || !q.explanation.trim()) {
    errors.push(`${prefix}: empty overall explanation`);
  }

  // Source question number
  if (typeof q.sourceQuestionNumber !== 'number') {
    errors.push(`${prefix}: sourceQuestionNumber is not a number`);
  }

  // Source answer
  if (!q.sourceAnswer || typeof q.sourceAnswer !== 'string') {
    errors.push(`${prefix}: sourceAnswer missing`);
  }
});

console.log('Total unique IDs:', ids.size);
console.log('Total validation errors:', errors.length);
if (errors.length > 0) {
  console.log('First 10 errors:', errors.slice(0, 10));
} else {
  console.log('ALL 200 QUESTIONS PASSED ALL INTEGRITY CHECKS PERFECTLY!');
}
