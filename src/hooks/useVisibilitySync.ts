import { useEffect } from 'react';
import { OM_CONFIG } from '@/lib/config';
import { useAppStore } from '@/lib/store';

type Runner = () => Promise<void>;

/**
 * Fire a silent incremental sync whenever the tab becomes visible again
 * and the last sync is older than VISIBILITY_SYNC_THRESHOLD_MS (5 min).
 *
 * Designed for the "I alt-tab back after a meeting" case — the user
 * doesn't have to hit refresh themselves, and at the same time we don't
 * hammer the API when they're rapidly switching tabs.
 *
 * Guards:
 * - noop if no token
 * - noop if a sync is already running
 * - noop if the last sync is younger than the threshold
 * - noop during page hiding (we only act on "visible" transitions)
 */
export function useVisibilitySync(runIncremental: Runner): void {
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const state = useAppStore.getState();
      if (!state.token) return;
      if (state.syncing) return;
      const last = state.lastSyncAt ? new Date(state.lastSyncAt).getTime() : 0;
      const age = Date.now() - last;
      if (last > 0 && age < OM_CONFIG.VISIBILITY_SYNC_THRESHOLD_MS) return;
      runIncremental().catch(e => console.error('visibility sync failed', e));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [runIncremental]);
}
