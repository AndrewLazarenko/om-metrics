export type HeatmapDirection = 'normal' | 'inverted';

export interface HeatmapColor {
  hue: number;
  saturation: number;
  lightness: number;
  opacity: number;
  css: string;
}

function transparent(): HeatmapColor {
  return { hue: 0, saturation: 0, lightness: 0, opacity: 0, css: 'transparent' };
}

export function heatmapColor(
  value: number,
  min: number,
  max: number,
  direction: HeatmapDirection = 'normal'
): HeatmapColor {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return transparent();
  }
  if (min === max) return transparent();

  let t = (value - min) / (max - min);
  if (direction === 'inverted') t = 1 - t;
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  const hue = Math.round(t * 140);
  const saturation = 70;
  const lightness = 55;
  const opacity = 0.15 + t * 0.35;

  return {
    hue,
    saturation,
    lightness,
    opacity,
    css: `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`,
  };
}

/**
 * Build a heatmap color gradient for a column of values.
 *
 * `mask`, if provided, indicates which indices are "active". Only the
 * active, finite values contribute to the min/max scale, and inactive
 * cells always render transparent regardless of their underlying value.
 * This lets us exclude day-off rows (tiny message counts) from skewing
 * the color gradient while still showing them as muted rows in the UI.
 */
export function scaleColumn(
  values: ReadonlyArray<number | null | undefined>,
  direction: HeatmapDirection = 'normal',
  mask?: ReadonlyArray<boolean>,
): HeatmapColor[] {
  const active: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (mask && !mask[i]) continue;
    const v = values[i];
    if (typeof v === 'number' && Number.isFinite(v)) active.push(v);
  }
  if (active.length === 0) return values.map(() => transparent());

  const min = Math.min(...active);
  const max = Math.max(...active);

  return values.map((v, i) => {
    if (mask && !mask[i]) return transparent();
    if (typeof v !== 'number' || !Number.isFinite(v)) return transparent();
    return heatmapColor(v, min, max, direction);
  });
}
