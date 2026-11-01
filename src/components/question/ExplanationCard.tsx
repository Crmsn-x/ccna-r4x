'use client';

import React, { useState } from 'react';
import type { Explanation, VerificationRecord } from '@/domain/types';

interface ExplanationCardProps {
  explanation?: Explanation;
  isCorrect?: boolean;
  score?: number;
  maxScore?: number;
  verificationRecord?: VerificationRecord;
  status?: string;
  selectedOptionId?: string;
  correctOptionId?: string;
}

export function ExplanationCard({
  explanation,
  isCorrect,
  score = 0,
  maxScore = 1,
  verificationRecord,
  status,
  selectedOptionId,
  correctOptionId,
}: ExplanationCardProps) {
  const [showAllOptions, setShowAllOptions] = useState(false);

  if (!explanation) return null;

  const correctLetter = correctOptionId || explanation.correctAnswerLetter || '';
  const overallExplanation = explanation.answerReasoning || explanation.summary?.text || '';
  const optionExplanations = explanation.optionExplanations || {};

  // User's choice explanation if answered incorrectly
  const userChoiceExplanation = selectedOptionId ? optionExplanations[selectedOptionId] : undefined;

  // Other incorrect options list
  let incorrectOptions: Array<{ key: string; text: string }> = [];
  if (Object.keys(optionExplanations).length > 0) {
    incorrectOptions = Object.entries(optionExplanations)
      .filter(([k]) => k !== correctLetter)
      .map(([k, text]) => ({ key: k, text }));
  } else if (explanation.incorrectRationales && explanation.incorrectRationales.length > 0) {
    incorrectOptions = explanation.incorrectRationales.map(r => ({
      key: r.optionIdOrKey,
      text: r.reason,
    }));
  }

  const hasAllOptions = Object.keys(optionExplanations).length > 0;

  return (
    <div className="space-y-5 p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-sm">
      {/* 1. Result Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-2.5">
          {typeof isCorrect === 'boolean' && (
            isCorrect ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)] text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                <span>✓ Correct (+{score} point)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--incorrect-bg)] text-[var(--incorrect-text)] border border-[var(--incorrect-border)] text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-[var(--incorrect-icon)]"></span>
                <span>✕ Incorrect (0/{maxScore} points)</span>
              </div>
            )
          )}
        </div>

        <span className="text-xs text-[var(--text-secondary)] font-mono">
          Answer & Explanation
        </span>
      </div>

      {/* 2. Correct Answer Header */}
      {correctLetter && (
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Correct Answer:
          </span>
          <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
            {correctLetter}
          </span>
        </div>
      )}

      {/* 3. Highlighted feedback for incorrect user choice */}
      {selectedOptionId && !isCorrect && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-1">
          <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <span>✕</span>
            <span>Why your choice (Option {selectedOptionId}) is incorrect:</span>
          </h4>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {userChoiceExplanation || `Option ${selectedOptionId} does not satisfy the question requirements.`}
          </p>
        </div>
      )}

      {/* 4. Overall Explanation */}
      {overallExplanation && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Explanation
          </h3>
          <p className="text-base text-[var(--text-primary)] leading-relaxed">
            {overallExplanation}
          </p>
        </div>
      )}

      {/* 5. Why the other options are incorrect */}
      {incorrectOptions.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Why the other options are incorrect:
          </h3>
          <div className="space-y-2">
            {incorrectOptions.map(item => (
              <div
                key={item.key}
                className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-sm leading-relaxed flex items-start gap-2.5"
              >
                <span className="font-bold text-rose-700 dark:text-rose-400 shrink-0">
                  {item.key}:
                </span>
                <span className="text-[var(--text-primary)]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Access to explanations for ALL options */}
      {hasAllOptions && (
        <div className="pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setShowAllOptions(prev => !prev)}
            className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1.5 cursor-pointer py-1"
          >
            <span>{showAllOptions ? 'Hide option-by-option breakdown' : 'Show all option explanations (A, B, C, D)'}</span>
            <span className="text-[10px]">{showAllOptions ? '▲' : '▼'}</span>
          </button>

          {showAllOptions && (
            <div className="mt-3 space-y-2.5 animate-in fade-in duration-200">
              {Object.entries(optionExplanations).map(([optId, text]) => {
                const isThisCorrect = optId === correctLetter;
                return (
                  <div
                    key={optId}
                    className={`p-3.5 rounded-lg border text-sm leading-relaxed flex items-start gap-2.5 ${
                      isThisCorrect
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-[var(--border)] bg-[var(--bg-page)]'
                    }`}
                  >
                    <span
                      className={`font-bold shrink-0 ${
                        isThisCorrect
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      Option {optId} {isThisCorrect ? '(Correct Answer)' : '(Incorrect)'}:
                    </span>
                    <span className="text-[var(--text-primary)]">{text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. Concept Refresher (if present) */}
      {(explanation.conceptRefresher || explanation.concept?.text) && (
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Concept Refresher
          </h3>
          <p className="text-base text-[var(--text-primary)] leading-relaxed">
            {explanation.conceptRefresher || explanation.concept?.text}
          </p>
        </div>
      )}

      {/* 8. Practical Implementation / Commands (if present) */}
      {explanation.practicalExampleOrCommands && (
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Practical Implementation / Verification Commands
          </h3>
          <pre className="p-3.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border)] font-mono text-xs md:text-sm text-[var(--text-primary)] overflow-x-auto whitespace-pre-wrap">
            {explanation.practicalExampleOrCommands}
          </pre>
        </div>
      )}
    </div>
  );
}
