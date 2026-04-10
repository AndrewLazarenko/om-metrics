import { useMemo } from 'react';
import { HeatmapCell } from './HeatmapCell';
import { scaleColumn } from '@/lib/heatmap';
import { sumArr, avgArr } from '@/lib/formulas';
import { formatMoney, formatInt, formatPct } from '@/lib/format';
import type { MetricsRow } from '@/lib/db';

interface Props {
  rows: MetricsRow[]; // already filtered by chatter + window, newest first
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

export function MoneyTable({ rows }: Props) {
  const columns = useMemo(() => {
    const sales = rows.map(r => r.derived.sales);
    const freeMedia = rows.map(r => r.raw.media_messages_count ?? 0);
    const ppvSent = rows.map(r => r.raw.paid_messages_count ?? 0);
    const ppvSold = rows.map(r => r.raw.sold_messages_count ?? 0);
    const openRate = rows.map(r => r.derived.openRate);
    const avgSent = rows.map(r => r.derived.avgPriceSent);
    const avgSold = rows.map(r => r.derived.avgPriceSold);

    return {
      sales: { values: sales, colors: scaleColumn(sales, 'normal') },
      freeMedia: { values: freeMedia, colors: scaleColumn(freeMedia, 'normal') },
      ppvSent: { values: ppvSent, colors: scaleColumn(ppvSent, 'normal') },
      ppvSold: { values: ppvSold, colors: scaleColumn(ppvSold, 'normal') },
      openRate: { values: openRate, colors: scaleColumn(openRate, 'normal') },
      avgSent: { values: avgSent, colors: scaleColumn(avgSent, 'normal') },
      avgSold: { values: avgSold, colors: scaleColumn(avgSold, 'normal') },
    };
  }, [rows]);

  const totals = {
    sales: sumArr(columns.sales.values),
    freeMedia: sumArr(columns.freeMedia.values),
    ppvSent: sumArr(columns.ppvSent.values),
    ppvSold: sumArr(columns.ppvSold.values),
    openRate: avgArr(columns.openRate.values),
    avgSent: avgArr(columns.avgSent.values),
    avgSold: avgArr(columns.avgSold.values),
  };

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
            <tr key={row.key}>
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
          </tfoot>
        )}
      </table>
    </div>
  );
}
