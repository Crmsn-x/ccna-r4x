import Link from 'next/link';

export default function PracticePlaceholderPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Practice Sessions</h1>
        <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30">
          Phase 2 Foundation Ready
        </span>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-4">
        <h2 className="text-base font-semibold">Scheduled for Phase 2</h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          The Phase 1 Store, canonical data model, deterministic marking engine, and sanitized session snapshots are ready.
          Phase 2 will unlock:
        </p>
        <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc list-inside">
          <li>Custom session setup: topic scoping, mode selection (Learn vs. Assess), and optional timed limits.</li>
          <li>Interactive renderers for all 4 question types (single, multi, matching, ordering) without dragging.</li>
          <li>Draft autosaving and confidence capture (confident / unsure / guessed) before submission.</li>
          <li>Idempotent server-side marking and honest score breakdown.</li>
        </ul>
        <div className="pt-4 border-t border-[var(--border)]">
          <Link
            href="/bank"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium hover:border-[var(--accent)]"
          >
            Review Question Bank &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
