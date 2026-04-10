import { useMemo } from 'react';
import { HeatmapCell } from './HeatmapCell';
import { scaleColumn } from '@/lib/heatmap';
import { sumArr, avgArr } from '@/lib/formulas';
import { formatInt, formatNum, formatMinutes } from '@/lib/format';
import { OM_CONFIG } from '@/lib/config';
import { cn } from '@/lib/utils';
import { computeDelta, formatDelta, type GoodDirection } from '@/lib/delta';
import type { MetricsRow } from '@/lib/db';

interface Props {
  rows: MetricsRow[];
  prevRows?: MetricsRow[];
}

// Shared totals shape reused for both current + previous period.
function computeActivityTotals(rows: MetricsRow[]) {
  const mask = rows.map(r => (r.raw.messages_count ?? 0) >= OM_CONFIG.DAYOFF_MIN_MESSAGES);
  const keep = <T,>(arr: T[]): T[] => arr.filter((_, i) => mask[i]);
  return {
    chats: sumArr(keep(rows.map(r => r.raw.fans_count ?? 0))),
    msgs: sumArr(keep(rows.map(r => r.raw.messages_count ?? 0))),
    msgH: avgArr(keep(rows.map(r => r.derived.msgPerHour))),
    chatH: avgArr(keep(rows.map(r => r.derived.chatPerHour))),
    reply: avgArr(keep(rows.map(r => r.derived.replyMinutes))),
    words: sumArr(keep(rows.map(r => r.raw.words_count_sum ?? 0))),
    ai: sumArr(keep(rows.map(r => r.raw.ai_generated_messages_count ?? 0))),
    count: mask.filter(Boolean).length,
  };
}

const headers = [
  'Дата',
  'Chats',
  'Messages',
  'Msg/Hour',
  'Chat/Hour',
  'Avg Resp',
  'Words',
  'AI',
];

export function ActivityTable({ rows, prevRows }: Props) {
  // A row is "active" if the chatter actually worked that day. The
  // threshold catches days marked as выходной where a few stray messages
  // still made it into the API response. Day-off rows are rendered muted
  // and excluded from both the heatmap color scale and the Σ/⌀ footer.
  const activeMask = useMemo(
    () => rows.map(r => (r.raw.messages_count ?? 0) >= OM_CONFIG.DAYOFF_MIN_MESSAGES),
    [rows],
  );

  const columns = useMemo(() => {
    const chats = rows.map(r => r.raw.fans_count ?? 0);
    const msgs = rows.map(r => r.raw.messages_count ?? 0);
    const msgH = rows.map(r => r.derived.msgPerHour);
    const chatH = rows.map(r => r.derived.chatPerHour);
    const reply = rows.map(r => r.derived.replyMinutes);
    const words = rows.map(r => r.raw.words_count_sum ?? 0);
    const ai = rows.map(r => r.raw.ai_generated_messages_count ?? 0);

    return {
      chats: { v: chats, c: scaleColumn(chats, 'normal', activeMask) },
      msgs: { v: msgs, c: scaleColumn(msgs, 'normal', activeMask) },
      msgH: { v: msgH, c: scaleColumn(msgH, 'normal', activeMask) },
      chatH: { v: chatH, c: scaleColumn(chatH, 'normal', activeMask) },
      reply: { v: reply, c: scaleColumn(reply, 'inverted', activeMask) }, // LOW is GREEN
      words: { v: words, c: scaleColumn(words, 'normal', activeMask) },
      ai: { v: ai, c: scaleColumn(ai, 'inverted', activeMask) }, // lower AI usage = better
    };
  }, [rows, activeMask]);

  // Totals computed only from active rows — day-off days are dropped
  // from both Σ (sums) and ⌀ (averages) so two stray messages don't
  // drag the weekly average down. Shared helper keeps current + prev
  // period on identical math.
  const totals = useMemo(() => computeActivityTotals(rows), [rows]);
  const prevTotals = useMemo(
    () => (prevRows && prevRows.length > 0 ? computeActivityTotals(prevRows) : null),
    [prevRows],
  );
  const deltas = useMemo(() => {
    if (!prevTotals) return null;
    const mk = (cur: number, prev: number, dir: GoodDirection = 'up') =>
      formatDelta(computeDelta(cur, prev), dir);
    return {
      chats: mk(totals.chats, prevTotals.chats),
      msgs: mk(totals.msgs, prevTotals.msgs),
      msgH: mk(totals.msgH, prevTotals.msgH),
      chatH: mk(totals.chatH, prevTotals.chatH),
      reply: mk(totals.reply, prevTotals.reply, 'down'),
      words: mk(totals.words, prevTotals.words),
      ai: mk(totals.ai, prevTotals.ai, 'down'),
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
              <HeatmapCell label={formatInt(columns.chats.v[i])} color={columns.chats.c[i]} />
              <HeatmapCell label={formatInt(columns.msgs.v[i])} color={columns.msgs.c[i]} />
              <HeatmapCell label={formatNum(columns.msgH.v[i], 1)} color={columns.msgH.c[i]} />
              <HeatmapCell label={formatNum(columns.chatH.v[i], 1)} color={columns.chatH.c[i]} />
              <HeatmapCell label={formatMinutes(columns.reply.v[i])} color={columns.reply.c[i]} />
              <HeatmapCell label={formatInt(columns.words.v[i])} color={columns.words.c[i]} />
              <HeatmapCell label={formatInt(columns.ai.v[i])} color={columns.ai.c[i]} />
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
              <td className="px-3 py-2 text-right tabular-nums">{formatInt(totals.chats)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatInt(totals.msgs)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatNum(totals.msgH, 1)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatNum(totals.chatH, 1)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMinutes(totals.reply)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatInt(totals.words)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatInt(totals.ai)}</td>
            </tr>
            {deltas && (
              <tr
                className="bg-slate-50/60 text-[10px] font-medium dark:bg-slate-900/40"
                title="Изменение относительно предыдущего периода такой же длины"
              >
                <td className="px-3 py-1 text-slate-500">vs prev</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.chats?.className)}>{deltas.chats?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.msgs?.className)}>{deltas.msgs?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.msgH?.className)}>{deltas.msgH?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.chatH?.className)}>{deltas.chatH?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.reply?.className)}>{deltas.reply?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.words?.className)}>{deltas.words?.label ?? '—'}</td>
                <td className={cn('px-3 py-1 text-right tabular-nums', deltas.ai?.className)}>{deltas.ai?.label ?? '—'}</td>
              </tr>
            )}
          </tfoot>
        )}
      </table>
    </div>
  );
}
