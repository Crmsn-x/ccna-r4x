'use client';

import React from 'react';
import type { ImmutableQuestionSnapshot, OptionItem } from '@/domain/types';

interface SingleChoiceQuestionProps {
  snapshot: ImmutableQuestionSnapshot;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  isSubmitted?: boolean;
  correctOptionId?: string;
}

export function SingleChoiceQuestion({
  snapshot,
  selectedOptionId,
  onSelect,
  disabled = false,
  isSubmitted = false,
  correctOptionId,
}: SingleChoiceQuestionProps) {
  const payload = snapshot.payload as { options: OptionItem[] };
  const options = payload.options || [];

  return (
    <fieldset className="space-y-3" aria-label="Single Choice Options" disabled={disabled}>
      <legend className="sr-only">Choose one option</legend>
      <div className="space-y-2.5">
        {options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = isSubmitted && correctOptionId === option.id;
          const isWrong = isSubmitted && isSelected && correctOptionId !== option.id;

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
                  type="radio"
                  name={`question-${snapshot.questionId}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onSelect(option.id)}
                  disabled={disabled}
                  className="w-4 h-4 text-[var(--accent)] focus:ring-[var(--ring-focus)] accent-[var(--accent)] cursor-pointer"
                  id={`opt-${snapshot.questionId}-${option.id}`}
                />
              </div>
              <div className="flex-1 text-base leading-relaxed select-none">
                <span className={textStyle}>{option.text}</span>
              </div>
              {isSubmitted && isCorrect && (
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white dark:bg-emerald-500">
                  Correct Answer
                </span>
              )}
              {isSubmitted && isWrong && (
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded bg-rose-600 text-white dark:bg-rose-500">
                  Your Answer (Incorrect)
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
