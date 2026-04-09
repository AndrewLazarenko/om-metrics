import { useMemo } from 'react';
import { HeatmapCell } from './HeatmapCell';
import { scaleColumn } from '@/lib/heatmap';
import { sumArr, avgArr } from '@/lib/formulas';
import { formatInt, formatNum, formatMinutes } from '@/lib/format';
import type { MetricsRow } from '@/lib/db';

interface Props {
  rows: MetricsRow[];
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

export function ActivityTable({ rows }: Props) {
  const columns = useMemo(() => {
    const chats = rows.map(r => r.raw.fans_count ?? 0);
    const msgs = rows.map(r => r.raw.messages_count ?? 0);
    const msgH = rows.map(r => r.derived.msgPerHour);
    const chatH = rows.map(r => r.derived.chatPerHour);
    const reply = rows.map(r => r.derived.replyMinutes);
    const words = rows.map(r => r.raw.words_count_sum ?? 0);
    const ai = rows.map(r => r.raw.ai_generated_messages_count ?? 0);

    return {
      chats: { v: chats, c: scaleColumn(chats, 'normal') },
      msgs: { v: msgs, c: scaleColumn(msgs, 'normal') },
      msgH: { v: msgH, c: scaleColumn(msgH, 'normal') },
      chatH: { v: chatH, c: scaleColumn(chatH, 'normal') },
      reply: { v: reply, c: scaleColumn(reply, 'inverted') }, // LOW is GREEN
      words: { v: words, c: scaleColumn(words, 'normal') },
      ai: { v: ai, c: scaleColumn(ai, 'inverted') }, // lower AI usage = better
    };
  }, [rows]);

  const totals = {
    chats: sumArr(columns.chats.v),
    msgs: sumArr(columns.msgs.v),
    msgH: avgArr(columns.msgH.v),
    chatH: avgArr(columns.chatH.v),
    reply: avgArr(columns.reply.v),
    words: sumArr(columns.words.v),
    ai: sumArr(columns.ai.v),
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            {headers.map(h => (
              <th key={h} className="px-3 py-2 text-left first:rounded-tl-lg last:rounded-tr-lg">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key}>
              <td className="border-b border-slate-200/40 px-3 py-2 font-mono text-xs text-slate-500 dark:border-slate-800/60">{row.date}</td>
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
          </tfoot>
        )}
      </table>
    </div>
  );
}
