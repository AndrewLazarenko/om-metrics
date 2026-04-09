import { useEffect } from 'react';

/**
 * Base keyboard shortcuts:
 * - `/` focuses the first input with data-hotkey="search"
 * - Esc is handled by Radix dialogs natively
 */
export function useHotkeys(): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        const el = document.querySelector<HTMLInputElement>('[data-hotkey="search"]');
        if (el) {
          e.preventDefault();
          el.focus();
        }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
