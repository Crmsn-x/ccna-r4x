'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Question, Tag } from '@/domain/types';
import { useDevMode, useCustomModules } from '@/hooks/useDevMode';

interface ManageClientProps {
  questions: Question[];
  tags: Tag[];
}

export function ManageClient({ questions, tags }: ManageClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'issues' ? 'issues' : 'about';

  const [activeTab, setActiveTab] = useState<'about' | 'developer' | 'issues' | 'modules'>(
    initialTab as 'about' | 'developer' | 'issues' | 'modules'
  );

  // Developer mode and custom course modules hooks
  const [devMode, setDevMode] = useDevMode();
  const [customModules, setCustomModules] = useCustomModules();
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedTopicForModule, setSelectedTopicForModule] = useState('');

  const handleToggleDevMode = (enabled: boolean) => {
    setDevMode(enabled);
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    const newMod = {
      id: `module-${Date.now()}`,
      name: newModuleName.trim(),
      topicIds: selectedTopicForModule ? [selectedTopicForModule] : [],
    };
    setCustomModules([...customModules, newMod]);
    setNewModuleName('');
    setSelectedTopicForModule('');
  };

  const handleDeleteModule = (id: string) => {
    setCustomModules(customModules.filter(m => m.id !== id));
  };

  const excludedQuestions = questions.filter(q => q.status === 'needs-source');
  const pilotQuestions = questions.filter(q => [1, 18, 24, 27, 43].includes(q.sourceNumber));
  const blueprintTopics = tags.filter(t => t.kind === 'topic');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
            activeTab === 'about'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          System Diagnostics &amp; About
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('developer')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'developer'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Developer Settings</span>
          {devMode && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30">
              ACTIVE
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'issues'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Content Issues</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400">
            {excludedQuestions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'modules'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Course Modules</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-secondary)]">
            {customModules.length}
          </span>
        </button>
      </div>

      {/* Tab 1: System & Runtime Diagnostics (Moved out of sidebar) */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Architecture &amp; Storage Implementation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border)] space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Storage Engine
                </span>
                <span className="text-base font-bold text-[var(--text-primary)] block">
                  Atomic JSON Store
                </span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Mutations write through safe temporary files (<code className="font-mono">.tmp.[uuid].json</code>) and atomic file replacements.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border)] space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Network Binding
                </span>
                <span className="text-base font-bold text-[var(--text-primary)] block font-mono">
                  127.0.0.1:3000 (Loopback Only)
                </span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Strictly local and offline. Zero telemetry, zero external APIs, zero cloud transmission.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border)] space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Daily Backups
                </span>
                <span className="text-base font-bold text-[var(--text-primary)] block">
                  Automated Daily Snapshots
                </span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Stored in <code className="font-mono">data/backups/</code> before daily mutations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border)] space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Client Runtime
                </span>
                <span className="text-base font-bold text-[var(--text-primary)] block">
                  Single-User PC Edition
                </span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Timezone: <span className="font-mono">Africa/Harare</span>. Framework: Next.js 16 with Turbopack.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Developer Settings */}
      {activeTab === 'developer' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Developer Mode (Test Fixtures &amp; Diagnostics)
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Developer mode enables testing with synthetic fixtures. When turned OFF (the default), development fixtures are hidden from normal Question Bank browsing and Practice setups.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={devMode}
                  onChange={(e) => handleToggleDevMode(e.target.checked)}
                  className="sr-only peer"
                  id="dev-mode-toggle"
                />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-page)] space-y-2 text-xs text-[var(--text-secondary)]">
              <div className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Status: {devMode ? 'ENABLED' : 'DISABLED (Default)'}
              </div>
              <p>
                {devMode
                  ? 'Test fixtures (dev-fixture-01, dev-fixture-02) are currently visible in Question Bank and can be tested in Practice setup. Fixture results remain strictly isolated from real study statistics.'
                  : 'Test fixtures are completely hidden from normal study navigation. All statistics reflect genuine source bank material.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Content Issues & Queue */}
      {activeTab === 'issues' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Excluded Content Issues ({excludedQuestions.length} Questions)
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                These questions lack essential source material in the syllabus file and are excluded from practice sessions until resolved.
              </p>
            </div>

            <div className="space-y-3">
              {excludedQuestions.map(q => (
                <div key={q.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-page)] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text-primary)]">
                      {q.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                      Excluded (Needs Source)
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {q.prompt}
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                    Issue: {q.needsSourceReason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Pilot Explanation Set ({pilotQuestions.length} Formats)
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Thoroughly researched pilot explanations covering single choice, multi-choice, matching, and ordering:
            </p>
            <div className="space-y-2">
              {pilotQuestions.map(q => (
                <div key={q.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[var(--accent)] mr-2">{q.id}</span>
                    <span className="font-medium text-[var(--text-primary)]">{q.prompt.substring(0, 75)}...</span>
                  </div>
                  <span className="capitalize font-semibold text-[var(--text-secondary)]">{q.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Course Modules & Lesson Mappings */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Course Module Mappings
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Map Cisco CCNA blueprint topics into custom course modules or university syllabi.
              </p>
            </div>

            {customModules.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-[var(--border)] text-center space-y-2">
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  No course modules or lesson mappings exist yet.
                </p>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                  The imported question bank follows the official Cisco CCNA 200-301 blueprint taxonomy. You can define custom course modules below to align revision with your specific syllabus.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customModules.map(mod => (
                  <div key={mod.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-page)] flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[var(--text-primary)] block">
                        {mod.name}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {mod.topicIds.length > 0 ? `Mapped topics: ${mod.topicIds.join(', ')}` : 'No mapped topics'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteModule(mod.id)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Create Module Form */}
            <form onSubmit={handleCreateModule} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-page)] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Add New Course Module
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Module Name (e.g. Module 1: Networking Basics)"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
                />
                <select
                  value={selectedTopicForModule}
                  onChange={(e) => setSelectedTopicForModule(e.target.value)}
                  className="px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
                >
                  <option value="">— Link Blueprint Topic (Optional) —</option>
                  {blueprintTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={!newModuleName.trim()}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors shadow-xs"
              >
                Create Module
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
