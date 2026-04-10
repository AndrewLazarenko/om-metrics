import type { AggregationMode } from '@/lib/aggregate';
import { cn } from '@/lib/utils';

interface Props {
  value: AggregationMode;
  onChange: (v: AggregationMode) => void;
}

const OPTIONS: { value: AggregationMode; label: string; title: string }[] = [
  { value: 'avg', label: '⌀', title: 'Среднее на чатера' },
  { value: 'sum', label: 'Σ', title: 'Сумма по всем чатерам' },
];

export function AggregationToggle({ value, onChange }: Props) {
  return (
    <div
      className="inline-flex rounded-md border border-slate-200 p-0.5 dark:border-slate-800"
      role="group"
      aria-label="Режим агрегации"
    >
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.title}
          aria-pressed={value === opt.value}
          className={cn(
            'rounded px-3 py-1 font-mono text-sm font-medium transition',
            value === opt.value
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
