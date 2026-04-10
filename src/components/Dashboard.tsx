import { useMemo } from 'react';
import { Header } from './Header';
import { SyncProgressBar } from './SyncProgressBar';
import { ChatterSelector } from './ChatterSelector';
import { PeriodSwitcher } from './PeriodSwitcher';
import { MoneyTable } from './MoneyTable';
import { ActivityTable } from './ActivityTable';
import { useAppStore } from '@/lib/store';
import { useMetricsWindow, useMembers } from '@/hooks/useMetricsWindow';
import { toDerived } from '@/lib/formulas';
import type { MetricsRow } from '@/lib/db';

interface Props { onRefresh: () => Promise<void> }

export function Dashboard({ onRefresh }: Props) {
  const settings = useAppStore(s => s.settings);
  const selectedUserId = useAppStore(s => s.selectedUserId);
  const setSelectedUserId = useAppStore(s => s.setSelectedUserId);
  const setWindowDays = useAppStore(s => s.setWindowDays);

  const allRows = useMetricsWindow(settings.windowDays);
  const members = useMembers();

  const rowsForChatter: MetricsRow[] = useMemo(() => {
    const filtered = selectedUserId == null
      ? aggregateByDate(allRows)
      : allRows.filter(r => r.userId === selectedUserId);
    // Always newest first
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date))
      // Recompute derived live if shiftHours / commissionRate changed without re-sync
      .map(r => ({ ...r, derived: toDerived(r.raw, settings) }));
  }, [allRows, selectedUserId, settings]);

  return (
    <div className="min-h-screen">
      <Header onRefresh={() => void onRefresh()} />
      <SyncProgressBar />

      <div className="sticky top-14 z-20 flex items-center justify-between gap-4 border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
        <ChatterSelector
          chatters={members}
          selectedId={selectedUserId}
          onSelect={setSelectedUserId}
        />
        <PeriodSwitcher value={settings.windowDays} onChange={setWindowDays} />
      </div>

      <main className="grid gap-6 px-4 py-6 lg:grid-cols-2">
        {/*
          Grid item sizing notes (don't remove without testing in Safari):
          - `min-w-0` lets the child `overflow-x-auto` wrapper actually scroll
            horizontally instead of forcing the grid cell to expand past the
            viewport. Without it, at ~90% zoom in Chrome the MoneyTable gets
            clipped on the left because the grid overflows.
          - `w-full` is required for Safari: with few data rows the table's
            intrinsic width is less than the track, and Safari fails to apply
            `align-items: stretch` to the grid item, leaving the section
            collapsed to its content width. This makes the two columns visually
            uneven (one shorter than the other). Chrome stretches by default.
            Forcing `width: 100%` makes Safari behave the same as Chrome.
        */}
        <section className="w-full min-w-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Деньги</h2>
          <MoneyTable rows={rowsForChatter} />
        </section>
        <section className="w-full min-w-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Активность</h2>
          <ActivityTable rows={rowsForChatter} />
        </section>
      </main>
    </div>
  );
}

/**
 * When no chatter is selected, sum all chatters per date
 * so the tables still show one row per day.
 */
function aggregateByDate(rows: MetricsRow[]): MetricsRow[] {
  const byDate = new Map<string, MetricsRow>();
  for (const r of rows) {
    const existing = byDate.get(r.date);
    if (!existing) {
      byDate.set(r.date, { ...r, userId: 0, key: `${r.date}|ALL`, raw: { ...r.raw } });
      continue;
    }
    const addedRaw = { ...existing.raw } as Record<string, number>;
    for (const k of Object.keys(r.raw) as (keyof typeof r.raw)[]) {
      const v = Number((r.raw as Record<string, unknown>)[k]) || 0;
      addedRaw[k as string] = (Number(addedRaw[k as string]) || 0) + v;
    }
    byDate.set(r.date, { ...existing, raw: addedRaw as typeof r.raw });
  }
  return Array.from(byDate.values());
}
