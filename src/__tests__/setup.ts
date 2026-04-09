import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 22+ has an experimental built-in `localStorage` that activates when
// `--localstorage-file` is passed (even without a valid path). It can shadow
// jsdom's localStorage and its `.clear()` may be broken/missing. Force a
// clean, spec-compliant in-memory Storage polyfill so tests behave
// identically on Node 18/20/22 and across CI + local macOS.
const store = new Map<string, string>();
const mockStorage: Storage = {
  get length() {
    return store.size;
  },
  clear: () => {
    store.clear();
  },
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  key: (i: number) => Array.from(store.keys())[i] ?? null,
  removeItem: (k: string) => {
    store.delete(k);
  },
  setItem: (k: string, v: string) => {
    store.set(k, String(v));
  },
};

function installMockStorage(target: object) {
  try {
    Object.defineProperty(target, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  } catch {
    // ignore — some environments lock the property, jsdom's usually doesn't
  }
}

installMockStorage(globalThis);
if (typeof window !== 'undefined') {
  installMockStorage(window);
}

afterEach(() => {
  cleanup();
  store.clear();
});
