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

  describe('with mask', () => {
    it('excludes masked-out indices from min/max computation', () => {
      // Without mask, 1 would be the min and would drag the scale wide.
      // With mask excluding index 0, the effective range is 100..500.
      const values = [1, 100, 300, 500];
      const mask = [false, true, true, true];
      const result = scaleColumn(values, 'normal', mask);

      // Index 0 is masked out → transparent
      expect(result[0].css).toBe('transparent');
      // Index 1 is the new min → red
      expect(result[1].hue).toBe(0);
      // Index 3 is the max → green
      expect(result[3].hue).toBe(140);
    });

    it('proves the day-off use case: one tiny value does not squish the gradient', () => {
      // Simulating a week where the chatter had one day off (2 messages)
      // and six real working days in the 3000-5000 range.
      const values = [2, 3000, 3500, 4000, 4200, 4700, 5000];
      const mask = values.map(v => v >= 15);

      const withoutMask = scaleColumn(values, 'normal');
      const withMask = scaleColumn(values, 'normal', mask);

      // Without the mask, all working days cluster near the top of the
      // gradient because the 2-msg day stretches the range: a normal day
      // at 3000 maps to t = (3000-2)/(5000-2) ≈ 0.6.
      // With the mask, the effective range is 3000..5000, so 3000 is red
      // (min = 0) and 5000 is green (max = 140).
      expect(withoutMask[1].hue).toBeGreaterThan(70); // squished upward
      expect(withMask[1].hue).toBe(0); // gets its own low-end color

      // The masked-out day is transparent
      expect(withMask[0].css).toBe('transparent');
    });

    it('returns all transparent when every row is masked out', () => {
      const values = [1, 2, 3];
      const mask = [false, false, false];
      const result = scaleColumn(values, 'normal', mask);
      expect(result.every(c => c.css === 'transparent')).toBe(true);
    });

    it('behaves identically to no-mask when mask is all true', () => {
      const values = [10, 20, 30];
      const noMask = scaleColumn(values, 'normal');
      const allTrue = scaleColumn(values, 'normal', [true, true, true]);
      expect(allTrue.map(c => c.hue)).toEqual(noMask.map(c => c.hue));
    });

    it('works with inverted direction and mask', () => {
      // Reply time: low is good (green). One stray low-reply day off.
      const values = [1, 200, 250, 300];
      const mask = [false, true, true, true];
      const result = scaleColumn(values, 'inverted', mask);
      expect(result[0].css).toBe('transparent');
      // In inverted: lowest active value (200) → green (hue 140)
      expect(result[1].hue).toBe(140);
      expect(result[3].hue).toBe(0);
    });
  });
});
