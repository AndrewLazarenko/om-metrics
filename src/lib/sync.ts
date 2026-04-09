import { OM_CONFIG } from './config';
import { fetchAllMembers, fetchMetricsRange } from './om-api';
import { getKyivDayRange, type DayRange } from './kyiv-dates';
import { toDerived, type FormulaSettings, type MetricsRaw } from './formulas';
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
 * Full initial sync: members + KEEP_DAYS days of metrics (newest → oldest).
 * Always fetches the maximum window so switching `windowDays` in the UI never
 * requires a re-sync — the UI just filters what's already in IDB.
 * Emits progress after each day.
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
  onProgress?.({ label: 'Список чатеров загружен', completed, total: totalSteps, done: false });

  const syncedDates: string[] = [];
  for (let i = 0; i < daysToFetch; i++) {
    const range = getKyivDayRange(i);
    onProgress?.({ label: `Загрузка метрик: ${range.day}`, completed, total: totalSteps, done: false });
    const items = await fetchMetricsRange(token, range.from, range.to);
    await upsertMetrics(rowsFromDay(range, items, settings));
    syncedDates.push(range.day);
    completed++;
    onProgress?.({ label: `Готово: ${range.day}`, completed, total: totalSteps, done: false });
  }

  await pruneOlderThan(OM_CONFIG.KEEP_DAYS);
  await updateMeta({ lastMetricsSyncAt: new Date().toISOString(), syncedDates });
  onProgress?.({ label: 'Готово', completed: totalSteps, total: totalSteps, done: true });
}

/**
 * Re-fetches the last BACKFILL_DAYS days to upsert any changes / late data,
 * and refreshes the members list (so newly added/removed chatters show up).
 * Does not touch older records, does not prune.
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

  for (let i = 0; i < days; i++) {
    const range = getKyivDayRange(i);
    onProgress?.({ label: `Обновление: ${range.day}`, completed, total, done: false });
    const items = await fetchMetricsRange(token, range.from, range.to);
    await upsertMetrics(rowsFromDay(range, items, settings));
    completed++;
  }

  await updateMeta({ lastMetricsSyncAt: new Date().toISOString() });
  onProgress?.({ label: 'Обновлено', completed, total, done: true });
}
