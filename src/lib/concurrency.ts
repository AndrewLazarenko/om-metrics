/**
 * Map items to promises with a bounded concurrency pool.
 *
 * Preserves input order in the returned array: `results[i]` always
 * corresponds to `items[i]`, regardless of completion order.
 *
 * Fails fast: if any task rejects, the rejection propagates via
 * Promise.all and the pool stops picking up new work. In-flight
 * tasks still finish (we can't actually cancel a fetch without an
 * AbortController wired in), but their results are discarded.
 *
 * The optional `onEach` callback fires once per successful item in
 * completion order (not input order) — useful for progress reporting
 * where you want "N of M done" to tick up smoothly.
 */
export async function parallelMap<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  onEach?: (result: R, item: T, index: number) => void,
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results: R[] = new Array(items.length);
  let nextIdx = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = nextIdx++;
      if (i >= items.length) return;
      const res = await fn(items[i], i);
      results[i] = res;
      onEach?.(res, items[i], i);
    }
  }

  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
  return results;
}
