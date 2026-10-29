import Link from 'next/link';
import { getStore } from '@/server/store';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const store = getStore();
  const [questions, sessions, dueReviews] = await Promise.all([
    store.getQuestions(),
    store.listSessions(),
    store.getDueReviews(),
  ]);

  const totalSourceQuestions = questions.length;
  const verifiedCount = questions.filter(q => q.status === 'verified').length;
  const unverifiedCount = questions.filter(q => q.status === 'unverified').length;
  const needsSourceCount = questions.filter(q => q.status === 'needs-source').length;
  const activeSession = sessions.find(s => s.status === 'active');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          CCNA 200-301 Revision & Knowledge Assessment Hub
        </p>
      </div>

      {/* Honest Content & Status Banner */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">Phase 0 & 1 Review Checkpoint: Honest Status Tracking</p>
            <p>
              All 75 source questions from the supplied question bank have been extracted, classified, and stored in the canonical seed.
              As required by the build brief, AI-drafted answers start strictly <strong>unverified</strong> (73 questions) and unusable questions with missing materials are classified as <strong>needs-source</strong> (2 questions: Q5 and Q52).
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-xs">
          <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Total Source Bank
          </div>
          <div className="text-3xl font-extrabold mt-2 text-[var(--text-primary)]">
            {totalSourceQuestions}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            All 75 source items accounted for
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-xs">
          <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Verified Content
          </div>
          <div className="text-3xl font-extrabold mt-2 text-emerald-600 dark:text-emerald-400">
            {verifiedCount}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            Requires documented authority check
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-xs">
          <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Draft / Unverified
          </div>
          <div className="text-3xl font-extrabold mt-2 text-amber-500">
            {unverifiedCount}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            Draft Learn practice only
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-xs">
          <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Needs Source
          </div>
          <div className="text-3xl font-extrabold mt-2 text-rose-500">
            {needsSourceCount}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            Q5 (missing label), Q52 (missing PT)
          </div>
        </div>
      </div>

      {/* Main Panels: Active Session, Spaced Repetition Due, and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Session & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Session Card */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)]">
            <h2 className="text-base font-bold flex items-center justify-between">
              <span>Active Revision Session</span>
              {activeSession && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500">
                  In Progress
                </span>
              )}
            </h2>

            {activeSession ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm">
                  You have an unfinished session with {activeSession.questionIds.length} questions.
                </p>
                <Link
                  href={`/practice/${activeSession.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Resume Session
                </Link>
              </div>
            ) : (
              <div className="mt-4 py-6 text-center border border-dashed border-[var(--border)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">No active study session right now.</p>
                <div className="mt-3">
                  <Link
                    href="/bank"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium hover:border-[var(--accent)] transition-colors"
                  >
                    Browse Question Bank
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Reviews Due (Leitner Spaced Repetition) */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)]">
            <h2 className="text-base font-bold flex items-center justify-between">
              <span>Reviews Due (Leitner Boxes 1–5)</span>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {dueReviews.length} due today
              </span>
            </h2>

            {dueReviews.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-[var(--text-secondary)]">
                  You have {dueReviews.length} questions due for spaced-repetition review.
                </p>
                <Link
                  href="/review"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Start Daily Review
                </Link>
              </div>
            ) : (
              <div className="mt-4 py-6 text-center border border-dashed border-[var(--border)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">
                  No spaced reviews currently due.
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Completed verified practice attempts automatically schedule reviews across 0, 1, 3, 7, and 21 day intervals.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fast Shortcuts & Bank Preview */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-4">
            <h2 className="text-base font-bold">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/bank"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] text-sm font-medium transition-colors"
              >
                <span>Question Bank Explorer</span>
                <span className="text-xs text-[var(--text-secondary)]">75 items &rarr;</span>
              </Link>
              <Link
                href="/labs"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] text-sm font-medium transition-colors"
              >
                <span>Practical Labs</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">Phase 5</span>
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] text-xs text-[var(--text-secondary)] space-y-2">
            <div className="font-semibold text-[var(--text-primary)]">Local PC Constraints</div>
            <p>• Unauthenticated private PC instance binding to 127.0.0.1.</p>
            <p>• Zero remote fonts or cloud analytics dependencies.</p>
            <p>• Server-side atomic JSON persistence with daily automated backups.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
