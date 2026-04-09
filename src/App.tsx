import { useCallback } from 'react';
import { Landing } from '@/components/Landing';
import { Dashboard } from '@/components/Dashboard';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/hooks/useTheme';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useAutoSync } from '@/hooks/useAutoSync';
import { initialSync, incrementalSync } from '@/lib/sync';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  useTheme();
  useHotkeys();

  const token = useAppStore(s => s.token);
  const settings = useAppStore(s => s.settings);
  const setSyncing = useAppStore(s => s.setSyncing);
  const setSyncProgress = useAppStore(s => s.setSyncProgress);
  const setSyncError = useAppStore(s => s.setSyncError);
  const clearTokenAction = useAppStore(s => s.clearTokenAction);

  const runInitialSync = useCallback(async () => {
    if (!token) return;
    if (useAppStore.getState().syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await initialSync({
        token,
        windowDays: settings.windowDays,
        settings: { shiftHours: settings.shiftHours, commissionRate: settings.commissionRate },
        onProgress: p => setSyncProgress(p),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSyncError(msg);
      if (/40[13]/.test(msg)) clearTokenAction();
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }, [token, settings, setSyncing, setSyncError, setSyncProgress, clearTokenAction]);

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
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSyncError(msg);
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }, [token, settings, setSyncing, setSyncError, setSyncProgress]);

  useAutoSync(runIncrementalSync);

  if (!token) {
    return (
      <TooltipProvider>
        <Landing onTokenAccepted={runInitialSync} />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Dashboard onRefresh={runIncrementalSync} />
    </TooltipProvider>
  );
}
