'use client';

import React from 'react';
import type { ImmutableQuestionSnapshot, OptionItem } from '@/domain/types';

interface MultiChoiceQuestionProps {
  snapshot: ImmutableQuestionSnapshot;
  selectedOptionIds?: string[];
  onToggle: (optionId: string) => void;
  disabled?: boolean;
  isSubmitted?: boolean;
  correctOptionIds?: string[];
}

export function MultiChoiceQuestion({
  snapshot,
  selectedOptionIds = [],
  onToggle,
  disabled = false,
  isSubmitted = false,
  correctOptionIds = [],
}: MultiChoiceQuestionProps) {
  const payload = snapshot.payload as { options: OptionItem[]; requiredSelections?: number };
  const options = payload.options || [];
  const required = payload.requiredSelections || 2;
  const currentCount = selectedOptionIds.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-[var(--text-secondary)] pb-1">
        <span>
          Choose exactly <strong>{required}</strong> options:
        </span>
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded font-medium ${
            currentCount === required
              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              : 'bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text-secondary)]'
          }`}
        >
          {currentCount} of {required} selected
        </span>
      </div>

      <fieldset className="space-y-2.5" aria-label="Multiple Choice Options" disabled={disabled}>
        {options.map((option, idx) => {
          const isSelected = selectedOptionIds.includes(option.id);
          const isCorrect = isSubmitted && correctOptionIds.includes(option.id);
          const isWrong = isSubmitted && isSelected && !correctOptionIds.includes(option.id);

          let borderStyle = 'border-[var(--border)]';
          let bgStyle = 'bg-[var(--bg-panel)]';
          let textStyle = 'text-[var(--text-primary)]';

          if (isSubmitted) {
            if (isCorrect) {
              borderStyle = 'border-emerald-600 dark:border-emerald-500 ring-1 ring-emerald-500';
              bgStyle = 'bg-emerald-500/10';
              textStyle = 'text-emerald-950 dark:text-emerald-200 font-medium';
            } else if (isWrong) {
              borderStyle = 'border-[var(--incorrect-border)] ring-1 ring-[var(--incorrect-border)]';
              bgStyle = 'bg-[var(--incorrect-bg)]';
              textStyle = 'text-[var(--incorrect-text)]';
            }
          } else if (isSelected) {
            borderStyle = 'border-[var(--accent)] ring-1 ring-[var(--accent)]';
            bgStyle = 'bg-[var(--accent)]/5';
          }

          return (
            <label
              key={option.id}
              className={`flex items-start gap-3.5 p-4 rounded-xl border ${borderStyle} ${bgStyle} cursor-pointer transition-all duration-150 ${
                disabled ? 'cursor-not-allowed opacity-90' : 'hover:border-[var(--accent)]'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                <input
                  type="checkbox"
                  name={`question-${snapshot.questionId}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onToggle(option.id)}
                  disabled={disabled}
                  className="w-4 h-4 rounded text-[var(--accent)] focus:ring-[var(--ring-focus)] accent-[var(--accent)] cursor-pointer"
                  id={`opt-${snapshot.questionId}-${option.id}`}
                />
              </div>
              <div className="flex-1 text-base leading-relaxed select-none">
                <span className={textStyle}>{option.text}</span>
              </div>
              {isSubmitted && isCorrect && (
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white dark:bg-emerald-500">
                  Correct Choice
                </span>
              )}
              {isSubmitted && isWrong && (
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded bg-rose-600 text-white dark:bg-rose-500">
                  Incorrect Selection
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
