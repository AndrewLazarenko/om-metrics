import { useMemo } from 'react';
import { Header } from './Header';
import { SyncProgressBar } from './SyncProgressBar';
import { ChatterSelector } from './ChatterSelector';
import { PeriodSwitcher } from './PeriodSwitcher';
import { AggregationToggle } from './AggregationToggle';
import { MoneyTable } from './MoneyTable';
import { ActivityTable } from './ActivityTable';
import { useAppStore } from '@/lib/store';
import {
  useMetricsWindow,
  usePreviousMetricsWindow,
  useMembers,
} from '@/hooks/useMetricsWindow';
import { toDerived } from '@/lib/formulas';
import { aggregateByDate } from '@/lib/aggregate';
import type { MetricsRow } from '@/lib/db';

interface Props { onRefresh: () => Promise<void> }

export function Dashboard({ onRefresh }: Props) {
  const settings = useAppStore(s => s.settings);
  const selectedUserId = useAppStore(s => s.selectedUserId);
  const setSelectedUserId = useAppStore(s => s.setSelectedUserId);
  const setWindowDays = useAppStore(s => s.setWindowDays);
  const aggMode = useAppStore(s => s.aggMode);
  const setAggMode = useAppStore(s => s.setAggMode);

  const allRows = useMetricsWindow(settings.windowDays);
  const prevAllRows = usePreviousMetricsWindow(settings.windowDays);
  const members = useMembers();

  const shape = (rows: MetricsRow[]): MetricsRow[] => {
    const filtered = selectedUserId == null
      ? aggregateByDate(rows, aggMode)
      : rows.filter(r => r.userId === selectedUserId);
    // Chronological order: oldest at top, newest just above the Σ/⌀ footer.
    // Reads left-to-right / top-to-bottom like a time series.
    return [...filtered].sort((a, b) => a.date.localeCompare(b.date))
      // Recompute derived live if shiftHours / commissionRate changed without re-sync
      .map(r => ({ ...r, derived: toDerived(r.raw, settings) }));
  };

  const rowsForChatter: MetricsRow[] = useMemo(
    () => shape(allRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRows, selectedUserId, settings, aggMode],
  );
  const prevRowsForChatter: MetricsRow[] = useMemo(
    () => shape(prevAllRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prevAllRows, selectedUserId, settings, aggMode],
  );

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
        <div className="flex items-center gap-2">
          {selectedUserId == null && (
            <AggregationToggle value={aggMode} onChange={setAggMode} />
          )}
          <PeriodSwitcher value={settings.windowDays} onChange={setWindowDays} />
        </div>
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
          <MoneyTable rows={rowsForChatter} prevRows={prevRowsForChatter} />
        </section>
        <section className="w-full min-w-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Активность</h2>
          <ActivityTable rows={rowsForChatter} prevRows={prevRowsForChatter} />
        </section>
      </main>
    </div>
  );
}

