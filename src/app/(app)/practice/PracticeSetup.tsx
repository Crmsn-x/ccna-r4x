'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Tag, Question, ScopeType, ScopeFilterSnapshot, Session } from '@/domain/types';
import {
  filterQuestionsByScope,
  formatScopeSummary,
  buildTaxonomyIndex,
  getDescendantTagIds,
} from '@/domain/taxonomy';
import { useCustomModules } from '@/hooks/useDevMode';
import { OverviewSearch } from '@/components/OverviewSearch';

interface PracticeSetupProps {
  questions: Question[];
  tags: Tag[];
  activeSession?: Session | null;
}

export function PracticeSetup({ questions, tags, activeSession }: PracticeSetupProps) {
  const router = useRouter();
  const [customModules] = useCustomModules();

  // Mode: Learn or Assessment
  const [mode, setMode] = useState<'learn' | 'assess'>('learn');

  // Scope: All questions, Domain, Topic, Module
  const [scopeType, setScopeType] = useState<ScopeType>('all');
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);
  const [topicDomainId, setTopicDomainId] = useState<string>('tag-domain-1');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  // Session settings: Questions
  const [selectedPreset, setSelectedPreset] = useState<5 | 10 | 25 | 50 | 'custom'>(10);
  const [customCountInput, setCustomCountInput] = useState<string>('10');

  // Session settings: Timer
  const [enableTimer, setEnableTimer] = useState<boolean>(false);
  const [timeMinutes, setTimeMinutes] = useState<number>(15);

  // Status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  // Build taxonomy index
  const taxIndex = useMemo(() => buildTaxonomyIndex(tags), [tags]);
  const domains = taxIndex.byKind.domain || [];

  // Available topics for the active topic domain filter
  const availableTopicsForDomain = useMemo(() => {
    if (!topicDomainId) return [];
    return (taxIndex.childrenMap.get(topicDomainId) || []).filter(t => t.kind === 'topic');
  }, [topicDomainId, taxIndex]);

  // Available subtopics for selected topic(s)
  const availableSubtopics = useMemo(() => {
    if (selectedTopicIds.length === 0) return [];
    const subs: Tag[] = [];
    for (const tId of selectedTopicIds) {
      const children = (taxIndex.childrenMap.get(tId) || []).filter(t => t.kind === 'subtopic');
      subs.push(...children);
    }
    return subs;
  }, [selectedTopicIds, taxIndex]);

  // Default topic domain if not set
  useEffect(() => {
    if (scopeType === 'topic' && !topicDomainId && domains.length > 0) {
      setTopicDomainId(domains[0].id);
    }
  }, [scopeType, topicDomainId, domains]);

  // Scope filter snapshot
  const currentScopeFilter: ScopeFilterSnapshot = useMemo(() => {
    const filter: ScopeFilterSnapshot = {
      scopeType,
      selectionCriteria: 'all',
      requestedCount: 10,
    };

    if (scopeType === 'domain' && selectedDomainIds.length > 0) {
      filter.domainTagIds = selectedDomainIds;
    } else if (scopeType === 'topic') {
      if (topicDomainId) filter.domainTagIds = [topicDomainId];
      if (selectedTopicIds.length > 0) filter.topicTagIds = selectedTopicIds;
      if (selectedSubtopicIds.length > 0) filter.subtopicTagIds = selectedSubtopicIds;
    } else if (scopeType === 'module' && selectedModuleIds.length > 0) {
      filter.moduleTagIds = selectedModuleIds;
    }

    return filter;
  }, [scopeType, selectedDomainIds, topicDomainId, selectedTopicIds, selectedSubtopicIds, selectedModuleIds]);

  // Calculate matching eligible questions in real time (excluding dev fixtures)
  const eligibleQuestions = useMemo(() => {
    const base = questions.filter(q => !q.isDevFixture && q.status !== 'needs-source');

    if (scopeType === 'all') {
      return base;
    }

    if (scopeType === 'domain') {
      if (selectedDomainIds.length === 0) return base;
      const tagSet = new Set<string>();
      for (const dId of selectedDomainIds) {
        const descendants = getDescendantTagIds(dId, tags);
        for (const d of descendants) tagSet.add(d);
      }
      return base.filter(q => q.tagIds.some(t => tagSet.has(t)));
    }

    if (scopeType === 'topic') {
      if (selectedTopicIds.length === 0 && !topicDomainId) return base;
      return filterQuestionsByScope(base, currentScopeFilter, tags);
    }

    if (scopeType === 'module') {
      if (selectedModuleIds.length === 0) return base;
      const topicSet = new Set<string>();
      for (const modId of selectedModuleIds) {
        const mod = customModules.find(m => m.id === modId);
        if (mod) {
          mod.topicIds.forEach(t => topicSet.add(t));
        }
      }
      if (topicSet.size === 0) return base;
      return base.filter(q => q.tagIds.some(t => topicSet.has(t)));
    }

    return base;
  }, [questions, scopeType, selectedDomainIds, topicDomainId, selectedTopicIds, selectedModuleIds, customModules, currentScopeFilter, tags]);

  const eligibleCount = eligibleQuestions.length;

  // Effective question count calculation
  const questionCount = useMemo(() => {
    if (eligibleCount <= 0) return 0;
    if (selectedPreset === 'custom') {
      const parsed = parseInt(customCountInput, 10);
      if (isNaN(parsed) || parsed < 1) return 1;
      return Math.min(eligibleCount, parsed);
    }
    return Math.min(eligibleCount, selectedPreset);
  }, [selectedPreset, customCountInput, eligibleCount]);

  // If eligibleCount changes and invalidates custom count, keep input synced
  useEffect(() => {
    if (selectedPreset === 'custom') {
      const parsed = parseInt(customCountInput, 10);
      if (parsed > eligibleCount && eligibleCount > 0) {
        setCustomCountInput(String(eligibleCount));
      }
    }
  }, [eligibleCount, selectedPreset, customCountInput]);

  // Removable chip toggles
  const handleDomainToggle = (domId: string) => {
    setSelectedDomainIds(prev =>
      prev.includes(domId) ? prev.filter(id => id !== domId) : [...prev, domId]
    );
  };

  const handleTopicToggle = (topId: string) => {
    setSelectedTopicIds(prev =>
      prev.includes(topId) ? prev.filter(id => id !== topId) : [...prev, topId]
    );
    setSelectedSubtopicIds([]);
  };

  const handleSubtopicToggle = (subId: string) => {
    setSelectedSubtopicIds(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleModuleToggle = (modId: string) => {
    setSelectedModuleIds(prev =>
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    );
  };

  // Scope summary text for the footer
  const scopeSummaryText = useMemo(() => {
    if (scopeType === 'all') return 'All questions';
    if (scopeType === 'domain') {
      if (selectedDomainIds.length === 0) return 'All questions';
      if (selectedDomainIds.length === 1) {
        return taxIndex.tagMap.get(selectedDomainIds[0])?.name || 'Selected domain';
      }
      return `${selectedDomainIds.length} domains`;
    }
    if (scopeType === 'topic') {
      if (selectedTopicIds.length === 0) {
        return taxIndex.tagMap.get(topicDomainId)?.name || 'All topics';
      }
      if (selectedTopicIds.length === 1) {
        return taxIndex.tagMap.get(selectedTopicIds[0])?.name || 'Selected topic';
      }
      return `${selectedTopicIds.length} topics`;
    }
    if (scopeType === 'module') {
      if (selectedModuleIds.length === 0) return 'All modules';
      return `${selectedModuleIds.length} ${selectedModuleIds.length === 1 ? 'module' : 'modules'}`;
    }
    return 'Custom scope';
  }, [scopeType, selectedDomainIds, selectedTopicIds, topicDomainId, selectedModuleIds, taxIndex]);

  // Start Practice action
  const handleStartPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (eligibleCount === 0) {
      setErrorMessage('No matching questions available for this selection. Try broadening your scope.');
      return;
    }

    if (questionCount < 1) {
      setErrorMessage('Please select at least 1 question for your session.');
      return;
    }

    if (enableTimer && (timeMinutes < 1 || isNaN(timeMinutes))) {
      setErrorMessage('Please specify a valid timer duration in minutes.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        mode,
        contentTrack: 'verified',
        scopeFilter: {
          ...currentScopeFilter,
          requestedCount: questionCount,
        },
        timeLimitMinutes: enableTimer && timeMinutes > 0 ? timeMinutes : undefined,
      };

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create practice session.');
      }

      router.push(`/practice/${data.session.id}`);
    } catch (err) {
      setErrorMessage((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full h-full flex flex-col min-h-0 py-6 text-[#0B1223] dark:text-slate-100 animate-in fade-in duration-200">
      {/* Page Header: Title + Subtitle + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-[32px] font-bold text-[#0B1223] dark:text-white tracking-tight leading-[40px]">
            Practice setup
          </h1>
          <p className="text-[15px] text-[#64748B] dark:text-slate-400 leading-[22px] mt-1">
            A focused session, your way.
          </p>
        </div>
        <OverviewSearch />
      </div>

      <form onSubmit={handleStartPractice} className="w-full flex-1 flex flex-col min-h-0">
        {/* Scrollable sections container */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
          {/* Active Unfinished Session Banner */}
          {activeSession && !isBannerDismissed && (
            <div className="mb-3.5 p-3 rounded-[8px] border border-blue-200 bg-[#EFF6FF] dark:bg-blue-950/40 dark:border-blue-800 text-[#0066FF] dark:text-blue-300 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-sm select-none">ℹ️</span>
                <span className="font-medium text-[13px] sm:text-[14px]">
                  You have an active session in progress ({activeSession.questionIds.length} questions, {activeSession.mode === 'learn' ? 'Learn' : 'Assessment'} mode).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/practice/${activeSession.id}`}
                  className="px-3 py-1.5 rounded-[6px] bg-[#0066FF] text-white font-semibold text-xs hover:bg-[#0052CC] transition-colors shrink-0 text-center"
                >
                  Resume session →
                </Link>
                <button
                  type="button"
                  onClick={() => setIsBannerDismissed(true)}
                  className="px-1.5 py-0.5 text-blue-400 hover:text-blue-700 dark:hover:text-white rounded cursor-pointer text-base leading-none"
                  aria-label="Dismiss banner"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-3.5 p-3 rounded-[8px] border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
              <span className="text-sm shrink-0 select-none">⚠️</span>
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* ========================================================
              01 PRACTICE MODE
             ======================================================== */}
          <section className="py-5 border-t border-[#E8EEF5] dark:border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-[28%_1fr] gap-6 lg:gap-8 items-start">
              {/* Left description column */}
              <div>
                <span className="text-[13px] font-semibold text-[#64748B] dark:text-slate-400 block mb-0.5">
                  01
                </span>
                <h2 className="text-[18px] font-semibold text-[#0B1223] dark:text-white leading-[26px]">
                  Practice mode
                </h2>
                <p className="text-[14px] text-[#64748B] dark:text-slate-400 leading-[20px] mt-0.5">
                  Choose when you see feedback.
                </p>
              </div>

              {/* Right controls column: Learn & Assessment cards */}
              <div
                role="radiogroup"
                aria-label="Practice mode"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                {/* Learn Card */}
                <div
                  role="radio"
                  tabIndex={0}
                  aria-checked={mode === 'learn'}
                  onClick={() => setMode('learn')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMode('learn');
                    }
                  }}
                  className={`min-h-[80px] p-4 rounded-[10px] border flex items-center gap-3.5 transition-all relative cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:outline-none ${
                    mode === 'learn'
                      ? 'bg-[#F0F7FF] dark:bg-blue-950/30 border-[#0066FF] shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-[#E5ECF6] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Book outline SVG icon: 28px */}
                  <div
                    className={`w-7 h-7 flex items-center justify-center shrink-0 ${
                      mode === 'learn'
                        ? 'text-[#0066FF] dark:text-blue-400'
                        : 'text-[#64748B] dark:text-slate-400'
                    }`}
                  >
                    <svg
                      className="w-7 h-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>

                  <div className="pr-6">
                    <span className="text-[16px] font-bold text-[#0B1223] dark:text-white block leading-tight">
                      Learn
                    </span>
                    <span className="text-[13px] text-[#64748B] dark:text-slate-400 font-normal block leading-[18px] mt-0.5">
                      Explanations after each answer.
                    </span>
                  </div>

                  {mode === 'learn' && (
                    <div className="absolute top-3 right-3 w-4.5 h-4.5 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-xs">
                      <svg
                        className="w-2.5 h-2.5 stroke-[3]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Assessment Card */}
                <div
                  role="radio"
                  tabIndex={0}
                  aria-checked={mode === 'assess'}
                  onClick={() => setMode('assess')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMode('assess');
                    }
                  }}
                  className={`min-h-[80px] p-4 rounded-[10px] border flex items-center gap-3.5 transition-all relative cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:outline-none ${
                    mode === 'assess'
                      ? 'bg-[#F0F7FF] dark:bg-blue-950/30 border-[#0066FF] shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-[#E5ECF6] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Checklist outline SVG icon: 28px */}
                  <div
                    className={`w-7 h-7 flex items-center justify-center shrink-0 ${
                      mode === 'assess'
                        ? 'text-[#0066FF] dark:text-blue-400'
                        : 'text-[#64748B] dark:text-slate-400'
                    }`}
                  >
                    <svg
                      className="w-7 h-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" />
                      <path d="M9 11l1.5 1.5 3-3" />
                      <line x1="15" y1="11" x2="16.5" y2="11" />
                      <path d="M9 16l1.5 1.5 3-3" />
                      <line x1="15" y1="16" x2="16.5" y2="16" />
                    </svg>
                  </div>

                  <div className="pr-6">
                    <span className="text-[16px] font-bold text-[#0B1223] dark:text-white block leading-tight">
                      Assessment
                    </span>
                    <span className="text-[13px] text-[#64748B] dark:text-slate-400 font-normal block leading-[18px] mt-0.5">
                      Results at the end.
                    </span>
                  </div>

                  {mode === 'assess' && (
                    <div className="absolute top-3 right-3 w-4.5 h-4.5 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-xs">
                      <svg
                        className="w-2.5 h-2.5 stroke-[3]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================
              02 CONTENT
             ======================================================== */}
          <section className="py-5 border-t border-[#E8EEF5] dark:border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-[28%_1fr] gap-6 lg:gap-8 items-start">
              {/* Left description column */}
              <div>
                <span className="text-[13px] font-semibold text-[#64748B] dark:text-slate-400 block mb-0.5">
                  02
                </span>
                <h2 className="text-[18px] font-semibold text-[#0B1223] dark:text-white leading-[26px]">
                  Content
                </h2>
                <p className="text-[14px] text-[#64748B] dark:text-slate-400 leading-[20px] mt-0.5">
                  Focus on what matters today.
                </p>
              </div>

              {/* Right controls column: Segmented scope selector & question count */}
              <div className="w-full">
                {/* Segmented controls: 40px high */}
                <div
                  role="tablist"
                  aria-label="Content scope selector"
                  className="h-[40px] p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-[8px] grid grid-cols-4 gap-1 w-full"
                >
                  {(
                    [
                      { id: 'all', label: 'All questions' },
                      { id: 'domain', label: 'Domain' },
                      { id: 'topic', label: 'Topic' },
                      { id: 'module', label: 'Module' },
                    ] as { id: ScopeType; label: string }[]
                  ).map((tab) => {
                    const isActive = scopeType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`scope-tab-${tab.id}`}
                        aria-selected={isActive}
                        onClick={() => setScopeType(tab.id)}
                        className={`rounded-[6px] text-[13px] sm:text-[14px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white dark:bg-slate-900 text-[#0066FF] font-semibold shadow-xs'
                            : 'text-[#475569] dark:text-slate-300 hover:text-[#0B1223] dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Removable chips container */}
                {scopeType === 'domain' && selectedDomainIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {selectedDomainIds.map(dId => {
                      const tag = taxIndex.tagMap.get(dId);
                      return (
                        <span
                          key={dId}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#0066FF] border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300"
                        >
                          {tag?.name || dId}
                          <button
                            type="button"
                            onClick={() => handleDomainToggle(dId)}
                            className="hover:text-blue-800 dark:hover:text-white cursor-pointer ml-0.5"
                            aria-label={`Remove domain ${tag?.name || dId}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setSelectedDomainIds([])}
                      className="text-xs text-[#64748B] hover:text-[#0B1223] dark:text-slate-400 dark:hover:text-white underline self-center ml-1"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {scopeType === 'topic' && (selectedTopicIds.length > 0 || selectedSubtopicIds.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {selectedTopicIds.map(tId => {
                      const tag = taxIndex.tagMap.get(tId);
                      return (
                        <span
                          key={tId}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#0066FF] border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300"
                        >
                          {tag?.name || tId}
                          <button
                            type="button"
                            onClick={() => handleTopicToggle(tId)}
                            className="hover:text-blue-800 dark:hover:text-white cursor-pointer ml-0.5"
                            aria-label={`Remove topic ${tag?.name || tId}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {selectedSubtopicIds.map(sId => {
                      const tag = taxIndex.tagMap.get(sId);
                      return (
                        <span
                          key={sId}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-[#475569] border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                        >
                          {tag?.name || sId}
                          <button
                            type="button"
                            onClick={() => handleSubtopicToggle(sId)}
                            className="hover:text-black dark:hover:text-white cursor-pointer ml-0.5"
                            aria-label={`Remove subtopic ${tag?.name || sId}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {scopeType === 'module' && selectedModuleIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {selectedModuleIds.map(mId => {
                      const mod = customModules.find(m => m.id === mId);
                      return (
                        <span
                          key={mId}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#0066FF] border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300"
                        >
                          {mod?.name || mId}
                          <button
                            type="button"
                            onClick={() => handleModuleToggle(mId)}
                            className="hover:text-blue-800 dark:hover:text-white cursor-pointer ml-0.5"
                            aria-label={`Remove module ${mod?.name || mId}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Dynamic Questions Count in Bank Indicator */}
                <div className="flex items-center gap-1.5 mt-2.5 text-[14px] leading-[20px] text-[#64748B] dark:text-slate-400 font-normal">
                  <svg
                    className="w-4 h-4 text-[#64748B] dark:text-slate-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M10 20h8a2 2 0 0 0 2-2V8" />
                  </svg>
                  <span>
                    {eligibleCount} {eligibleCount === 1 ? 'question' : 'questions'} in your bank
                  </span>
                </div>

                {/* ========================================================
                    Compact Expanded Scope Details (Domain, Topic, Module)
                   ======================================================== */}
                {/* Domain Multi-Select Drawer */}
                {scopeType === 'domain' && (
                  <div className="mt-3 p-3.5 rounded-[10px] border border-[#E5ECF6] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                        Select Exam Domains ({selectedDomainIds.length} of {domains.length} selected)
                      </span>
                      {selectedDomainIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedDomainIds([])}
                          className="text-xs text-[#0066FF] hover:underline"
                        >
                          Reset to all
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                      {domains.map((dom) => {
                        const isSelected = selectedDomainIds.includes(dom.id);
                        const domDescendants = getDescendantTagIds(dom.id, tags);
                        const domCount = questions.filter(
                          q => !q.isDevFixture && q.tagIds.some(t => domDescendants.includes(t))
                        ).length;

                        return (
                          <label
                            key={dom.id}
                            className={`flex items-center justify-between p-2 rounded-md border text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-[#0066FF] bg-[#EFF6FF] dark:bg-blue-950/40 text-[#0066FF] font-semibold'
                                : 'border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0B1223] dark:text-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleDomainToggle(dom.id)}
                                className="w-3.5 h-3.5 rounded text-[#0066FF] accent-[#0066FF]"
                              />
                              <span className="line-clamp-1">{dom.name}</span>
                            </div>
                            <span className="text-xs text-[#64748B] dark:text-slate-400 font-normal shrink-0 ml-1">
                              {domCount} q
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Topic & Subtopic Drawer */}
                {scopeType === 'topic' && (
                  <div className="mt-3 p-3.5 rounded-[10px] border border-[#E5ECF6] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 space-y-3 animate-in fade-in duration-150">
                    {/* 1. Domain Selector */}
                    <div>
                      <label
                        htmlFor="topic-domain-select"
                        className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1"
                      >
                        Filter Topics by Domain
                      </label>
                      <select
                        id="topic-domain-select"
                        value={topicDomainId}
                        onChange={(e) => {
                          setTopicDomainId(e.target.value);
                          setSelectedTopicIds([]);
                          setSelectedSubtopicIds([]);
                        }}
                        className="w-full h-9 px-3 rounded-md border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm text-[#0B1223] dark:text-white outline-none focus:border-[#0066FF] transition-colors"
                      >
                        {domains.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Topic Checkboxes */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                          Available Topics ({availableTopicsForDomain.length}) — {selectedTopicIds.length} selected
                        </span>
                        {selectedTopicIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedTopicIds([])}
                            className="text-xs text-[#0066FF] hover:underline"
                          >
                            Clear topics
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 p-1.5 rounded-md border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-950">
                        {availableTopicsForDomain.map((top) => {
                          const isChecked = selectedTopicIds.includes(top.id);
                          return (
                            <label
                              key={top.id}
                              className={`flex items-center gap-2 p-1.5 rounded border text-xs font-medium cursor-pointer transition-colors ${
                                isChecked
                                  ? 'border-[#0066FF] bg-[#EFF6FF] dark:bg-blue-950/40 text-[#0066FF] font-semibold'
                                  : 'border-transparent bg-slate-50/50 dark:bg-slate-900 text-[#1E293B] dark:text-slate-300 hover:border-slate-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTopicToggle(top.id)}
                                className="w-3.5 h-3.5 rounded text-[#0066FF] accent-[#0066FF] shrink-0"
                              />
                              <span className="leading-tight line-clamp-1">{top.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Subtopics (Optional) */}
                    {selectedTopicIds.length > 0 && availableSubtopics.length > 0 && (
                      <div>
                        <span className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1">
                          Optional Subtopics
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1 p-1.5 rounded-md border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-950">
                          {availableSubtopics.map((sub) => {
                            const isChecked = selectedSubtopicIds.includes(sub.id);
                            return (
                              <label
                                key={sub.id}
                                className={`flex items-center gap-2 p-1.5 rounded border text-xs font-medium cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'border-[#0066FF] bg-[#EFF6FF] dark:bg-blue-950/40 text-[#0066FF] font-semibold'
                                    : 'border-transparent bg-slate-50/50 dark:bg-slate-900 text-[#1E293B] dark:text-slate-300 hover:border-slate-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSubtopicToggle(sub.id)}
                                  className="w-3.5 h-3.5 rounded text-[#0066FF] accent-[#0066FF] shrink-0"
                                />
                                <span className="leading-tight line-clamp-1">{sub.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Module Multi-Select Drawer */}
                {scopeType === 'module' && (
                  <div className="mt-3 p-3.5 rounded-[10px] border border-[#E5ECF6] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 animate-in fade-in duration-150">
                    <span className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-2">
                      Course Modules
                    </span>
                    {customModules.length === 0 ? (
                      <p className="text-xs text-[#64748B] dark:text-slate-400 italic">
                        No custom course modules configured. You can configure custom syllabus modules in Settings.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {customModules.map((mod) => {
                          const isSelected = selectedModuleIds.includes(mod.id);
                          return (
                            <label
                              key={mod.id}
                              className={`flex items-center justify-between p-2 rounded-md border text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-[#0066FF] bg-[#EFF6FF] dark:bg-blue-950/40 text-[#0066FF] font-semibold'
                                  : 'border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0B1223] dark:text-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleModuleToggle(mod.id)}
                                  className="w-3.5 h-3.5 rounded text-[#0066FF] accent-[#0066FF]"
                                />
                                <span className="line-clamp-1">{mod.name}</span>
                              </div>
                              <span className="text-xs text-[#64748B] dark:text-slate-400 font-normal shrink-0 ml-1">
                                {mod.topicIds.length} topics
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ========================================================
              03 SESSION SETTINGS
             ======================================================== */}
          <section className="py-5 border-t border-[#E8EEF5] dark:border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-[28%_1fr] gap-6 lg:gap-8 items-start">
              {/* Left description column */}
              <div>
                <span className="text-[13px] font-semibold text-[#64748B] dark:text-slate-400 block mb-0.5">
                  03
                </span>
                <h2 className="text-[18px] font-semibold text-[#0B1223] dark:text-white leading-[26px]">
                  Session settings
                </h2>
                <p className="text-[14px] text-[#64748B] dark:text-slate-400 leading-[20px] mt-0.5">
                  Set a comfortable pace.
                </p>
              </div>

              {/* Right controls column: Questions & Timer side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#E8EEF5] dark:divide-slate-800">
                {/* Questions Sub-column */}
                <div className="w-full">
                  <label className="text-[15px] font-bold text-[#0B1223] dark:text-white block mb-2 leading-tight">
                    Questions
                  </label>

                  {/* Compact segmented button group (5 · 10 · 25 · 50 · Custom): 40px high */}
                  <div
                    role="radiogroup"
                    aria-label="Question count presets"
                    className="inline-flex h-[40px] rounded-[8px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 w-full max-w-[340px]"
                  >
                    {([5, 10, 25, 50] as const).map((preset) => {
                      const isSelected = selectedPreset === preset;
                      const isDisabled = preset > eligibleCount && eligibleCount > 0;
                      return (
                        <button
                          key={preset}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={isDisabled}
                          onClick={() => {
                            setSelectedPreset(preset);
                            setCustomCountInput(String(Math.min(eligibleCount, preset)));
                          }}
                          className={`flex-1 flex items-center justify-center text-[13px] sm:text-[14px] font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'border-2 border-[#0066FF] text-[#0066FF] font-bold rounded-[6px] m-[2px] bg-[#F0F7FF] dark:bg-blue-950/40 shadow-xs'
                              : isDisabled
                              ? 'border-r border-[#CBD5E1] dark:border-slate-700 opacity-40 cursor-not-allowed text-[#94A3B8] dark:text-slate-600'
                              : 'border-r border-[#CBD5E1] dark:border-slate-700 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}

                    {/* Custom Segment */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedPreset === 'custom'}
                      onClick={() => setSelectedPreset('custom')}
                      className={`flex-1 flex items-center justify-center text-[13px] sm:text-[14px] font-medium transition-all cursor-pointer px-2 sm:px-3 ${
                        selectedPreset === 'custom'
                          ? 'border-2 border-[#0066FF] text-[#0066FF] font-bold rounded-[6px] m-[2px] bg-[#F0F7FF] dark:bg-blue-950/40 shadow-xs'
                          : 'text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Custom numeric input (revealed when Custom is selected) */}
                  {selectedPreset === 'custom' && (
                    <div className="mt-2.5 flex items-center gap-2.5">
                      <input
                        type="number"
                        min="1"
                        max={eligibleCount}
                        value={customCountInput}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setCustomCountInput(raw);
                        }}
                        onBlur={() => {
                          let parsed = parseInt(customCountInput, 10);
                          if (isNaN(parsed) || parsed < 1) parsed = 1;
                          if (parsed > eligibleCount) parsed = eligibleCount;
                          setCustomCountInput(String(parsed));
                        }}
                        className="w-20 h-9 px-2 text-center rounded-[6px] border border-[#0066FF] bg-white dark:bg-slate-950 text-[14px] font-bold text-[#0066FF] outline-none"
                      />
                      <span className="text-[12px] text-[#64748B] dark:text-slate-400">
                        max {eligibleCount} questions
                      </span>
                    </div>
                  )}

                  {/* Helper text */}
                  <p className="text-[14px] leading-[20px] text-[#64748B] dark:text-slate-400 mt-1.5">
                    Choose your session length.
                  </p>

                  {/* Inline adjustment notice if preset was adjusted */}
                  {selectedPreset !== 'custom' && selectedPreset > eligibleCount && eligibleCount > 0 && (
                    <p className="text-[12px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                      Adjusted to {eligibleCount} available questions.
                    </p>
                  )}
                </div>

                {/* Timer Sub-column */}
                <div className="w-full pt-4 md:pt-0 md:pl-8">
                  <label className="text-[15px] font-bold text-[#0B1223] dark:text-white block mb-2 leading-tight">
                    Timer
                  </label>

                  {/* Switch row: 40px high */}
                  <div className="flex items-center gap-3 h-[40px]">
                    {/* Accessible Pill Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enableTimer}
                      onClick={() => setEnableTimer(prev => !prev)}
                      className={`w-[44px] h-[24px] rounded-full transition-colors relative cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:outline-none shrink-0 ${
                        enableTimer ? 'bg-[#0066FF]' : 'bg-[#CBD5E1] dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`block w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform absolute top-[2.5px] left-[2.5px] ${
                          enableTimer ? 'translate-x-[20px]' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Off/On state display */}
                    {!enableTimer ? (
                      <span className="text-[14px] font-medium text-[#0B1223] dark:text-slate-200">
                        Untimed
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                        <input
                          type="number"
                          min="1"
                          max="360"
                          value={timeMinutes}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) setTimeMinutes(Math.max(1, Math.min(360, val)));
                          }}
                          className="w-16 h-8 px-2 text-center rounded-[6px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-[14px] text-[#0066FF] outline-none focus:border-[#0066FF]"
                        />
                        <span className="text-[13px] text-[#64748B] dark:text-slate-400 font-medium">
                          min
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Helper text */}
                  <p className="text-[14px] leading-[20px] text-[#64748B] dark:text-slate-400 mt-1.5">
                    {!enableTimer ? 'No rush. Take your time.' : 'Session ends when time runs out.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================
            04 BOTTOM ACTION ROW
           ======================================================== */}
        <div className="h-[80px] border-t border-[#E8EEF5] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          {/* Left summary stack with outline play icon in pale-blue circle: 40px */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EFF6FF] dark:bg-blue-950/50 text-[#0066FF] dark:text-blue-400 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 ml-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#0B1223] dark:text-white leading-tight">
                Ready when you are
              </h3>
              <p className="text-[13px] leading-[18px] text-[#64748B] dark:text-slate-400 font-normal mt-0.5">
                {questionCount} questions · {mode === 'learn' ? 'Learn' : 'Assessment'} · {scopeSummaryText} ·{' '}
                {enableTimer ? `${timeMinutes} min` : 'Untimed'}
              </p>
            </div>
          </div>

          {/* Right action button: Start practice → (48px high) */}
          <button
            type="submit"
            disabled={isLoading || eligibleCount === 0 || questionCount < 1}
            className="w-full sm:w-[200px] h-[48px] px-6 rounded-[10px] bg-[#0066FF] hover:bg-[#0052CC] active:bg-[#0047B3] text-white font-semibold text-[15px] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Starting…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Start practice</span>
                <span className="text-base leading-none">→</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
