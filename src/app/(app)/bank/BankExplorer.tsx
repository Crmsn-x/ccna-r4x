'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type {
  Question,
  Tag,
  SingleChoicePayload,
  MultiChoicePayload,
  MatchingPayload,
  OrderingPayload,
} from '@/domain/types';

interface BankExplorerProps {
  initialQuestions: Question[];
  tags: Tag[];
}

export function BankExplorer({ initialQuestions, tags }: BankExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unverified' | 'verified' | 'needs-source'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'multi' | 'matching' | 'ordering'>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialQuestions.length > 0 ? initialQuestions[0].id : null
  );
  const [enlargedExhibitUrl, setEnlargedExhibitUrl] = useState<string | null>(null);

  // Tags lookup
  const tagMap = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const t of tags) map.set(t.id, t);
    return map;
  }, [tags]);

  // Filtering
  const filteredQuestions = useMemo(() => {
    return initialQuestions.filter((q) => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;
      if (domainFilter !== 'all' && !q.tagIds.includes(domainFilter)) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesPrompt = q.prompt.toLowerCase().includes(term);
        const matchesId = q.externalId.toLowerCase().includes(term);
        const matchesNum = String(q.sourceNumber).includes(term);
        if (!matchesPrompt && !matchesId && !matchesNum) return false;
      }

      return true;
    });
  }, [initialQuestions, statusFilter, typeFilter, domainFilter, searchTerm]);

  // Selected question
  const selectedQuestion = useMemo(() => {
    return initialQuestions.find((q) => q.id === selectedQuestionId) || null;
  }, [initialQuestions, selectedQuestionId]);

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Browse, filter, and inspect reviewed CCNA questions and draft materials.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
          <span className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-panel)]">
            Showing {filteredQuestions.length} of {initialQuestions.length}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div>
            <label htmlFor="search-input" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Search Text or ID
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="e.g. SVI, port, q018, 54..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-sm focus:border-[var(--accent)]"
            />
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="status-select" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Review Status
            </label>
            <select
              id="status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-sm focus:border-[var(--accent)]"
            >
              <option value="all">All Statuses</option>
              <option value="unverified">Draft / Unverified</option>
              <option value="needs-source">Needs Source / Incomplete</option>
              <option value="verified">Verified Authority</option>
            </select>
          </div>

          {/* Type filter */}
          <div>
            <label htmlFor="type-select" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Question Type
            </label>
            <select
              id="type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-sm focus:border-[var(--accent)]"
            >
              <option value="all">All Types</option>
              <option value="single">Single Choice</option>
              <option value="multi">Multiple Choice</option>
              <option value="matching">Matching</option>
              <option value="ordering">Ordering Sequence</option>
            </select>
          </div>

          {/* Domain tag filter */}
          <div>
            <label htmlFor="domain-select" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              CCNA Exam Domain
            </label>
            <select
              id="domain-select"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-sm focus:border-[var(--accent)]"
            >
              <option value="all">All Domains</option>
              {tags.filter(t => t.kind === 'domain').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Split View: Question List on Left, Detail Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Questions Table/List (5 cols on lg) */}
        <div className="lg:col-span-5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden shadow-xs">
          <div className="p-3 border-b border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] flex items-center justify-between">
            <span>Question List</span>
            <span>{filteredQuestions.length} items</span>
          </div>

          <div className="divide-y divide-[var(--border)] max-h-[750px] overflow-y-auto">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
                No questions match your current filter criteria.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isSelected = q.id === selectedQuestionId;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuestionId(q.id)}
                    id={`question-item-${q.sourceNumber}`}
                    className={`w-full text-left p-4 transition-colors flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent)]/10 border-l-4 border-l-[var(--accent)]'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          Q{q.sourceNumber}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                          {q.externalId}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Type Badge */}
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-secondary)]">
                          {q.type}
                        </span>

                        {/* Status Badge */}
                        {q.status === 'verified' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            Verified
                          </span>
                        )}
                        {q.status === 'unverified' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Draft
                          </span>
                        )}
                        {q.status === 'needs-source' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            Needs Source
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-primary)] line-clamp-2 leading-relaxed">
                      {q.prompt}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                      {q.assetReferences.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[var(--accent)] font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Exhibit
                        </span>
                      )}
                      {q.duplicateGroupId && (
                        <span className="text-amber-500 font-mono">
                          Dup group
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Question Inspector Detail (7 cols on lg) */}
        <div className="lg:col-span-7">
          {selectedQuestion ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 space-y-6 shadow-xs sticky top-4">
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">
                      Question {selectedQuestion.sourceNumber}
                    </h2>
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      ({selectedQuestion.externalId} • v{selectedQuestion.version})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedQuestion.tagIds.map(tid => {
                      const tag = tagMap.get(tid);
                      return tag ? (
                        <span key={tid} className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-secondary)]">
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Status Indicator */}
                <div>
                  {selectedQuestion.status === 'verified' && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      Verified
                    </span>
                  )}
                  {selectedQuestion.status === 'unverified' && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      Draft (Unverified)
                    </span>
                  )}
                  {selectedQuestion.status === 'needs-source' && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                      Needs Source
                    </span>
                  )}
                </div>
              </div>

              {/* Status Warning / Cleanup Notes */}
              {selectedQuestion.status === 'needs-source' && (
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Excluded from Practice: Needs Missing Source</span>
                  </div>
                  <p>{selectedQuestion.needsSourceReason}</p>
                </div>
              )}

              {selectedQuestion.cleanupNotes && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                  <span className="font-semibold">Cleanup Note: </span>
                  {selectedQuestion.cleanupNotes}
                </div>
              )}

              {selectedQuestion.duplicateGroupId && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
                  <span className="font-semibold">Duplicate Group: </span>
                  This question belongs to group <code className="font-mono">{selectedQuestion.duplicateGroupId}</code>. Both versions are preserved in the bank, but practice sessions avoid repeatedly selecting the same group.
                </div>
              )}

              {/* Question Prompt */}
              <div className="space-y-3">
                <div className="text-sm font-medium leading-relaxed">
                  {selectedQuestion.prompt}
                </div>

                {/* Structured blocks e.g. code snippets */}
                {selectedQuestion.structuredBlocks?.map((block, idx) => (
                  <pre
                    key={idx}
                    className="p-3 rounded-lg bg-[var(--bg-page)] border border-[var(--border)] text-xs font-mono overflow-x-auto text-[var(--text-primary)]"
                  >
                    <code>{block.content}</code>
                  </pre>
                ))}
              </div>

              {/* Exhibit Image if Present */}
              {selectedQuestion.assetReferences.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Associated Exhibit
                  </div>
                  {selectedQuestion.assetReferences.map((asset) => (
                    <div key={asset.id} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-page)]">
                      <div className="relative group cursor-pointer" onClick={() => setEnlargedExhibitUrl(asset.url)}>
                        <div className="relative w-full h-48 sm:h-56">
                          <Image
                            src={asset.url}
                            alt={asset.altText || asset.caption || 'Question exhibit'}
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium rounded">
                          Click to enlarge exhibit
                        </div>
                      </div>
                      {asset.caption && (
                        <p className="text-[11px] text-[var(--text-secondary)] mt-2 text-center">
                          {asset.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Payload Options / Mappings by Question Type */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Options & Answer Structure
                </div>

                {/* Single Choice */}
                {selectedQuestion.type === 'single' && (
                  <div className="space-y-2">
                    {((selectedQuestion.payload as SingleChoicePayload).options || []).map((opt) => {
                      const isCorrect = (selectedQuestion.payload as SingleChoicePayload).correctOptionIds?.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                            isCorrect
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                              : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                              {isCorrect ? '✓' : ''}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Draft Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Multi Choice */}
                {selectedQuestion.type === 'multi' && (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      Required selections: {(selectedQuestion.payload as MultiChoicePayload).requiredSelections}
                    </p>
                    {((selectedQuestion.payload as MultiChoicePayload).options || []).map((opt) => {
                      const isCorrect = (selectedQuestion.payload as MultiChoicePayload).correctOptionIds?.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                            isCorrect
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                              : 'border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                              {isCorrect ? '✓' : ''}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Draft Selection
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Matching */}
                {selectedQuestion.type === 'matching' && (
                  <div className="space-y-2">
                    <div className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)] text-xs">
                      {((selectedQuestion.payload as MatchingPayload).prompts || []).map((prompt) => {
                        const choiceId = (selectedQuestion.payload as MatchingPayload).correctMapping?.[prompt.id];
                        const choice = (selectedQuestion.payload as MatchingPayload).choices?.find(c => c.id === choiceId);
                        return (
                          <div key={prompt.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--bg-page)]">
                            <span className="font-medium text-[var(--text-primary)]">{prompt.text}</span>
                            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold shrink-0">
                              {choice ? choice.text : (choiceId === null ? 'No Match (Distractor)' : 'Unassigned')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ordering */}
                {selectedQuestion.type === 'ordering' && (
                  <div className="space-y-2">
                    <ol className="list-decimal list-inside space-y-1.5 text-xs">
                      {((selectedQuestion.payload as OrderingPayload).correctOrderIds || []).map((itemId, idx) => {
                        const item = (selectedQuestion.payload as OrderingPayload).items?.find(i => i.id === itemId);
                        return (
                          <li key={itemId} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-page)]">
                            <span className="font-semibold mr-2">{idx + 1}.</span>
                            <span>{item?.text}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>

              {/* Explanations Section */}
              <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Explanation & Review Notes
                </div>

                <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] space-y-3 text-xs leading-relaxed">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block mb-1">Reasoning:</span>
                    <p className="text-[var(--text-secondary)]">{selectedQuestion.explanation.answerReasoning}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block mb-1">Concept Refresher:</span>
                    <p className="text-[var(--text-secondary)]">{selectedQuestion.explanation.conceptRefresher}</p>
                  </div>

                  {selectedQuestion.explanation.commonMisconception && (
                    <div>
                      <span className="font-semibold text-[var(--text-primary)] block mb-1">Common Misconception:</span>
                      <p className="text-[var(--text-secondary)]">{selectedQuestion.explanation.commonMisconception}</p>
                    </div>
                  )}

                  {selectedQuestion.explanation.references && selectedQuestion.explanation.references.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border)] font-mono text-[11px] text-[var(--text-secondary)]">
                      <span>References: </span>
                      {selectedQuestion.explanation.references.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] text-sm text-[var(--text-secondary)]">
              Select a question from the list to view complete details, exhibits, and explanations.
            </div>
          )}
        </div>
      </div>

      {/* Enlarged Exhibit Modal */}
      {enlargedExhibitUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
          onClick={() => setEnlargedExhibitUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-[80vh] bg-[var(--bg-panel)] p-4 rounded-2xl border border-[var(--border)] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <span className="font-semibold text-sm">Enlarged Exhibit</span>
              <button
                type="button"
                onClick={() => setEnlargedExhibitUrl(null)}
                className="text-xs px-2 py-1 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20"
              >
                Close (ESC)
              </button>
            </div>
            <div className="relative flex-1 w-full mt-3">
              <Image
                src={enlargedExhibitUrl}
                alt="Enlarged exhibit"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
