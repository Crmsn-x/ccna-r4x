import Link from 'next/link';
import { OverviewSearch } from '@/components/OverviewSearch';

export const metadata = {
  title: 'Practical labs | CCNA Revise',
  description: 'Guided Packet Tracer scenarios and practical networking labs for CCNA preparation.',
};

export default function LabsPage() {
  return (
    <div className="w-full">
      {/* 1. Page Header (Title + Soon badge + Search bar 438x52px) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3.5">
          <h1 className="text-[36px] sm:text-[44px] lg:text-[48px] font-bold tracking-tight text-[var(--text-heading)] leading-none">
            Practical labs
          </h1>
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-[10px] bg-[var(--soon-badge-bg)] text-[var(--soon-badge-text)] text-[14px] font-semibold leading-none select-none">
            Soon
          </span>
        </div>
        <OverviewSearch />
      </div>

      {/* 2. Hero Banner (Charcoal/Navy #222B39, exactly 257px height, rounded-[10px]) */}
      <div className="mt-8 sm:mt-[51px] mb-10 sm:mb-[44px] bg-[#222B39] text-white rounded-[10px] px-8 sm:px-12 h-auto sm:h-[257px] min-h-[257px] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xs">
        <div className="max-w-xl z-10 py-6 sm:py-0">
          <h2 className="text-[30px] sm:text-[34px] lg:text-[36px] font-bold text-white tracking-tight leading-[1.14]">
            Put your networking skills<br className="hidden sm:inline" /> into practice.
          </h2>
          <p className="text-[17px] sm:text-[18px] text-[#94A3B8] font-normal mt-5">
            Guided Packet Tracer scenarios are on the way.
          </p>
        </div>

        {/* Network Topology Illustration on Right (Router stack + Blue link + Laptop terminal) */}
        <div className="relative w-full md:w-[440px] h-[175px] md:h-[215px] shrink-0 flex items-center justify-center md:justify-end select-none pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/labs_banner_graphic.png"
            alt="Guided Packet Tracer topology preview"
            className="w-[440px] h-[215px] object-contain"
          />
        </div>
      </div>

      {/* 3. Section: What's coming */}
      <div className="w-full">
        <h2 className="text-[22px] sm:text-[24px] font-bold text-[var(--text-heading)] mb-[16px] tracking-tight">
          What&apos;s coming
        </h2>

        <div>
          {/* Item 1: Small branch setup */}
          <div className="flex items-center gap-[42px] py-[24px] border-b border-[#E8EEF5] dark:border-slate-800">
            <div className="w-[68px] h-[68px] rounded-[16px] bg-[#E8F1FD] dark:bg-[#1E293D] text-[#1877F2] dark:text-[#3B82F6] flex items-center justify-center shrink-0 shadow-xs">
              <svg
                className="w-8 h-8 text-[#1877F2] dark:text-[#3B82F6]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="2" width="6" height="5" rx="1" />
                <rect x="2" y="16" width="6" height="5" rx="1" />
                <rect x="9" y="16" width="6" height="5" rx="1" />
                <rect x="16" y="16" width="6" height="5" rx="1" />
                <line x1="12" y1="7" x2="12" y2="11.5" />
                <line x1="5" y1="11.5" x2="19" y2="11.5" />
                <line x1="5" y1="11.5" x2="5" y2="16" />
                <line x1="12" y1="11.5" x2="12" y2="16" />
                <line x1="19" y1="11.5" x2="19" y2="16" />
              </svg>
            </div>
            <div>
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--text-heading)] leading-snug">
                Small branch setup
              </h3>
              <p className="text-[15px] sm:text-[16px] text-[var(--text-secondary)] font-normal mt-1 leading-normal">
                Addressing, secure access and basic configuration.
              </p>
            </div>
          </div>

          {/* Item 2: Departmental network */}
          <div className="flex items-center gap-[42px] py-[24px] border-b border-[#E8EEF5] dark:border-slate-800">
            <div className="w-[68px] h-[68px] rounded-[16px] bg-[#E8F1FD] dark:bg-[#1E293D] text-[#1877F2] dark:text-[#3B82F6] flex items-center justify-center shrink-0 shadow-xs">
              <svg
                className="w-8 h-8 text-[#1877F2] dark:text-[#3B82F6]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
              </svg>
            </div>
            <div>
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--text-heading)] leading-snug">
                Departmental network
              </h3>
              <p className="text-[15px] sm:text-[16px] text-[var(--text-secondary)] font-normal mt-1 leading-normal">
                VLANs, trunks and inter-VLAN routing.
              </p>
            </div>
          </div>

          {/* Item 3: Fault investigation */}
          <div className="flex items-center gap-[42px] py-[24px] border-b border-[#E8EEF5] dark:border-slate-800">
            <div className="w-[68px] h-[68px] rounded-[16px] bg-[#E8F1FD] dark:bg-[#1E293D] text-[#1877F2] dark:text-[#3B82F6] flex items-center justify-center shrink-0 shadow-xs">
              <svg
                className="w-8 h-8 text-[#1877F2] dark:text-[#3B82F6]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--text-heading)] leading-snug">
                Fault investigation
              </h3>
              <p className="text-[15px] sm:text-[16px] text-[var(--text-secondary)] font-normal mt-1 leading-normal">
                Find and fix common network issues.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note & Explore Question Bank Link */}
        <div className="pt-[34px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-12">
          <span className="text-[14px] sm:text-[15px] text-[#64748B] dark:text-slate-400">
            Packet Tracer runs separately on your computer.
          </span>
          <Link
            href="/bank"
            id="explore-bank-link"
            className="inline-flex items-center gap-2 text-[15px] sm:text-[16px] font-semibold text-[#0066FF] hover:text-[#0052CC] dark:text-[#3B82F6] dark:hover:text-[#60A5FA] transition-colors group"
          >
            <span>Explore question bank</span>
            <svg
              className="w-4 h-4 stroke-[2.25] text-current transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
