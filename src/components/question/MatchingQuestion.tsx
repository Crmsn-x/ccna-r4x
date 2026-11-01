'use client';

import React from 'react';
import type { ImmutableQuestionSnapshot, MatchingPrompt, MatchingChoice } from '@/domain/types';

interface MatchingQuestionProps {
  snapshot: ImmutableQuestionSnapshot;
  mapping?: Record<string, string | null>;
  onChangeMapping: (promptId: string, choiceId: string | null) => void;
  disabled?: boolean;
  isSubmitted?: boolean;
  correctMapping?: Record<string, string | null>;
}

export function MatchingQuestion({
  snapshot,
  mapping = {},
  onChangeMapping,
  disabled = false,
  isSubmitted = false,
  correctMapping,
}: MatchingQuestionProps) {
  const payload = snapshot.payload as {
    prompts: MatchingPrompt[];
    choices: MatchingChoice[];
    allowChoiceReuse?: boolean;
  };
  const prompts = payload.prompts || [];
  const choices = payload.choices || [];

  return (
    <div className="space-y-4">
      <div className="text-sm text-[var(--text-secondary)]">
        Match each item on the left with its corresponding category or function using the dropdown menu:
      </div>

      <div className="space-y-3">
        {prompts.map((prompt, idx) => {
          const selectedChoiceId = mapping[prompt.id] ?? null;
          const targetChoiceId = correctMapping ? correctMapping[prompt.id] : undefined;
          const isCorrect = isSubmitted && targetChoiceId !== undefined && selectedChoiceId === targetChoiceId;
          const isWrong = isSubmitted && targetChoiceId !== undefined && selectedChoiceId !== targetChoiceId;

          let borderStyle = 'border-[var(--border)]';
          let bgStyle = 'bg-[var(--bg-panel)]';

          if (isSubmitted) {
            if (isCorrect) {
              borderStyle = 'border-emerald-600 dark:border-emerald-500 ring-1 ring-emerald-500';
              bgStyle = 'bg-emerald-500/10';
            } else if (isWrong) {
              borderStyle = 'border-[var(--incorrect-border)] ring-1 ring-[var(--incorrect-border)]';
              bgStyle = 'bg-[var(--incorrect-bg)]';
            }
          }

          return (
            <div
              key={prompt.id}
              className={`p-4 rounded-xl border ${borderStyle} ${bgStyle} flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all duration-150`}
            >
              {/* Prompt text */}
              <div className="flex-1 text-base text-[var(--text-primary)] leading-relaxed">
                <span className="font-semibold text-xs text-[var(--text-secondary)] mr-2 uppercase tracking-wider">
                  Item {idx + 1}:
                </span>
                {prompt.text}
              </div>

              {/* Match dropdown */}
              <div className="w-full md:w-64 shrink-0">
                <label htmlFor={`match-${snapshot.questionId}-${prompt.id}`} className="sr-only">
                  Matching choice for item {idx + 1}
                </label>
                <select
                  id={`match-${snapshot.questionId}-${prompt.id}`}
                  value={selectedChoiceId === null ? '__unmatched__' : (selectedChoiceId || '')}
                  onChange={e => {
                    const val = e.target.value;
                    onChangeMapping(prompt.id, val === '' || val === '__unmatched__' ? null : val);
                  }}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--ring-focus)] focus:border-transparent outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-80"
                >
                  <option value="">— Select matching choice —</option>
                  {choices.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.text}
                    </option>
                  ))}
                  <option value="__unmatched__">Not used</option>
                </select>

                {isSubmitted && (
                  <div className="mt-1.5 text-xs font-semibold">
                    {isCorrect ? (
                      <span className="text-emerald-700 dark:text-emerald-300">✓ Correct Match</span>
                    ) : (
                      <span className="text-rose-700 dark:text-rose-400">
                        Target:{' '}
                        {targetChoiceId
                          ? choices.find(c => c.id === targetChoiceId)?.text || targetChoiceId
                          : 'Not used'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
