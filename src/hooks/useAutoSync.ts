import { useEffect, useRef } from 'react';
import { getMeta } from '@/lib/db';
import { OM_CONFIG } from '@/lib/config';
import { useAppStore } from '@/lib/store';

type Runner = () => Promise<void>;

/**
 * Single source of truth for background-driven syncs.
 *
 * Behavior:
 * - If no prior sync exists (first run after token entered) → runInitial.
 *   This replaces Landing.onTokenAccepted's old call path which suffered
 *   from a stale-closure bug (the prop was captured when token was null,
 *   and the underlying useCallback early-returned because of that).
 * - If prior sync exists but covers fewer than KEEP_DAYS days → runInitial.
 *   This handles users who first synced under the old behavior where
 *   initialSync fetched only `windowDays` days (e.g. 7). Now we always
 *   backfill to the full KEEP_DAYS window so switching periods in the UI
 *   shows real data instead of empty tails.
 * - If prior sync exists and is older than AUTO_SYNC_THRESHOLD_MS → runIncremental.
 * - Otherwise → no-op.
 *
 * The effect is gated by a ref so it fires at most once per token lifecycle.
 * Reset the ref when token clears so that re-entering a token triggers a new
 * initial sync.
 */
export function useAutoSync(runInitial: Runner, runIncremental: Runner): void {
  const token = useAppStore(s => s.token);
  const triggered = useRef(false);

  useEffect(() => {
    if (!token) {
      triggered.current = false;
      return;
    }
    if (triggered.current) return;
    triggered.current = true;
    (async () => {
      const meta = await getMeta();
      const last = meta.lastMetricsSyncAt ? new Date(meta.lastMetricsSyncAt).getTime() : 0;
      if (last === 0) {
        try { await runInitial(); } catch (e) { console.error('initial sync failed', e); }
        return;
      }
      // Backfill: if the last initial didn't cover the full KEEP_DAYS window
      // (e.g. user first synced when initialSync respected windowDays=7),
      // re-run initial to fetch the missing days.
      const covered = meta.syncedDates?.length ?? 0;
      if (covered < OM_CONFIG.KEEP_DAYS) {
        try { await runInitial(); } catch (e) { console.error('backfill initial sync failed', e); }
        return;
      }
      const age = Date.now() - last;
      if (age > OM_CONFIG.AUTO_SYNC_THRESHOLD_MS) {
        try { await runIncremental(); } catch (e) { console.error('auto sync failed', e); }
      }
    })();
  }, [token, runInitial, runIncremental]);
}
