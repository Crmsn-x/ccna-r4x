import type {
  Question,
  ImmutableQuestionSnapshot,
  SingleChoicePayload,
  MultiChoicePayload,
  MatchingPayload,
  OrderingPayload,
} from './types.ts';

/**
 * Creates a sanitized question snapshot for the client during study sessions.
 * Completely strips correctOptionIds, correctMapping, correctOrderIds, and explanations.
 */
export function sanitizeQuestionForSession(question: Question): ImmutableQuestionSnapshot {
  let sanitizedPayload: ImmutableQuestionSnapshot['payload'];

  switch (question.type) {
    case 'single': {
      const p = question.payload as SingleChoicePayload;
      sanitizedPayload = {
        options: p.options.map(o => ({ id: o.id, text: o.text })),
      };
      break;
    }
    case 'multi': {
      const p = question.payload as MultiChoicePayload;
      sanitizedPayload = {
        options: p.options.map(o => ({ id: o.id, text: o.text })),
        requiredSelections: p.requiredSelections,
      };
      break;
    }
    case 'matching': {
      const p = question.payload as MatchingPayload;
      sanitizedPayload = {
        prompts: p.prompts.map(prompt => ({ id: prompt.id, text: prompt.text })),
        choices: p.choices.map(choice => ({ id: choice.id, text: choice.text })),
        allowChoiceReuse: p.allowChoiceReuse,
      };
      break;
    }
    case 'ordering': {
      const p = question.payload as OrderingPayload;
      // In ordering questions, provide items in the original authored order or a stable order
      sanitizedPayload = {
        items: p.items.map(item => ({ id: item.id, text: item.text })),
      };
      break;
    }
    default:
      throw new Error(`Unknown question type: ${question.type}`);
  }

  return {
    questionId: question.id,
    version: question.version,
    type: question.type,
    prompt: question.prompt,
    structuredBlocks: question.structuredBlocks,
    assetReferences: question.assetReferences,
    tagIds: question.tagIds,
    payload: sanitizedPayload,
  };
}
