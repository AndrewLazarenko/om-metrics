import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { clearAll, db } from '@/lib/db';
import { initialSync, incrementalSync, type SyncProgress } from '@/lib/sync';

const BASE = 'https://omapi.onlymonster.ai/api/v0';

const server = setupServer(
  http.get(`${BASE}/members`, () => HttpResponse.json({
    items: [{ id: 1001, name: 'Alice' }, { id: 1002, name: 'Bob' }],
    total: 2,
  })),
  http.get(`${BASE}/users/metrics`, () => HttpResponse.json({
    items: [{
      user_id: 1001,
      tips_amount_sum: 50,
      sold_messages_price_sum: 450,
      fans_count: 60,
      messages_count: 1200,
      reply_time_avg: 120,
      media_messages_count: 10,
      paid_messages_count: 30,
      sold_messages_count: 15,
      internal_templates_count: 5,
      copied_messages_count: 2,
      paid_messages_price_sum: 600,
      words_count_sum: 5000,
      ai_generated_messages_count: 0,
    }],
    total: 1,
  })),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => {
  server.close();
});
beforeEach(async () => {
  await clearAll();
});
afterEach(() => {
  server.resetHandlers();
});

describe('initialSync', () => {
  it('fetches N days of metrics + members and writes to db', async () => {
    const events: SyncProgress[] = [];
    await initialSync({
      token: 'tok',
      windowDays: 3,
      settings: { shiftHours: 6, commissionRate: 0.2 },
      onProgress: p => events.push(p),
    });

    const metrics = await db.metrics.toArray();
    const members = await db.members.toArray();
    expect(metrics).toHaveLength(3);           // 3 days × 1 item
    expect(members).toHaveLength(2);
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events[events.length - 1].done).toBe(true);
  });

  it('computes derived fields using passed settings', async () => {
    await initialSync({
      token: 'tok',
      windowDays: 1,
      settings: { shiftHours: 8, commissionRate: 0.3 },
    });
    const row = (await db.metrics.toArray())[0];
    // grossSales=500, sales = 500 * 0.7 = 350
    expect(row.derived.sales).toBe(350);
    // msgPerHour = 1200 / 8 = 150
    expect(row.derived.msgPerHour).toBe(150);
  });

  it('stores the per-row composite key as `${date}|${userId}`', async () => {
    await initialSync({ token: 'tok', windowDays: 1, settings: { shiftHours: 6, commissionRate: 0.2 } });
    const row = (await db.metrics.toArray())[0];
    expect(row.key).toBe(`${row.date}|${row.userId}`);
  });
});

describe('incrementalSync', () => {
  it('refetches last BACKFILL_DAYS days only', async () => {
    // Pre-populate with an old day that should NOT be touched
    await db.metrics.put({
      key: '2020-01-01|999',
      date: '2020-01-01',
      userId: 999,
      raw: {} as any,
      derived: {} as any,
      syncedAt: '2020-01-01T00:00:00.000Z',
    });
    await incrementalSync({ token: 'tok', settings: { shiftHours: 6, commissionRate: 0.2 } });
    const old = await db.metrics.get('2020-01-01|999');
    expect(old).toBeTruthy(); // untouched (prune runs only if windowDays specified)
    const fresh = await db.metrics.where('date').above('2026-04-01').toArray();
    expect(fresh.length).toBeGreaterThan(0);
  });
});
