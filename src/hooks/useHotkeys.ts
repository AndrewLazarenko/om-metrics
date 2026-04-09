import { useEffect } from 'react';

/**
 * Base keyboard shortcuts:
 * - `/` focuses the chatter search. If the chatter popover is already open,
 *   jump directly to its `[data-hotkey="search"]` input. Otherwise click the
 *   `[data-hotkey="open-search"]` trigger, which opens the popover — the
 *   autoFocus prop on the inner Input then takes care of focusing.
 * - Esc is handled by Radix popovers/dialogs natively.
 */
export function useHotkeys(): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== '/') return;
      // Don't hijack `/` while the user is typing in an input/textarea.
      const tgt = e.target as HTMLElement | null;
      if (tgt instanceof HTMLInputElement || tgt instanceof HTMLTextAreaElement || tgt?.isContentEditable) {
        return;
      }
      const search = document.querySelector<HTMLInputElement>('[data-hotkey="search"]');
      if (search) {
        e.preventDefault();
        search.focus();
        return;
      }
      const trigger = document.querySelector<HTMLButtonElement>('[data-hotkey="open-search"]');
      if (trigger) {
        e.preventDefault();
        trigger.click();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
