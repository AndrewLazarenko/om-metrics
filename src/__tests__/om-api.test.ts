import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { fetchMetricsRange, fetchAllMembers, validateToken, OmApiError } from '@/lib/om-api';

const BASE = 'https://omapi.onlymonster.ai/api/v0';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function item(id: number, overrides: Record<string, unknown> = {}) {
  return {
    user_id: id,
    tips_amount_sum: 10,
    sold_messages_price_sum: 20,
    fans_count: 5,
    messages_count: 50,
    reply_time_avg: 60,
    media_messages_count: 1,
    paid_messages_count: 3,
    sold_messages_count: 1,
    internal_templates_count: 0,
    copied_messages_count: 0,
    paid_messages_price_sum: 30,
    words_count_sum: 100,
    ai_generated_messages_count: 0,
    ...overrides,
  };
}

describe('validateToken', () => {
  it('returns true on 200', async () => {
    server.use(http.get(`${BASE}/members`, () => HttpResponse.json({ items: [], total: 0 })));
    await expect(validateToken('tok')).resolves.toBe(true);
  });

  it('throws OmApiError with status 401 on unauthorized', async () => {
    server.use(http.get(`${BASE}/members`, () => HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })));
    await expect(validateToken('tok')).rejects.toMatchObject({ status: 401 });
  });
});

describe('fetchMetricsRange pagination', () => {
  it('stops when items.length < limit', async () => {
    let call = 0;
    server.use(http.get(`${BASE}/users/metrics`, () => {
      call++;
      const items = Array.from({ length: call === 1 ? 100 : 30 }, (_, i) => item(i + (call - 1) * 100));
      return HttpResponse.json({ items, total: 130 });
    }));
    const rows = await fetchMetricsRange('tok', '2026-04-09T00:00:00.000Z', '2026-04-09T23:59:59.999Z');
    expect(rows).toHaveLength(130);
    expect(call).toBe(2);
  });

  it('returns empty when items.length === 0', async () => {
    server.use(http.get(`${BASE}/users/metrics`, () => HttpResponse.json({ items: [], total: 0 })));
    const rows = await fetchMetricsRange('tok', 'from', 'to');
    expect(rows).toEqual([]);
  });
});

describe('fetchAllMembers pagination with limit=50', () => {
  it('paginates through /members', async () => {
    let call = 0;
    server.use(http.get(`${BASE}/members`, ({ request }) => {
      call++;
      const url = new URL(request.url);
      const limit = Number(url.searchParams.get('limit'));
      expect(limit).toBe(50);
      const items = Array.from({ length: call === 1 ? 50 : 3 }, (_, i) => ({
        id: i + (call - 1) * 50,
        name: `Chatter ${i + (call - 1) * 50}`,
        avatar: null,
        email: 'x@y.z',
        createdAt: '2026-01-01',
      }));
      return HttpResponse.json({ items, total: 53 });
    }));
    const members = await fetchAllMembers('tok');
    expect(members).toHaveLength(53);
    expect(members[0]).toEqual({ id: 0, name: 'Chatter 0' });
    expect(call).toBe(2);
  });
});

describe('retry logic', () => {
  it('retries on 429 and succeeds', async () => {
    let call = 0;
    server.use(http.get(`${BASE}/members`, () => {
      call++;
      if (call < 3) return HttpResponse.json({ error: 'rate limit' }, { status: 429 });
      return HttpResponse.json({ items: [], total: 0 });
    }));
    vi.useFakeTimers();
    const promise = fetchAllMembers('tok');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual([]);
    expect(call).toBe(3);
    vi.useRealTimers();
  });

  it('does not retry on 401', async () => {
    let call = 0;
    server.use(http.get(`${BASE}/members`, () => {
      call++;
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }));
    await expect(fetchAllMembers('tok')).rejects.toMatchObject({ status: 401 });
    expect(call).toBe(1);
  });

  it('throws after API_RETRIES exhausted on 500', async () => {
    server.use(http.get(`${BASE}/members`, () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    vi.useFakeTimers();
    const promise = fetchAllMembers('tok');
    // Attach a catch handler synchronously so Vitest/Node don't flag this as
    // an unhandled rejection between the reject and the `expect(...).rejects`
    // assertion below (which only attaches its handler after runAllTimersAsync).
    const assertion = expect(promise).rejects.toMatchObject({ status: 500 });
    await vi.runAllTimersAsync();
    await assertion;
    vi.useRealTimers();
  });
});
