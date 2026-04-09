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
      const age = Date.now() - last;
      if (age > OM_CONFIG.AUTO_SYNC_THRESHOLD_MS || last === 0) {
        try { await run(); } catch (e) { console.error('auto sync failed', e); }
      }
    })();
  }, [token, run]);
}
