import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStore } from '@/server/store';
import { ExplanationCard } from '@/components/question/ExplanationCard';

export const dynamic = 'force-dynamic';

export default async function PracticeResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const store = getStore();

  const session = await store.getSession(sessionId);
  if (!session) {
    notFound();
  }

  // If session is still active assess, finalize it now
  let activeSession = session;
  if (activeSession.status === 'active') {
    activeSession = await store.finalizeSession(sessionId);
  }

  const submissions = await store.getSubmittedResponses(sessionId);
  const totalQuestions = activeSession.questionIds.length;
  const answeredCount = submissions.length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  const totalScore = submissions.reduce((sum, s) => sum + (s.markingResult?.score || 0), 0);
  const incorrectCount = submissions.filter(s => !s.markingResult?.isCorrect).length;
  const percentScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  // First-attempt vs Repeat-attempt accuracy
  const firstAttempts = submissions.filter(s => s.isFirstAttempt);
  const firstScore = firstAttempts.reduce((sum, s) => sum + (s.markingResult?.score || 0), 0);
  const firstAttemptAccuracy = firstAttempts.length > 0
    ? Math.round((firstScore / firstAttempts.length) * 100)
    : null;

  const repeatAttempts = submissions.filter(s => !s.isFirstAttempt);
  const repeatScore = repeatAttempts.reduce((sum, s) => sum + (s.markingResult?.score || 0), 0);
  const repeatAttemptAccuracy = repeatAttempts.length > 0
    ? Math.round((repeatScore / repeatAttempts.length) * 100)
    : null;

  // Breakdown lists
  const missedResponses = submissions.filter(s => !s.markingResult.isCorrect);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {activeSession.mode === 'assess' ? 'Examination Performance & Review' : 'Session Performance Summary'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-2">
            <span>Mode: {activeSession.mode === 'learn' ? 'Learn Practice' : 'Examination'}</span>
            <span>•</span>
            <span className="capitalize">
              Track: {activeSession.contentTrack === 'draft' ? 'Draft Practice' : activeSession.contentTrack === 'verified' ? 'Reviewed Content' : 'Dev Fixtures'}
            </span>
            {activeSession.contentTrack === 'fixture' && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30">
                Developer Test Session
              </span>
            )}
            {activeSession.scopeFilter?.scopeSummary && (
              <>
                <span>•</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  Scope: {activeSession.scopeFilter.scopeSummary}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/practice"
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold hover:border-[var(--accent)] transition-colors"
          >
            New Session
          </Link>
          <Link
            href="/bank"
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
          >
            Question Bank →
          </Link>
        </div>
      </div>

      {/* Main Scorecard Banner */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-sm space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border)]">
            <span className="text-xs uppercase font-bold text-[var(--text-secondary)] block">
              Overall Score
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mt-1 block">
              {totalScore} / {totalQuestions}
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)] mt-1 block">
              {percentScore}% Score
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border)]">
            <span className="text-xs uppercase font-bold text-[var(--text-secondary)] block">
              Correct Responses
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 block">
              {totalScore}
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)] mt-1 block">
              {totalQuestions > 0 ? `${Math.round((totalScore / totalQuestions) * 100)}% of exam` : '—'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border)]">
            <span className="text-xs uppercase font-bold text-[var(--text-secondary)] block">
              Incorrect Responses
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-rose-700 dark:text-rose-400 mt-1 block">
              {incorrectCount}
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)] mt-1 block">
              {unansweredCount > 0 ? `${unansweredCount} unanswered` : '0 unanswered'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border)]">
            <span className="text-xs uppercase font-bold text-[var(--text-secondary)] block">
              First-Attempt Accuracy
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mt-1 block">
              {firstAttemptAccuracy !== null ? `${firstAttemptAccuracy}%` : '—'}
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)] mt-1 block">
              {firstAttempts.length} first-try Qs
            </span>
          </div>
        </div>

        {/* Progress & Tracking Note */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 text-xs md:text-sm leading-relaxed flex items-start gap-2.5">
          <span className="text-base shrink-0">ℹ️</span>
          <div>
            <strong>Session Complete:</strong> All 200 questions in this bank participate in your continuous study progress. Review your answers and explanations below to reinforce key concepts.
          </div>
        </div>
      </div>

      {/* Post-Exam Question-by-Question Review */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Post-Exam Review ({submissions.length} Reviewed)
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Detailed answers and option explanations for every question in this examination.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              {totalScore} Correct
            </span>
            <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
              {incorrectCount} Incorrect
            </span>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[var(--border)] text-center text-sm text-[var(--text-secondary)]">
            No questions were submitted during this session.
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((sub, idx) => {
              const snapshot = activeSession.questionSnapshots.find(s => s.questionId === sub.questionId);
              const selectedOptId = sub.answer?.type === 'single' ? sub.answer.selectedOptionId : undefined;
              const correctOptId = (sub.markingResult?.correctAnswerSummary as { correctOptionId?: string })?.correctOptionId;

              return (
                <div key={sub.submissionId} className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-secondary)]">
                        Question #{idx + 1} ({sub.questionId})
                      </span>
                      {selectedOptId && (
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          Your Answer: <strong className="text-[var(--text-primary)] font-bold">Option {selectedOptId}</strong>
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      {sub.markingResult.isCorrect ? (
                        <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ✓ Correct (+1 point)
                        </span>
                      ) : (
                        <span className="text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          ✕ Incorrect (0 points)
                        </span>
                      )}
                    </span>
                  </div>

                  <p className="text-base text-[var(--text-primary)] font-medium leading-relaxed">
                    {snapshot?.prompt}
                  </p>

                  {/* Render Full ExplanationCard for Post-Exam Review */}
                  {sub.markingResult.explanation && (
                    <ExplanationCard
                      explanation={sub.markingResult.explanation}
                      isCorrect={sub.markingResult.isCorrect}
                      score={sub.markingResult.score}
                      maxScore={sub.markingResult.maxScore}
                      selectedOptionId={selectedOptId}
                      correctOptionId={correctOptId}
                      status="verified"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
