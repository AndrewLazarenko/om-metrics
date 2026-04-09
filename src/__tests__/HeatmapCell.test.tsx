import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeatmapCell } from '@/components/HeatmapCell';
import type { HeatmapColor } from '@/lib/heatmap';

const transparent: HeatmapColor = { hue: 0, saturation: 0, lightness: 0, opacity: 0, css: 'transparent' };
const green: HeatmapColor = { hue: 140, saturation: 70, lightness: 55, opacity: 0.5, css: 'hsla(140, 70%, 55%, 0.5)' };

describe('HeatmapCell', () => {
  it('renders the formatted label', () => {
    render(<HeatmapCell label="$1,234.00" color={transparent} />);
    expect(screen.getByText('$1,234.00')).toBeInTheDocument();
  });

  it('applies the color css as background', () => {
    render(<HeatmapCell label="42" color={green} />);
    const el = screen.getByText('42').closest('td') ?? screen.getByText('42').parentElement;
    expect(el).toHaveStyle(`background-color: ${green.css}`);
  });
});
