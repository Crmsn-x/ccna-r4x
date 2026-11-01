'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function OverviewSearch() {
  const [query, setQuery] = useState('');
  const [isMac, setIsMac] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMac(typeof window !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/bank?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/bank');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full sm:w-[438px] h-[44px]">
      <div className="relative w-full h-full">
        <svg
          className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions, topics..."
          className="w-full h-full pl-12 pr-16 text-[15px] sm:text-[16px] bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl text-[var(--text-heading)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all shadow-xs"
        />
        <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-sans font-medium text-slate-400 dark:text-slate-500 bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md select-none pointer-events-none">
          {isMac ? '⌘ K' : 'Ctrl K'}
        </kbd>
      </div>
    </form>
  );
}
