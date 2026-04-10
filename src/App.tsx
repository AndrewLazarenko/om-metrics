import { useCallback, useEffect } from 'react';
import { Landing } from '@/components/Landing';
import { Dashboard } from '@/components/Dashboard';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/hooks/useTheme';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useAutoSync } from '@/hooks/useAutoSync';
import { useVisibilitySync } from '@/hooks/useVisibilitySync';
import { initialSync, incrementalSync } from '@/lib/sync';
import { getMeta } from '@/lib/db';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  useTheme();
  useHotkeys();

  const token = useAppStore(s => s.token);
  const settings = useAppStore(s => s.settings);
  const setSyncing = useAppStore(s => s.setSyncing);
  const setSyncProgress = useAppStore(s => s.setSyncProgress);
  const setSyncError = useAppStore(s => s.setSyncError);
  const setLastSyncAt = useAppStore(s => s.setLastSyncAt);
  const clearTokenAction = useAppStore(s => s.clearTokenAction);

  // Hydrate lastSyncAt from IDB meta on boot so the header chip shows
  // a real age even before the next sync runs.
  useEffect(() => {
    if (!token) return;
    (async () => {
      const meta = await getMeta();
      if (meta.lastMetricsSyncAt) setLastSyncAt(meta.lastMetricsSyncAt);
    })();
  }, [token, setLastSyncAt]);

  const runInitialSync = useCallback(async () => {
    if (!token) return;
    if (useAppStore.getState().syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await initialSync({
        token,
        settings: { shiftHours: settings.shiftHours, commissionRate: settings.commissionRate },
        onProgress: p => setSyncProgress(p),
      });
      setLastSyncAt(new Date().toISOString());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSyncError(msg);
      if (/40[13]/.test(msg)) clearTokenAction();
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }, [token, settings, setSyncing, setSyncError, setSyncProgress, setLastSyncAt, clearTokenAction]);

  const runIncrementalSync = useCallback(async () => {
    if (!token) return;
    if (useAppStore.getState().syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await incrementalSync({
        token,
        settings: { shiftHours: settings.shiftHours, commissionRate: settings.commissionRate },
        onProgress: p => setSyncProgress(p),
      });
      setLastSyncAt(new Date().toISOString());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSyncError(msg);
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }, [token, settings, setSyncing, setSyncError, setSyncProgress, setLastSyncAt]);

  useAutoSync(runInitialSync, runIncrementalSync);
  useVisibilitySync(runIncrementalSync);

  if (!token) {
    return (
      <TooltipProvider>
        <Landing />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Dashboard onRefresh={runIncrementalSync} />
    </TooltipProvider>
  );
}
