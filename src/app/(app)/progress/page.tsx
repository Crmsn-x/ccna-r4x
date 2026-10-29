import Link from 'next/link';

export default function ProgressPlaceholderPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Progress & Analytics</h1>
        <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30">
          Phase 3
        </span>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-4">
        <h2 className="text-base font-semibold">Scheduled for Phase 3</h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Transparent metrics without invented mastery scores:
        </p>
        <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc list-inside">
          <li>Bank coverage and first-attempt accuracy vs. repeat accuracy.</li>
          <li>Sample size labels (e.g. &quot;Limited evidence&quot; under 5 questions attempted).</li>
          <li>Separation of theoretical exam progress and practical lab completion.</li>
          <li>Strict exclusion of draft practice and unanswered questions from accuracy calculations.</li>
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
