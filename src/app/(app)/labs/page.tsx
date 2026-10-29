import Link from 'next/link';

export default function LabsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Practical Labs</h1>
        <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
          Upcoming (Phase 5)
        </span>
      </div>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        Integrated multi-concept networking scenarios with Packet Tracer instructions, hints, topology specifications, and worked solutions.
      </p>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-4">
        <h2 className="text-base font-semibold">Scheduled for Phase 5</h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Per the build brief, Practical Labs will be fully introduced in Phase 5. Planned initial integrated scenarios include:
        </p>

        <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc list-inside">
          <li><strong>Small Branch Setup:</strong> Device naming, console access password security, IP addressing, SVI configuration, SSH access, and configuration save.</li>
          <li><strong>Departmental Network:</strong> VLAN segmentation, 802.1Q trunks, and inter-VLAN routing connectivity.</li>
          <li><strong>Fault Investigation:</strong> Addressing issues, interface shutdown states, and management access troubleshooting.</li>
        </ul>

        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">Packet Tracer runs separately on your computer.</span>
          <Link
            href="/bank"
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium hover:border-[var(--accent)]"
          >
            Explore Question Bank &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
