'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Question, Tag, SubmittedResponse, ReviewState } from '@/domain/types';
import { buildTaxonomyIndex } from '@/domain/taxonomy';
import { OverviewSearch } from '@/components/OverviewSearch';
import { ExplanationCard } from '@/components/question/ExplanationCard';

interface ReviewClientProps {
  questions: Question[];
  tags: Tag[];
  submittedResponses: SubmittedResponse[];
  reviewStates: ReviewState[];
  dueStates: ReviewState[];
}

type TabType = 'missed' | 'guessed' | 'due' | 'bookmarks';

export function ReviewClient({
  questions,
  tags,
  submittedResponses,
  reviewStates,
  dueStates,
}: ReviewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameter support: ?tab=missed | guessed | due | bookmarks
  const initialTab = (searchParams.get('tab') as TabType) || 'missed';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localBookmarks, setLocalBookmarks] = useState<Set<string>>(() => {
    return new Set(reviewStates.filter(r => r.bookmarked).map(r => r.questionId));
  });
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Taxonomy lookup
  const taxIndex = useMemo(() => buildTaxonomyIndex(tags), [tags]);

  const questionMap = useMemo(() => {
    const map = new Map<string, Question>();
    for (const q of questions) {
      map.set(q.id, q);
    }
    return map;
  }, [questions]);

  // Filter latest submission for each question
  const latestByQuestion = useMemo(() => {
    const map = new Map<string, SubmittedResponse>();
    for (const sub of submittedResponses) {
      const existing = map.get(sub.questionId);
      if (!existing || new Date(sub.submittedAt).getTime() > new Date(existing.submittedAt).getTime()) {
        map.set(sub.questionId, sub);
      }
    }
    return map;
  }, [submittedResponses]);

  // Review item lists
  const missedItems = useMemo(() => {
    return Array.from(latestByQuestion.values()).filter(s => !s.markingResult.isCorrect);
  }, [latestByQuestion]);

  const guessedItems = useMemo(() => {
    return Array.from(latestByQuestion.values()).filter(
      s => s.confidence === 'guessed' || s.confidence === 'unsure'
    );
  }, [latestByQuestion]);

  const bookmarkedItems = useMemo(() => {
    return questions.filter(q => localBookmarks.has(q.id));
  }, [questions, localBookmarks]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Toggle bookmark handler
  const handleToggleBookmark = async (questionId: string) => {
    const next = new Set(localBookmarks);
    const isCurrentlyBookmarked = next.has(questionId);
    if (isCurrentlyBookmarked) {
      next.delete(questionId);
    } else {
      next.add(questionId);
    }
    setLocalBookmarks(next);

    try {
      await fetch('/api/review/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      });
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      // revert on error
      setLocalBookmarks(localBookmarks);
    }
  };

  // Start targeted practice session with specific questions
  const handleStartReviewPractice = async (items: { questionId?: string; id?: string }[]) => {
    try {
      setIsStartingSession(true);
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'learn',
          contentTrack: 'draft',
          scopeFilter: {
            scopeType: 'all',
            selectionCriteria: activeTab === 'missed' ? 'incorrect' : 'all',
            requestedCount: Math.max(1, items.length),
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.session?.id) {
        router.push(`/practice/${data.session.id}`);
      } else {
        router.push('/practice');
      }
    } catch {
      router.push('/practice');
    } finally {
      setIsStartingSession(false);
    }
  };

  // Determine cross-link suggestion when active tab is empty
  const crossLinkSuggestion = useMemo(() => {
    if (activeTab === 'missed') {
      if (guessedItems.length > 0) {
        return {
          tab: 'guessed' as TabType,
          label: `Review ${guessedItems.length} unsure answer${guessedItems.length === 1 ? '' : 's'}`,
        };
      }
      if (dueStates.length > 0) {
        return {
          tab: 'due' as TabType,
          label: `Review ${dueStates.length} due card${dueStates.length === 1 ? '' : 's'}`,
        };
      }
      if (bookmarkedItems.length > 0) {
        return {
          tab: 'bookmarks' as TabType,
          label: `Review ${bookmarkedItems.length} bookmark${bookmarkedItems.length === 1 ? '' : 's'}`,
        };
      }
    } else if (activeTab === 'guessed') {
      if (missedItems.length > 0) {
        return {
          tab: 'missed' as TabType,
          label: `Review ${missedItems.length} missed question${missedItems.length === 1 ? '' : 's'}`,
        };
      }
      if (dueStates.length > 0) {
        return {
          tab: 'due' as TabType,
          label: `Review ${dueStates.length} due card${dueStates.length === 1 ? '' : 's'}`,
        };
      }
    } else if (activeTab === 'due') {
      if (missedItems.length > 0) {
        return {
          tab: 'missed' as TabType,
          label: `Review ${missedItems.length} missed question${missedItems.length === 1 ? '' : 's'}`,
        };
      }
      if (guessedItems.length > 0) {
        return {
          tab: 'guessed' as TabType,
          label: `Review ${guessedItems.length} unsure answer${guessedItems.length === 1 ? '' : 's'}`,
        };
      }
    } else if (activeTab === 'bookmarks') {
      if (missedItems.length > 0) {
        return {
          tab: 'missed' as TabType,
          label: `Review ${missedItems.length} missed question${missedItems.length === 1 ? '' : 's'}`,
        };
      }
    }
    return null;
  }, [activeTab, missedItems.length, guessedItems.length, dueStates.length, bookmarkedItems.length]);

  return (
    <div className="w-full max-w-[1245px] space-y-7">
      {/* 1. Header Bar: Title on left, OverviewSearch on right */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-[40px] sm:text-[48px] font-bold text-[var(--text-heading)] tracking-tight">
          Review
        </h1>
        <OverviewSearch />
      </div>

      {/* 2. Tab Navigation Bar (Underline indicator + Pill badges) */}
      <div className="relative w-full border-b border-[#E8EEF5] dark:border-slate-800 flex items-center gap-6 sm:gap-10 overflow-x-auto scrollbar-none">
        {/* Tab 1: Missed Questions */}
        <button
          type="button"
          id="tab-missed-questions"
          onClick={() => setActiveTab('missed')}
          className={`py-3.5 relative flex items-center gap-2.5 text-[15px] sm:text-[16px] whitespace-nowrap cursor-pointer select-none transition-colors ${
            activeTab === 'missed'
              ? 'font-bold text-[#0066FF] dark:text-blue-400'
              : 'font-semibold text-[#334155] dark:text-slate-400 hover:text-[#0C1523] dark:hover:text-white'
          }`}
        >
          <span>Missed Questions</span>
          <span className="h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[12px] font-bold bg-[#EFF6FF] text-[#0066FF] dark:bg-blue-950/60 dark:text-blue-400">
            {missedItems.length}
          </span>
          {activeTab === 'missed' && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0066FF] rounded-t-sm" />
          )}
        </button>

        {/* Tab 2: Unsure & Guessed */}
        <button
          type="button"
          id="tab-unsure-guessed"
          onClick={() => setActiveTab('guessed')}
          className={`py-3.5 relative flex items-center gap-2.5 text-[15px] sm:text-[16px] whitespace-nowrap cursor-pointer select-none transition-colors ${
            activeTab === 'guessed'
              ? 'font-bold text-[#0066FF] dark:text-blue-400'
              : 'font-semibold text-[#334155] dark:text-slate-400 hover:text-[#0C1523] dark:hover:text-white'
          }`}
        >
          <span>Unsure & Guessed</span>
          <span className="h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[12px] font-bold bg-[#FEF3C7] text-[#D97706] dark:bg-amber-950/60 dark:text-amber-400">
            {guessedItems.length}
          </span>
          {activeTab === 'guessed' && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0066FF] rounded-t-sm" />
          )}
        </button>

        {/* Tab 3: Due (Leitner Intervals) */}
        <button
          type="button"
          id="tab-due-leitner"
          onClick={() => setActiveTab('due')}
          className={`py-3.5 relative flex items-center gap-2.5 text-[15px] sm:text-[16px] whitespace-nowrap cursor-pointer select-none transition-colors ${
            activeTab === 'due'
              ? 'font-bold text-[#0066FF] dark:text-blue-400'
              : 'font-semibold text-[#334155] dark:text-slate-400 hover:text-[#0C1523] dark:hover:text-white'
          }`}
        >
          <span>Due (Leitner Intervals)</span>
          <span className="h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[12px] font-bold bg-[#EFF6FF] text-[#0066FF] dark:bg-blue-950/60 dark:text-blue-400">
            {dueStates.length}
          </span>
          {activeTab === 'due' && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0066FF] rounded-t-sm" />
          )}
        </button>

        {/* Tab 4: Bookmarks */}
        <button
          type="button"
          id="tab-bookmarks"
          onClick={() => setActiveTab('bookmarks')}
          className={`py-3.5 relative flex items-center gap-2.5 text-[15px] sm:text-[16px] whitespace-nowrap cursor-pointer select-none transition-colors ${
            activeTab === 'bookmarks'
              ? 'font-bold text-[#0066FF] dark:text-blue-400'
              : 'font-semibold text-[#334155] dark:text-slate-400 hover:text-[#0C1523] dark:hover:text-white'
          }`}
        >
          <span>Bookmarks</span>
          <span className="h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[12px] font-bold bg-[#F1F5F9] text-[#64748B] dark:bg-slate-800 dark:text-slate-400">
            {bookmarkedItems.length}
          </span>
          {activeTab === 'bookmarks' && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0066FF] rounded-t-sm" />
          )}
        </button>
      </div>

      {/* 3. Content Area */}
      {/* TAB 1: MISSED QUESTIONS */}
      {activeTab === 'missed' && (
        <div>
          {missedItems.length === 0 ? (
            /* EXACT TEMPLATE EMPTY STATE */
            <div className="pt-20 pb-16 flex flex-col items-center justify-center text-center">
              {/* Circular Checkmark Icon */}
              <div className="w-[72px] h-[72px] rounded-full border-2 border-[#BFDBFE] dark:border-blue-900/60 bg-[#EFF6FF] dark:bg-blue-950/40 flex items-center justify-center mb-6 shadow-xs">
                <svg
                  className="w-8 h-8 text-[#0066FF] dark:text-blue-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-[26px] sm:text-[28px] font-bold text-[#0C1523] dark:text-white mb-2 tracking-tight">
                No missed questions yet.
              </h2>

              {/* Subtitle */}
              <p className="text-[15px] sm:text-[16px] text-[#64748B] dark:text-slate-400 mb-8 max-w-md">
                Questions you miss during practice will appear here.
              </p>

              {/* CTA Button */}
              <Link
                href="/practice"
                id="empty-start-practice-btn"
                className="inline-flex items-center justify-center gap-2 px-8 h-[52px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-white text-[16px] font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <span>Start practice</span>
                <span className="text-[18px]">→</span>
              </Link>

              {/* Secondary Divider Line */}
              <div className="w-full border-b border-[#E8EEF5] dark:border-slate-800 mt-20 mb-8" />

              {/* Contextual Link Suggestion */}
              {crossLinkSuggestion ? (
                <button
                  type="button"
                  id="empty-crosslink-btn"
                  onClick={() => setActiveTab(crossLinkSuggestion.tab)}
                  className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0066FF] dark:text-blue-400 hover:underline cursor-pointer transition-all"
                >
                  <span>{crossLinkSuggestion.label}</span>
                  <span className="text-[17px]">→</span>
                </button>
              ) : (
                <Link
                  href="/bank"
                  className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0066FF] dark:text-blue-400 hover:underline cursor-pointer transition-all"
                >
                  <span>Explore Question Bank</span>
                  <span className="text-[17px]">→</span>
                </Link>
              )}
            </div>
          ) : (
            /* POPULATED MISSED QUESTIONS LIST */
            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <p className="text-[15px] text-[#64748B] dark:text-slate-400 font-medium">
                  Showing {missedItems.length} question{missedItems.length === 1 ? '' : 's'} you answered incorrectly on your most recent attempt.
                </p>
                <button
                  type="button"
                  disabled={isStartingSession}
                  onClick={() => handleStartReviewPractice(missedItems)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-[14px] font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <span>Practice missed questions</span>
                  <span>→</span>
                </button>
              </div>

              <div className="space-y-4">
                {missedItems.map(sub => {
                  const q = questionMap.get(sub.questionId);
                  const isExpanded = expandedId === sub.questionId;
                  const isBookmarked = localBookmarks.has(sub.questionId);

                  // Primary domain tag
                  const primaryTagId = q?.tagIds[0];
                  const primaryTag = primaryTagId ? taxIndex.tagMap.get(primaryTagId) : null;

                  return (
                    <div
                      key={sub.submissionId}
                      className="p-6 rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-[#CBD5E1] dark:hover:border-slate-700 transition-all space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300">
                            {sub.questionId}
                          </span>
                          {primaryTag && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#0066FF] dark:bg-blue-950/40 dark:text-blue-400">
                              {primaryTag.name}
                            </span>
                          )}
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400">
                            Missed (0/{sub.markingResult.maxScore})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleBookmark(sub.questionId)}
                            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isBookmarked
                                ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/40 dark:border-amber-700'
                                : 'border-[#E2E8F0] dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white'
                            }`}
                          >
                            <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpand(sub.questionId)}
                            className="text-[13px] font-semibold text-[#0066FF] dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {isExpanded ? 'Hide explanation ▲' : 'Show explanation ▼'}
                          </button>
                        </div>
                      </div>

                      <p className="text-[16px] sm:text-[17px] text-[#0C1523] dark:text-white font-medium leading-relaxed">
                        {q?.prompt || `Question ${sub.questionId}`}
                      </p>

                      {/* Display options review if single choice */}
                      {q?.type === 'single' && 'options' in q.payload && (
                        <div className="space-y-2 pt-1">
                          {q.payload.options.map((opt) => {
                            const isUserSelected = sub.answer.type === 'single' && sub.answer.selectedOptionId === opt.id;
                            return (
                              <div
                                key={opt.id}
                                className={`p-3.5 rounded-lg border text-[14.5px] flex items-center justify-between ${
                                  isUserSelected
                                    ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200'
                                    : 'border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-950 text-[#334155] dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span>{opt.text}</span>
                                </div>
                                {isUserSelected && (
                                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                    <span>✕</span> Your answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation accordion */}
                      {isExpanded && sub.markingResult.explanation && (
                        <div className="pt-2 animate-in fade-in duration-150">
                          <ExplanationCard
                            explanation={sub.markingResult.explanation}
                            isCorrect={false}
                            score={0}
                            maxScore={1}
                            status={q?.status || 'unverified'}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNSURE & GUESSED */}
      {activeTab === 'guessed' && (
        <div>
          {guessedItems.length === 0 ? (
            /* EMPTY STATE FOR GUESSED */
            <div className="pt-20 pb-16 flex flex-col items-center justify-center text-center">
              <div className="w-[72px] h-[72px] rounded-full border-2 border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-6 shadow-xs text-amber-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>

              <h2 className="text-[26px] sm:text-[28px] font-bold text-[#0C1523] dark:text-white mb-2 tracking-tight">
                No unsure or guessed answers yet.
              </h2>

              <p className="text-[15px] sm:text-[16px] text-[#64748B] dark:text-slate-400 mb-8 max-w-md">
                Questions where you selected &ldquo;unsure&rdquo; or &ldquo;guessed&rdquo; confidence will appear here so you can solidify them into firm mastery.
              </p>

              <Link
                href="/practice"
                className="inline-flex items-center justify-center gap-2 px-8 h-[52px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-white text-[16px] font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <span>Start practice</span>
                <span className="text-[18px]">→</span>
              </Link>

              <div className="w-full border-b border-[#E8EEF5] dark:border-slate-800 mt-20 mb-8" />

              {crossLinkSuggestion && (
                <button
                  type="button"
                  onClick={() => setActiveTab(crossLinkSuggestion.tab)}
                  className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0066FF] dark:text-blue-400 hover:underline cursor-pointer transition-all"
                >
                  <span>{crossLinkSuggestion.label}</span>
                  <span className="text-[17px]">→</span>
                </button>
              )}
            </div>
          ) : (
            /* POPULATED UNSURE LIST */
            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <p className="text-[15px] text-[#64748B] dark:text-slate-400 font-medium">
                  Showing {guessedItems.length} question{guessedItems.length === 1 ? '' : 's'} flagged as unsure or guessed. Target these to turn lucky guesses into firm knowledge.
                </p>
                <button
                  type="button"
                  disabled={isStartingSession}
                  onClick={() => handleStartReviewPractice(guessedItems)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-[14px] font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <span>Practice flagged questions</span>
                  <span>→</span>
                </button>
              </div>

              <div className="space-y-4">
                {guessedItems.map(sub => {
                  const q = questionMap.get(sub.questionId);
                  const isExpanded = expandedId === sub.questionId;
                  const isBookmarked = localBookmarks.has(sub.questionId);
                  const primaryTagId = q?.tagIds[0];
                  const primaryTag = primaryTagId ? taxIndex.tagMap.get(primaryTagId) : null;

                  return (
                    <div
                      key={sub.submissionId}
                      className="p-6 rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-[#CBD5E1] dark:hover:border-slate-700 transition-all space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300">
                            {sub.questionId}
                          </span>
                          {primaryTag && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#0066FF] dark:bg-blue-950/40 dark:text-blue-400">
                              {primaryTag.name}
                            </span>
                          )}
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 capitalize">
                            Flagged: {sub.confidence}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md">
                            {sub.markingResult.isCorrect ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Marked Correct</span>
                            ) : (
                              <span className="text-rose-700 dark:text-rose-400 font-bold">✕ Marked Incorrect</span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleBookmark(sub.questionId)}
                            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isBookmarked
                                ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/40 dark:border-amber-700'
                                : 'border-[#E2E8F0] dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white'
                            }`}
                          >
                            <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpand(sub.questionId)}
                            className="text-[13px] font-semibold text-[#0066FF] dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {isExpanded ? 'Hide explanation ▲' : 'Show explanation ▼'}
                          </button>
                        </div>
                      </div>

                      <p className="text-[16px] sm:text-[17px] text-[#0C1523] dark:text-white font-medium leading-relaxed">
                        {q?.prompt || `Question ${sub.questionId}`}
                      </p>

                      {isExpanded && sub.markingResult.explanation && (
                        <div className="pt-2 animate-in fade-in duration-150">
                          <ExplanationCard
                            explanation={sub.markingResult.explanation}
                            isCorrect={sub.markingResult.isCorrect}
                            score={sub.markingResult.score}
                            maxScore={1}
                            status={q?.status || 'unverified'}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DUE (LEITNER INTERVALS) */}
      {activeTab === 'due' && (
        <div>
          {dueStates.length === 0 ? (
            /* EMPTY STATE FOR DUE */
            <div className="pt-20 pb-16 flex flex-col items-center justify-center text-center">
              <div className="w-[72px] h-[72px] rounded-full border-2 border-[#BFDBFE] dark:border-blue-900/60 bg-[#EFF6FF] dark:bg-blue-950/40 flex items-center justify-center mb-6 shadow-xs text-[#0066FF] dark:text-blue-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-[26px] sm:text-[28px] font-bold text-[#0C1523] dark:text-white mb-2 tracking-tight">
                All caught up!
              </h2>

              <p className="text-[15px] sm:text-[16px] text-[#64748B] dark:text-slate-400 mb-8 max-w-md">
                No cards are due for spaced repetition review today. Spaced intervals automatically schedule verified practice cards across 5 Leitner boxes.
              </p>

              <Link
                href="/practice"
                className="inline-flex items-center justify-center gap-2 px-8 h-[52px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-white text-[16px] font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <span>Start practice</span>
                <span className="text-[18px]">→</span>
              </Link>

              <div className="w-full border-b border-[#E8EEF5] dark:border-slate-800 mt-20 mb-8" />

              {crossLinkSuggestion && (
                <button
                  type="button"
                  onClick={() => setActiveTab(crossLinkSuggestion.tab)}
                  className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0066FF] dark:text-blue-400 hover:underline cursor-pointer transition-all"
                >
                  <span>{crossLinkSuggestion.label}</span>
                  <span className="text-[17px]">→</span>
                </button>
              )}
            </div>
          ) : (
            /* POPULATED DUE LIST */
            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <p className="text-[15px] text-[#64748B] dark:text-slate-400 font-medium">
                  Showing {dueStates.length} scheduled Leitner card{dueStates.length === 1 ? '' : 's'} due for review today.
                </p>
                <Link
                  href="/practice?criteria=due"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-[14px] font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <span>Review due cards</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="space-y-4">
                {dueStates.map(r => {
                  const q = questionMap.get(r.questionId);
                  const isBookmarked = localBookmarks.has(r.questionId);
                  const primaryTagId = q?.tagIds[0];
                  const primaryTag = primaryTagId ? taxIndex.tagMap.get(primaryTagId) : null;

                  return (
                    <div
                      key={r.questionId}
                      className="p-6 rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0066FF] dark:bg-blue-950/40 dark:text-blue-400">
                            Box {r.box}
                          </span>
                          {primaryTag && (
                            <span className="text-xs font-medium text-slate-500">
                              {primaryTag.name}
                            </span>
                          )}
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            Due Now
                          </span>
                        </div>
                        <p className="text-[16px] text-[#0C1523] dark:text-white font-medium">
                          {q?.prompt || `Question ${r.questionId}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(r.questionId)}
                          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                            isBookmarked
                              ? 'bg-amber-50 border-amber-300 text-amber-500'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                        <Link
                          href={`/bank?q=${encodeURIComponent(r.questionId)}`}
                          className="px-4 py-2 rounded-lg border border-[#E2E8F0] dark:border-slate-700 text-[13px] font-semibold text-[#0066FF] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          View card →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        <div>
          {bookmarkedItems.length === 0 ? (
            /* EMPTY STATE FOR BOOKMARKS */
            <div className="pt-20 pb-16 flex flex-col items-center justify-center text-center">
              <div className="w-[72px] h-[72px] rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-xs text-slate-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>

              <h2 className="text-[26px] sm:text-[28px] font-bold text-[#0C1523] dark:text-white mb-2 tracking-tight">
                No bookmarked questions yet.
              </h2>

              <p className="text-[15px] sm:text-[16px] text-[#64748B] dark:text-slate-400 mb-8 max-w-md">
                Bookmark challenging questions during practice sessions or explore the question bank to save items for quick reference.
              </p>

              <Link
                href="/bank"
                className="inline-flex items-center justify-center gap-2 px-8 h-[52px] rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] text-white text-[16px] font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <span>Explore question bank</span>
                <span className="text-[18px]">→</span>
              </Link>

              <div className="w-full border-b border-[#E8EEF5] dark:border-slate-800 mt-20 mb-8" />

              {crossLinkSuggestion && (
                <button
                  type="button"
                  onClick={() => setActiveTab(crossLinkSuggestion.tab)}
                  className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0066FF] dark:text-blue-400 hover:underline cursor-pointer transition-all"
                >
                  <span>{crossLinkSuggestion.label}</span>
                  <span className="text-[17px]">→</span>
                </button>
              )}
            </div>
          ) : (
            /* POPULATED BOOKMARKS LIST */
            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <p className="text-[15px] text-[#64748B] dark:text-slate-400 font-medium">
                  Showing {bookmarkedItems.length} bookmarked question{bookmarkedItems.length === 1 ? '' : 's'} saved for quick reference.
                </p>
                <button
                  type="button"
                  disabled={isStartingSession}
                  onClick={() => handleStartReviewPractice(bookmarkedItems)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-[14px] font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <span>Practice bookmarked questions</span>
                  <span>→</span>
                </button>
              </div>

              <div className="space-y-4">
                {bookmarkedItems.map(q => {
                  const primaryTagId = q.tagIds[0];
                  const primaryTag = primaryTagId ? taxIndex.tagMap.get(primaryTagId) : null;

                  return (
                    <div
                      key={q.id}
                      className="p-6 rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {q.id}
                          </span>
                          {primaryTag && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#0066FF] dark:bg-blue-950/40 dark:text-blue-400">
                              {primaryTag.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[16px] text-[#0C1523] dark:text-white font-medium">
                          {q.prompt}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(q.id)}
                          className="p-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-700 transition-colors cursor-pointer"
                          title="Remove bookmark"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                        <Link
                          href={`/bank?q=${encodeURIComponent(q.id)}`}
                          className="px-4 py-2 rounded-lg border border-[#E2E8F0] dark:border-slate-700 text-[13px] font-semibold text-[#0066FF] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          View in Bank →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
