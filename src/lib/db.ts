import Dexie, { type Table } from 'dexie';
import type { MetricsRaw, MetricsDerived } from './formulas';

export interface MetricsRow {
  key: string;             // `${date}|${userId}`
  date: string;            // "YYYY-MM-DD" Kyiv
  userId: number;
  raw: MetricsRaw;
  derived: MetricsDerived;
  syncedAt: string;        // ISO
}

export interface MemberRow {
  id: number;
  name: string;
}

export interface MetaRow {
  id: 1;
  lastMetricsSyncAt?: string;
  lastMembersSyncAt?: string;
  syncedDates?: string[];
}

class OmMetricsDb extends Dexie {
  metrics!: Table<MetricsRow, string>;
  members!: Table<MemberRow, number>;
  meta!: Table<MetaRow, number>;

  constructor() {
    super('om-metrics');
    this.version(1).stores({
      metrics: 'key, date, userId',
      members: 'id',
      meta: 'id',
    });
  }
}

export const db = new OmMetricsDb();

export async function upsertMetrics(rows: MetricsRow[]): Promise<void> {
  if (rows.length === 0) return;
  await db.metrics.bulkPut(rows);
}

export async function upsertMembers(members: MemberRow[]): Promise<void> {
  if (members.length === 0) return;
  await db.members.bulkPut(members);
}

/**
 * Returns all metrics with date >= (today - windowDays + 1) in Kyiv-day terms,
 * sorted by date desc then userId.
 */
export async function getMetricsForWindow(windowDays: number): Promise<MetricsRow[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (windowDays - 1));
  const cutoff = cutoffDate.toISOString().slice(0, 10);
  const all = await db.metrics.where('date').aboveOrEqual(cutoff).toArray();
  return all.sort((a, b) => (b.date.localeCompare(a.date) || a.userId - b.userId));
}

export async function pruneOlderThan(keepDays: number): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  await db.metrics.where('date').below(cutoffStr).delete();
}

export async function getMeta(): Promise<MetaRow> {
  const m = await db.meta.get(1);
  return m ?? { id: 1 };
}

export async function updateMeta(patch: Partial<Omit<MetaRow, 'id'>>): Promise<void> {
  const existing = await getMeta();
  await db.meta.put({ ...existing, ...patch, id: 1 });
}

export async function clearAll(): Promise<void> {
  await db.transaction('rw', db.metrics, db.members, db.meta, async () => {
    await db.metrics.clear();
    await db.members.clear();
    await db.meta.clear();
  });
}
