import type { ConfidenceLevel, ReviewState } from './types.ts';

export const LEITNER_BOX_INTERVALS_DAYS = [0, 1, 3, 7, 21] as const; // Index 0 is Box 1 (0 days), Index 4 is Box 5 (21 days)
export const DEFAULT_TIMEZONE = 'Africa/Harare';

export interface LeitnerTransitionInput {
  currentBox: number; // 1 to 5
  isCorrect: boolean;
  confidence: ConfidenceLevel;
  now?: Date;
}

export interface LeitnerTransitionResult {
  nextBox: number; // 1 to 5
  dueAt: string; // ISO UTC string
  intervalDays: number;
}

/**
 * Calculates next Leitner box and due date for a submitted attempt.
 * Pure deterministic function.
 */
export function calculateNextLeitnerState(input: LeitnerTransitionInput): LeitnerTransitionResult {
  const now = input.now ?? new Date();
  const currentBox = Math.max(1, Math.min(5, input.currentBox));

  let nextBox: number;
  let intervalDays: number;

  if (!input.isCorrect) {
    // Incorrect: reset to box 1, due today
    nextBox = 1;
    intervalDays = LEITNER_BOX_INTERVALS_DAYS[0]; // 0 days
  } else {
    // Correct
    if (input.confidence === 'confident') {
      // Advance one box, capped at 5
      nextBox = Math.min(5, currentBox + 1);
    } else {
      // Unsure or guessed: remain in the current box
      nextBox = currentBox;
    }
    intervalDays = LEITNER_BOX_INTERVALS_DAYS[nextBox - 1];
  }

  // Calculate due date in UTC by adding intervalDays to now
  const dueDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    nextBox,
    dueAt: dueDate.toISOString(),
    intervalDays,
  };
}

/**
 * Checks whether a review state is currently due.
 */
export function isReviewDue(reviewState: ReviewState, now: Date = new Date()): boolean {
  const due = new Date(reviewState.dueAt);
  return due.getTime() <= now.getTime();
}

/**
 * Initializes a new review state for a question.
 */
export function initializeReviewState(questionId: string, userId = 'local', now: Date = new Date()): ReviewState {
  return {
    userId,
    questionId,
    box: 1,
    dueAt: now.toISOString(),
    bookmarked: false,
    updatedAt: now.toISOString(),
  };
}
