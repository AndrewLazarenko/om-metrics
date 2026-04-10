/**
 * Percent-change helpers for the "vs prev" delta row in table footers.
 *
 * Compares two aggregated values (Σ or ⌀) from the current period vs
 * the previous equal-length period. Returns null when a meaningful
 * percentage cannot be computed (no prev data, or prev was zero and
 * current is also zero — "no change, nothing to show").
 */
export interface Delta {
  /** Absolute percent change as a fraction: 0.12 means +12%. */
  pct: number;
  /** 1 = up, -1 = down, 0 = flat (|pct| < FLAT_EPSILON). */
  sign: 1 | 0 | -1;
}

const FLAT_EPSILON = 0.005; // 0.5% — tighter than that we call it "flat"

export function computeDelta(current: number, previous: number): Delta | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) {
    // Previous zero: if current is also zero, nothing changed → null.
    // If current is non-zero, percent is mathematically undefined; we
    // still return a signed marker so the UI can show "↑ new".
    if (current === 0) return null;
    return { pct: Infinity, sign: current > 0 ? 1 : -1 };
  }
  const pct = (current - previous) / Math.abs(previous);
  if (!Number.isFinite(pct)) return null;
  if (Math.abs(pct) < FLAT_EPSILON) return { pct: 0, sign: 0 };
  return { pct, sign: pct > 0 ? 1 : -1 };
}

/**
 * Format a delta for display. Returns an object with a compact label
 * and a Tailwind class string so the table can render it inline.
 *
 *   { label: '↑ +12%', className: 'text-emerald-600 dark:text-emerald-400' }
 *
 * `goodDirection` controls color semantics:
 *   - 'up'   (default) — higher is better (sales, messages, open rate…)
 *   - 'down' — lower is better (reply time, AI usage…)
 */
export type GoodDirection = 'up' | 'down';

export function formatDelta(
  d: Delta | null,
  goodDirection: GoodDirection = 'up',
): { label: string; className: string } | null {
  if (d == null) return null;
  if (d.sign === 0) {
    return { label: '— 0%', className: 'text-slate-400 dark:text-slate-500' };
  }
  const isGood =
    (goodDirection === 'up' && d.sign === 1) ||
    (goodDirection === 'down' && d.sign === -1);
  const className = isGood
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400';
  const arrow = d.sign === 1 ? '↑' : '↓';
  if (!Number.isFinite(d.pct)) {
    return { label: `${arrow} new`, className };
  }
  const pctStr = `${d.sign === 1 ? '+' : ''}${Math.round(d.pct * 100)}%`;
  return { label: `${arrow} ${pctStr}`, className };
}
