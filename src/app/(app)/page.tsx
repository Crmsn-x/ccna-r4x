import Link from 'next/link';
import { getStore } from '@/server/store';
import { OverviewSearch } from '@/components/OverviewSearch';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const store = getStore();
  const [questions, sessions, dueReviews, reviewStates] = await Promise.all([
    store.getQuestions(),
    store.listSessions(),
    store.getDueReviews(),
    store.getReviewStates(),
  ]);

  const totalBankQuestions = questions.length; // 75
  const reviewedCount = reviewStates.length; // Reviewed so far
  const needsSourceCount = questions.filter(q => q.status === 'needs-source').length; // 2

  // Active session
  const activeSession = sessions.find(s => s.status === 'active');
  const activeCount = activeSession ? activeSession.questionIds.length : 1;
  const isDraftPractice = !activeSession || activeSession.contentTrack === 'draft' || activeSession.mode === 'learn';
  const sessionSubtitle = activeSession
    ? `${isDraftPractice ? 'Draft practice' : 'Timed assessment'} · ${activeCount} question${activeCount === 1 ? '' : 's'}`
    : 'Draft practice · 1 question';

  const resumeHref = activeSession ? `/practice/${activeSession.id}` : '/practice';

  return (
    <div className="w-full">
      {/* 1. Page Header (Overview heading 48px bold + Search box 438x52px) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <h1 className="text-[36px] sm:text-[44px] lg:text-[48px] font-bold tracking-tight text-[var(--text-heading)] leading-none">
          Overview
        </h1>
        <OverviewSearch />
      </div>

      {/* 2. Session Banner (charcoal #1B222E, min-height ~281px, rounded-[8px]) */}
      <div className="mt-8 mb-9 bg-[var(--session-banner-bg)] text-[var(--session-banner-text)] rounded-[8px] p-7 sm:p-9 lg:p-11 min-h-[281px] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl z-10">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2] inline-block shrink-0" />
            <span className="text-[12px] sm:text-[13px] font-semibold tracking-wider text-slate-300 uppercase">
              SESSION IN PROGRESS
            </span>
          </div>

          <h2 className="text-[30px] sm:text-[36px] lg:text-[40px] font-bold text-white mt-3.5 mb-2 tracking-tight leading-tight">
            Pick up where you left off.
          </h2>

          <p className="text-[18px] sm:text-[20px] text-[var(--session-banner-muted)] mb-8 font-normal">
            {sessionSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <Link
              href={resumeHref}
              id="resume-session-btn"
              className="inline-flex items-center gap-2.5 bg-white text-[#0B1223] font-semibold px-7 py-3.5 rounded-[8px] text-[16px] hover:bg-slate-100 transition-colors shadow-xs"
            >
              <span>Resume session</span>
              <svg
                className="w-4 h-4 stroke-[2.25] text-[#0B1223]"
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

            <Link
              href="/practice"
              id="start-new-session-btn"
              className="text-slate-300 hover:text-white text-[16px] font-medium transition-colors"
            >
              Start new session
            </Link>
          </div>
        </div>

        {/* High-Fidelity 3D Perspective Cards Graphic on Right */}
        <div className="relative w-80 lg:w-[410px] h-52 shrink-0 hidden md:flex items-center justify-center select-none pointer-events-none">
          <svg
            viewBox="0 0 440 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Card 3 (Back) */}
            <g transform="translate(182, 38) skewY(4.5)">
              <rect
                width="176"
                height="142"
                rx="12"
                fill="#161E2B"
                stroke="rgba(175, 195, 220, 0.28)"
                strokeWidth="1.5"
              />
            </g>

            {/* Card 2 (Middle) */}
            <g transform="translate(118, 54) skewY(4.5)">
              <rect
                width="176"
                height="142"
                rx="12"
                fill="#192230"
                stroke="rgba(175, 195, 220, 0.48)"
                strokeWidth="1.5"
              />
            </g>

            {/* Card 1 (Front) */}
            <g transform="translate(54, 70) skewY(4.5)">
              <rect
                width="176"
                height="142"
                rx="12"
                fill="#1C2534"
                stroke="#FFFFFF"
                strokeWidth="1.75"
              />
              {/* Blue rounded badge icon */}
              <rect
                x="20"
                y="20"
                width="28"
                height="28"
                rx="7"
                fill="#087BFF"
              />
              {/* 3 Prompt wireframe lines */}
              <line
                x1="20"
                y1="72"
                x2="136"
                y2="72"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1="20"
                y1="94"
                x2="116"
                y2="94"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1="20"
                y1="116"
                x2="80"
                y2="116"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* 3. Statistics Row (Numbers 38-42px bold, labels 16px, vertical separator, right-aligned View progress) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-7 sm:gap-9">
          <div className="flex items-center gap-3.5">
            <span className="text-[36px] sm:text-[40px] font-bold text-[var(--text-heading)] leading-none tracking-tight">
              {totalBankQuestions}
            </span>
            <span className="text-[16px] text-[#5C6B82] dark:text-slate-400 font-normal">
              Questions in your bank
            </span>
          </div>

          <div className="h-9 w-px bg-[#D9E2EC] dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-3.5">
            <span className="text-[36px] sm:text-[40px] font-bold text-[var(--text-heading)] leading-none tracking-tight">
              {reviewedCount}
            </span>
            <span className="text-[16px] text-[#5C6B82] dark:text-slate-400 font-normal">
              Reviewed so far
            </span>
          </div>
        </div>

        <Link
          href="/progress"
          id="overview-view-progress-link"
          className="text-[#087BFF] hover:underline text-[16px] font-semibold inline-flex items-center gap-2 transition-colors"
        >
          <span>View progress</span>
          <svg
            className="w-4 h-4 stroke-[2.25]"
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

      {/* Light Horizontal Divider below statistics */}
      <div className="w-full border-b border-[#E8EEF5] dark:border-slate-800 my-8" />

      {/* 4. Study Section (Heading 28px bold, cards ~118px height) */}
      <div>
        <h2 className="text-[26px] sm:text-[28px] font-bold text-[var(--text-heading)] tracking-tight mb-5">
          Your study space
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Targeted Practice */}
          <Link
            href="/practice"
            id="targeted-practice-card"
            className="p-6 rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-[var(--bg-card)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all flex items-center justify-between min-h-[118px] group"
          >
            <div className="flex items-center gap-5">
              <div className="w-[56px] h-[56px] rounded-[14px] bg-[#EBF3FC] dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                {/* Clean Crosshairs / Target icon matching reference */}
                <svg
                  className="w-7 h-7 text-[#087BFF]"
                  viewBox="0 0 28 28"
                  fill="none"
                >
                  <circle cx="14" cy="14" r="8" stroke="currentColor" strokeWidth="1.75" />
                  <circle cx="14" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.75" />
                  <circle cx="14" cy="14" r="1" fill="currentColor" />
                  <line x1="14" y1="2" x2="14" y2="5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <line x1="14" y1="23" x2="14" y2="26" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <line x1="2" y1="14" x2="5" y2="14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <line x1="23" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-[19px] sm:text-[20px] font-bold text-[var(--text-heading)] tracking-[-0.2px]">
                  Targeted practice
                </h3>
                <p className="text-[14px] sm:text-[15px] text-[#64748B] dark:text-slate-400 mt-1 font-normal">
                  Focus on a topic, one question at a time.
                </p>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-[#0B1223] dark:text-slate-200 shrink-0 group-hover:translate-x-1 transition-transform ml-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>

          {/* Card 2: Review Queue */}
          <Link
            href="/review"
            id="review-queue-card"
            className="p-6 rounded-[14px] border border-[#E5ECF6] dark:border-slate-800 bg-[var(--bg-card)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all flex items-center justify-between min-h-[118px] group"
          >
            <div className="flex items-center gap-5">
              <div className="w-[56px] h-[56px] rounded-[14px] bg-[#EBF3FC] dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                {/* Clean Clock icon matching reference */}
                <svg
                  className="w-7 h-7 text-[#087BFF]"
                  viewBox="0 0 28 28"
                  fill="none"
                >
                  <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.75" />
                  <path
                    d="M14 9.5V14L17.5 16"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-[19px] sm:text-[20px] font-bold text-[var(--text-heading)] tracking-[-0.2px]">
                  Review queue
                </h3>
                <p className="text-[14px] sm:text-[15px] text-[#64748B] dark:text-slate-400 mt-1 font-normal">
                  {dueReviews.length > 0
                    ? `${dueReviews.length} question${dueReviews.length === 1 ? '' : 's'} due for review.`
                    : "You're all caught up."}
                </p>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-[#0B1223] dark:text-slate-200 shrink-0 group-hover:translate-x-1 transition-transform ml-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 5. Bottom Status Divider & Audit Link (only displayed when issues exist) */}
      {needsSourceCount > 0 && (
        <div className="w-full border-t border-[#E8EEF5] dark:border-slate-800 pt-7 mt-9 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] shrink-0 inline-block" />
            <span className="text-[15px] text-[#5C6B82] dark:text-slate-400 font-normal">
              {needsSourceCount} questions need source material
            </span>
          </div>

          <Link
            href="/manage?tab=issues"
            id="overview-review-content-link"
            className="text-[#087BFF] hover:underline text-[15px] font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Review content</span>
            <svg
              className="w-4 h-4 stroke-[2.25]"
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
      )}
    </div>
  );
}
