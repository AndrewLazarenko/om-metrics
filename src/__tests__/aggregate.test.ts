import { describe, it, expect } from 'vitest';
import { aggregateByDate } from '../lib/aggregate';
import type { MetricsRow } from '../lib/db';
import type { MetricsRaw, MetricsDerived } from '../lib/formulas';

function makeRow(
  date: string,
  userId: number,
  raw: Partial<MetricsRaw>,
): MetricsRow {
  const emptyDerived: MetricsDerived = {
    grossSales: 0,
    sales: 0,
    msgPerHour: 0,
    chatPerHour: 0,
    replyMinutes: 0,
    openRate: 0,
    avgPriceSent: 0,
    avgPriceSold: 0,
  };
  return {
    key: `${date}|${userId}`,
    date,
    userId,
    raw: raw as MetricsRaw,
    derived: emptyDerived,
    syncedAt: new Date().toISOString(),
  };
}

describe('aggregateByDate', () => {
  const rows: MetricsRow[] = [
    makeRow('2026-04-10', 1, {
      tips_amount_sum: 100,
      sold_messages_price_sum: 200,
      fans_count: 50,
      messages_count: 500,
      reply_time_avg: 30,
      paid_messages_count: 10,
      sold_messages_count: 5,
    }),
    makeRow('2026-04-10', 2, {
      tips_amount_sum: 200,
      sold_messages_price_sum: 400,
      fans_count: 100,
      messages_count: 1000,
      reply_time_avg: 60,
      paid_messages_count: 20,
      sold_messages_count: 10,
    }),
    makeRow('2026-04-10', 3, {
      tips_amount_sum: 300,
      sold_messages_price_sum: 600,
      fans_count: 150,
      messages_count: 1500,
      reply_time_avg: 90,
      paid_messages_count: 30,
      sold_messages_count: 15,
    }),
  ];

  it('sum mode: sums count fields across chatters', () => {
    const result = aggregateByDate(rows, 'sum');
    expect(result).toHaveLength(1);
    const r = result[0];
    expect(r.raw.tips_amount_sum).toBe(600);
    expect(r.raw.sold_messages_price_sum).toBe(1200);
    expect(r.raw.fans_count).toBe(300);
    expect(r.raw.messages_count).toBe(3000);
    expect(r.raw.paid_messages_count).toBe(60);
    expect(r.raw.sold_messages_count).toBe(30);
  });

  it('sum mode: averages reply_time_avg (never sums it)', () => {
    const result = aggregateByDate(rows, 'sum');
    // (30 + 60 + 90) / 3 = 60, NOT 180
    expect(result[0].raw.reply_time_avg).toBe(60);
  });

  it('avg mode: divides count fields by number of chatters', () => {
    const result = aggregateByDate(rows, 'avg');
    expect(result).toHaveLength(1);
    const r = result[0];
    expect(r.raw.tips_amount_sum).toBe(200); // 600/3
    expect(r.raw.sold_messages_price_sum).toBe(400); // 1200/3
    expect(r.raw.fans_count).toBe(100); // 300/3
    expect(r.raw.messages_count).toBe(1000); // 3000/3
    expect(r.raw.paid_messages_count).toBe(20); // 60/3
    expect(r.raw.sold_messages_count).toBe(10); // 30/3
  });

  it('avg mode: reply_time_avg stays as chatter average', () => {
    const result = aggregateByDate(rows, 'avg');
    expect(result[0].raw.reply_time_avg).toBe(60);
  });

  it('avg mode: ratios like openRate remain correct (sold/sent invariant)', () => {
    const result = aggregateByDate(rows, 'avg');
    const r = result[0];
    // openRate is derived as sold_messages_count / paid_messages_count
    // Sum mode: 30/60 = 0.5. Avg mode: 10/20 = 0.5. Must be identical.
    const openRate =
      (r.raw.sold_messages_count ?? 0) / (r.raw.paid_messages_count ?? 1);
    expect(openRate).toBe(0.5);
  });

  it('groups rows by date across multiple dates', () => {
    const multi = [
      ...rows,
      makeRow('2026-04-09', 1, { tips_amount_sum: 50, reply_time_avg: 45 }),
      makeRow('2026-04-09', 2, { tips_amount_sum: 50, reply_time_avg: 75 }),
    ];
    const result = aggregateByDate(multi, 'sum');
    expect(result).toHaveLength(2);
    const apr09 = result.find(r => r.date === '2026-04-09')!;
    expect(apr09.raw.tips_amount_sum).toBe(100);
    expect(apr09.raw.reply_time_avg).toBe(60); // (45+75)/2
  });

  it('ignores zero reply_time_avg values when averaging', () => {
    const withZero = [
      makeRow('2026-04-10', 1, { reply_time_avg: 30 }),
      makeRow('2026-04-10', 2, { reply_time_avg: 0 }),
      makeRow('2026-04-10', 3, { reply_time_avg: 90 }),
    ];
    const result = aggregateByDate(withZero, 'sum');
    // Only 30 and 90 are counted; 0 is treated as "no data"
    expect(result[0].raw.reply_time_avg).toBe(60);
  });

  it('returns empty reply_time_avg when no chatter has data', () => {
    const allZero = [
      makeRow('2026-04-10', 1, { reply_time_avg: 0 }),
      makeRow('2026-04-10', 2, { reply_time_avg: 0 }),
    ];
    const result = aggregateByDate(allZero, 'sum');
    expect(result[0].raw.reply_time_avg).toBe(0);
  });

  it('marks aggregated row with userId=0 and ALL key', () => {
    const result = aggregateByDate(rows, 'avg');
    expect(result[0].userId).toBe(0);
    expect(result[0].key).toBe('2026-04-10|ALL');
  });

  it('handles empty input', () => {
    expect(aggregateByDate([], 'sum')).toEqual([]);
    expect(aggregateByDate([], 'avg')).toEqual([]);
  });

  it('defaults to avg mode when no mode specified', () => {
    const result = aggregateByDate(rows);
    // avg mode divides by N=3
    expect(result[0].raw.tips_amount_sum).toBe(200);
  });
});
