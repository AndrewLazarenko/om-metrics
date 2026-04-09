import { describe, it, expect } from 'vitest';
import { heatmapColor, scaleColumn } from '@/lib/heatmap';

describe('heatmapColor', () => {
  it('returns transparent when min === max', () => {
    expect(heatmapColor(5, 5, 5, 'normal').opacity).toBe(0);
  });

  it('returns green tone for max in normal direction', () => {
    const c = heatmapColor(10, 0, 10, 'normal');
    expect(c.hue).toBe(140);
    expect(c.opacity).toBeGreaterThan(0.4);
  });

  it('returns red tone for min in normal direction', () => {
    const c = heatmapColor(0, 0, 10, 'normal');
    expect(c.hue).toBe(0);
  });

  it('returns yellow tone for mid in normal direction', () => {
    const c = heatmapColor(5, 0, 10, 'normal');
    expect(c.hue).toBeGreaterThanOrEqual(50);
    expect(c.hue).toBeLessThanOrEqual(70);
  });

  it('inverts scale for direction=inverted', () => {
    const low = heatmapColor(1, 1, 10, 'inverted');
    const high = heatmapColor(10, 1, 10, 'inverted');
    expect(low.hue).toBe(140);
    expect(high.hue).toBe(0);
  });
});

describe('scaleColumn', () => {
  it('returns all zero-opacity for empty', () => {
    expect(scaleColumn([], 'normal')).toEqual([]);
  });

  it('returns all same for constant column', () => {
    const result = scaleColumn([5, 5, 5], 'normal');
    expect(result.every(c => c.opacity === 0)).toBe(true);
  });

  it('extremes hit green and red', () => {
    const result = scaleColumn([1, 5, 10], 'normal');
    expect(result[0].hue).toBe(0);
    expect(result[2].hue).toBe(140);
  });

  it('ignores null/undefined in min/max computation', () => {
    const result = scaleColumn([1, null, 10, undefined] as unknown as number[], 'normal');
    expect(result[0].hue).toBe(0);
    expect(result[2].hue).toBe(140);
    expect(result[1].opacity).toBe(0);
    expect(result[3].opacity).toBe(0);
  });
});
