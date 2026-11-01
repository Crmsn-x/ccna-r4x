import Link from 'next/link';
import { OverviewSearch } from '@/components/OverviewSearch';

export const metadata = {
  title: 'Progress | CCNA Revise',
  description: 'Track your question coverage, answer accuracy, and practice history.',
};

export default function ProgressPage() {
  return (
    <div className="w-full">
      {/* 1. Page Header (Title + Search bar 438x52px) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <h1 className="text-[36px] sm:text-[44px] lg:text-[48px] font-bold tracking-tight text-[var(--text-heading)] leading-none">
          Progress
        </h1>
        <OverviewSearch />
      </div>

      {/* 2. Hero Banner (Dark Slate/Navy #1B293A, exactly 264px height, rounded-[10px]) */}
      <div className="mt-8 sm:mt-[52px] mb-10 sm:mb-[46px] bg-[#1B293A] text-white rounded-[10px] px-8 sm:px-12 h-auto sm:h-[264px] min-h-[264px] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xs">
        <div className="max-w-xl z-10 py-6 sm:py-0">
          {/* Coming soon Pill Badge */}
          <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#293B52] text-[#60A5FA] text-[13px] font-medium leading-none select-none">
            Coming soon
          </span>

          <h2 className="text-[30px] sm:text-[34px] lg:text-[36px] font-bold text-white tracking-tight leading-[1.15] mt-4">
            A clearer view of your progress.
          </h2>
          <p className="text-[17px] sm:text-[18px] text-[#94A3B8] font-normal mt-3">
            Study insights are coming soon.
          </p>
        </div>

        {/* Bar Chart Illustration on Right (4 ascending bars with blue active bar) */}
        <div className="relative w-full md:w-[360px] h-[165px] md:h-[185px] shrink-0 flex items-center justify-center md:justify-end select-none pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/progress_chart_original.png"
            alt="Study progress chart preview"
            className="w-[360px] h-[185px] object-contain"
          />
        </div>
      </div>

      {/* 3. Section: What you’ll be able to track */}
      <div className="w-full">
        <h2 className="text-[22px] sm:text-[24px] font-bold text-[var(--text-heading)] mb-[19px] tracking-tight">
          What you’ll be able to track
        </h2>

        <div className="space-y-[18px]">
          {/* Card 1: Question coverage */}
          <div
            id="track-coverage-card"
            className="w-full h-auto sm:h-[102px] bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[12px] p-5 sm:px-7 sm:py-[16px] flex items-center justify-between gap-6 shadow-xs transition-colors hover:border-[#CBD5E1] dark:hover:border-slate-700 group cursor-default"
          >
            <div className="flex items-center gap-[34px]">
              <div className="w-[68px] h-[68px] rounded-[16px] bg-[#E8F1FD] dark:bg-[#1E293D] text-[#1877F2] dark:text-[#3B82F6] flex items-center justify-center shrink-0 shadow-xs">
                {/* File/Document with lines icon */}
                <svg
                  className="w-8 h-8 text-[#1877F2] dark:text-[#3B82F6]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="2" width="16" height="20" rx="3" />
                  <line x1="8" y1="7" x2="11" y2="7" />
                  <line x1="8" y1="12" x2="13" y2="12" />
                  <line x1="8" y1="17" x2="16" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--text-heading)] leading-snug">
                  Question coverage
                </h3>
                <p className="text-[15px] sm:text-[16px] text-[var(--text-secondary)] font-normal mt-1 leading-normal">
                  See how much of your bank you’ve practised.
                </p>
              </div>
            </div>

            <div className="text-[var(--text-heading)] shrink-0 transition-transform group-hover:translate-x-1 pr-1">
              <svg
                className="w-5 h-5 stroke-[2]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>

          {/* Card 2: Answer accuracy */}
          <div
            id="track-accuracy-card"
            className="w-full h-auto sm:h-[102px] bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[12px] p-5 sm:px-7 sm:py-[16px] flex items-center justify-between gap-6 shadow-xs transition-colors hover:border-[#CBD5E1] dark:hover:border-slate-700 group cursor-default"
          >
            <div className="flex items-center gap-[34px]">
              <div className="w-[68px] h-[68px] rounded-[16px] bg-[#E8F1FD] dark:bg-[#1E293D] text-[#1877F2] dark:text-[#3B82F6] flex items-center justify-center shrink-0 shadow-xs">
                {/* Target / Crosshair icon */}
                <svg
                  className="w-8 h-8 text-[#1877F2] dark:text-[#3B82F6]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--text-heading)] leading-snug">
                  Answer accuracy
                </h3>
                <p className="text-[15px] sm:text-[16px] text-[var(--text-secondary)] font-normal mt-1 leading-normal">
                  Compare first attempts with repeat attempts.
                </p>
              </div>
            </div>

            <div className="text-[var(--text-heading)] shrink-0 transition-transform group-hover:translate-x-1 pr-1">
              <svg
                className="w-5 h-5 stroke-[2]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>

          {/* Card 3: Practice history */}
          <div
            id="track-history-card"
            className="w-full h-auto sm:h-[102px] bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[12px] p-5 sm:px-7 sm:py-[16px] flex items-center justify-between gap-6 shadow-xs transition-colors hover:border-[#CBD5E1] dark:hover:border-slate-700 group cursor-default"
          >
            <div className="flex items-center gap-[34px]">
              <div className="w-[68px] h-[68px] rounded-[16px] bg-[#E8F1FD] dark:bg-[#1E293D] text-[#1877F2] dark:text-[#3B82F6] flex items-center justify-center shrink-0 shadow-xs">
                {/* Clock / Time icon */}
                <svg
                  className="w-8 h-8 text-[#1877F2] dark:text-[#3B82F6]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 15 15" />
                </svg>
              </div>
              <div>
                <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--text-heading)] leading-snug">
                  Practice history
                </h3>
                <p className="text-[15px] sm:text-[16px] text-[var(--text-secondary)] font-normal mt-1 leading-normal">
                  Keep exam study and practical labs distinct.
                </p>
              </div>
            </div>

            <div className="text-[var(--text-heading)] shrink-0 transition-transform group-hover:translate-x-1 pr-1">
              <svg
                className="w-5 h-5 stroke-[2]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer Info Note & Explore Question Bank Link */}
        <div className="pt-[48px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-14">
          <div className="flex items-center gap-2.5 text-[14px] sm:text-[15px] text-[#64748B] dark:text-slate-400">
            <svg
              className="w-[18px] h-[18px] text-[#64748B] dark:text-slate-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Accuracy will use reviewed content only.</span>
          </div>

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
