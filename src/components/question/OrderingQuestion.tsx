'use client';

import React from 'react';
import type { ImmutableQuestionSnapshot, OrderingItem } from '@/domain/types';

interface OrderingQuestionProps {
  snapshot: ImmutableQuestionSnapshot;
  orderedItemIds?: string[];
  onChangeOrder: (orderedItemIds: string[]) => void;
  disabled?: boolean;
  isSubmitted?: boolean;
  correctOrderIds?: string[];
}

export function OrderingQuestion({
  snapshot,
  orderedItemIds,
  onChangeOrder,
  disabled = false,
  isSubmitted = false,
  correctOrderIds,
}: OrderingQuestionProps) {
  const payload = snapshot.payload as { items: OrderingItem[]; distractorItemIds?: string[] };
  const items = payload.items || [];
  const itemMap = new Map(items.map(i => [i.id, i]));

  // Active ordered items
  const currentOrder = React.useMemo(() => {
    if (orderedItemIds && Array.isArray(orderedItemIds)) {
      return orderedItemIds.filter(id => itemMap.has(id));
    }
    return items.map(i => i.id);
  }, [orderedItemIds, items, itemMap]);

  // Excluded / Not used items (any item not currently in currentOrder)
  const excludedItems = React.useMemo(() => {
    const activeSet = new Set(currentOrder);
    return items.filter(i => !activeSet.has(i.id));
  }, [items, currentOrder]);

  const moveUp = (index: number) => {
    if (index <= 0 || disabled) return;
    const next = [...currentOrder];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onChangeOrder(next);
  };

  const moveDown = (index: number) => {
    if (index >= currentOrder.length - 1 || disabled) return;
    const next = [...currentOrder];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onChangeOrder(next);
  };

  const excludeItem = (itemId: string) => {
    if (disabled || currentOrder.length <= 1) return;
    const next = currentOrder.filter(id => id !== itemId);
    onChangeOrder(next);
  };

  const includeItem = (itemId: string) => {
    if (disabled) return;
    const next = [...currentOrder, itemId];
    onChangeOrder(next);
  };

  return (
    <div className="space-y-5">
      <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
        Arrange the items into the correct chronological or operational sequence using Move Up and Move Down. If the question states that not all options are used, move unused items to the <strong>Not used</strong> area:
      </div>

      {/* Ordered Sequence */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Ordered Sequence ({currentOrder.length} {currentOrder.length === 1 ? 'item' : 'items'})
        </div>
        <ol className="space-y-3" aria-label="Sequence Ordering List">
          {currentOrder.map((itemId, idx) => {
            const item = itemMap.get(itemId);
            if (!item) return null;

            const isTargetPos = isSubmitted && correctOrderIds && correctOrderIds[idx] === itemId;
            const isWrongPos = isSubmitted && correctOrderIds && (correctOrderIds[idx] !== itemId || !correctOrderIds.includes(itemId));

            let borderStyle = 'border-[var(--border)]';
            let bgStyle = 'bg-[var(--bg-panel)]';

            if (isSubmitted) {
              if (isTargetPos) {
                borderStyle = 'border-emerald-600 dark:border-emerald-500 ring-1 ring-emerald-500';
                bgStyle = 'bg-emerald-500/10';
              } else if (isWrongPos) {
                borderStyle = 'border-[var(--incorrect-border)] ring-1 ring-[var(--incorrect-border)]';
                bgStyle = 'bg-[var(--incorrect-bg)]';
              }
            }

            return (
              <li
                key={itemId}
                className={`p-4 rounded-xl border ${borderStyle} ${bgStyle} flex items-center justify-between gap-4 transition-all duration-150`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-[var(--bg-page)] border border-[var(--border)] flex items-center justify-center font-bold text-sm text-[var(--text-primary)] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-base text-[var(--text-primary)] leading-relaxed select-none">
                    {item.text}
                  </span>
                </div>

                {/* Order adjustment controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={disabled || idx === 0}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-xs font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label={`Move item ${idx + 1} up`}
                  >
                    ↑ Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={disabled || idx === currentOrder.length - 1}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-xs font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label={`Move item ${idx + 1} down`}
                  >
                    ↓ Down
                  </button>
                  <button
                    type="button"
                    onClick={() => excludeItem(itemId)}
                    disabled={disabled || currentOrder.length <= 1}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] text-xs font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move item to Not used"
                  >
                    Not used
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Excluded / Not Used Area */}
      {excludedItems.length > 0 && (
        <div className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Not used / Distractor items ({excludedItems.length})
            </span>
          </div>
          <div className="space-y-2">
            {excludedItems.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] flex items-center justify-between gap-3"
              >
                <span className="text-sm text-[var(--text-secondary)] line-through">
                  {item.text}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => includeItem(item.id)}
                    className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-page)] text-xs font-semibold text-[var(--accent)] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    + Add to sequence
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isSubmitted && correctOrderIds && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 text-sm text-emerald-950 dark:text-emerald-200">
          <div className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
            Target Correct Sequence:
          </div>
          <ol className="list-decimal list-inside space-y-1">
            {correctOrderIds.map(id => (
              <li key={id}>{itemMap.get(id)?.text || id}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
