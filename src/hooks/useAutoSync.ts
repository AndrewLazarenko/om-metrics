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
      const age = Date.now() - last;
      if (age > OM_CONFIG.AUTO_SYNC_THRESHOLD_MS) {
        try { await runIncremental(); } catch (e) { console.error('auto sync failed', e); }
      }
    })();
  }, [token, runInitial, runIncremental]);
}
