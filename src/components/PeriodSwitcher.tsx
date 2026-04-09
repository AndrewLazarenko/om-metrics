import { WINDOW_OPTIONS, type WindowDays } from '@/lib/config';
import { cn } from '@/lib/utils';

interface Props {
  value: WindowDays;
  onChange: (v: WindowDays) => void;
}

export function PeriodSwitcher({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 p-0.5 dark:border-slate-800">
      {WINDOW_OPTIONS.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'rounded px-3 py-1 text-xs font-medium transition',
            value === opt
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100',
          )}
        >
          {opt}д
        </button>
      ))}
    </div>
  );
}
