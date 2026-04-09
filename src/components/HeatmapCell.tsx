import type { HeatmapColor } from '@/lib/heatmap';
import { cn } from '@/lib/utils';

interface HeatmapCellProps {
  label: string;
  color: HeatmapColor;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function HeatmapCell({ label, color, className, align = 'right' }: HeatmapCellProps) {
  return (
    <td
      style={{ backgroundColor: color.css }}
      className={cn(
        'border-b border-slate-200/40 px-3 py-2 text-sm tabular-nums dark:border-slate-800/60',
        align === 'right' && 'text-right',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {label}
    </td>
  );
}
