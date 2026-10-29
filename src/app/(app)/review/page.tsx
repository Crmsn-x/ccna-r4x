import Link from 'next/link';

export default function ReviewPlaceholderPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Review (Leitner Spaced Repetition)</h1>
        <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30">
          Phase 3
        </span>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-4">
        <h2 className="text-base font-semibold">Scheduled for Phase 3</h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          The 5-box Leitner scheduling engine (0, 1, 3, 7, 21 days) is implemented in pure tested modules.
          Phase 3 connects the UI tabs:
        </p>
        <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc list-inside">
          <li><strong>Missed:</strong> Questions answered incorrectly in recent sessions.</li>
          <li><strong>Guessed:</strong> Questions answered with unsure or guessed confidence.</li>
          <li><strong>Due:</strong> Spaced repetition cards currently due based on Leitner intervals.</li>
          <li><strong>Bookmarks:</strong> Explicitly bookmarked study cards.</li>
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
