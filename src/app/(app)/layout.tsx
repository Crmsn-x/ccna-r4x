'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItem {
  name: string;
  href: string;
  badge?: string;
  icon: (active: boolean) => React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: 'Overview',
    href: '/',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Question Bank',
    href: '/bank',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    name: 'Practice',
    href: '/practice',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    name: 'Practical Labs',
    href: '/labs',
    badge: 'Upcoming',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  {
    name: 'Review',
    href: '/review',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Progress',
    href: '/progress',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Manage',
    href: '/manage',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex md:w-64 flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] text-[var(--text-sidebar)] select-none shrink-0"
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[var(--border-sidebar)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <h1 className="font-bold text-lg tracking-tight text-white">CCNA Revise</h1>
            </div>
            <p className="text-[11px] text-[var(--text-sidebar-muted)] mt-0.5 font-mono">
              200-301 • Private PC Edition
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                id={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-sidebar)] hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon(active)}
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Status Footer */}
        <div className="p-4 border-t border-[var(--border-sidebar)] text-[11px] text-[var(--text-sidebar-muted)] space-y-1.5 font-mono">
          <div className="flex items-center justify-between">
            <span>Storage:</span>
            <span className="text-emerald-400 font-semibold">Atomic JSON</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Network:</span>
            <span className="text-slate-300">127.0.0.1 (Loopback)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Timezone:</span>
            <span className="text-slate-300">Africa/Harare</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--bg-sidebar)] text-[var(--text-sidebar)] border-b border-[var(--border-sidebar)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span className="font-bold text-base text-white">CCNA Revise</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-page)] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Compact Navigation Bar (Overview, Bank, Practice, More) */}
        <nav
          className="md:hidden flex items-center justify-around border-t border-[var(--border)] bg-[var(--bg-panel)] py-2 px-1 select-none"
          aria-label="Mobile Bottom Navigation"
        >
          {navItems.slice(0, 3).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
                  active ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-secondary)]'
                }`}
              >
                {item.icon(active)}
                <span>{item.name}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            id="mobile-more-btn"
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* Mobile "More" Drawer/Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--bg-panel)] border-t border-[var(--border)] rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="font-bold text-base">All Modules</h2>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-lg text-sm font-medium ${
                      active ? 'bg-[var(--accent)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon(active)}
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
