'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type {
  Question,
  Tag,
  SingleChoicePayload,
  MultiChoicePayload,
  MatchingPayload,
  OrderingPayload,
} from '@/domain/types';
import { buildTaxonomyIndex, getDescendantTagIds } from '@/domain/taxonomy';
import { useDevMode } from '@/hooks/useDevMode';

interface BankExplorerProps {
  initialQuestions: Question[];
  tags: Tag[];
  initialBookmarkedIds?: string[];
}

type ViewMode = 'browse' | 'focus';
type SortOption = 'source' | 'number' | 'type' | 'domain';

function cleanTagName(name: string): string {
  if (!name) return '';
  return name.replace(/^\d+\.\d+\s+/, '');
}

function formatOptionText(text: string): string {
  if (!text) return '';
  const trimmed = text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'single':
      return 'Single';
    case 'multi':
      return 'Multi';
    case 'matching':
      return 'Match';
    case 'ordering':
      return 'Order';
    default:
      return type;
  }
}

function getTypeFullLabel(type: string): string {
  switch (type) {
    case 'single':
      return 'Single choice';
    case 'multi':
      return 'Multiple choice';
    case 'matching':
      return 'Matching';
    case 'ordering':
      return 'Ordering sequence';
    default:
      return type;
  }
}

export function BankExplorer({
  initialQuestions,
  tags,
  initialBookmarkedIds = [],
}: BankExplorerProps) {
  const router = useRouter();

  // 1. View Mode (Browse vs Focus)
  const [viewMode, setViewMode] = useState<ViewMode>('browse');

  // 2. Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unverified' | 'verified' | 'needs-source'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'multi' | 'matching' | 'ordering'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [subtopicFilter, setSubtopicFilter] = useState<string>('all');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [includeFixtures, setIncludeFixtures] = useState(false);
  const [devModeEnabled] = useDevMode();

  // 3. Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortOption>('source');
  const pageSize = 25;
  const [jumpInput, setJumpInput] = useState('');

  // 4. Selection & Preview state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);
  const [explanationLoadingState, setExplanationLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [enlargedExhibitUrl, setEnlargedExhibitUrl] = useState<string | null>(null);

  // 5. Bookmarks state
  const [localBookmarks, setLocalBookmarks] = useState<Set<string>>(
    () => new Set(initialBookmarkedIds)
  );

  // Scroll ref for preview panel
  const previewScrollRef = useRef<HTMLDivElement>(null);

  // Taxonomy index
  const taxIndex = useMemo(() => buildTaxonomyIndex(tags), [tags]);
  const domains = useMemo(() => taxIndex.byKind.domain || [], [taxIndex]);

  // Dependent topics
  const availableTopics = useMemo(() => {
    if (domainFilter === 'all') {
      return taxIndex.byKind.topic || [];
    }
    return (taxIndex.childrenMap.get(domainFilter) || []).filter(t => t.kind === 'topic');
  }, [domainFilter, taxIndex]);

  // Dependent subtopics
  const availableSubtopics = useMemo(() => {
    if (topicFilter === 'all') return [];
    return (taxIndex.childrenMap.get(topicFilter) || []).filter(t => t.kind === 'subtopic');
  }, [topicFilter, taxIndex]);

  const tagMap = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const t of tags) map.set(t.id, t);
    return map;
  }, [tags]);

  const handleDomainChange = (domId: string) => {
    setDomainFilter(domId);
    setTopicFilter('all');
    setSubtopicFilter('all');
    setCurrentIndex(0);
    setIsExplanationExpanded(false);
  };

  const handleTopicChange = (topId: string) => {
    setTopicFilter(topId);
    setSubtopicFilter('all');
    setCurrentIndex(0);
    setIsExplanationExpanded(false);
  };

  // Target tag IDs for hierarchical scope filtering
  const targetTagIds = useMemo(() => {
    if (subtopicFilter !== 'all') return [subtopicFilter];
    if (topicFilter !== 'all') return getDescendantTagIds(topicFilter, tags);
    if (domainFilter !== 'all') return getDescendantTagIds(domainFilter, tags);
    return null;
  }, [domainFilter, topicFilter, subtopicFilter, tags]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    const list = initialQuestions.filter((q) => {
      // Exclude dev fixtures unless devMode is active AND user checked includeFixtures
      if (q.isDevFixture && (!devModeEnabled || !includeFixtures)) return false;

      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;

      // Hierarchical scope filter
      if (targetTagIds !== null) {
        const matchesScope = targetTagIds.some(tid => q.tagIds.includes(tid));
        if (!matchesScope) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesPrompt = q.prompt.toLowerCase().includes(term);
        const matchesId = q.externalId.toLowerCase().includes(term);
        const matchesNum = String(q.sourceNumber) === term || `q${q.sourceNumber}` === term;
        const explanationText = typeof q.explanation === 'object' && q.explanation
          ? `${q.explanation.answerReasoning || ''} ${q.explanation.conceptRefresher || ''}`.toLowerCase()
          : '';
        const matchesExplanation = explanationText.includes(term);
        if (!matchesPrompt && !matchesId && !matchesNum && !matchesExplanation) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortBy === 'number') {
      return [...list].sort((a, b) => (a.sourceNumber || 0) - (b.sourceNumber || 0));
    }
    if (sortBy === 'type') {
      return [...list].sort((a, b) => a.type.localeCompare(b.type));
    }
    if (sortBy === 'domain') {
      return [...list].sort((a, b) => {
        const aDom = a.tagIds[0] ? tagMap.get(a.tagIds[0])?.name || '' : '';
        const bDom = b.tagIds[0] ? tagMap.get(b.tagIds[0])?.name || '' : '';
        return aDom.localeCompare(bDom);
      });
    }

    return list;
  }, [
    initialQuestions,
    statusFilter,
    typeFilter,
    targetTagIds,
    searchTerm,
    devModeEnabled,
    includeFixtures,
    sortBy,
    tagMap,
  ]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= filteredQuestions.length && filteredQuestions.length > 0) {
      setCurrentIndex(0);
      setIsExplanationExpanded(false);
    }
  }, [filteredQuestions.length, currentIndex]);

  const currentQuestion: Question | undefined = filteredQuestions[currentIndex];

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const currentPage = Math.min(totalPages, Math.floor(currentIndex / pageSize) + 1);

  const pagedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  const handleSelectQuestion = (globalIdx: number) => {
    if (globalIdx !== currentIndex) {
      setCurrentIndex(globalIdx);
      setIsExplanationExpanded(false);
      setExplanationLoadingState('idle');
      if (previewScrollRef.current) {
        previewScrollRef.current.scrollTop = 0;
      }
    }
  };

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      handleSelectQuestion(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredQuestions.length - 1) {
      handleSelectQuestion(currentIndex + 1);
    }
  }, [currentIndex, filteredQuestions.length]);

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.max(1, Math.min(totalPages, newPage));
    const targetIdx = (targetPage - 1) * pageSize;
    handleSelectQuestion(targetIdx);
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = jumpInput.trim();
    if (!query) return;

    const num = parseInt(query.replace(/^q/i, ''), 10);
    if (!isNaN(num)) {
      // Find matching sourceNumber first
      const foundIdx = filteredQuestions.findIndex(q => q.sourceNumber === num);
      if (foundIdx !== -1) {
        handleSelectQuestion(foundIdx);
        setJumpInput('');
        return;
      }
      // Otherwise jump to 1-based index in list
      if (num >= 1 && num <= filteredQuestions.length) {
        handleSelectQuestion(num - 1);
        setJumpInput('');
        return;
      }
    }
  };

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Toggle Bookmark handler
  const handleToggleBookmark = async (qId: string) => {
    const next = new Set(localBookmarks);
    const isBookmarked = next.has(qId);
    if (isBookmarked) {
      next.delete(qId);
    } else {
      next.add(qId);
    }
    setLocalBookmarks(next);

    try {
      await fetch('/api/review/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId }),
      });
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      setLocalBookmarks(localBookmarks);
    }
  };

  // Breadcrumbs tags lookup for current question
  const breadcrumb = useMemo(() => {
    if (!currentQuestion) return { domain: '', topic: '' };
    const qTags = currentQuestion.tagIds.map(id => tagMap.get(id)).filter(Boolean) as Tag[];
    const dom = qTags.find(t => t.kind === 'domain')?.name || 'Network Fundamentals';
    const top = qTags.find(t => t.kind === 'topic')?.name || qTags.find(t => t.kind === 'subtopic')?.name || '';
    return { domain: cleanTagName(dom), topic: cleanTagName(top) };
  }, [currentQuestion, tagMap]);

  // Explanation title & details
  const explanationTitle = useMemo(() => {
    if (!currentQuestion) return 'Explanation';
    if (currentQuestion.type === 'single') {
      const p = currentQuestion.payload as SingleChoicePayload;
      const correctId = (p.correctOptionIds || [])[0];
      const correctOpt = p.options.find(o => o.id === correctId);
      if (correctOpt) return formatOptionText(correctOpt.text);
    } else if (currentQuestion.type === 'multi') {
      const p = currentQuestion.payload as MultiChoicePayload;
      const correctIds = p.correctOptionIds || [];
      const correctOpts = p.options.filter(o => correctIds.includes(o.id));
      if (correctOpts.length > 0) return correctOpts.map(o => formatOptionText(o.text)).join(' & ');
    }
    return breadcrumb.topic || 'Core Concept';
  }, [currentQuestion, breadcrumb]);

  const { mainExplanation, keyClue } = useMemo(() => {
    if (!currentQuestion || !currentQuestion.explanation) {
      return { mainExplanation: 'No detailed explanation provided for this draft question.', keyClue: '' };
    }
    const exp = currentQuestion.explanation;
    const reasoning = exp.answerReasoning ? exp.answerReasoning.trim() : '';
    const misconception = exp.commonMisconception ? exp.commonMisconception.trim() : '';
    const refresher = exp.conceptRefresher ? exp.conceptRefresher.trim() : '';

    const mainText = reasoning || refresher || 'Review the core networking principles for this topic.';
    const clueText = misconception
      ? `The key clue is ${misconception.charAt(0).toLowerCase()}${misconception.slice(1)}`
      : refresher
      ? `The key clue is understanding: ${refresher.split('.')[0]}.`
      : '';

    return { mainExplanation: mainText, keyClue: clueText };
  }, [currentQuestion]);

  // Exhibit image lookup
  const exhibitAsset = useMemo(() => {
    if (!currentQuestion || !currentQuestion.assetReferences) return null;
    return currentQuestion.assetReferences.find(a => a.type === 'image') || null;
  }, [currentQuestion]);

  // Handle on-demand explanation reveal
  const handleToggleExplanation = () => {
    if (isExplanationExpanded) {
      setIsExplanationExpanded(false);
      setExplanationLoadingState('idle');
      return;
    }

    setExplanationLoadingState('loading');
    setTimeout(() => {
      setExplanationLoadingState('loaded');
      setIsExplanationExpanded(true);
    }, 120);
  };

  // Navigating to Practice filtered session
  const handlePracticeFiltered = () => {
    const params = new URLSearchParams();
    if (domainFilter !== 'all') {
      params.set('domain', domainFilter);
      params.set('scopeType', 'domain');
    }
    if (topicFilter !== 'all') {
      params.set('topic', topicFilter);
      params.set('scopeType', 'topic');
    }
    const qs = params.toString();
    router.push(qs ? `/practice?${qs}` : '/practice');
  };

  const startItem = filteredQuestions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredQuestions.length);

  // Pagination buttons logic (e.g. 1 2 3 ... 20)
  const paginationPages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="w-full flex flex-col h-full lg:h-[calc(100dvh-95px)] lg:max-h-[calc(100dvh-95px)] overflow-hidden">
      {/* 1. Header Bar: Title, question count, Mode Switch [Browse | Focus], Practice filtered button */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 pb-3 pt-1">
        <div>
          <h1 className="text-[32px] sm:text-[38px] font-bold tracking-tight text-[var(--text-heading)] leading-none">
            Question bank
          </h1>
          <p className="text-[14px] text-[#64748B] dark:text-slate-400 mt-1.5 font-normal">
            {initialQuestions.length} questions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented Switch: Browse vs Focus */}
          <div className="inline-flex items-center p-1 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/80 shadow-2xs">
            <button
              type="button"
              id="bank-view-browse-btn"
              onClick={() => setViewMode('browse')}
              className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'browse'
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#0B1223] dark:hover:text-white'
              }`}
            >
              Browse
            </button>
            <button
              type="button"
              id="bank-view-focus-btn"
              onClick={() => setViewMode('focus')}
              className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'focus'
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#0B1223] dark:hover:text-white'
              }`}
            >
              Focus
            </button>
          </div>

          {/* Practice Filtered Button */}
          <button
            type="button"
            id="practice-filtered-btn"
            onClick={handlePracticeFiltered}
            className="h-[38px] px-4 rounded-lg border border-[#BFDBFE] dark:border-blue-900 bg-white dark:bg-slate-900 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-[#0066FF] dark:text-blue-400 font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Practice filtered</span>
          </button>
        </div>
      </div>

      {/* 2. Top Controls / Filter Row: Search | All domains | All modules | Filters */}
      <div className="shrink-0 mb-3.5 p-2 rounded-[12px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] flex flex-wrap items-center gap-2.5 w-full shadow-2xs">
        {/* Search input with search icon */}
        <div className="relative flex-1 min-w-[220px] h-[40px]">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#64748B]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            id="bank-search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentIndex(0);
              setIsExplanationExpanded(false);
            }}
            placeholder="Search question text or ID..."
            className="w-full h-full pl-10 pr-8 rounded-[8px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 text-[14px] text-[#0B1223] dark:text-white placeholder-[#64748B] focus:outline-none focus:border-[#0066FF] transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentIndex(0);
              }}
              className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* All domains dropdown */}
        <div className="relative min-w-[170px] sm:min-w-[200px] h-[40px]">
          <select
            id="domain-select"
            value={domainFilter}
            onChange={(e) => handleDomainChange(e.target.value)}
            aria-label="Filter by exam domain"
            className="w-full h-full pl-3.5 pr-9 rounded-[8px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 text-[13.5px] font-normal text-[#0B1223] dark:text-white focus:outline-none focus:border-[#0066FF] appearance-none cursor-pointer transition-colors"
          >
            <option value="all">All domains</option>
            {domains.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#64748B]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* All modules / topics dropdown */}
        <div className="relative min-w-[160px] sm:min-w-[190px] h-[40px]">
          <select
            id="topic-select"
            value={topicFilter}
            onChange={(e) => handleTopicChange(e.target.value)}
            aria-label="Filter by topic or module"
            className="w-full h-full pl-3.5 pr-9 rounded-[8px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 text-[13.5px] font-normal text-[#0B1223] dark:text-white focus:outline-none focus:border-[#0066FF] appearance-none cursor-pointer transition-colors"
          >
            <option value="all">All modules</option>
            {availableTopics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#64748B]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Filters Button */}
        <button
          type="button"
          id="toggle-more-filters-btn"
          onClick={() => setShowMoreFilters(prev => !prev)}
          className={`h-[40px] px-3.5 rounded-[8px] border text-[13.5px] font-medium flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            showMoreFilters || typeFilter !== 'all' || statusFilter !== 'all' || subtopicFilter !== 'all'
              ? 'border-[#0066FF] text-[#0066FF] bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0B1223] dark:text-white'
          }`}
        >
          <svg className="w-4 h-4 text-[#0066FF] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span>Filters</span>
        </button>
      </div>

      {/* Expandable Extra Filters Drawer */}
      {showMoreFilters && (
        <div className="shrink-0 mb-3 p-4 rounded-[12px] border border-[#E2E8F0] dark:border-slate-800 bg-[var(--bg-card)] shadow-xs animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="type-filter-select" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Question Type
              </label>
              <select
                id="type-filter-select"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as typeof typeFilter);
                  setCurrentIndex(0);
                  setIsExplanationExpanded(false);
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:border-[#0066FF] outline-none"
              >
                <option value="all">All Types</option>
                <option value="single">Single Choice</option>
                <option value="multi">Multiple Choice</option>
                <option value="matching">Matching</option>
                <option value="ordering">Ordering Sequence</option>
              </select>
            </div>

            <div>
              <label htmlFor="status-filter-select" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Review Status
              </label>
              <select
                id="status-filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setCurrentIndex(0);
                  setIsExplanationExpanded(false);
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:border-[#0066FF] outline-none"
              >
                <option value="all">All statuses</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified draft</option>
                <option value="needs-source">Needs source</option>
              </select>
            </div>

            <div>
              <label htmlFor="subtopic-filter-select" className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Subtopic
              </label>
              <select
                id="subtopic-filter-select"
                value={subtopicFilter}
                disabled={topicFilter === 'all'}
                onChange={(e) => {
                  setSubtopicFilter(e.target.value);
                  setCurrentIndex(0);
                  setIsExplanationExpanded(false);
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:border-[#0066FF] outline-none disabled:opacity-50"
              >
                <option value="all">{topicFilter === 'all' ? 'Select a topic first' : 'All Subtopics'}</option>
                {availableSubtopics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Views Area */}
      {filteredQuestions.length === 0 ? (
        <div className="flex-1 p-16 rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-[var(--bg-card)] text-center flex flex-col items-center justify-center">
          <p className="text-lg font-semibold text-[var(--text-heading)] mb-1">No matching questions found</p>
          <p className="text-sm text-[#64748B] mb-5">Try clearing your search term or adjusting your domain filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setDomainFilter('all');
              setStatusFilter('all');
              setTypeFilter('all');
              setTopicFilter('all');
              setSubtopicFilter('all');
              setCurrentIndex(0);
            }}
            className="px-4 py-2 rounded-lg bg-[#0066FF] text-white font-semibold text-xs hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      ) : viewMode === 'browse' ? (
        /* =========================================================================
           BROWSE VIEW: Compact split list-and-preview layout
           ========================================================================= */
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3.5 items-stretch pb-1">
          {/* LEFT COLUMN: Question List Table Card */}
          <div className="flex-1 lg:w-[58%] flex flex-col h-full rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] shadow-xs overflow-hidden">
            {/* Table Header Row: "All questions" "476 results" & "Source order ▾" */}
            <div className="shrink-0 px-4 py-3 border-b border-[#E8EEF5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-[var(--text-heading)]">All questions</span>
                <span className="text-[13px] text-[#64748B] dark:text-slate-400 font-normal">
                  {filteredQuestions.length} results
                </span>
              </div>

              {/* Sort selector */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort question list"
                  className="pl-3 pr-7 py-1 text-xs font-medium rounded-md border border-[#E5ECF6] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0B1223] dark:text-slate-200 appearance-none cursor-pointer focus:outline-none focus:border-[#0066FF]"
                >
                  <option value="source">Source order</option>
                  <option value="number">Question number</option>
                  <option value="type">Type</option>
                  <option value="domain">Domain</option>
                </select>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Column Headers */}
            <div className="shrink-0 px-4 py-2 bg-[#F8FAFC] dark:bg-slate-900/60 border-b border-[#E8EEF5] dark:border-slate-800 grid grid-cols-[45px_1fr_65px_36px] items-center text-[11.5px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              <span>#</span>
              <span>Question</span>
              <span className="text-center">Type</span>
              <span className="text-right">
                <svg className="w-3.5 h-3.5 inline text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </span>
            </div>

            {/* Question Rows (Scrollable internally) */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] dark:divide-slate-800/80 min-h-0">
              {pagedQuestions.map((q, pIdx) => {
                const globalIdx = (currentPage - 1) * pageSize + pIdx;
                const isSelected = globalIdx === currentIndex;
                const isBookmarked = localBookmarks.has(q.id);

                // Look up domain/topic subtitle
                const qTags = q.tagIds.map(id => tagMap.get(id)).filter(Boolean) as Tag[];
                const domName = qTags.find(t => t.kind === 'domain')?.name;
                const topName = qTags.find(t => t.kind === 'topic')?.name || qTags.find(t => t.kind === 'subtopic')?.name;
                const subtitle = cleanTagName(topName || domName || 'General');

                const numStr = String(q.sourceNumber || globalIdx + 1).padStart(3, '0');

                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelectQuestion(globalIdx)}
                    className={`px-4 py-2.5 grid grid-cols-[45px_1fr_65px_36px] items-center cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-l-[3.5px] border-l-[#0066FF] bg-[#F4F8FF] dark:bg-blue-950/25'
                        : 'border-l-[3.5px] border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Number */}
                    <span className={`text-[13px] font-mono ${isSelected ? 'font-bold text-[#0066FF] dark:text-blue-400' : 'text-[#64748B] dark:text-slate-400'}`}>
                      {numStr}
                    </span>

                    {/* Question text & domain subtitle */}
                    <div className="pr-3 min-w-0">
                      <p className={`text-[13px] truncate leading-snug ${isSelected ? 'font-semibold text-[#0B1223] dark:text-white' : 'font-medium text-[#1E293B] dark:text-slate-200'}`}>
                        {q.prompt}
                      </p>
                      <p className="text-[11.5px] text-[#64748B] dark:text-slate-400 truncate mt-0.5 font-normal">
                        {subtitle}
                      </p>
                    </div>

                    {/* Type badge */}
                    <span className="text-[12px] text-center text-[#64748B] dark:text-slate-400 font-medium">
                      {getTypeLabel(q.type)}
                    </span>

                    {/* Bookmark icon button */}
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark(q.id);
                        }}
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                        className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <svg
                          className={`w-4 h-4 ${isBookmarked ? 'fill-[#0066FF] text-[#0066FF]' : 'fill-none text-slate-400'}`}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pinned Footer (Pagination & Jump) */}
            <div className="shrink-0 px-4 py-2.5 border-t border-[#E8EEF5] dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Range: 1-25 of 476 */}
              <span className="text-[#64748B] dark:text-slate-400 font-medium shrink-0">
                {startItem}–{endItem} of {filteredQuestions.length}
              </span>

              {/* Page Buttons: < 1 2 3 ... 20 > */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {paginationPages.map((p, idx) => {
                  if (p === 'ellipsis') {
                    return (
                      <span key={`ell-${idx}`} className="w-6 text-center text-slate-400">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === currentPage;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0066FF] text-white shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* Jump to #: [ e.g. 42 ] → */}
              <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5 shrink-0">
                <span className="text-[#64748B] dark:text-slate-400 text-xs">Jump to #</span>
                <input
                  type="text"
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-16 h-7 px-2 text-xs rounded border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0B1223] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0066FF]"
                />
                <button
                  type="submit"
                  aria-label="Jump to question"
                  className="w-7 h-7 rounded border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Preview Card */}
          {currentQuestion && (
            <div className="flex-1 lg:w-[42%] flex flex-col h-full rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] shadow-xs overflow-hidden">
              {/* Preview Header: Q001 | Single choice + Bookmark + Breadcrumb */}
              <div className="shrink-0 p-5 pb-3 border-b border-[#E8EEF5] dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-[#0066FF] dark:text-blue-400">
                      Q{String(currentQuestion.sourceNumber || currentIndex + 1).padStart(3, '0')}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-[13px] text-[#64748B] dark:text-slate-400 font-medium">
                      {getTypeFullLabel(currentQuestion.type)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(currentQuestion.id)}
                    aria-label={localBookmarks.has(currentQuestion.id) ? 'Remove bookmark' : 'Bookmark question'}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <svg
                      className={`w-4 h-4 ${localBookmarks.has(currentQuestion.id) ? 'fill-[#0066FF] text-[#0066FF]' : 'fill-none text-slate-400'}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>

                <div className="text-[12.5px] text-[#64748B] dark:text-slate-400 font-normal mt-1 truncate">
                  <span>{breadcrumb.domain}</span>
                  {breadcrumb.topic && (
                    <>
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">/</span>
                      <span>{breadcrumb.topic}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Preview Scrollable Body (Scrolls internally when expanded!) */}
              <div ref={previewScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
                {/* Question Stem */}
                <p className="text-[15px] leading-[1.6] text-[#0C1523] dark:text-slate-100 font-normal">
                  {currentQuestion.prompt}
                </p>

                {/* Structured Code Block if present */}
                {currentQuestion.structuredBlocks && currentQuestion.structuredBlocks.length > 0 && (
                  <div className="space-y-2">
                    {currentQuestion.structuredBlocks.map((block, idx) => (
                      <pre
                        key={idx}
                        className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 font-mono text-xs text-[var(--text-primary)] overflow-x-auto whitespace-pre-wrap"
                      >
                        {block.content || block.text}
                      </pre>
                    ))}
                  </div>
                )}

                {/* Exhibit Diagram if present */}
                {exhibitAsset && (
                  <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] mb-1.5">
                      <span>EXHIBIT DIAGRAM</span>
                      <button
                        type="button"
                        onClick={() => setEnlargedExhibitUrl(exhibitAsset.url)}
                        className="text-[#0066FF] hover:underline cursor-pointer text-[11px]"
                      >
                        Enlarge ↗
                      </button>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setEnlargedExhibitUrl(exhibitAsset.url)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setEnlargedExhibitUrl(exhibitAsset.url);
                        }
                      }}
                      className="cursor-pointer flex items-center justify-center max-h-[160px] overflow-hidden rounded"
                    >
                      <Image
                        src={exhibitAsset.url}
                        alt="Exhibit Diagram"
                        width={400}
                        height={200}
                        className="object-contain max-h-[150px] w-auto rounded"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {/* Answers / Options Area */}
                <div className="space-y-2.5">
                  {/* Single Choice Options */}
                  {currentQuestion.type === 'single' && (() => {
                    const p = currentQuestion.payload as SingleChoicePayload;
                    const correctId = (p.correctOptionIds || [])[0];

                    return p.options.map((opt) => {
                      const isCorrect = isExplanationExpanded && opt.id === correctId;

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                            isCorrect
                              ? 'border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-2xs'
                              : 'border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900/40'
                          }`}
                        >
                          {/* Letter Badge */}
                          <div
                            className={`w-7 h-7 rounded-full border text-xs font-semibold flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isCorrect ? (
                              <svg className="w-3.5 h-3.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              opt.id
                            )}
                          </div>

                          {/* Option Text */}
                          <span className={`text-[13.5px] leading-snug flex-1 ${isCorrect ? 'font-medium text-emerald-950 dark:text-emerald-100' : 'text-[#1E293B] dark:text-slate-200'}`}>
                            {formatOptionText(opt.text)}
                          </span>

                          {/* Correct Answer Pill Badge */}
                          {isCorrect && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 shrink-0">
                              Correct answer
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}

                  {/* Multiple Choice Options */}
                  {currentQuestion.type === 'multi' && (() => {
                    const p = currentQuestion.payload as MultiChoicePayload;
                    const correctIds = p.correctOptionIds || [];

                    return p.options.map((opt) => {
                      const isCorrect = isExplanationExpanded && correctIds.includes(opt.id);

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                            isCorrect
                              ? 'border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-2xs'
                              : 'border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-slate-900/40'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-md border text-xs font-semibold flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isCorrect ? (
                              <svg className="w-3.5 h-3.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              opt.id
                            )}
                          </div>

                          <span className={`text-[13.5px] leading-snug flex-1 ${isCorrect ? 'font-medium text-emerald-950 dark:text-emerald-100' : 'text-[#1E293B] dark:text-slate-200'}`}>
                            {formatOptionText(opt.text)}
                          </span>

                          {isCorrect && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 shrink-0">
                              Correct answer
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}

                  {/* Matching Options */}
                  {currentQuestion.type === 'matching' && (() => {
                    const p = currentQuestion.payload as MatchingPayload;
                    const pairs = Object.entries(p.correctMapping || {});

                    if (!isExplanationExpanded) {
                      return (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Items to match:</p>
                          {p.prompts?.map((pr) => (
                            <div key={pr.id} className="p-2.5 rounded-lg border border-[#E5ECF6] dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-[#1E293B] dark:text-slate-200">
                              {pr.text}
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          Correct Matching Pairs:
                        </p>
                        {pairs.map(([promptId, choiceId]) => {
                          const prompt = p.prompts?.find(pr => pr.id === promptId);
                          const choice = p.choices?.find(c => c.id === choiceId);
                          return (
                            <div
                              key={promptId}
                              className="p-3 rounded-lg border border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="font-medium text-[#0B1223] dark:text-white">{prompt?.text}</span>
                              <span className="text-emerald-600 font-bold">&rarr;</span>
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
                                {choice?.text || 'No match'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Ordering Options */}
                  {currentQuestion.type === 'ordering' && (() => {
                    const p = currentQuestion.payload as OrderingPayload;
                    const seq = p.correctOrderIds || [];

                    if (!isExplanationExpanded) {
                      return (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Sequence items:</p>
                          {p.items?.map((it) => (
                            <div key={it.id} className="p-2.5 rounded-lg border border-[#E5ECF6] dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-[#1E293B] dark:text-slate-200">
                              {it.text}
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          Correct Ordered Sequence:
                        </p>
                        {seq.map((itemId, idx) => {
                          const item = p.items?.find(it => it.id === itemId);
                          return (
                            <div
                              key={itemId}
                              className="p-3 rounded-lg border border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center gap-3 text-xs"
                            >
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-[#0B1223] dark:text-white">
                                {item?.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Show / Hide Answer & Explanation Disclosure Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    id="toggle-preview-explanation-btn"
                    onClick={handleToggleExplanation}
                    aria-expanded={isExplanationExpanded}
                    aria-controls="preview-explanation"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066FF] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer select-none"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isExplanationExpanded ? 'rotate-180' : 'rotate-0'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    <span>
                      {isExplanationExpanded ? 'Hide answer & explanation' : 'Show answer & explanation'}
                    </span>
                  </button>
                  <p className="text-[12px] text-[#64748B] dark:text-slate-400 mt-1 font-normal">
                    Browsing does not affect your progress.
                  </p>
                </div>

                {/* Expanded Answer & Explanation Section */}
                {isExplanationExpanded && (
                  <div
                    id="preview-explanation"
                    className="pt-3 border-t border-[#E8EEF5] dark:border-slate-800 space-y-4 animate-in fade-in duration-150"
                  >
                    {explanationLoadingState === 'loading' ? (
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-500">
                        <svg className="w-4 h-4 animate-spin text-[#0066FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" strokeWidth="3" className="opacity-75" />
                        </svg>
                        <span>Loading explanation details...</span>
                      </div>
                    ) : (
                      <>
                        {/* Main Explanation */}
                        <div>
                          <h4 className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            Explanation
                          </h4>
                          <p className="text-[13.5px] leading-relaxed text-[#1E293B] dark:text-slate-200">
                            {mainExplanation}
                          </p>
                        </div>

                        {/* Why each option is correct or incorrect */}
                        {currentQuestion.explanation?.optionExplanations && (
                          <div className="pt-2 space-y-2">
                            <h4 className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1">
                              Why each option is correct or incorrect
                            </h4>
                            <div className="space-y-2 text-xs">
                              {Object.entries(currentQuestion.explanation.optionExplanations).map(([optKey, optExp]) => (
                                <div
                                  key={optKey}
                                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50"
                                >
                                  <span className="font-bold text-[#0066FF] dark:text-blue-400 mr-2">
                                    Option {optKey}:
                                  </span>
                                  <span className="text-[#334155] dark:text-slate-300 leading-normal">
                                    {optExp}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expandable deeper concept notes */}
                        {(keyClue || currentQuestion.explanation?.conceptRefresher || currentQuestion.explanation?.practicalExampleOrCommands) && (
                          <details className="group pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <summary className="text-xs font-semibold text-[#0066FF] dark:text-blue-400 cursor-pointer list-none flex items-center gap-1.5 select-none hover:underline">
                              <span className="transition-transform group-open:rotate-90 inline-block text-[10px]">▶</span>
                              <span>Key concept notes & practical commands</span>
                            </summary>
                            <div className="mt-2.5 p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                              {keyClue && <p><strong className="text-blue-900 dark:text-blue-200">Key takeaway:</strong> {keyClue}</p>}
                              {currentQuestion.explanation?.conceptRefresher && (
                                <p><strong className="text-blue-900 dark:text-blue-200">Concept refresher:</strong> {currentQuestion.explanation.conceptRefresher}</p>
                              )}
                              {currentQuestion.explanation?.practicalExampleOrCommands && (
                                <p><strong className="text-blue-900 dark:text-blue-200">Practical example / commands:</strong> {currentQuestion.explanation.practicalExampleOrCommands}</p>
                              )}
                            </div>
                          </details>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Fixed Footer: Open in Focus on Left & < > Navigation on Right */}
              <div className="shrink-0 p-3.5 px-5 border-t border-[#E8EEF5] dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] flex items-center justify-between gap-3">
                {/* Open in Focus Button */}
                <button
                  type="button"
                  id="open-in-focus-btn"
                  onClick={() => setViewMode('focus')}
                  className="h-9 px-4 rounded-lg border border-[#BFDBFE] dark:border-blue-900 bg-white dark:bg-slate-900 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-[#0066FF] dark:text-blue-400 font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                  <span>Open in Focus</span>
                </button>

                {/* < and > buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex <= 0}
                    aria-label="Previous question"
                    className="w-9 h-9 rounded-lg border border-[#E5ECF6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex >= filteredQuestions.length - 1}
                    aria-label="Next question"
                    className="w-9 h-9 rounded-lg border border-[#E5ECF6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
           FOCUS VIEW: Preserves our two-column question-and-explanation layout
           ========================================================================= */
        currentQuestion ? (
          <div className="flex-1 overflow-y-auto min-h-0 pb-6">
            <div className="flex flex-col lg:flex-row gap-[14px] items-stretch min-h-[680px]">
              {/* LEFT COLUMN: Question Card (~65% width) */}
              <div className="flex-1 rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] p-8 sm:p-10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-[26px] sm:text-[28px] font-bold text-[var(--text-heading)] tracking-tight leading-tight">
                      Question {currentQuestion.sourceNumber}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(currentQuestion.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <svg
                        className={`w-5 h-5 ${localBookmarks.has(currentQuestion.id) ? 'fill-[#0066FF] text-[#0066FF]' : 'fill-none text-slate-400'}`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Breadcrumbs */}
                  <div className="text-[13.5px] sm:text-[14px] text-[#64748B] dark:text-slate-400 font-normal mt-1 mb-7 flex items-center gap-1.5 flex-wrap">
                    <span>{breadcrumb.domain}</span>
                    {breadcrumb.topic && (
                      <>
                        <span className="text-[#94A3B8]">&rsaquo;</span>
                        <span>{breadcrumb.topic}</span>
                      </>
                    )}
                  </div>

                  {/* Question Prompt */}
                  <p className="text-[16px] sm:text-[17px] leading-[1.65] text-[#1E293B] dark:text-slate-200 font-normal mb-8">
                    {currentQuestion.prompt}
                  </p>

                  {/* Code block */}
                  {currentQuestion.structuredBlocks && currentQuestion.structuredBlocks.length > 0 && (
                    <div className="mb-8 space-y-3">
                      {currentQuestion.structuredBlocks.map((block, idx) => (
                        <pre
                          key={idx}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 font-mono text-xs md:text-sm text-[var(--text-primary)] overflow-x-auto whitespace-pre-wrap"
                        >
                          {block.content || block.text}
                        </pre>
                      ))}
                    </div>
                  )}

                  {/* Exhibit Image if Present */}
                  {exhibitAsset && (
                    <div className="mb-8 rounded-xl border border-[#E2E8F0] dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] mb-2 px-1">
                        <span>EXHIBIT DIAGRAM</span>
                        <button
                          type="button"
                          onClick={() => setEnlargedExhibitUrl(exhibitAsset.url)}
                          className="text-[#087BFF] hover:underline cursor-pointer"
                        >
                          Click to enlarge ↗
                        </button>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setEnlargedExhibitUrl(exhibitAsset.url)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setEnlargedExhibitUrl(exhibitAsset.url);
                          }
                        }}
                        className="cursor-pointer max-w-lg mx-auto relative rounded-lg overflow-hidden flex items-center justify-center min-h-[160px]"
                      >
                        <Image
                          src={exhibitAsset.url}
                          alt={`Exhibit for Question ${currentQuestion.sourceNumber}`}
                          width={600}
                          height={320}
                          className="rounded-lg object-contain w-auto max-h-[300px]"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {/* Options Rendering */}
                  <div className="space-y-4 mb-8">
                    {currentQuestion.type === 'single' && (() => {
                      const payload = currentQuestion.payload as SingleChoicePayload;
                      const correctIds = payload.correctOptionIds || [];
                      return payload.options.map((option) => {
                        const isCorrect = correctIds.includes(option.id);
                        return (
                          <div
                            key={option.id}
                            className={`min-h-[58px] px-5 py-3.5 rounded-[10px] border flex items-center gap-4 transition-colors ${
                              isCorrect
                                ? 'bg-[#EFF6FF] dark:bg-blue-950/30 border-[#BFDBFE] dark:border-blue-500/60'
                                : 'bg-white dark:bg-slate-900 border-[#E5ECF6] dark:border-slate-800'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'border-[#0066FF] dark:border-blue-400'
                                  : 'border-[#6B7A99] dark:border-slate-500'
                              }`}
                            >
                              {isCorrect && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#0066FF] dark:bg-blue-400" />
                              )}
                            </div>
                            <span
                              className={`text-[15px] sm:text-[16px] leading-normal ${
                                isCorrect
                                  ? 'font-medium text-[#0B1223] dark:text-white'
                                  : 'font-normal text-[#1E293B] dark:text-slate-300'
                              }`}
                            >
                              {formatOptionText(option.text)}
                            </span>
                          </div>
                        );
                      });
                    })()}

                    {currentQuestion.type === 'multi' && (() => {
                      const payload = currentQuestion.payload as MultiChoicePayload;
                      const correctIds = payload.correctOptionIds || [];
                      return payload.options.map((option) => {
                        const isCorrect = correctIds.includes(option.id);
                        return (
                          <div
                            key={option.id}
                            className={`min-h-[58px] px-5 py-3.5 rounded-[10px] border flex items-center gap-4 transition-colors ${
                              isCorrect
                                ? 'bg-[#EFF6FF] dark:bg-blue-950/30 border-[#BFDBFE] dark:border-blue-500/60'
                                : 'bg-white dark:bg-slate-900 border-[#E5ECF6] dark:border-slate-800'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'border-[#0066FF] bg-[#0066FF] text-white'
                                  : 'border-[#6B7A99] dark:border-slate-500'
                              }`}
                            >
                              {isCorrect && (
                                <svg className="w-3.5 h-3.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-[15px] sm:text-[16px] leading-normal ${
                                isCorrect
                                  ? 'font-medium text-[#0B1223] dark:text-white'
                                  : 'font-normal text-[#1E293B] dark:text-slate-300'
                              }`}
                            >
                              {formatOptionText(option.text)}
                            </span>
                          </div>
                        );
                      });
                    })()}

                    {currentQuestion.type === 'matching' && (() => {
                      const payload = currentQuestion.payload as MatchingPayload;
                      const pairs = Object.entries(payload.correctMapping || {});
                      return (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                            Correct Matching Pairs:
                          </p>
                          {pairs.map(([promptId, choiceId]) => {
                            const prompt = payload.prompts?.find(p => p.id === promptId);
                            const choice = payload.choices?.find(c => c.id === choiceId);
                            return (
                              <div
                                key={promptId}
                                className="p-4 rounded-[10px] border border-[#BFDBFE] dark:border-blue-500/60 bg-[#EFF6FF] dark:bg-blue-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                              >
                                <span className="font-medium text-[#0B1223] dark:text-white">{prompt?.text}</span>
                                <span className="text-[#0066FF] font-bold">&rarr;</span>
                                <span className="font-semibold text-[#0066FF] bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800">
                                  {choice?.text || 'No match'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {currentQuestion.type === 'ordering' && (() => {
                      const payload = currentQuestion.payload as OrderingPayload;
                      const seq = payload.correctOrderIds || [];
                      return (
                        <div className="space-y-2.5">
                          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                            Correct Ordered Sequence:
                          </p>
                          {seq.map((itemId, idx) => {
                            const item = payload.items?.find(it => it.id === itemId);
                            return (
                              <div
                                key={itemId}
                                className="p-4 rounded-[10px] border border-[#BFDBFE] dark:border-blue-500/60 bg-[#EFF6FF] dark:bg-blue-950/30 flex items-center gap-4"
                              >
                                <span className="w-7 h-7 rounded-full bg-[#0066FF] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-[15px] font-semibold text-[#0B1223] dark:text-white">
                                  {item?.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Bottom Navigation in Focus View */}
                <div className="mt-auto pt-8 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="h-[48px] px-6 rounded-[8px] border border-[#E5ECF6] dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] font-medium text-[#526078] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors inline-flex items-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>Previous question</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('browse')}
                      className="h-[48px] px-5 rounded-[8px] border border-[#E5ECF6] dark:border-slate-700 bg-white dark:bg-slate-800 text-[14px] font-medium text-[#526078] dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Back to Browse
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={currentIndex >= filteredQuestions.length - 1}
                      className="h-[48px] px-7 rounded-[8px] bg-[#0066FF] hover:bg-blue-600 text-[15px] font-semibold text-white transition-colors inline-flex items-center gap-2.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>Next question</span>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Explanation Panel (~35% width) */}
              <div className="w-full lg:w-[425px] shrink-0 rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] p-8 sm:p-9 shadow-xs min-h-[680px] flex flex-col justify-start">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <svg
                      className="w-6 h-6 text-[#087BFF] shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <h3 className="text-[24px] font-bold text-[var(--text-heading)] tracking-tight">
                      Explanation
                    </h3>
                  </div>

                  <h4 className="text-[17px] font-bold text-[var(--text-heading)] mb-3">
                    {explanationTitle}
                  </h4>

                  <p className="text-[15px] leading-[1.68] text-[#1E293B] dark:text-slate-300 font-normal mb-6">
                    {mainExplanation}
                  </p>

                  <div className="w-full border-b border-[#E8EEF5] dark:border-slate-800 my-6" />

                  {keyClue ? (
                    <p className="text-[15px] leading-[1.62] text-[#526078] dark:text-slate-400 font-normal">
                      {keyClue}
                    </p>
                  ) : (
                    <p className="text-[14px] leading-[1.6] text-[#526078] dark:text-slate-400 italic">
                      Review the question prompt carefully and contrast each choice against standard CCNA 200-301 networking definitions.
                    </p>
                  )}

                  {/* Option explanations in Focus Mode */}
                  {currentQuestion.explanation?.optionExplanations && (
                    <div className="mt-6 pt-4 border-t border-[#E8EEF5] dark:border-slate-800 space-y-2">
                      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                        Per-Option Explanations:
                      </p>
                      <div className="space-y-2 text-xs">
                        {Object.entries(currentQuestion.explanation.optionExplanations).map(([k, exp]) => (
                          <div key={k} className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="font-bold text-[#0066FF] mr-1.5">({k})</span>
                            <span className="text-slate-700 dark:text-slate-300">{exp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null
      )}

      {/* Lightbox Exhibit Modal */}
      {enlargedExhibitUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEnlargedExhibitUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Exhibit Diagram View
              </span>
              <button
                type="button"
                onClick={() => setEnlargedExhibitUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src={enlargedExhibitUrl}
                alt="Enlarged Exhibit"
                width={1000}
                height={600}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
