'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Start false on SSR and client first render to avoid hydration mismatch, sync preference in useEffect
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const pathname = usePathname();
  const isPracticeSetup = pathname === '/practice';

  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('collapsed') === 'true') {
        setCollapsed(true);
      } else if (params.get('collapsed') === 'false') {
        setCollapsed(false);
      } else if (localStorage.getItem('ccna_sidebar_collapsed') === 'true') {
        setCollapsed(true);
      }
      if (params.get('mobileDrawer') === 'true') {
        setMobileOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ccna_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCloseMobile = () => {
    setMobileOpen(false);
    hamburgerRef.current?.focus();
  };

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Shared Application Sidebar (Desktop Fixed + Mobile Drawer) */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
      />

      {/* Main Content Area - Offsets exactly by sidebar width (266px expanded, 76px collapsed) */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-[padding-left] duration-[180ms] ease-in-out motion-reduce:transition-none ${
          collapsed ? 'md:pl-[76px]' : 'md:pl-[266px]'
        }`}
      >
        {/* Mobile Header (< 768px) with drawer trigger */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--bg-sidebar)] text-[var(--text-sidebar)] border-b border-[var(--border-sidebar)] shrink-0">
          <div className="flex items-center gap-3">
            <button
              ref={hamburgerRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF]"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <Image
                src="/4blue.png"
                alt="ccna revise"
                width={26}
                height={26}
                className="w-[26px] h-[26px] object-contain shrink-0"
              />
              <span className="font-bold text-base text-[var(--text-heading)]">ccna revise</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body - left edge offset matches approved reference */}
        <main
          className={`flex-1 bg-[var(--bg-page)] w-full min-w-0 ${
            isPracticeSetup
              ? 'flex flex-col min-h-0 overflow-y-auto md:overflow-hidden pl-6 sm:pl-[41px] pr-6 sm:pr-[36px]'
              : 'overflow-y-auto pt-[36px] pb-10 pl-6 sm:pl-[41px] pr-6 sm:pr-[36px]'
          }`}
        >
          <div className={`w-full ${isPracticeSetup ? 'flex-1 flex flex-col min-h-0 h-full' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
