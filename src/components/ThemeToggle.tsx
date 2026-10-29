'use client';

import { useSyncExternalStore } from 'react';

function getThemeSnapshot(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function getServerThemeSnapshot(): 'light' | 'dark' {
  return 'light';
}

function subscribeToTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('ccna_theme', nextTheme);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      id="theme-toggle-btn"
      aria-label={`Switch to ${theme === 'light' ? 'black/crimson dark' : 'light'} theme`}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors text-xs font-medium cursor-pointer"
    >
      {theme === 'light' ? (
        <>
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          <span>Light</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span className="text-[var(--accent)] font-semibold">Dark (Crimson)</span>
        </>
      )}
    </button>
  );
}
