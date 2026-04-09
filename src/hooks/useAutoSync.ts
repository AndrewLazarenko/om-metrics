import { useEffect, useRef } from 'react';
import { getMeta } from '@/lib/db';
import { OM_CONFIG } from '@/lib/config';
import { useAppStore } from '@/lib/store';

type Runner = () => Promise<void>;

/**
 * On mount, if last sync > AUTO_SYNC_THRESHOLD_MS ago, triggers `run` in background.
 */
export function useAutoSync(run: Runner): void {
  const token = useAppStore(s => s.token);
  const triggered = useRef(false);
  useEffect(() => {
    if (!token || triggered.current) return;
    triggered.current = true;
    (async () => {
      const meta = await getMeta();
      const last = meta.lastMetricsSyncAt ? new Date(meta.lastMetricsSyncAt).getTime() : 0;
      // On first-run (no prior sync) we intentionally do NOT auto-sync here —
      // the initial sync is owned by Landing.onTokenAccepted to avoid racing
      // the full initialSync (20 days + members) against an incremental one
      // (7 days, no members). Only auto-sync when we already have data but
      // it's stale.
      if (last === 0) return;
      const age = Date.now() - last;
      if (age > OM_CONFIG.AUTO_SYNC_THRESHOLD_MS) {
        try { await run(); } catch (e) { console.error('auto sync failed', e); }
      }
    })();
  }, [token, run]);
}
