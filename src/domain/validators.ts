import type {
  Question,
  QuestionType,
  QuestionStatus,
  SingleChoicePayload,
  MultiChoicePayload,
  MatchingPayload,
  OrderingPayload,
  ClientAnswer,
  ConfidenceLevel,
} from './types.ts';
import { SCHEMA_VERSION } from './types.ts';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateQuestion(q: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!q || typeof q !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: 'Question must be a non-null object' }] };
  }

  const record = q as Record<string, unknown>;

  if (typeof record.id !== 'string' || !record.id.trim()) {
    errors.push({ field: 'id', message: 'Question id is required and must be a non-empty string' });
  }

  if (typeof record.bankId !== 'string' || !record.bankId.trim()) {
    errors.push({ field: 'bankId', message: 'Question bankId is required and must be a non-empty string' });
  }

  if (typeof record.externalId !== 'string' || !record.externalId.trim()) {
    errors.push({ field: 'externalId', message: 'Question externalId is required and must be a non-empty string' });
  }

  if (typeof record.sourceNumber !== 'number' || record.sourceNumber < 1) {
    errors.push({ field: 'sourceNumber', message: 'sourceNumber must be a positive integer' });
  }

  if (typeof record.version !== 'number' || record.version < 1) {
    errors.push({ field: 'version', message: 'version must be a positive integer' });
  }

  const validStatuses: QuestionStatus[] = ['unverified', 'verified', 'needs-source'];
  if (typeof record.status !== 'string' || !validStatuses.includes(record.status as QuestionStatus)) {
    errors.push({ field: 'status', message: `status must be one of: ${validStatuses.join(', ')}` });
  }

  if (record.status === 'needs-source') {
    if (typeof record.needsSourceReason !== 'string' || !record.needsSourceReason.trim()) {
      errors.push({ field: 'needsSourceReason', message: 'needsSourceReason is required when status is "needs-source"' });
    }
    // If status is needs-source, we preserve the record without requiring publishable validation
    return { valid: errors.length === 0, errors };
  }

  if (typeof record.prompt !== 'string' || !record.prompt.trim()) {
    errors.push({ field: 'prompt', message: 'prompt must be a non-empty string' });
  }

  const validTypes: QuestionType[] = ['single', 'multi', 'matching', 'ordering'];
  if (typeof record.type !== 'string' || !validTypes.includes(record.type as QuestionType)) {
    errors.push({ field: 'type', message: `type must be one of: ${validTypes.join(', ')}` });
    return { valid: false, errors };
  }

  const type = record.type as QuestionType;
  const payload = record.payload as Record<string, unknown> | undefined;

  if (!payload || typeof payload !== 'object') {
    errors.push({ field: 'payload', message: 'payload must be an object' });
    return { valid: false, errors };
  }

  if (type === 'single') {
    validateSinglePayload(payload as unknown as SingleChoicePayload, errors);
  } else if (type === 'multi') {
    validateMultiPayload(payload as unknown as MultiChoicePayload, errors);
  } else if (type === 'matching') {
    validateMatchingPayload(payload as unknown as MatchingPayload, errors);
  } else if (type === 'ordering') {
    validateOrderingPayload(payload as unknown as OrderingPayload, errors);
  }

  return { valid: errors.length === 0, errors };
}

function validateSinglePayload(payload: SingleChoicePayload, errors: ValidationError[]): void {
  if (!Array.isArray(payload.options) || payload.options.length < 2) {
    errors.push({ field: 'payload.options', message: 'Single choice questions must have at least 2 options' });
    return;
  }

  const ids = new Set<string>();
  for (let i = 0; i < payload.options.length; i++) {
    const opt = payload.options[i];
    if (!opt || typeof opt.id !== 'string' || !opt.id.trim()) {
      errors.push({ field: `payload.options[${i}].id`, message: 'Option must have a non-empty id' });
    } else if (ids.has(opt.id)) {
      errors.push({ field: `payload.options[${i}].id`, message: `Duplicate option id: ${opt.id}` });
    } else {
      ids.add(opt.id);
    }
    if (!opt || typeof opt.text !== 'string' || !opt.text.trim()) {
      errors.push({ field: `payload.options[${i}].text`, message: 'Option must have non-empty text' });
    }
  }

  if (!Array.isArray(payload.correctOptionIds) || payload.correctOptionIds.length !== 1) {
    errors.push({ field: 'payload.correctOptionIds', message: 'Single choice questions must have exactly 1 correctOptionId' });
  } else {
    const correctId = payload.correctOptionIds[0];
    if (!ids.has(correctId)) {
      errors.push({ field: 'payload.correctOptionIds', message: `correctOptionId "${correctId}" does not exist in options` });
    }
  }
}

function validateMultiPayload(payload: MultiChoicePayload, errors: ValidationError[]): void {
  if (!Array.isArray(payload.options) || payload.options.length < 3) {
    errors.push({ field: 'payload.options', message: 'Multi choice questions must have at least 3 options' });
    return;
  }

  const ids = new Set<string>();
  for (let i = 0; i < payload.options.length; i++) {
    const opt = payload.options[i];
    if (!opt || typeof opt.id !== 'string' || !opt.id.trim()) {
      errors.push({ field: `payload.options[${i}].id`, message: 'Option must have a non-empty id' });
    } else if (ids.has(opt.id)) {
      errors.push({ field: `payload.options[${i}].id`, message: `Duplicate option id: ${opt.id}` });
    } else {
      ids.add(opt.id);
    }
  }

  if (typeof payload.requiredSelections !== 'number' || payload.requiredSelections < 2 || payload.requiredSelections >= payload.options.length) {
    errors.push({
      field: 'payload.requiredSelections',
      message: `requiredSelections must be between 2 and ${payload.options.length - 1}`,
    });
  }

  if (!Array.isArray(payload.correctOptionIds) || payload.correctOptionIds.length !== payload.requiredSelections) {
    errors.push({
      field: 'payload.correctOptionIds',
      message: `correctOptionIds count (${payload.correctOptionIds?.length}) must equal requiredSelections (${payload.requiredSelections})`,
    });
  } else {
    for (const cId of payload.correctOptionIds) {
      if (!ids.has(cId)) {
        errors.push({ field: 'payload.correctOptionIds', message: `correctOptionId "${cId}" does not exist in options` });
      }
    }
  }
}

function validateMatchingPayload(payload: MatchingPayload, errors: ValidationError[]): void {
  if (!Array.isArray(payload.prompts) || payload.prompts.length < 2) {
    errors.push({ field: 'payload.prompts', message: 'Matching questions must have at least 2 prompts' });
    return;
  }

  if (!Array.isArray(payload.choices) || payload.choices.length < 2) {
    errors.push({ field: 'payload.choices', message: 'Matching questions must have at least 2 choices' });
    return;
  }

  const promptIds = new Set<string>();
  for (let i = 0; i < payload.prompts.length; i++) {
    const p = payload.prompts[i];
    if (!p || typeof p.id !== 'string' || !p.id.trim()) {
      errors.push({ field: `payload.prompts[${i}].id`, message: 'Prompt must have a non-empty id' });
    } else if (promptIds.has(p.id)) {
      errors.push({ field: `payload.prompts[${i}].id`, message: `Duplicate prompt id: ${p.id}` });
    } else {
      promptIds.add(p.id);
    }
  }

  const choiceIds = new Set<string>();
  for (let i = 0; i < payload.choices.length; i++) {
    const c = payload.choices[i];
    if (!c || typeof c.id !== 'string' || !c.id.trim()) {
      errors.push({ field: `payload.choices[${i}].id`, message: 'Choice must have a non-empty id' });
    } else if (choiceIds.has(c.id)) {
      errors.push({ field: `payload.choices[${i}].id`, message: `Duplicate choice id: ${c.id}` });
    } else {
      choiceIds.add(c.id);
    }
  }

  if (!payload.correctMapping && Array.isArray(payload.correctMatches)) {
    payload.correctMapping = Object.fromEntries(
      payload.correctMatches.map(m => [m.promptId, m.choiceId])
    );
  }

  if (!payload.correctMapping || typeof payload.correctMapping !== 'object') {
    errors.push({ field: 'payload.correctMapping', message: 'correctMapping must be an object' });
    return;
  }

  for (const promptId of promptIds) {
    if (!(promptId in payload.correctMapping)) {
      errors.push({ field: 'payload.correctMapping', message: `Missing mapping for prompt "${promptId}"` });
      continue;
    }
    const mappedChoiceId = payload.correctMapping[promptId];
    if (mappedChoiceId !== null && !choiceIds.has(mappedChoiceId)) {
      errors.push({ field: 'payload.correctMapping', message: `Mapped choice "${mappedChoiceId}" for prompt "${promptId}" does not exist` });
    }
  }
}

function validateOrderingPayload(payload: OrderingPayload, errors: ValidationError[]): void {
  if (!Array.isArray(payload.items) || payload.items.length < 2) {
    errors.push({ field: 'payload.items', message: 'Ordering questions must have at least 2 items' });
    return;
  }

  const itemIds = new Set<string>();
  for (let i = 0; i < payload.items.length; i++) {
    const item = payload.items[i];
    if (!item || typeof item.id !== 'string' || !item.id.trim()) {
      errors.push({ field: `payload.items[${i}].id`, message: 'Item must have a non-empty id' });
    } else if (itemIds.has(item.id)) {
      errors.push({ field: `payload.items[${i}].id`, message: `Duplicate item id: ${item.id}` });
    } else {
      itemIds.add(item.id);
    }
  }

  const distractorCount = Array.isArray(payload.distractorItemIds) ? payload.distractorItemIds.length : 0;
  if (!Array.isArray(payload.correctOrderIds) || (payload.correctOrderIds.length + distractorCount) !== payload.items.length) {
    errors.push({
      field: 'payload.correctOrderIds',
      message: `correctOrderIds length (${payload.correctOrderIds?.length}) plus distractors (${distractorCount}) must equal items count (${payload.items.length})`,
    });
    return;
  }

  const orderedSet = new Set(payload.correctOrderIds);
  if (orderedSet.size !== payload.correctOrderIds.length) {
    errors.push({ field: 'payload.correctOrderIds', message: 'correctOrderIds must contain unique item ids' });
  }

  for (const id of payload.correctOrderIds) {
    if (!itemIds.has(id)) {
      errors.push({ field: 'payload.correctOrderIds', message: `correctOrderId "${id}" does not exist in items` });
    }
  }

  if (Array.isArray(payload.distractorItemIds)) {
    for (const dId of payload.distractorItemIds) {
      if (!itemIds.has(dId)) {
        errors.push({ field: 'payload.distractorItemIds', message: `distractorItemId "${dId}" does not exist in items` });
      }
    }
  }
}

export function validateClientAnswer(answer: unknown, question: Question): ValidationResult {
  const errors: ValidationError[] = [];
  if (!answer || typeof answer !== 'object') {
    return { valid: false, errors: [{ field: 'answer', message: 'Answer must be a non-null object' }] };
  }

  const ca = answer as ClientAnswer;
  if (ca.type !== question.type) {
    return { valid: false, errors: [{ field: 'type', message: `Answer type "${ca.type}" does not match question type "${question.type}"` }] };
  }

  if (question.type === 'single') {
    const payload = question.payload as SingleChoicePayload;
    const singleAns = ca as { type: 'single'; selectedOptionId: string };
    if (typeof singleAns.selectedOptionId !== 'string' || !singleAns.selectedOptionId.trim()) {
      errors.push({ field: 'selectedOptionId', message: 'selectedOptionId is required' });
    } else if (!payload.options.some(o => o.id === singleAns.selectedOptionId)) {
      errors.push({ field: 'selectedOptionId', message: `Option "${singleAns.selectedOptionId}" is not a valid option` });
    }
  } else if (question.type === 'multi') {
    const payload = question.payload as MultiChoicePayload;
    const multiAns = ca as { type: 'multi'; selectedOptionIds: string[] };
    if (!Array.isArray(multiAns.selectedOptionIds)) {
      errors.push({ field: 'selectedOptionIds', message: 'selectedOptionIds must be an array' });
    } else {
      const validIds = new Set(payload.options.map(o => o.id));
      for (const id of multiAns.selectedOptionIds) {
        if (!validIds.has(id)) {
          errors.push({ field: 'selectedOptionIds', message: `Option "${id}" is not a valid option` });
        }
      }
    }
  } else if (question.type === 'matching') {
    const payload = question.payload as MatchingPayload;
    const matchAns = ca as { type: 'matching'; mapping: Record<string, string | null> };
    if (!matchAns.mapping || typeof matchAns.mapping !== 'object') {
      errors.push({ field: 'mapping', message: 'mapping must be an object' });
    } else {
      const promptIds = new Set(payload.prompts.map(p => p.id));
      const choiceIds = new Set(payload.choices.map(c => c.id));
      for (const [pId, cId] of Object.entries(matchAns.mapping)) {
        if (!promptIds.has(pId)) {
          errors.push({ field: `mapping.${pId}`, message: `Prompt "${pId}" is not a valid prompt` });
        }
        if (cId !== null && !choiceIds.has(cId)) {
          errors.push({ field: `mapping.${pId}`, message: `Choice "${cId}" is not a valid choice` });
        }
      }
    }
  } else if (question.type === 'ordering') {
    const payload = question.payload as OrderingPayload;
    const orderAns = ca as { type: 'ordering'; orderedItemIds: string[] };
    if (!Array.isArray(orderAns.orderedItemIds)) {
      errors.push({ field: 'orderedItemIds', message: 'orderedItemIds must be an array' });
    } else {
      const validIds = new Set(payload.items.map(i => i.id));
      for (const id of orderAns.orderedItemIds) {
        if (!validIds.has(id)) {
          errors.push({ field: 'orderedItemIds', message: `Item "${id}" is not a valid item` });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateConfidence(c: unknown): c is ConfidenceLevel {
  return typeof c === 'string' && ['confident', 'unsure', 'guessed'].includes(c);
}

export function validateUserDataStore(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: 'Data must be a non-null object' }] };
  }

  const store = data as Record<string, unknown>;
  if (typeof store.schemaVersion !== 'number') {
    errors.push({ field: 'schemaVersion', message: 'schemaVersion is required' });
  } else if (store.schemaVersion > SCHEMA_VERSION) {
    errors.push({ field: 'schemaVersion', message: `Unsupported future schema version ${store.schemaVersion}. Current max supported is ${SCHEMA_VERSION}.` });
  }

  if (typeof store.userId !== 'string') {
    errors.push({ field: 'userId', message: 'userId is required' });
  }

  if (!Array.isArray(store.questions)) {
    errors.push({ field: 'questions', message: 'questions must be an array' });
  }

  return { valid: errors.length === 0, errors };
}
