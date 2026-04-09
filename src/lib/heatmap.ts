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

export function scaleColumn(
  values: ReadonlyArray<number | null | undefined>,
  direction: HeatmapDirection = 'normal'
): HeatmapColor[] {
  const finite = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (finite.length === 0) return values.map(() => transparent());

  const min = Math.min(...finite);
  const max = Math.max(...finite);

  return values.map(v => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return transparent();
    return heatmapColor(v, min, max, direction);
  });
}
