import { useAppStore } from '@/lib/store';

export function SyncProgressBar() {
  const syncing = useAppStore(s => s.syncing);
  const progress = useAppStore(s => s.syncProgress);

  if (!syncing || !progress) return null;
  const pct = progress.total === 0 ? 0 : Math.round((progress.completed / progress.total) * 100);

  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="px-4 py-1 text-xs text-slate-500">
        {progress.label} — {progress.completed}/{progress.total}
      </div>
    </div>
  );
}
