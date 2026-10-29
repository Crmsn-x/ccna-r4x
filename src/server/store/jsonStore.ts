import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  Question,
  Tag,
  Session,
  DraftResponse,
  SubmittedResponse,
  ReviewState,
  UserDataStore,
  BackupBundle,
} from '../../domain/types.ts';
import { SCHEMA_VERSION } from '../../domain/types.ts';
import {
  validateQuestion,
  validateUserDataStore,
  validateClientAnswer,
  validateConfidence,
} from '../../domain/validators.ts';
import { markQuestion } from '../../domain/marking.ts';
import { calculateNextLeitnerState, initializeReviewState } from '../../domain/scheduling.ts';
import { sanitizeQuestionForSession } from '../../domain/sanitizer.ts';
import type {
  Store,
  QuestionFilters,
  CreateSessionParams,
  SubmitResponseParams,
} from './types.ts';

interface SeedStructure {
  schemaVersion: number;
  bankId: string;
  bankName: string;
  tags: Tag[];
  questions: Question[];
}

export class JsonStore implements Store {
  private baseDir: string;
  private seedFilePath: string;
  private userDataFilePath: string;
  private backupsDir: string;

  private seedCache: SeedStructure | null = null;
  private userDataCache: UserDataStore | null = null;
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
    this.seedFilePath = path.join(baseDir, 'data', 'questions.seed.json');
    this.userDataFilePath = path.join(baseDir, 'data', 'user-data.json');
    this.backupsDir = path.join(baseDir, 'data', 'backups');
  }

  private ensureDirectories(): void {
    const dataDir = path.join(this.baseDir, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  private loadSeed(): SeedStructure {
    if (this.seedCache) return this.seedCache;
    this.ensureDirectories();

    if (!fs.existsSync(this.seedFilePath)) {
      throw new Error(`Seed file not found at ${this.seedFilePath}. Please run seed generator.`);
    }

    try {
      const content = fs.readFileSync(this.seedFilePath, 'utf8');
      const parsed = JSON.parse(content) as SeedStructure;
      if (!parsed || !Array.isArray(parsed.questions)) {
        throw new Error('Seed file content is invalid; questions array is missing');
      }
      this.seedCache = parsed;
      return parsed;
    } catch (err) {
      throw new Error(`Failed to read seed file: ${(err as Error).message}`);
    }
  }

  private loadUserData(): UserDataStore {
    if (this.userDataCache) return this.userDataCache;
    this.ensureDirectories();

    if (!fs.existsSync(this.userDataFilePath)) {
      // Initialize cold start user data store
      const initial: UserDataStore = {
        schemaVersion: SCHEMA_VERSION,
        userId: 'local',
        questions: [],
        questionVersions: {},
        tags: [],
        sessions: [],
        draftResponses: {},
        submittedResponses: [],
        reviewStates: {},
        lastDailyBackupDate: undefined,
        updatedAt: new Date().toISOString(),
      };
      this.userDataCache = initial;
      this.persistUserDataSync(initial);
      return initial;
    }

    try {
      const content = fs.readFileSync(this.userDataFilePath, 'utf8');
      const parsed = JSON.parse(content);
      const val = validateUserDataStore(parsed);
      if (!val.valid) {
        throw new Error(
          `User data file is malformed: ${val.errors.map(e => e.message).join('; ')}. ` +
          `Recovery copies may be available in ${this.backupsDir}.`
        );
      }
      this.userDataCache = parsed as UserDataStore;
      return this.userDataCache;
    } catch (err) {
      throw new Error(
        `Failed to parse user data store at ${this.userDataFilePath}: ${(err as Error).message}. ` +
        `Check backups in ${this.backupsDir} to restore previous state.`
      );
    }
  }

  private getTodayDateString(): string {
    // Local date string in format YYYY-MM-DD
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private performDailyBackupIfNeeded(data: UserDataStore): void {
    const today = this.getTodayDateString();
    if (data.lastDailyBackupDate === today) return;

    this.ensureDirectories();
    const backupFileName = `backup-${today}.json`;
    const backupFilePath = path.join(this.backupsDir, backupFileName);

    if (!fs.existsSync(backupFilePath)) {
      const backupPayload: BackupBundle = {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        appVersion: '0.1.0',
        userId: data.userId,
        seedVersion: 'cisco-ccna-test-1',
        userData: data,
      };
      fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), 'utf8');
    }

    data.lastDailyBackupDate = today;
  }

  private persistUserDataSync(data: UserDataStore): void {
    this.ensureDirectories();

    const val = validateUserDataStore(data);
    if (!val.valid) {
      throw new Error(`Cannot persist invalid store data: ${val.errors.map(e => e.message).join('; ')}`);
    }

    data.updatedAt = new Date().toISOString();
    const serialized = JSON.stringify(data, null, 2);

    // Atomic write using unique temporary file in the same directory
    const tempFile = path.join(
      this.baseDir,
      'data',
      `user-data.tmp.${crypto.randomUUID()}.json`
    );

    try {
      fs.writeFileSync(tempFile, serialized, 'utf8');
      
      // On Windows, replacing an existing file can occasionally hit EPERM if a reader holds a handle.
      // We handle this cleanly:
      try {
        fs.renameSync(tempFile, this.userDataFilePath);
      } catch {
        // Fallback: copyFileSync then unlink temp
        fs.copyFileSync(tempFile, this.userDataFilePath);
        try { fs.unlinkSync(tempFile); } catch { /* ignore */ }
      }
    } catch (err) {
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch { /* ignore */ }
      }
      throw new Error(`Atomic write failed: ${(err as Error).message}`);
    }
  }

  /**
   * Enqueues a mutation to execute sequentially.
   * If a mutation fails, rolls back memory cache and does not poison subsequent operations.
   */
  private async runMutation<T>(operation: (data: UserDataStore) => Promise<T> | T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.mutationQueue = this.mutationQueue.then(
        async () => {
          const currentData = this.loadUserData();
          // Deep clone snapshot for rollback in case of error
          const snapshotClone: UserDataStore = JSON.parse(JSON.stringify(currentData));

          try {
            this.performDailyBackupIfNeeded(currentData);
            const result = await operation(currentData);
            this.persistUserDataSync(currentData);
            this.userDataCache = currentData;
            resolve(result);
          } catch (err) {
            // Roll back in-memory cache to previous valid state
            this.userDataCache = snapshotClone;
            reject(err);
          }
        },
        async () => {
          // If previous failed, still execute next
          const currentData = this.loadUserData();
          const snapshotClone: UserDataStore = JSON.parse(JSON.stringify(currentData));

          try {
            this.performDailyBackupIfNeeded(currentData);
            const result = await operation(currentData);
            this.persistUserDataSync(currentData);
            this.userDataCache = currentData;
            resolve(result);
          } catch (err) {
            this.userDataCache = snapshotClone;
            reject(err);
          }
        }
      );
    });
  }

  // ===================== STORE METHODS =====================

  async getQuestions(filters?: QuestionFilters): Promise<Question[]> {
    const seed = this.loadSeed();
    const userData = this.loadUserData();

    // Map seed questions
    const questionMap = new Map<string, Question>();
    for (const q of seed.questions) {
      questionMap.set(q.id, q);
    }
    // Overrides / imported questions from user data
    for (const q of userData.questions) {
      questionMap.set(q.id, q);
    }

    let list = Array.from(questionMap.values());

    if (!filters?.includeDevFixtures) {
      list = list.filter(q => !q.isDevFixture);
    }

    if (filters?.type) {
      list = list.filter(q => q.type === filters.type);
    }
    if (filters?.status) {
      list = list.filter(q => q.status === filters.status);
    }
    if (filters?.tagId) {
      list = list.filter(q => q.tagIds.includes(filters.tagId!));
    }
    if (filters?.duplicateGroupId) {
      list = list.filter(q => q.duplicateGroupId === filters.duplicateGroupId);
    }
    if (filters?.search && filters.search.trim()) {
      const qLower = filters.search.toLowerCase().trim();
      list = list.filter(q =>
        q.prompt.toLowerCase().includes(qLower) ||
        q.externalId.toLowerCase().includes(qLower) ||
        String(q.sourceNumber).includes(qLower)
      );
    }

    // Sort by sourceNumber ascending
    return list.sort((a, b) => a.sourceNumber - b.sourceNumber);
  }

  async getQuestionById(id: string): Promise<Question | null> {
    const seed = this.loadSeed();
    const userData = this.loadUserData();

    const fromUser = userData.questions.find(q => q.id === id);
    if (fromUser) return fromUser;

    const fromSeed = seed.questions.find(q => q.id === id);
    return fromSeed || null;
  }

  async saveQuestion(question: Question): Promise<Question> {
    const val = validateQuestion(question);
    if (!val.valid) {
      throw new Error(`Invalid question: ${val.errors.map(e => e.message).join('; ')}`);
    }

    return this.runMutation(data => {
      const existingIdx = data.questions.findIndex(q => q.id === question.id);
      const now = new Date().toISOString();

      if (existingIdx >= 0) {
        // Increment version and archive old snapshot
        const old = data.questions[existingIdx];
        if (!data.questionVersions[question.id]) {
          data.questionVersions[question.id] = [];
        }
        data.questionVersions[question.id].push(old);

        const updated: Question = {
          ...question,
          version: old.version + 1,
          updatedAt: now,
        };
        data.questions[existingIdx] = updated;
        return updated;
      } else {
        const created: Question = {
          ...question,
          version: 1,
          createdAt: now,
          updatedAt: now,
        };
        data.questions.push(created);
        return created;
      }
    });
  }

  async getTags(): Promise<Tag[]> {
    const seed = this.loadSeed();
    const userData = this.loadUserData();

    const tagMap = new Map<string, Tag>();
    for (const t of seed.tags) {
      tagMap.set(t.id, t);
    }
    for (const t of userData.tags) {
      tagMap.set(t.id, t);
    }
    return Array.from(tagMap.values());
  }

  async createSession(params: CreateSessionParams): Promise<Session> {
    const allQuestions = await this.getQuestions({
      includeDevFixtures: false,
    });

    // Content track filtering
    let eligible = allQuestions;
    if (params.contentTrack === 'verified') {
      eligible = eligible.filter(q => q.status === 'verified');
    } else {
      // Draft Learn practice allows unverified, but excludes needs-source
      eligible = eligible.filter(q => q.status !== 'needs-source');
    }

    // Apply tag scope
    if (params.scopeFilter.domainTagIds?.length) {
      eligible = eligible.filter(q =>
        q.tagIds.some(t => params.scopeFilter.domainTagIds!.includes(t))
      );
    }
    if (params.scopeFilter.topicTagIds?.length) {
      eligible = eligible.filter(q =>
        q.tagIds.some(t => params.scopeFilter.topicTagIds!.includes(t))
      );
    }

    // Selection criteria: unseen, incorrect, due, all
    const userData = this.loadUserData();
    const submittedMap = new Map<string, SubmittedResponse[]>();
    for (const sub of userData.submittedResponses) {
      if (!submittedMap.has(sub.questionId)) {
        submittedMap.set(sub.questionId, []);
      }
      submittedMap.get(sub.questionId)!.push(sub);
    }

    if (params.scopeFilter.selectionCriteria === 'unseen') {
      eligible = eligible.filter(q => !submittedMap.has(q.id));
    } else if (params.scopeFilter.selectionCriteria === 'incorrect') {
      eligible = eligible.filter(q => {
        const subs = submittedMap.get(q.id) || [];
        const last = subs[subs.length - 1];
        return last && !last.markingResult.isCorrect;
      });
    } else if (params.scopeFilter.selectionCriteria === 'due') {
      const now = new Date();
      eligible = eligible.filter(q => {
        const rev = userData.reviewStates[q.id];
        return rev && new Date(rev.dueAt).getTime() <= now.getTime();
      });
    }

    // Avoid repeatedly selecting duplicate groups if possible
    const selected: Question[] = [];
    const seenDuplicateGroups = new Set<string>();

    for (const q of eligible) {
      if (selected.length >= params.scopeFilter.requestedCount) break;
      if (q.duplicateGroupId) {
        if (seenDuplicateGroups.has(q.duplicateGroupId)) continue;
        seenDuplicateGroups.add(q.duplicateGroupId);
      }
      selected.push(q);
    }

    // If still need questions to reach requested count, allow duplicate groups
    if (selected.length < params.scopeFilter.requestedCount) {
      for (const q of eligible) {
        if (selected.length >= params.scopeFilter.requestedCount) break;
        if (!selected.some(s => s.id === q.id)) {
          selected.push(q);
        }
      }
    }

    const sessionId = `session-${crypto.randomUUID()}`;
    const startedAt = new Date().toISOString();
    const deadlineAt = params.timeLimitSeconds
      ? new Date(Date.now() + params.timeLimitSeconds * 1000).toISOString()
      : undefined;

    // Freeze sanitized snapshots for session questions
    const questionSnapshots = selected.map(q => sanitizeQuestionForSession(q));

    const session: Session = {
      id: sessionId,
      userId: params.userId || 'local',
      mode: params.mode,
      contentTrack: params.contentTrack,
      scopeFilter: params.scopeFilter,
      status: 'active',
      questionIds: selected.map(q => q.id),
      questionSnapshots,
      startedAt,
      timeLimitSeconds: params.timeLimitSeconds,
      deadlineAt,
      totalQuestions: selected.length,
      unansweredCount: selected.length,
    };

    return this.runMutation(data => {
      data.sessions.push(session);
      return session;
    });
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const data = this.loadUserData();
    return data.sessions.find(s => s.id === sessionId) || null;
  }

  async listSessions(userId = 'local'): Promise<Session[]> {
    const data = this.loadUserData();
    return data.sessions.filter(s => s.userId === userId);
  }

  async saveDraftResponse(draft: DraftResponse): Promise<DraftResponse> {
    return this.runMutation(data => {
      const key = `${draft.sessionId}_${draft.questionId}`;
      const saved: DraftResponse = {
        ...draft,
        updatedAt: new Date().toISOString(),
      };
      data.draftResponses[key] = saved;
      return saved;
    });
  }

  async getDraftResponse(sessionId: string, questionId: string): Promise<DraftResponse | null> {
    const data = this.loadUserData();
    const key = `${sessionId}_${questionId}`;
    return data.draftResponses[key] || null;
  }

  async submitResponse(params: SubmitResponseParams): Promise<SubmittedResponse> {
    if (!validateConfidence(params.confidence)) {
      throw new Error(`Valid confidence level ('confident' | 'unsure' | 'guessed') is required before submission`);
    }

    const question = await this.getQuestionById(params.questionId);
    if (!question) {
      throw new Error(`Question ${params.questionId} not found`);
    }

    const val = validateClientAnswer(params.answer, question);
    if (!val.valid) {
      throw new Error(`Malformed answer submission: ${val.errors.map(e => e.message).join('; ')}`);
    }

    return this.runMutation(data => {
      const submissionId = `${params.sessionId}_${params.questionId}`;

      // Idempotency: return existing submitted response if already processed
      const existing = data.submittedResponses.find(s => s.submissionId === submissionId);
      if (existing) {
        return existing;
      }

      // Pure deterministic marking on server
      const markingResult = markQuestion(question, params.answer);

      // Check if this is the user's firstAttempt for this question across all sessions
      const priorAttempts = data.submittedResponses.filter(s => s.questionId === params.questionId);
      const isFirstAttempt = priorAttempts.length === 0;

      const now = new Date();
      const submittedResponse: SubmittedResponse = {
        submissionId,
        sessionId: params.sessionId,
        questionId: params.questionId,
        questionVersion: question.version,
        answer: params.answer,
        confidence: params.confidence,
        flagged: Boolean(params.flagged),
        markingResult,
        isFirstAttempt,
        submittedAt: now.toISOString(),
      };

      data.submittedResponses.push(submittedResponse);

      // Update session statistics if active
      const session = data.sessions.find(s => s.id === params.sessionId);
      if (session) {
        const sessionSubmissions = data.submittedResponses.filter(s => s.sessionId === params.sessionId);
        session.unansweredCount = Math.max(0, (session.totalQuestions || 0) - sessionSubmissions.length);
      }

      // Review state transition: only eligible verified questions advance Leitner boxes
      // Unverified questions or draft practice do NOT advance scheduling
      if (question.status === 'verified') {
        let rev = data.reviewStates[question.id];
        if (!rev) {
          rev = initializeReviewState(question.id, data.userId, now);
        }

        const next = calculateNextLeitnerState({
          currentBox: rev.box,
          isCorrect: markingResult.isCorrect,
          confidence: params.confidence,
          now,
        });

        rev.box = next.nextBox;
        rev.dueAt = next.dueAt;
        rev.lastProcessedAttemptId = submissionId;
        rev.updatedAt = now.toISOString();

        data.reviewStates[question.id] = rev;
      }

      return submittedResponse;
    });
  }

  async getSubmittedResponses(sessionId?: string): Promise<SubmittedResponse[]> {
    const data = this.loadUserData();
    if (sessionId) {
      return data.submittedResponses.filter(s => s.sessionId === sessionId);
    }
    return data.submittedResponses;
  }

  async getReviewStates(): Promise<ReviewState[]> {
    const data = this.loadUserData();
    return Object.values(data.reviewStates);
  }

  async getDueReviews(): Promise<ReviewState[]> {
    const data = this.loadUserData();
    const now = Date.now();
    return Object.values(data.reviewStates).filter(
      r => new Date(r.dueAt).getTime() <= now
    );
  }

  async getReviewState(questionId: string): Promise<ReviewState | null> {
    const data = this.loadUserData();
    return data.reviewStates[questionId] || null;
  }

  async toggleBookmark(questionId: string): Promise<ReviewState> {
    return this.runMutation(data => {
      let rev = data.reviewStates[questionId];
      const now = new Date().toISOString();
      if (!rev) {
        rev = initializeReviewState(questionId, data.userId, new Date());
      }
      rev.bookmarked = !rev.bookmarked;
      rev.updatedAt = now;
      data.reviewStates[questionId] = rev;
      return rev;
    });
  }

  async createBackup(): Promise<BackupBundle> {
    const data = this.loadUserData();
    return {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: '0.1.0',
      userId: data.userId,
      seedVersion: 'cisco-ccna-test-1',
      userData: data,
    };
  }

  async restoreBackup(bundle: unknown): Promise<{ success: boolean; message: string }> {
    if (!bundle || typeof bundle !== 'object') {
      throw new Error('Invalid backup bundle: must be a non-null object');
    }
    const b = bundle as BackupBundle;
    if (typeof b.schemaVersion !== 'number' || b.schemaVersion > SCHEMA_VERSION) {
      throw new Error(`Unsupported backup schema version ${b.schemaVersion}`);
    }
    const val = validateUserDataStore(b.userData);
    if (!val.valid) {
      throw new Error(`Invalid user data in backup: ${val.errors.map(e => e.message).join('; ')}`);
    }

    return this.runMutation(currentData => {
      // Pre-restore backup
      const today = this.getTodayDateString();
      const preRestorePath = path.join(this.backupsDir, `pre-restore-${today}-${Date.now()}.json`);
      fs.writeFileSync(preRestorePath, JSON.stringify(currentData, null, 2), 'utf8');

      // Replace state
      Object.assign(currentData, b.userData);
      return { success: true, message: 'Backup restored successfully' };
    });
  }

  async reseed(): Promise<{ questionsCount: number }> {
    this.seedCache = null;
    const seed = this.loadSeed();
    return { questionsCount: seed.questions.length };
  }
}
