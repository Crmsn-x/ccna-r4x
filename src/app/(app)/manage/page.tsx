import Link from 'next/link';

export default function ManagePlaceholderPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Content & System Management</h1>
        <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30">
          Phase 4
        </span>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-4">
        <h2 className="text-base font-semibold">Scheduled for Phase 4 (Store Backups Operational in Phase 1)</h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          The underlying Store already performs automatic dated daily backups in <code className="font-mono">data/backups/</code> before any mutation. Phase 4 provides complete UI controls for:
        </p>
        <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc list-inside">
          <li><strong>JSON Import Validation & Preview:</strong> Preview incoming banks, specify add/update conflict policy, reject malformed schemas before persistence.</li>
          <li><strong>Question Editor & Versioning:</strong> Edit prompts, options, and explanations with immutable revision snapshots that preserve historical session integrity.</li>
          <li><strong>Verification Metadata:</strong> Record authoritative reference sources and review status. Substantive content edits invalidate prior verification until re-reviewed.</li>
          <li><strong>Export & Restore:</strong> Complete JSON bundle export and safe state restoration with pre-restore recovery snapshots.</li>
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
