import type {
  Question,
  ClientAnswer,
  MarkingResult,
  SingleChoicePayload,
  MultiChoicePayload,
  MatchingPayload,
  OrderingPayload,
} from './types.ts';
import { validateClientAnswer } from './validators.ts';

export function markQuestion(question: Question, answer: ClientAnswer): MarkingResult {
  const val = validateClientAnswer(answer, question);
  if (!val.valid) {
    throw new Error(`Malformed answer submission: ${val.errors.map(e => e.message).join('; ')}`);
  }

  let isCorrect = false;
  let correctAnswerSummary: unknown = null;

  switch (question.type) {
    case 'single': {
      const payload = question.payload as SingleChoicePayload;
      const singleAns = answer as { type: 'single'; selectedOptionId: string };
      const expectedId = payload.correctOptionIds[0];
      isCorrect = singleAns.selectedOptionId === expectedId;
      correctAnswerSummary = {
        correctOptionId: expectedId,
      };
      break;
    }

    case 'multi': {
      const payload = question.payload as MultiChoicePayload;
      const multiAns = answer as { type: 'multi'; selectedOptionIds: string[] };
      const expectedSet = new Set(payload.correctOptionIds);
      const submittedSet = new Set(multiAns.selectedOptionIds);

      // All-or-nothing with order-independent set comparison
      if (expectedSet.size === submittedSet.size) {
        let allMatch = true;
        for (const id of submittedSet) {
          if (!expectedSet.has(id)) {
            allMatch = false;
            break;
          }
        }
        isCorrect = allMatch;
      } else {
        isCorrect = false;
      }

      correctAnswerSummary = {
        correctOptionIds: payload.correctOptionIds,
      };
      break;
    }

    case 'matching': {
      const payload = question.payload as MatchingPayload;
      const matchAns = answer as { type: 'matching'; mapping: Record<string, string | null> };
      
      const mapping = payload.correctMapping || (payload.correctMatches ? Object.fromEntries(payload.correctMatches.map(m => [m.promptId, m.choiceId])) : {});
      let allMatch = true;
      for (const [promptId, expectedChoiceId] of Object.entries(mapping)) {
        const submittedChoiceId = matchAns.mapping[promptId] ?? null;
        if (submittedChoiceId !== expectedChoiceId) {
          allMatch = false;
          break;
        }
      }
      isCorrect = allMatch;
      correctAnswerSummary = {
        correctMapping: mapping,
      };
      break;
    }

    case 'ordering': {
      const payload = question.payload as OrderingPayload;
      const orderAns = answer as { type: 'ordering'; orderedItemIds: string[] };

      if (orderAns.orderedItemIds.length !== payload.correctOrderIds.length) {
        isCorrect = false;
      } else {
        isCorrect = orderAns.orderedItemIds.every((id, idx) => id === payload.correctOrderIds[idx]);
      }

      correctAnswerSummary = {
        correctOrderIds: payload.correctOrderIds,
        distractorItemIds: payload.distractorItemIds || [],
      };
      break;
    }

    default:
      throw new Error(`Unsupported question type for marking`);
  }

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    maxScore: 1,
    submittedAnswer: answer,
    correctAnswerSummary,
    explanation: question.explanation,
  };
}
