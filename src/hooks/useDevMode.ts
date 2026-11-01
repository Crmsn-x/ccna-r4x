'use client';

import { useSyncExternalStore, useMemo } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('ccna_dev_mode_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('ccna_dev_mode_change', callback);
  };
}

function getDevModeSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('ccna_dev_mode') === 'true';
  } catch {
    return false;
  }
}

function getDevModeServerSnapshot(): boolean {
  return false;
}

export function useDevMode(): [boolean, (enabled: boolean) => void] {
  const isDev = useSyncExternalStore(subscribe, getDevModeSnapshot, getDevModeServerSnapshot);

  const setDev = (enabled: boolean) => {
    try {
      localStorage.setItem('ccna_dev_mode', enabled ? 'true' : 'false');
      window.dispatchEvent(new Event('ccna_dev_mode_change'));
    } catch {
      // ignore
    }
  };

  return [isDev, setDev];
}

export interface CustomCourseModule {
  id: string;
  name: string;
  topicIds: string[];
}

function getCustomModulesSnapshot(): string {
  if (typeof window === 'undefined') return '[]';
  try {
    return localStorage.getItem('ccna_custom_modules') || '[]';
  } catch {
    return '[]';
  }
}

function getCustomModulesServerSnapshot(): string {
  return '[]';
}

export function useCustomModules(): [
  CustomCourseModule[],
  (modules: CustomCourseModule[]) => void
] {
  const raw = useSyncExternalStore(subscribe, getCustomModulesSnapshot, getCustomModulesServerSnapshot);

  const modules = useMemo<CustomCourseModule[]>(() => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, [raw]);

  const setModules = (newModules: CustomCourseModule[]) => {
    try {
      localStorage.setItem('ccna_custom_modules', JSON.stringify(newModules));
      window.dispatchEvent(new Event('ccna_dev_mode_change'));
    } catch {
      // ignore
    }
  };

  return [modules, setModules];
}
