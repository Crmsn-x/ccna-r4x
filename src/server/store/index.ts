import { JsonStore } from './jsonStore.ts';
import type { Store } from './types.ts';

declare global {
  var __ccna_revise_store__: Store | undefined;
}

export function getStore(): Store {
  if (!globalThis.__ccna_revise_store__) {
    globalThis.__ccna_revise_store__ = new JsonStore();
  }
  return globalThis.__ccna_revise_store__;
}

export const store: Store = getStore();
export * from './types.ts';
