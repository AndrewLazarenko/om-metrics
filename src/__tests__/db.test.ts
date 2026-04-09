import { describe, it, expect, beforeEach } from 'vitest';
import { db, upsertMetrics, upsertMembers, getMetricsForWindow, clearAll, updateMeta, getMeta, type MetricsRow } from '@/lib/db';

function row(date: string, userId: number, sales = 100): MetricsRow {
  return {
    key: `${date}|${userId}`,
    date,
    userId,
    raw: {
      tips_amount_sum: 0,
      sold_messages_price_sum: sales,
      fans_count: 10,
      messages_count: 100,
      reply_time_avg: 60,
      media_messages_count: 1,
      paid_messages_count: 5,
      sold_messages_count: 2,
      internal_templates_count: 0,
      copied_messages_count: 0,
      paid_messages_price_sum: 50,
      words_count_sum: 500,
      ai_generated_messages_count: 0,
    },
    derived: {
      grossSales: sales,
      sales: sales * 0.8,
      msgPerHour: 100 / 6,
      chatPerHour: 10 / 6,
      replyMinutes: 1,
      openRate: 0.4,
      avgPriceSent: 10,
      avgPriceSold: 25,
    },
    syncedAt: new Date().toISOString(),
  };
}

describe('db', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('bulkPut inserts and returns via getMetricsForWindow', async () => {
    await upsertMetrics([row('2026-04-09', 1001), row('2026-04-08', 1001)]);
    const rows = await getMetricsForWindow(7);
    expect(rows.length).toBe(2);
  });

  it('upsert overwrites existing key', async () => {
    await upsertMetrics([row('2026-04-09', 1001, 100)]);
    await upsertMetrics([row('2026-04-09', 1001, 500)]);
    const rows = await getMetricsForWindow(30);
    expect(rows).toHaveLength(1);
    expect(rows[0].derived.grossSales).toBe(500);
  });

  it('getMetricsForWindow filters out dates older than N days', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const eight = new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10);
    await upsertMetrics([row(today, 1001), row(eight, 1001)]);
    const rows = await getMetricsForWindow(7);
    expect(rows.some(r => r.date === today)).toBe(true);
    expect(rows.some(r => r.date === eight)).toBe(false);
  });

  it('upsertMembers and name lookup', async () => {
    await upsertMembers([{ id: 1001, name: 'Alice' }, { id: 1002, name: 'Bob' }]);
    const all = await db.members.toArray();
    expect(all).toHaveLength(2);
  });

  it('meta read/write roundtrip', async () => {
    const iso = new Date().toISOString();
    await updateMeta({ lastMetricsSyncAt: iso });
    const meta = await getMeta();
    expect(meta.lastMetricsSyncAt).toBe(iso);
  });

  it('clearAll wipes tables', async () => {
    await upsertMetrics([row('2026-04-09', 1001)]);
    await upsertMembers([{ id: 1001, name: 'Alice' }]);
    await clearAll();
    expect(await db.metrics.count()).toBe(0);
    expect(await db.members.count()).toBe(0);
  });
});
