'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  Session,
  ImmutableQuestionSnapshot,
  ClientAnswer,
  ConfidenceLevel,
  SubmittedResponse,
  DraftResponse,
} from '@/domain/types';
import { SingleChoiceQuestion } from '@/components/question/SingleChoiceQuestion';
import { MultiChoiceQuestion } from '@/components/question/MultiChoiceQuestion';
import { MatchingQuestion } from '@/components/question/MatchingQuestion';
import { OrderingQuestion } from '@/components/question/OrderingQuestion';
import { ExplanationCard } from '@/components/question/ExplanationCard';

interface PracticeRunnerProps {
  initialSession: Session;
  initialSubmittedResponses: SubmittedResponse[];
  initialDrafts: Record<string, DraftResponse>;
}

export function PracticeRunner({
  initialSession,
  initialSubmittedResponses,
  initialDrafts,
}: PracticeRunnerProps) {
  const router = useRouter();
  const session = initialSession;

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Submissions map
  const [submissions, setSubmissions] = useState<Record<string, SubmittedResponse>>(() => {
    const map: Record<string, SubmittedResponse> = {};
    for (const sub of initialSubmittedResponses) {
      map[sub.questionId] = sub;
    }
    return map;
  });

  // Drafts map
  const [drafts, setDrafts] = useState<Record<string, DraftResponse>>(initialDrafts);

  // Autosave status indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');

  // Submit in progress
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer countdown
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(() => {
    if (!session.deadlineAt) return null;
    const diff = Math.floor((new Date(session.deadlineAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  // Active question snapshot
  const snapshots = session.questionSnapshots || [];
  const currentSnapshot: ImmutableQuestionSnapshot | undefined = snapshots[currentIndex];
  const currentQuestionId = currentSnapshot?.questionId;

  const currentSubmission = currentQuestionId ? submissions[currentQuestionId] : undefined;
  const currentDraft = currentQuestionId ? drafts[currentQuestionId] : undefined;

  // Working answer state
  const currentAnswer: ClientAnswer | undefined = currentSubmission
    ? currentSubmission.answer
    : currentDraft?.answer;

  const currentConfidence: ConfidenceLevel | undefined = currentSubmission
    ? currentSubmission.confidence
    : currentDraft?.confidence;

  const isFlagged: boolean = currentSubmission
    ? currentSubmission.flagged
    : Boolean(currentDraft?.flagged);

  // Autosave timer ref
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Timer tick
  useEffect(() => {
    if (session.status !== 'active' || !session.deadlineAt) return;

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(session.deadlineAt!).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setTimeLeftSeconds(0);
        clearInterval(interval);
      } else {
        setTimeLeftSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.deadlineAt, session.status]);

  // Debounced autosave
  const triggerAutosave = useCallback(
    (questionId: string, answer?: ClientAnswer, confidence?: ConfidenceLevel, flagged?: boolean) => {
      if (session.status !== 'active') return;

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      setSaveStatus('saving');

      autosaveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/sessions/${session.id}/draft`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId,
              answer,
              confidence,
              flagged,
            }),
          });
          if (!res.ok) throw new Error('Failed to autosave');
          setSaveStatus('saved');
        } catch {
          setSaveStatus('error');
        }
      }, 350);
    },
    [session.id, session.status]
  );

  // Handle answer change
  const handleAnswerChange = (newAnswer: ClientAnswer) => {
    if (!currentQuestionId || currentSubmission) return;

    const updatedDraft: DraftResponse = {
      sessionId: session.id,
      questionId: currentQuestionId,
      answer: newAnswer,
      confidence: currentConfidence,
      flagged: isFlagged,
      updatedAt: new Date().toISOString(),
    };

    setDrafts(prev => ({ ...prev, [currentQuestionId]: updatedDraft }));
    triggerAutosave(currentQuestionId, newAnswer, currentConfidence, isFlagged);
  };

  // Handle confidence change
  const handleConfidenceChange = (conf: ConfidenceLevel) => {
    if (!currentQuestionId || currentSubmission) return;

    const updatedDraft: DraftResponse = {
      sessionId: session.id,
      questionId: currentQuestionId,
      answer: currentAnswer,
      confidence: conf,
      flagged: isFlagged,
      updatedAt: new Date().toISOString(),
    };

    setDrafts(prev => ({ ...prev, [currentQuestionId]: updatedDraft }));
    triggerAutosave(currentQuestionId, currentAnswer, conf, isFlagged);
  };

  // Handle flag toggle
  const handleFlagToggle = () => {
    if (!currentQuestionId || currentSubmission) return;
    const nextFlagged = !isFlagged;

    const updatedDraft: DraftResponse = {
      sessionId: session.id,
      questionId: currentQuestionId,
      answer: currentAnswer,
      confidence: currentConfidence,
      flagged: nextFlagged,
      updatedAt: new Date().toISOString(),
    };

    setDrafts(prev => ({ ...prev, [currentQuestionId]: updatedDraft }));
    triggerAutosave(currentQuestionId, currentAnswer, currentConfidence, nextFlagged);
  };

  // Submit current question (Learn mode)
  const handleSubmitCurrent = async () => {
    if (!currentQuestionId || !currentAnswer) {
      setErrorMessage('Please select an answer before submitting.');
      return;
    }
    if (!currentConfidence) {
      setErrorMessage('Please select your confidence level (Confident, Unsure, or Guessed) before submitting.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/sessions/${session.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestionId,
          answer: currentAnswer,
          confidence: currentConfidence,
          flagged: isFlagged,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit response');
      }

      setSubmissions(prev => ({
        ...prev,
        [currentQuestionId]: data.submittedResponse,
      }));
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finalize session (Assess mode)
  const handleFinalizeSession = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/sessions/${session.id}/finalize`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to finalize session');
      }

      router.push(`/practice/${session.id}/results`);
    } catch (err) {
      setErrorMessage((err as Error).message);
      setIsSubmitting(false);
    }
  };

  if (!currentSnapshot) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-base text-[var(--text-secondary)]">No questions in this session.</p>
        <Link href="/practice" className="text-sm font-semibold text-[var(--accent)] hover:underline">
          Return to Practice Setup
        </Link>
      </div>
    );
  }

  // Answer state extracted for current interactive renderer
  const isSubmitted = Boolean(currentSubmission);
  const correctOptionIds = currentSubmission?.markingResult?.correctAnswerSummary as
    | { correctOptionId?: string; correctOptionIds?: string[] }
    | undefined;

  const correctMapping = currentSubmission?.markingResult?.correctAnswerSummary as
    | Record<string, string | null>
    | undefined;

  const correctOrderIds = currentSubmission?.markingResult?.correctAnswerSummary as
    | string[]
    | undefined;

  // Format time remaining
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(submissions).length;
  const isLastQuestion = currentIndex === snapshots.length - 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Session Top Navigation & Status Bar */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/practice"
            className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)]"
          >
            ← Exit
          </Link>
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-secondary)]">
            {session.mode === 'learn' ? 'Learn Practice' : 'Assessment'}
          </span>
          {session.contentTrack === 'fixture' && (
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30">
              Developer Test Session
            </span>
          )}
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            Question {currentIndex + 1} of {snapshots.length} ({answeredCount} answered)
          </span>
          {session.scopeFilter?.scopeSummary && (
            <span className="hidden lg:inline text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[var(--border)]">
              Scope: {session.scopeFilter.scopeSummary}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Autosave status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            {saveStatus === 'saving' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Saving draft...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Draft saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span className="text-rose-600 dark:text-rose-400">Save error</span>
              </>
            )}
          </div>

          {/* Countdown timer if active */}
          {timeLeftSeconds !== null && (
            <div
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold border ${
                timeLeftSeconds < 120
                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300 animate-pulse'
                  : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)]'
              }`}
            >
              ⏱ {formatTime(timeLeftSeconds)}
            </div>
          )}

          {/* Assess finalize button */}
          {session.mode === 'assess' && (
            <button
              type="button"
              onClick={handleFinalizeSession}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
            >
              Finalize Assessment →
            </button>
          )}
        </div>
      </div>

      {/* Question Number Stepper Bar (especially helpful in Assess mode) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {snapshots.map((s, idx) => {
          const isCurrent = idx === currentIndex;
          const isDone = Boolean(submissions[s.questionId]);
          const hasDraft = Boolean(drafts[s.questionId]?.answer);
          const isCardFlagged = Boolean(drafts[s.questionId]?.flagged || submissions[s.questionId]?.flagged);

          let btnClass = 'border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-secondary)]';
          if (isCurrent) {
            btnClass = 'border-[var(--accent)] bg-[var(--accent)] text-white font-bold ring-2 ring-[var(--ring-focus)]';
          } else if (isDone) {
            btnClass = 'border-emerald-600/50 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold';
          } else if (hasDraft) {
            btnClass = 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300';
          }

          return (
            <button
              key={s.questionId}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-all ${btnClass} flex items-center gap-1`}
              aria-label={`Jump to Question ${idx + 1}`}
            >
              <span>Q{idx + 1}</span>
              {isCardFlagged && <span className="text-[10px]">🚩</span>}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-sm space-y-6">
        {/* Header tags & Flag toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-secondary)]">
              {currentSnapshot.questionId}
            </span>
            <span className="text-xs uppercase font-semibold text-[var(--text-secondary)] tracking-wider">
              {currentSnapshot.type} choice
            </span>
          </div>

          <button
            type="button"
            onClick={handleFlagToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              isFlagged
                ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
            }`}
          >
            <span>🚩</span>
            <span>{isFlagged ? 'Flagged for Review' : 'Flag Question'}</span>
          </button>
        </div>

        {/* Question Prompt */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] leading-relaxed">
            {currentSnapshot.prompt}
          </h2>

          {/* Structured Code / Text Blocks */}
          {currentSnapshot.structuredBlocks && currentSnapshot.structuredBlocks.length > 0 && (
            <div className="space-y-2">
              {currentSnapshot.structuredBlocks.map((block, idx) => (
                <pre
                  key={idx}
                  className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border)] font-mono text-xs md:text-sm text-[var(--text-primary)] overflow-x-auto whitespace-pre-wrap"
                >
                  {block.content}
                </pre>
              ))}
            </div>
          )}

          {/* Exhibits (Images) */}
          {currentSnapshot.assetReferences && currentSnapshot.assetReferences.length > 0 && (
            <div className="space-y-3 pt-2">
              {currentSnapshot.assetReferences.map(asset => (
                <div key={asset.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-page)] space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {asset.caption || 'Exhibit'}
                  </div>
                  <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-black/5 dark:bg-white/5 flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.altText || asset.caption || 'Question exhibit'}
                      className="max-h-96 w-auto object-contain rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Answer Renderer */}
        <div className="pt-2">
          {currentSnapshot.type === 'single' && (
            <SingleChoiceQuestion
              snapshot={currentSnapshot}
              selectedOptionId={currentAnswer?.type === 'single' ? currentAnswer.selectedOptionId : undefined}
              onSelect={optId => handleAnswerChange({ type: 'single', selectedOptionId: optId })}
              disabled={isSubmitted}
              isSubmitted={isSubmitted}
              correctOptionId={correctOptionIds?.correctOptionId}
            />
          )}

          {currentSnapshot.type === 'multi' && (
            <MultiChoiceQuestion
              snapshot={currentSnapshot}
              selectedOptionIds={currentAnswer?.type === 'multi' ? currentAnswer.selectedOptionIds : []}
              onToggle={optId => {
                const prevIds = currentAnswer?.type === 'multi' ? currentAnswer.selectedOptionIds : [];
                const nextIds = prevIds.includes(optId)
                  ? prevIds.filter(id => id !== optId)
                  : [...prevIds, optId];
                handleAnswerChange({ type: 'multi', selectedOptionIds: nextIds });
              }}
              disabled={isSubmitted}
              isSubmitted={isSubmitted}
              correctOptionIds={correctOptionIds?.correctOptionIds || []}
            />
          )}

          {currentSnapshot.type === 'matching' && (
            <MatchingQuestion
              snapshot={currentSnapshot}
              mapping={currentAnswer?.type === 'matching' ? currentAnswer.mapping : {}}
              onChangeMapping={(promptId, choiceId) => {
                const prev = currentAnswer?.type === 'matching' ? currentAnswer.mapping : {};
                const next = { ...prev, [promptId]: choiceId };
                handleAnswerChange({ type: 'matching', mapping: next });
              }}
              disabled={isSubmitted}
              isSubmitted={isSubmitted}
              correctMapping={correctMapping}
            />
          )}

          {currentSnapshot.type === 'ordering' && (
            <OrderingQuestion
              snapshot={currentSnapshot}
              orderedItemIds={currentAnswer?.type === 'ordering' ? currentAnswer.orderedItemIds : undefined}
              onChangeOrder={orderedIds => handleAnswerChange({ type: 'ordering', orderedItemIds: orderedIds })}
              disabled={isSubmitted}
              isSubmitted={isSubmitted}
              correctOrderIds={correctOrderIds}
            />
          )}
        </div>

        {/* Confidence Level Capture (Required before submission) */}
        {!isSubmitted && (
          <div className="pt-4 border-t border-[var(--border)] space-y-2.5">
            <label className="block text-sm font-bold text-[var(--text-primary)]">
              Your Confidence Level:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['confident', 'unsure', 'guessed'] as ConfidenceLevel[]).map(lvl => {
                const isChosen = currentConfidence === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleConfidenceChange(lvl)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold capitalize transition-all ${
                      isChosen
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white ring-2 ring-[var(--ring-focus)] shadow-xs'
                        : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error message alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setCurrentIndex(prev => Math.max(0, prev - 1));
              setErrorMessage(null);
            }}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-3">
            {/* Learn mode submission button */}
            {session.mode === 'learn' && !isSubmitted && (
              <button
                type="button"
                onClick={handleSubmitCurrent}
                disabled={isSubmitting || !currentAnswer || !currentConfidence}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isSubmitting ? 'Checking...' : 'Submit Answer'}
              </button>
            )}

            {/* Next button */}
            {!isLastQuestion ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(prev => Math.min(snapshots.length - 1, prev + 1));
                  setErrorMessage(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:bg-[var(--accent-hover)] transition-all shadow-sm"
              >
                Next Question →
              </button>
            ) : (
              <Link
                href={`/practice/${session.id}/results`}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm"
              >
                View Session Results →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Immediate Explanation Card (Learn mode after submission) */}
      {isSubmitted && currentSubmission?.markingResult?.explanation && (
        <ExplanationCard
          explanation={currentSubmission.markingResult.explanation}
          isCorrect={currentSubmission.markingResult.isCorrect}
          score={currentSubmission.markingResult.score}
          maxScore={currentSubmission.markingResult.maxScore}
          selectedOptionId={currentAnswer?.type === 'single' ? currentAnswer.selectedOptionId : undefined}
          correctOptionId={correctOptionIds?.correctOptionId}
          status="verified"
        />
      )}
    </div>
  );
}
