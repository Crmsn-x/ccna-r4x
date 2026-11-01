'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

type ThemeMode = 'light' | 'dark' | 'system';

// 1. Overview Icon: Outline house with pitched roof, rectangular body, centred doorway
function OverviewIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-[26px] h-[26px] shrink-0 transition-colors ${
        active ? 'text-[var(--sidebar-active-text)]' : 'text-[var(--sidebar-icon-color)]'
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5" />
      <path d="M10 21v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
    </svg>
  );
}

// 2. Question Bank Icon: Upright document, folded corner, short horizontal marks, square detail
function BankIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-[26px] h-[26px] shrink-0 transition-colors ${
        active ? 'text-[var(--sidebar-active-text)]' : 'text-[var(--sidebar-icon-color)]'
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h8.5L19 7.5V20a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M14 3v5h5" />
      <rect x="8" y="11" width="2.5" height="2.5" rx="0.5" stroke="currentColor" strokeWidth={1.5} />
      <path d="M13.5 12.25h2.5M8 16h8" />
    </svg>
  );
}

// 3. Practice Icon: Simple outlined right-pointing play triangle. No enclosing circle.
function PracticeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-[26px] h-[26px] shrink-0 transition-colors ${
        active ? 'text-[var(--sidebar-active-text)]' : 'text-[var(--sidebar-icon-color)]'
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 5.5l12 6.5-12 6.5V5.5z" />
    </svg>
  );
}

// 4. Review Icon: Four narrow vertical chart strokes of different heights. No enclosing box.
function ReviewIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-[26px] h-[26px] shrink-0 transition-colors ${
        active ? 'text-[var(--sidebar-active-text)]' : 'text-[var(--sidebar-icon-color)]'
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 19v-4M10 19v-9M15 19v-13M20 19v-7" />
    </svg>
  );
}

// 5. Progress Icon: Outline pie chart, with upper-right quarter clearly separated. Not a clock.
function ProgressIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-[26px] h-[26px] shrink-0 transition-colors ${
        active ? 'text-[var(--sidebar-active-text)]' : 'text-[var(--sidebar-icon-color)]'
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4v9h9a9 9 0 11-9-9z" />
      <path d="M15 2.5a9 9 0 016.5 6.5H15V2.5z" />
    </svg>
  );
}

// 6. Practical Labs Icon: Outline laboratory flask with narrow neck, sloping shoulders, horizontal liquid line
function LabsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-[26px] h-[26px] shrink-0 transition-colors ${
        active ? 'text-[var(--sidebar-active-text)]' : 'text-[var(--sidebar-icon-color)]'
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 3h4M10 3v5L5.5 17.5A2 2 0 007.2 20h9.6a2 2 0 001.7-2.5L14 8V3" />
      <path d="M7.5 14h9" />
    </svg>
  );
}

// 7. Settings Icon: Outline cog with small circular centre
function SettingsIcon() {
  return (
    <svg
      className="w-[26px] h-[26px] shrink-0 text-[var(--sidebar-icon-color)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

// 8. Appearance Icon: Outline sun in light mode, moon in dark mode
// Uses CSS-based display toggling (dark:hidden / dark:block) to guarantee 100% hydration matching
function AppearanceIcon() {
  return (
    <>
      <svg
        className="w-[26px] h-[26px] shrink-0 text-[var(--sidebar-icon-color)] dark:hidden block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg
        className="w-[26px] h-[26px] shrink-0 text-[var(--sidebar-icon-color)] dark:block hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </>
  );
}

const navItems = [
  { name: 'Overview', href: '/', icon: OverviewIcon, topPx: 132 },
  { name: 'Question bank', href: '/bank', icon: BankIcon, topPx: 189 },
  { name: 'Practice', href: '/practice', icon: PracticeIcon, topPx: 246 },
  { name: 'Review', href: '/review', icon: ReviewIcon, topPx: 303 },
  { name: 'Progress', href: '/progress', icon: ProgressIcon, topPx: 360 },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  // Appearance popup state - initialize with stable default to prevent hydration mismatch
  const [appearanceMenuOpen, setAppearanceMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const urlTheme = new URLSearchParams(window.location.search).get('theme');
      if (urlTheme === 'dark' || urlTheme === 'light' || urlTheme === 'system') {
        setThemeMode(urlTheme as ThemeMode);
        if (urlTheme === 'system') {
          setResolvedTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        } else {
          setResolvedTheme(urlTheme as 'light' | 'dark');
        }
        return;
      }
      const savedMode = (localStorage.getItem('ccna_theme_mode') ||
        localStorage.getItem('ccna_theme') ||
        'light') as ThemeMode;
      setThemeMode(savedMode);
      if (savedMode === 'system') {
        setResolvedTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(savedMode === 'dark' ? 'dark' : 'light');
      }
    } catch {
      // ignore
    }
  }, []);

  const appearanceBtnRef = useRef<HTMLButtonElement>(null);
  const appearanceMenuRef = useRef<HTMLDivElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

  // Floating tooltip state for collapsed sidebar (shows title ONLY when hovering directly on an icon)
  const [hoveredTooltip, setHoveredTooltip] = useState<{ title: string; top: number } | null>(null);

  const handleIconMouseEnter = (title: string, e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
    if (!collapsed || appearanceMenuOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      title,
      top: rect.top + rect.height / 2,
    });
  };

  const handleIconMouseLeave = () => {
    setHoveredTooltip(null);
  };

  // Listen to OS system color-scheme changes when in system mode
  useEffect(() => {
    try {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = () => {
        const mode = localStorage.getItem('ccna_theme_mode');
        if (mode === 'system') {
          const current = mql.matches ? 'dark' : 'light';
          setResolvedTheme(current);
          document.documentElement.setAttribute('data-theme', current);
        }
      };

      mql.addEventListener('change', handleMediaChange);
      return () => mql.removeEventListener('change', handleMediaChange);
    } catch {
      // ignore
    }
  }, []);

  // Handle outside clicks and Escape key for Appearance menu
  useEffect(() => {
    if (!appearanceMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAppearanceMenuOpen(false);
        appearanceBtnRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        appearanceMenuRef.current &&
        !appearanceMenuRef.current.contains(e.target as Node) &&
        !appearanceBtnRef.current?.contains(e.target as Node)
      ) {
        setAppearanceMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [appearanceMenuOpen]);

  // Mobile drawer keyboard accessibility & body scroll lock
  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
        return;
      }

      if (e.key === 'Tab' && mobileDrawerRef.current) {
        const focusables = mobileDrawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const valid = Array.from(focusables).filter((el) => !el.hasAttribute('disabled'));
        if (valid.length === 0) return;
        const first = valid[0];
        const last = valid[valid.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Initial focus on close button
    const timer = setTimeout(() => {
      const closeBtn = mobileDrawerRef.current?.querySelector<HTMLElement>('button[aria-label="Close menu"]');
      closeBtn?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [mobileOpen, onCloseMobile]);

  const applyThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    setAppearanceMenuOpen(false);
    try {
      localStorage.setItem('ccna_theme_mode', mode);
      localStorage.setItem('ccna_theme', mode);
      let newTheme = mode;
      if (mode === 'system') {
        newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      setResolvedTheme(newTheme as 'light' | 'dark');
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch {
      // ignore
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* =========================================================================
          DESKTOP FIXED SIDEBAR
          Width: 266px expanded, 76px collapsed
          Background: var(--bg-sidebar), Right border: 1px solid var(--border-sidebar)
          Fixed against left viewport edge at 100dvh
          Overflow visible on outer aside so collapse toggle button isn't clipped
          ========================================================================= */}
      <aside
        id="app-sidebar"
        aria-label="Application Sidebar"
        suppressHydrationWarning
        className={`group/sidebar hidden md:flex flex-col fixed top-0 left-0 h-[100dvh] z-40 bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] select-none box-border transition-[width] duration-[180ms] ease-in-out motion-reduce:transition-none shrink-0 overflow-visible ${
          collapsed ? 'w-[76px]' : 'w-[266px]'
        }`}
      >
        {/* Collapse / Expand Toggle Button centered on right sidebar edge
            24 x 32px, vertical center at y: 61px (top: 45px), right: -12px */}
        <button
          type="button"
          onClick={onToggleCollapse}
          suppressHydrationWarning
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-[12px] top-[45px] w-[24px] h-[32px] bg-[var(--bg-sidebar)] border border-[var(--border-sidebar)] rounded-[6px] flex items-center justify-center cursor-pointer shadow-xs hover:bg-[var(--sidebar-hover-bg)] transition-all opacity-0 group-hover/sidebar:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] z-50"
        >
          {collapsed ? (
            <svg
              className="w-[14px] h-[14px] text-[var(--sidebar-icon-color)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <svg
              className="w-[14px] h-[14px] text-[var(--sidebar-icon-color)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          )}
        </button>

        {/* Inner Scroll Container for Responsive Heights */}
        <div
          onScroll={() => setHoveredTooltip(null)}
          className="w-full h-full flex flex-col overflow-y-auto overflow-x-hidden"
        >
          {/* 1. BRAND ROW
              Top position: 44px, Left position: 38px, Height: 34px
              Visible logo size: 28 x 28px, Gap: 16px
              Wordmark: ccna revise, 28px, weight 700, line-height 34px, letter-spacing -1px */}
          <div
            className={`pt-[44px] h-[78px] flex items-center shrink-0 ${
              collapsed ? 'justify-center px-0' : 'pl-[38px] pr-[20px]'
            }`}
          >
            <div className="flex items-center gap-[16px] h-[34px]">
              <Image
                src="/4blue.png"
                alt="ccna revise"
                width={28}
                height={28}
                className="w-[28px] h-[28px] object-contain shrink-0"
                priority
              />
              {!collapsed && (
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '28px',
                    fontWeight: 700,
                    lineHeight: '34px',
                    letterSpacing: '-1px',
                    color: 'var(--wordmark-color)',
                  }}
                  className="whitespace-nowrap overflow-hidden transition-opacity duration-150"
                >
                  ccna revise
                </span>
              )}
            </div>
          </div>

          {/* 2. MAIN NAVIGATION
              Starts at 132px from top (mt-[54px] after 78px brand area).
              Rows: 50px high, 7px vertical gap.
              Margin-inline: 18px (expanded), Padding-inline: 20px (expanded), Gap: 24px.
              Row width: 230px, Icon left edge: 38px, Label left edge: 88px.
              Collapsed: 52x50px, mx-[12px], centered icons. */}
          <nav
            className="mt-[54px] flex flex-col space-y-[7px] shrink-0"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <div key={item.name} className="relative">
                  <Link
                    href={item.href}
                    id={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-current={active ? 'page' : undefined}
                    onMouseEnter={(e) => handleIconMouseEnter(item.name, e)}
                    onMouseLeave={handleIconMouseLeave}
                    onFocus={(e) => handleIconMouseEnter(item.name, e)}
                    onBlur={handleIconMouseLeave}
                    onClick={handleIconMouseLeave}
                    className={`h-[50px] flex items-center rounded-[8px] transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] focus-visible:ring-offset-2 ${
                      collapsed
                        ? 'w-[52px] mx-[12px] px-0 justify-center'
                        : 'mx-[18px] px-[20px] gap-[24px]'
                    } ${
                      active
                        ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold'
                        : 'text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-hover-bg)] active:bg-[var(--sidebar-pressed-bg)]'
                    }`}
                  >
                    <Icon active={active} />
                    {!collapsed && (
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '18px',
                          fontWeight: active ? 500 : 400,
                          lineHeight: '26px',
                          letterSpacing: '-0.4px',
                        }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* 3. PRACTICAL LABS GROUP
              36px space below Progress (row ends at 410px -> divider at 446px).
              Divider: height 1px, mx-[24px], bg var(--sidebar-divider).
              Row: 27px below divider (top at 474px). Reduced right padding to 6px, gap 18px. */}
          <div className="mt-[36px] shrink-0">
            <div className="h-[1px] mx-[24px] bg-[var(--sidebar-divider)]" />

            <div className="mt-[27px] relative">
              <Link
                href="/labs"
                id="nav-practical-labs"
                aria-current={isActive('/labs') ? 'page' : undefined}
                onMouseEnter={(e) => handleIconMouseEnter('Practical labs', e)}
                onMouseLeave={handleIconMouseLeave}
                onFocus={(e) => handleIconMouseEnter('Practical labs', e)}
                onBlur={handleIconMouseLeave}
                onClick={handleIconMouseLeave}
                className={`h-[50px] flex items-center rounded-[8px] transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] focus-visible:ring-offset-2 ${
                  collapsed
                    ? 'w-[52px] mx-[12px] px-0 justify-center'
                    : 'mx-[18px] pl-[20px] pr-[6px] gap-[18px]'
                } ${
                  isActive('/labs')
                    ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold'
                    : 'text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-hover-bg)] active:bg-[var(--sidebar-pressed-bg)]'
                }`}
              >
                <LabsIcon active={isActive('/labs')} />
                {!collapsed && (
                  <>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: isActive('/labs') ? 500 : 400,
                        lineHeight: '26px',
                        letterSpacing: '-0.4px',
                      }}
                      className="whitespace-nowrap shrink-0"
                    >
                      Practical labs
                    </span>
                    <span
                      style={{
                        borderRadius: '10px',
                        backgroundColor: 'var(--soon-badge-bg)',
                        color: 'var(--soon-badge-text)',
                        fontSize: '12px',
                        fontWeight: 500,
                        lineHeight: '16px',
                      }}
                      className="ml-auto px-[10px] py-[3px] flex items-center justify-center shrink-0 select-none"
                    >
                      Soon
                    </span>
                  </>
                )}
              </Link>
            </div>
          </div>

          {/* 4. LARGE EMPTY SPACE PRESERVED
              Pushes footer to bottom via flex-1 / mt-auto */}
          <div className="flex-1 min-h-[40px]" />

          {/* 5. FOOTER CONTROLS
              Horizontal divider (same style, mx-[24px]).
              Space after divider: 22px.
              Settings row (50px) + Gap 7px + Appearance row (50px).
              Bottom padding: 36px. Divider at 826px for 992px viewport. */}
          <div className="shrink-0 pb-[36px] relative">
            <div className="h-[1px] mx-[24px] bg-[var(--sidebar-divider)]" />

            <div className="mt-[22px] flex flex-col space-y-[7px]">
              {/* Settings Row */}
              <div className="relative">
                <Link
                  href="/manage"
                  id="nav-settings"
                  aria-current={isActive('/manage') ? 'page' : undefined}
                  onMouseEnter={(e) => handleIconMouseEnter('Settings', e)}
                  onMouseLeave={handleIconMouseLeave}
                  onFocus={(e) => handleIconMouseEnter('Settings', e)}
                  onBlur={handleIconMouseLeave}
                  onClick={handleIconMouseLeave}
                  className={`h-[50px] flex items-center rounded-[8px] transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] focus-visible:ring-offset-2 ${
                    collapsed
                      ? 'w-[52px] mx-[12px] px-0 justify-center'
                      : 'mx-[18px] px-[20px] gap-[24px]'
                  } ${
                    isActive('/manage')
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold'
                      : 'text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-hover-bg)] active:bg-[var(--sidebar-pressed-bg)]'
                  }`}
                >
                  <SettingsIcon />
                  {!collapsed && (
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: isActive('/manage') ? 500 : 400,
                        lineHeight: '26px',
                        letterSpacing: '-0.4px',
                      }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      Settings
                    </span>
                  )}
                </Link>
              </div>

              {/* Appearance Row (Button with Popover) */}
              <div className="relative">
                <button
                  ref={appearanceBtnRef}
                  type="button"
                  onClick={() => {
                    setHoveredTooltip(null);
                    setAppearanceMenuOpen((prev) => !prev);
                  }}
                  onMouseEnter={(e) => handleIconMouseEnter('Appearance', e)}
                  onMouseLeave={handleIconMouseLeave}
                  onFocus={(e) => handleIconMouseEnter('Appearance', e)}
                  onBlur={handleIconMouseLeave}
                  id="nav-appearance"
                  suppressHydrationWarning
                  aria-haspopup="true"
                  aria-expanded={appearanceMenuOpen}
                  aria-label="Appearance theme settings"
                  className={`h-[50px] flex items-center rounded-[8px] transition-colors duration-150 ease-in-out cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] focus-visible:ring-offset-2 ${
                    collapsed
                      ? 'w-[52px] mx-[12px] px-0 justify-center'
                      : 'mx-[18px] px-[20px] gap-[24px] w-[calc(100%-36px)]'
                  } ${
                    appearanceMenuOpen
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold'
                      : 'text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-hover-bg)] active:bg-[var(--sidebar-pressed-bg)]'
                  }`}
                >
                  <AppearanceIcon />
                  {!collapsed && (
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: appearanceMenuOpen ? 500 : 400,
                        lineHeight: '26px',
                        letterSpacing: '-0.4px',
                      }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      Appearance
                    </span>
                  )}
                </button>

                {/* Anchored Appearance Menu (Light, Dark, System) */}
                {appearanceMenuOpen && (
                  <div
                    ref={appearanceMenuRef}
                    role="menu"
                    aria-label="Select appearance theme"
                    className={`absolute z-50 bg-[var(--bg-panel)] border border-[var(--border-sidebar)] rounded-xl shadow-xl p-1.5 flex flex-col gap-1 ${
                      collapsed
                        ? 'left-[86px] bottom-0 w-[180px]'
                        : 'left-[18px] bottom-[58px] w-[230px]'
                    }`}
                  >
                    {/* Light Option */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => applyThemeMode('light')}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[15px] font-medium transition-colors cursor-pointer ${
                        themeMode === 'light'
                          ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold'
                          : 'text-[var(--text-primary)] hover:bg-[var(--sidebar-hover-bg)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <svg
                          className="w-4 h-4 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <circle cx="12" cy="12" r="4" />
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                        </svg>
                        <span>Light</span>
                      </div>
                      {themeMode === 'light' && (
                        <svg
                          className="w-4 h-4 text-[var(--sidebar-active-text)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    {/* Dark Option */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => applyThemeMode('dark')}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[15px] font-medium transition-colors cursor-pointer ${
                        themeMode === 'dark'
                          ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold'
                          : 'text-[var(--text-primary)] hover:bg-[var(--sidebar-hover-bg)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <svg
                          className="w-4 h-4 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        </svg>
                        <span>Dark</span>
                      </div>
                      {themeMode === 'dark' && (
                        <svg
                          className="w-4 h-4 text-[var(--sidebar-active-text)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    {/* System Option */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => applyThemeMode('system')}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[15px] font-medium transition-colors cursor-pointer ${
                        themeMode === 'system'
                          ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold'
                          : 'text-[var(--text-primary)] hover:bg-[var(--sidebar-hover-bg)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <svg
                          className="w-4 h-4 text-slate-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                        <span>System</span>
                      </div>
                      {themeMode === 'system' && (
                        <svg
                          className="w-4 h-4 text-[var(--sidebar-active-text)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sleek Floating Icon Tooltip (Visible ONLY when collapsed and hovering directly on an icon) */}
        {collapsed && hoveredTooltip && !appearanceMenuOpen && (
          <div
            style={{ top: `${hoveredTooltip.top}px` }}
            role="tooltip"
            aria-live="polite"
            className="fixed left-[84px] -translate-y-1/2 z-50 pointer-events-none select-none transition-all duration-150 ease-out animate-in fade-in zoom-in-95"
          >
            <div className="relative px-3 py-1.5 rounded-[8px] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] text-[13px] font-medium leading-none tracking-tight shadow-[0_4px_16px_rgba(15,23,42,0.1),0_1px_3px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-[#E2E8F0] dark:border-[#334155] whitespace-nowrap flex items-center">
              {/* Subtle left-pointing caret */}
              <span
                aria-hidden="true"
                className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rotate-45 bg-white dark:bg-[#1E293B] border-l border-b border-[#E2E8F0] dark:border-[#334155]"
              />
              <span className="relative z-10">{hoveredTooltip.title}</span>
            </div>
          </div>
        )}
      </aside>

      {/* =========================================================================
          MOBILE SLIDING DRAWER (< 768px)
          266px width, dimmed backdrop, focus trap, Escape & outside click to close
          ========================================================================= */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          {/* Dimmed Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel (266px width) */}
          <div
            ref={mobileDrawerRef}
            className="relative w-[266px] max-w-[85vw] h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] flex flex-col z-10 shadow-2xl overflow-y-auto"
          >
            {/* Header & Close Button */}
            <div className="pt-[32px] px-[24px] pb-[20px] flex items-center justify-between">
              <div className="flex items-center gap-[16px]">
                <Image
                  src="/4blue.png"
                  alt="ccna revise"
                  width={28}
                  height={28}
                  className="w-[28px] h-[28px] object-contain shrink-0"
                />
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '30px',
                    letterSpacing: '-0.8px',
                    color: 'var(--wordmark-color)',
                  }}
                >
                  ccna revise
                </span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="mt-[20px] px-[16px] flex flex-col space-y-[6px]">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onCloseMobile}
                    aria-current={active ? 'page' : undefined}
                    className={`h-[48px] flex items-center px-[16px] gap-[20px] rounded-[8px] transition-colors ${
                      active
                        ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold'
                        : 'text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-hover-bg)] font-medium'
                    }`}
                  >
                    <Icon active={active} />
                    <span className="text-[17px]">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Divider above Practical Labs */}
            <div className="my-[20px] mx-[20px] border-t border-[var(--sidebar-divider)]" />

            <div className="px-[16px]">
              <Link
                href="/labs"
                onClick={onCloseMobile}
                className="h-[48px] flex items-center px-[16px] gap-[20px] rounded-[8px] text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-hover-bg)] font-medium"
              >
                <LabsIcon active={isActive('/labs')} />
                <span className="text-[17px]">Practical labs</span>
                <span
                  style={{
                    backgroundColor: 'var(--soon-badge-bg)',
                    color: 'var(--soon-badge-text)',
                  }}
                  className="ml-auto px-[10px] py-[3px] rounded-[10px] text-[12px] font-medium flex items-center justify-center select-none"
                >
                  Soon
                </span>
              </Link>
            </div>

            <div className="flex-1" />

            {/* Bottom Controls */}
            <div className="p-[16px] border-t border-[var(--sidebar-divider)] space-y-[6px]">
              <Link
                href="/manage"
                onClick={onCloseMobile}
                className="h-[48px] flex items-center px-[16px] gap-[20px] rounded-[8px] text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-hover-bg)] font-medium"
              >
                <SettingsIcon />
                <span className="text-[17px]">Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  const next = resolvedTheme === 'light' ? 'dark' : 'light';
                  applyThemeMode(next);
                }}
                className="w-full h-[48px] flex items-center px-[16px] gap-[20px] rounded-[8px] text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-hover-bg)] font-medium text-left cursor-pointer"
              >
                <AppearanceIcon />
                <span className="text-[17px]">Appearance</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
