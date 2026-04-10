import { useMemo } from 'react';
import { HeatmapCell } from './HeatmapCell';
import { scaleColumn } from '@/lib/heatmap';
import { sumArr, avgArr } from '@/lib/formulas';
import { formatMoney, formatInt, formatPct } from '@/lib/format';
import { OM_CONFIG } from '@/lib/config';
import { cn } from '@/lib/utils';
import { computeDelta, formatDelta, type GoodDirection } from '@/lib/delta';
import type { MetricsRow } from '@/lib/db';

interface Props {
  rows: MetricsRow[]; // already filtered by chatter + window, sorted oldest → newest
  prevRows?: MetricsRow[]; // same shape, previous equal-length period
}

const headers = [
  'Дата',
  'Продажи',
  'Free Media',
  'PPV Sent',
  'PPV Sold',
  'Open Rate',
  'Avg Price Sent',
  'Avg Price Sold',
];

function computeMoneyTotals(rows: MetricsRow[]) {
  const mask = rows.map(r => (r.raw.messages_count ?? 0) >= OM_CONFIG.DAYOFF_MIN_MESSAGES);
  const keep = <T,>(arr: T[]): T[] => arr.filter((_, i) => mask[i]);
  return {
    sales: sumArr(keep(rows.map(r => r.derived.sales))),
    freeMedia: sumArr(keep(rows.map(r => r.raw.media_messages_count ?? 0))),
    ppvSent: sumArr(keep(rows.map(r => r.raw.paid_messages_count ?? 0))),
    ppvSold: sumArr(keep(rows.map(r => r.raw.sold_messages_count ?? 0))),
    openRate: avgArr(keep(rows.map(r => r.derived.openRate))),
    avgSent: avgArr(keep(rows.map(r => r.derived.avgPriceSent))),
    avgSold: avgArr(keep(rows.map(r => r.derived.avgPriceSold))),
    count: mask.filter(Boolean).length,
  };
}

export function MoneyTable({ rows, prevRows }: Props) {
  // See ActivityTable — same day-off masking rule keyed on messages_count.
  // Day-off rows are excluded from the color scale and totals.
  const activeMask = useMemo(
    () => rows.map(r => (r.raw.messages_count ?? 0) >= OM_CONFIG.DAYOFF_MIN_MESSAGES),
    [rows],
  );

  const columns = useMemo(() => {
    const sales = rows.map(r => r.derived.sales);
    const freeMedia = rows.map(r => r.raw.media_messages_count ?? 0);
    const ppvSent = rows.map(r => r.raw.paid_messages_count ?? 0);
    const ppvSold = rows.map(r => r.raw.sold_messages_count ?? 0);
    const openRate = rows.map(r => r.derived.openRate);
    const avgSent = rows.map(r => r.derived.avgPriceSent);
    const avgSold = rows.map(r => r.derived.avgPriceSold);

    return {
      sales: { values: sales, colors: scaleColumn(sales, 'normal', activeMask) },
      freeMedia: { values: freeMedia, colors: scaleColumn(freeMedia, 'normal', activeMask) },
      ppvSent: { values: ppvSent, colors: scaleColumn(ppvSent, 'normal', activeMask) },
      ppvSold: { values: ppvSold, colors: scaleColumn(ppvSold, 'normal', activeMask) },
      openRate: { values: openRate, colors: scaleColumn(openRate, 'normal', activeMask) },
      avgSent: { values: avgSent, colors: scaleColumn(avgSent, 'normal', activeMask) },
      avgSold: { values: avgSold, colors: scaleColumn(avgSold, 'normal', activeMask) },
    };
  }, [rows, activeMask]);

  const totals = useMemo(() => computeMoneyTotals(rows), [rows]);
  const prevTotals = useMemo(
    () => (prevRows && prevRows.length > 0 ? computeMoneyTotals(prevRows) : null),
    [prevRows],
  );
  const deltas = useMemo(() => {
    if (!prevTotals) return null;
    const mk = (cur: number, prev: number, dir: GoodDirection = 'up') =>
      formatDelta(computeDelta(cur, prev), dir);
    return {
      sales: mk(totals.sales, prevTotals.sales),
      freeMedia: mk(totals.freeMedia, prevTotals.freeMedia),
      ppvSent: mk(totals.ppvSent, prevTotals.ppvSent),
      ppvSold: mk(totals.ppvSold, prevTotals.ppvSold),
      openRate: mk(totals.openRate, prevTotals.openRate),
      avgSent: mk(totals.avgSent, prevTotals.avgSent),
      avgSold: mk(totals.avgSold, prevTotals.avgSold),
    };
  }, [totals, prevTotals]);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            {headers.map(h => (
              <th key={h} className="h-12 px-3 py-2 align-middle text-left first:rounded-tl-lg last:rounded-tr-lg">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.key}
              className={cn(!activeMask[i] && 'text-slate-400/60 dark:text-slate-600')}
              title={!activeMask[i] ? 'Выходной (меньше порога сообщений)' : undefined}
            >
              <td className="whitespace-nowrap border-b border-slate-200/40 px-3 py-2 font-mono text-xs text-slate-500 dark:border-slate-800/60">{row.date}</td>
              <HeatmapCell label={formatMoney(columns.sales.values[i])} color={columns.sales.colors[i]} />
              <HeatmapCell label={formatInt(columns.freeMedia.values[i])} color={columns.freeMedia.colors[i]} />
              <HeatmapCell label={formatInt(columns.ppvSent.values[i])} color={columns.ppvSent.colors[i]} />
              <HeatmapCell label={formatInt(columns.ppvSold.values[i])} color={columns.ppvSold.colors[i]} />
              <HeatmapCell label={formatPct(columns.openRate.values[i])} color={columns.openRate.colors[i]} />
              <HeatmapCell label={formatMoney(columns.avgSent.values[i])} color={columns.avgSent.colors[i]} />
              <HeatmapCell label={formatMoney(columns.avgSold.values[i])} color={columns.avgSold.colors[i]} />
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-8 text-center text-sm text-slate-500">
                Нет данных за выбранный период
              </td>
            </tr>
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-slate-100/80 text-xs font-semibold dark:bg-slate-900/80">
              <td className="px-3 py-2">Σ / ⌀</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMoney(totals.sales)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatInt(totals.freeMedia)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatInt(totals.ppvSent)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatInt(totals.ppvSold)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPct(totals.openRate)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMoney(totals.avgSent)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMoney(totals.avgSold)}</td>
            </tr>
            {deltas && (
              <tr
                className="bg-slate-50/60 text-[10px] font-medium dark:bg-slate-900/40"
                title="Изменение относительно предыдущего периода такой же длины"
              >
                <td className="px-3 py-1 text-slate-500">vs prev</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.sales?.className)}>{deltas.sales?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.freeMedia?.className)}>{deltas.freeMedia?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.ppvSent?.className)}>{deltas.ppvSent?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.ppvSold?.className)}>{deltas.ppvSold?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.openRate?.className)}>{deltas.openRate?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.avgSent?.className)}>{deltas.avgSent?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.avgSold?.className)}>{deltas.avgSold?.label ?? '—'}</td>
              </tr>
            )}
          </tfoot>
        )}
      </table>
    </div>
  );
}
