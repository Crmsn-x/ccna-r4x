import type {
  Question,
  QuestionType,
  QuestionStatus,
  Tag,
  Session,
  SessionMode,
  ContentTrack,
  ScopeFilterSnapshot,
  DraftResponse,
  SubmittedResponse,
  ReviewState,
  ClientAnswer,
  ConfidenceLevel,
  BackupBundle,
} from '../../domain/types.ts';

export interface QuestionFilters {
  type?: QuestionType;
  status?: QuestionStatus;
  tagId?: string;
  search?: string;
  duplicateGroupId?: string;
  includeDevFixtures?: boolean;
}

export interface CreateSessionParams {
  userId?: string;
  mode: SessionMode;
  contentTrack: ContentTrack;
  scopeFilter: ScopeFilterSnapshot;
  timeLimitSeconds?: number;
}

export interface SubmitResponseParams {
  sessionId: string;
  questionId: string;
  answer: ClientAnswer;
  confidence: ConfidenceLevel;
  flagged?: boolean;
}

export interface Store {
  /** Questions */
  getQuestions(filters?: QuestionFilters): Promise<Question[]>;
  getQuestionById(id: string): Promise<Question | null>;
  saveQuestion(question: Question): Promise<Question>;
  
  /** Tags */
  getTags(): Promise<Tag[]>;
  
  /** Sessions */
  createSession(params: CreateSessionParams): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  listSessions(userId?: string): Promise<Session[]>;
  finalizeSession(sessionId: string): Promise<Session>;
  
  /** Responses & Marking */
  saveDraftResponse(draft: DraftResponse): Promise<DraftResponse>;
  getDraftResponse(sessionId: string, questionId: string): Promise<DraftResponse | null>;
  submitResponse(params: SubmitResponseParams): Promise<SubmittedResponse>;
  getSubmittedResponses(sessionId?: string): Promise<SubmittedResponse[]>;
  
  /** Leitner Reviews */
  getReviewStates(): Promise<ReviewState[]>;
  getDueReviews(): Promise<ReviewState[]>;
  getReviewState(questionId: string): Promise<ReviewState | null>;
  toggleBookmark(questionId: string): Promise<ReviewState>;
  
  /** Backups and Maintenance */
  createBackup(): Promise<BackupBundle>;
  restoreBackup(bundle: unknown): Promise<{ success: boolean; message: string }>;
  reseed(): Promise<{ questionsCount: number }>;
}
