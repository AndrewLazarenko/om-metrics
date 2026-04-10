import { OM_CONFIG } from './config';
import { fetchAllMembers, fetchMetricsRange } from './om-api';
import { getKyivDayRange, type DayRange } from './kyiv-dates';
import { toDerived, type FormulaSettings, type MetricsRaw } from './formulas';
import { parallelMap } from './concurrency';
import {
  upsertMetrics,
  upsertMembers,
  updateMeta,
  pruneOlderThan,
  type MetricsRow,
} from './db';

export interface SyncProgress {
  label: string;
  completed: number;
  total: number;
  done: boolean;
}

export interface SyncOptions {
  token: string;
  settings: FormulaSettings;
  onProgress?: (p: SyncProgress) => void;
}

export type InitialSyncOptions = SyncOptions;

function rowsFromDay(range: DayRange, items: MetricsRaw[], settings: FormulaSettings): MetricsRow[] {
  return items.map((raw): MetricsRow => {
    const userId = Number(raw.user_id);
    return {
      key: `${range.day}|${userId}`,
      date: range.day,
      userId,
      raw,
      derived: toDerived(raw, settings),
      syncedAt: new Date().toISOString(),
    };
  });
}

/**
 * Fetch metrics for a list of day ranges in parallel using a bounded
 * concurrency pool. Upserts each day into IDB as soon as it completes,
 * and ticks the progress callback after every finished day.
 *
 * Returns the list of successfully fetched day strings in input order
 * (newest → oldest), so callers can persist `syncedDates` reliably.
 */
async function fetchDaysParallel(
  ranges: DayRange[],
  token: string,
  settings: FormulaSettings,
  onDayFinished: (doneCount: number, total: number) => void,
): Promise<string[]> {
  let finished = 0;
  await parallelMap(
    ranges,
    OM_CONFIG.SYNC_CONCURRENCY,
    async (range) => {
      const items = await fetchMetricsRange(token, range.from, range.to);
      await upsertMetrics(rowsFromDay(range, items, settings));
    },
    () => {
      finished++;
      onDayFinished(finished, ranges.length);
    },
  );
  return ranges.map(r => r.day);
}

/**
 * Full initial sync: members + KEEP_DAYS days of metrics.
 * Always fetches the maximum window so switching `windowDays` in the UI never
 * requires a re-sync — the UI just filters what's already in IDB.
 * Day fetches run in parallel (SYNC_CONCURRENCY at a time) for ~4–5× speedup
 * over the old sequential loop.
 */
export async function initialSync(opts: InitialSyncOptions): Promise<void> {
  const { token, settings, onProgress } = opts;
  const daysToFetch = OM_CONFIG.KEEP_DAYS;
  const totalSteps = daysToFetch + 1; // +1 for members
  let completed = 0;

  onProgress?.({ label: 'Загрузка списка чатеров', completed, total: totalSteps, done: false });
  const members = await fetchAllMembers(token);
  await upsertMembers(members);
  await updateMeta({ lastMembersSyncAt: new Date().toISOString() });
  completed++;
  onProgress?.({
    label: `Загрузка метрик: 0/${daysToFetch}`,
    completed,
    total: totalSteps,
    done: false,
  });

  const ranges = Array.from({ length: daysToFetch }, (_, i) => getKyivDayRange(i));
  const syncedDates = await fetchDaysParallel(
    ranges,
    token,
    settings,
    (done, totalDays) => {
      completed++;
      onProgress?.({
        label: `Загрузка метрик: ${done}/${totalDays}`,
        completed,
        total: totalSteps,
        done: false,
      });
    },
  );

  await pruneOlderThan(OM_CONFIG.KEEP_DAYS);
  await updateMeta({ lastMetricsSyncAt: new Date().toISOString(), syncedDates });
  onProgress?.({ label: 'Готово', completed: totalSteps, total: totalSteps, done: true });
}

/**
 * Re-fetches the last BACKFILL_DAYS days to upsert any changes / late data,
 * and refreshes the members list (so newly added/removed chatters show up).
 * Does not touch older records, does not prune. Day fetches run in parallel.
 */
export async function incrementalSync(opts: SyncOptions): Promise<void> {
  const { token, settings, onProgress } = opts;
  const days = OM_CONFIG.BACKFILL_DAYS;
  const total = days + 1; // +1 for members refresh
  let completed = 0;

  onProgress?.({ label: 'Обновление списка чатеров', completed, total, done: false });
  const members = await fetchAllMembers(token);
  await upsertMembers(members);
  await updateMeta({ lastMembersSyncAt: new Date().toISOString() });
  completed++;

  const ranges = Array.from({ length: days }, (_, i) => getKyivDayRange(i));
  await fetchDaysParallel(
    ranges,
    token,
    settings,
    (done, totalDays) => {
      completed++;
      onProgress?.({
        label: `Обновление: ${done}/${totalDays}`,
        completed,
        total,
        done: false,
      });
    },
  );

  await updateMeta({ lastMetricsSyncAt: new Date().toISOString() });
  onProgress?.({ label: 'Обновлено', completed, total, done: true });
}
