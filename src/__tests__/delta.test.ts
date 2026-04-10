import { describe, it, expect } from 'vitest';
import { computeDelta, formatDelta } from '@/lib/delta';

describe('computeDelta', () => {
  it('returns null when both values are zero', () => {
    expect(computeDelta(0, 0)).toBeNull();
  });

  it('returns positive pct + sign=1 when current > previous', () => {
    const d = computeDelta(120, 100);
    expect(d).not.toBeNull();
    expect(d!.sign).toBe(1);
    expect(d!.pct).toBeCloseTo(0.2, 5);
  });

  it('returns negative pct + sign=-1 when current < previous', () => {
    const d = computeDelta(80, 100);
    expect(d!.sign).toBe(-1);
    expect(d!.pct).toBeCloseTo(-0.2, 5);
  });

  it('treats tiny changes as flat (sign=0)', () => {
    const d = computeDelta(100.1, 100);
    expect(d!.sign).toBe(0);
    expect(d!.pct).toBe(0);
  });

  it('returns Infinity pct when previous was zero but current is positive', () => {
    const d = computeDelta(50, 0);
    expect(d).not.toBeNull();
    expect(d!.sign).toBe(1);
    expect(Number.isFinite(d!.pct)).toBe(false);
  });

  it('uses absolute previous so negative baselines still flip sign correctly', () => {
    // Reply time example: previous = -10 (hypothetical), current = -5
    // Not realistic for our metrics but the helper should still be robust.
    const d = computeDelta(-5, -10);
    expect(d!.sign).toBe(1);
    expect(d!.pct).toBeCloseTo(0.5, 5);
  });

  it('returns null on NaN inputs', () => {
    expect(computeDelta(NaN, 10)).toBeNull();
    expect(computeDelta(10, NaN)).toBeNull();
  });
});

describe('formatDelta', () => {
  it('returns null when delta is null', () => {
    expect(formatDelta(null)).toBeNull();
  });

  it('formats up-good up-change as emerald + ↑ label', () => {
    const f = formatDelta(computeDelta(120, 100), 'up');
    expect(f).not.toBeNull();
    expect(f!.label).toBe('↑ +20%');
    expect(f!.className).toMatch(/emerald/);
  });

  it('formats up-good down-change as rose + ↓ label', () => {
    const f = formatDelta(computeDelta(80, 100), 'up');
    expect(f!.label).toBe('↓ -20%');
    expect(f!.className).toMatch(/rose/);
  });

  it('inverts color semantics when goodDirection=down (reply time)', () => {
    // Lower reply time is better: 80 < 100 → good → emerald.
    const f = formatDelta(computeDelta(80, 100), 'down');
    expect(f!.label).toBe('↓ -20%');
    expect(f!.className).toMatch(/emerald/);
  });

  it('marks brand-new values (prev=0, cur>0) as "new"', () => {
    const f = formatDelta(computeDelta(50, 0), 'up');
    expect(f!.label).toBe('↑ new');
    expect(f!.className).toMatch(/emerald/);
  });

  it('shows flat as "— 0%" in neutral slate', () => {
    const f = formatDelta(computeDelta(100.1, 100), 'up');
    expect(f!.label).toBe('— 0%');
    expect(f!.className).toMatch(/slate/);
  });
});
