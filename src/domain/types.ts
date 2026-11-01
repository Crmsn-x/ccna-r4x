/**
 * CCNA Revise - Canonical Data Model
 * Strict TypeScript records and discriminated unions.
 */

export const SCHEMA_VERSION = 1;

export type QuestionType = 'single' | 'multi' | 'matching' | 'ordering';
export type QuestionStatus = 'unverified' | 'verified' | 'needs-source';
export type ConfidenceLevel = 'confident' | 'unsure' | 'guessed';
export type SessionMode = 'learn' | 'assess';
export type ContentTrack = 'verified' | 'draft' | 'fixture';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type TagKind = 'course' | 'domain' | 'topic' | 'subtopic' | 'module' | 'lesson';

export interface Tag {
  id: string;
  kind: TagKind;
  name: string;
  parentId?: string | null;
  courseId?: string | null;
  blueprintVersion?: string; // e.g. "CCNA 200-301 v1.1"
  mappingStatus?: string;
}

export interface OptionItem {
  id: string;
  text: string;
}

export interface SingleChoicePayload {
  options: OptionItem[];
  correctOptionIds: string[]; // single element for valid single-choice
  requiredSelections?: number;
}

export interface MultiChoicePayload {
  options: OptionItem[];
  correctOptionIds: string[];
  requiredSelections: number;
}

export interface MatchingPrompt {
  id: string;
  text: string;
}

export interface MatchingChoice {
  id: string;
  text: string;
}

export interface MatchingPayload {
  prompts: MatchingPrompt[];
  choices: MatchingChoice[]; // includes possible distractors
  // Map of promptId -> choiceId (or null if "No match" is explicitly authored)
  correctMapping: Record<string, string | null>;
  correctMatches?: { promptId: string; choiceId: string | null }[];
  allowChoiceReuse: boolean;
  allowNoMatch?: boolean;
}

export interface OrderingItem {
  id: string;
  text: string;
}

export interface OrderingPayload {
  items: OrderingItem[];
  correctOrderIds: string[]; // ordered sequence of item ids
  distractorItemIds?: string[];
}

export type QuestionPayload =
  | { type: 'single'; payload: SingleChoicePayload }
  | { type: 'multi'; payload: MultiChoicePayload }
  | { type: 'matching'; payload: MatchingPayload }
  | { type: 'ordering'; payload: OrderingPayload };

export interface ExplanationRationale {
  optionIdOrKey: string;
  reason: string;
}

export interface Explanation {
  answerReasoning: string;
  conceptRefresher: string;
  incorrectRationales?: ExplanationRationale[];
  practicalExampleOrCommands?: string;
  commonMisconception?: string;
  references?: string[];
  relatedLabIds?: string[];
  summary?: { text: string; origin: string; sourceRefs: unknown[] };
  concept?: { text: string; origin: string; sourceRefs: unknown[] };
  sourceExplanation?: { text: string; origin: string; sourceRefs: unknown[] } | null;
  optionRationales?: Array<{ optionId: string; rationale: { text: string; origin: string; sourceRefs: unknown[] } }>;
  matchingRationales?: Array<{ promptId: string; rationale: { text: string; origin: string; sourceRefs: unknown[] } }>;
  orderingRationales?: Array<{ itemId: string; rationale: { text: string; origin: string; sourceRefs: unknown[] } }>;
  commonMistakes?: Array<{ text: string; origin: string; sourceRefs: unknown[] }>;
  practicalExample?: { intro: { text: string; origin: string; sourceRefs: unknown[] }; code?: string | null; language?: string | null } | null;
  relatedQuestionIds?: string[];
  correctAnswerLetter?: string;
  optionExplanations?: Record<string, string>;
}

export interface AssetReference {
  id: string;
  type: 'image' | 'packet-tracer' | 'document';
  url: string;
  caption?: string;
  altText?: string;
  originalFileName?: string;
}

export interface VerificationRecord {
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  authoritativeSource?: string;
  consultedSources?: string[];
  suggestedReferences?: string[];
  whatWasChecked?: string;
  referenceLocation?: string;
  notes?: string;
  unresolvedAmbiguity?: string;
  trialOnly?: boolean;
}

export interface Question {
  id: string;
  bankId: string;
  externalId: string; // e.g. "q001" or "itn-m01-03-test-q001", scoped to bankId
  sourceNumber: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  type: QuestionType;
  status: QuestionStatus;
  needsSourceReason?: string; // required when status is 'needs-source'
  prompt: string;
  structuredBlocks?: {
    type: 'paragraph' | 'code' | 'callout' | 'text' | 'image';
    content?: string;
    text?: string;
    language?: string;
    assetId?: string;
  }[];
  blocks?: Array<{
    type: string;
    text?: string;
    language?: string;
    assetId?: string;
  }>;
  sourceNumbers?: Array<{
    sourceId: string;
    number: number;
    pages: number[];
  }>;
  moduleIds?: string[];
  topicIds?: string[];
  difficulty?: 'entry' | 'intermediate' | 'advanced';
  payload:
    | SingleChoicePayload
    | MultiChoicePayload
    | MatchingPayload
    | OrderingPayload;
  explanation: Explanation;
  assetReferences: AssetReference[];
  tagIds: string[];
  cleanupNotes?: string;
  duplicateGroupId?: string | null;
  verificationRecord?: VerificationRecord;
  isDevFixture?: boolean; // development fixture excluded from real progress statistics
  provenance?: unknown;
  editorialNotes?: Array<{
    field: string;
    originalText: string;
    revisedText: string;
    reason: string;
  }>;
  verificationStatus?: string;
  trialOnly?: boolean;
  sourceAnswer?: string;
}

export interface ImmutableQuestionSnapshot {
  questionId: string;
  version: number;
  type: QuestionType;
  prompt: string;
  structuredBlocks?: Question['structuredBlocks'];
  assetReferences: AssetReference[];
  tagIds: string[];
  // Note: Client-facing sanitized snapshot withholds correctOptionIds / correctMapping / correctOrderIds
  payload:
    | { options: OptionItem[] } // sanitized single
    | { options: OptionItem[]; requiredSelections: number } // sanitized multi
    | { prompts: MatchingPrompt[]; choices: MatchingChoice[]; allowChoiceReuse: boolean; allowNoMatch?: boolean } // sanitized matching
    | { items: OrderingItem[]; distractorItemIds?: string[] }; // sanitized ordering
  initialDisplayOrder?: string[]; // for ordering initial shuffle or options presentation
}

export type ClientAnswer =
  | { type: 'single'; selectedOptionId: string }
  | { type: 'multi'; selectedOptionIds: string[] }
  | { type: 'matching'; mapping: Record<string, string | null> }
  | { type: 'ordering'; orderedItemIds: string[] };

export interface MarkingResult {
  isCorrect: boolean;
  score: number; // 1 or 0
  maxScore: number; // 1
  submittedAnswer: ClientAnswer;
  correctAnswerSummary: unknown; // released only when feedback is permitted
  explanation?: Explanation;
}

export interface DraftResponse {
  sessionId: string;
  questionId: string;
  answer?: ClientAnswer;
  confidence?: ConfidenceLevel;
  flagged?: boolean;
  updatedAt: string;
}

export interface SubmittedResponse {
  submissionId: string; // unique idempotent submission identity
  sessionId: string;
  questionId: string;
  questionVersion: number;
  answer: ClientAnswer;
  confidence: ConfidenceLevel;
  flagged: boolean;
  markingResult: MarkingResult;
  isFirstAttempt: boolean; // earliest submitted scored attempt across sessions
  submittedAt: string;
}

export type ScopeType = 'all' | 'domain' | 'topic' | 'module';

export interface ScopeFilterSnapshot {
  scopeType: ScopeType;
  domainTagIds?: string[];
  topicTagIds?: string[];
  subtopicTagIds?: string[];
  moduleTagIds?: string[];
  lessonTagIds?: string[];
  resolvedTagIds?: string[];
  scopeSummary?: string;
  selectionCriteria: 'unseen' | 'incorrect' | 'due' | 'all';
  requestedCount: number;
}

export interface Session {
  id: string;
  userId: string; // "local" initially
  mode: SessionMode;
  contentTrack: ContentTrack;
  scopeFilter: ScopeFilterSnapshot;
  status: SessionStatus;
  questionIds: string[]; // ordered sequence of questions
  questionSnapshots: ImmutableQuestionSnapshot[];
  startedAt: string;
  finishedAt?: string;
  timeLimitSeconds?: number;
  deadlineAt?: string; // stored server deadline
  score?: number;
  totalQuestions?: number;
  unansweredCount?: number;
}

export interface ReviewState {
  userId: string; // "local"
  questionId: string;
  box: number; // 1 to 5
  dueAt: string; // ISO string
  bookmarked: boolean;
  lastProcessedAttemptId?: string;
  updatedAt: string;
}

export interface UserDataStore {
  schemaVersion: number;
  userId: string;
  questions: Question[]; // custom/imported questions or overrides
  questionVersions: Record<string, Question[]>; // historical snapshots: questionId -> array of versions
  tags: Tag[];
  sessions: Session[];
  draftResponses: Record<string, DraftResponse>; // key: `${sessionId}_${questionId}`
  submittedResponses: SubmittedResponse[];
  reviewStates: Record<string, ReviewState>; // key: questionId
  lastDailyBackupDate?: string; // YYYY-MM-DD
  updatedAt: string;
}

export interface BackupBundle {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  userId: string;
  seedVersion: string;
  userData: UserDataStore;
  assets?: {
    fileName: string;
    mimeType: string;
    base64Data: string;
  }[];
}
