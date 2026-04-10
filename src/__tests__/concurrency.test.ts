import { describe, it, expect } from 'vitest';
import { parallelMap } from '../lib/concurrency';

function defer<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('parallelMap', () => {
  it('returns results in input order regardless of completion order', async () => {
    const delays = [30, 5, 20, 1, 15];
    const result = await parallelMap(delays, 3, async (d, i) => {
      await new Promise(r => setTimeout(r, d));
      return i * 10;
    });
    expect(result).toEqual([0, 10, 20, 30, 40]);
  });

  it('respects the concurrency limit (never more than N in-flight)', async () => {
    let inflight = 0;
    let peak = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);

    await parallelMap(items, 4, async (i) => {
      inflight++;
      peak = Math.max(peak, inflight);
      await new Promise(r => setTimeout(r, 5));
      inflight--;
      return i;
    });

    expect(peak).toBeLessThanOrEqual(4);
  });

  it('runs all items in parallel when concurrency >= items.length', async () => {
    const started: number[] = [];
    const items = [1, 2, 3];
    await parallelMap(items, 10, async (i) => {
      started.push(i);
      await new Promise(r => setTimeout(r, 1));
      return i;
    });
    // All three must have started before any finishes
    expect(started).toHaveLength(3);
  });

  it('returns empty array on empty input without touching fn', async () => {
    let called = false;
    const result = await parallelMap([], 5, async () => {
      called = true;
      return 1;
    });
    expect(result).toEqual([]);
    expect(called).toBe(false);
  });

  it('propagates errors via Promise.all', async () => {
    await expect(
      parallelMap([1, 2, 3], 2, async (i) => {
        if (i === 2) throw new Error('boom');
        return i;
      }),
    ).rejects.toThrow('boom');
  });

  it('calls onEach once per successful item in completion order', async () => {
    const completionOrder: number[] = [];
    // Odd-index items finish faster
    await parallelMap(
      [100, 10, 80, 5],
      4,
      async (delay) => {
        await new Promise(r => setTimeout(r, delay));
        return delay;
      },
      (result) => {
        completionOrder.push(result);
      },
    );
    // Completion order reflects delays: 5 < 10 < 80 < 100
    expect(completionOrder).toEqual([5, 10, 80, 100]);
  });

  it('works with a non-parallel pool (concurrency=1) sequentially', async () => {
    const started: number[] = [];
    const ended: number[] = [];
    const d1 = defer<void>();
    const d2 = defer<void>();

    const promise = parallelMap([1, 2], 1, async (i) => {
      started.push(i);
      await (i === 1 ? d1.promise : d2.promise);
      ended.push(i);
      return i;
    });

    // Give the worker a tick to start
    await new Promise(r => setTimeout(r, 0));
    expect(started).toEqual([1]); // only first started

    d1.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(started).toEqual([1, 2]);

    d2.resolve();
    await promise;
    expect(ended).toEqual([1, 2]);
  });
});
