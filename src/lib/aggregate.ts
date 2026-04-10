import type { MetricsRow } from './db';
import type { MetricsRaw } from './formulas';
import { num } from './formulas';

export type AggregationMode = 'sum' | 'avg';

/**
 * Keys of MetricsRaw that represent counts / sums over a single
 * chatter-day. These can be summed across chatters when "all chatters"
 * is selected. In 'avg' mode they are additionally divided by the
 * number of contributing chatters for that date.
 *
 * Derived fields like openRate, avgPriceSent, avgPriceSold are ratios
 * computed from these summed raw fields in toDerived(), so they come
 * out correct in both modes without any special handling.
 */
const SUMMABLE_KEYS = [
  'tips_amount_sum',
  'sold_messages_price_sum',
  'fans_count',
  'messages_count',
  'media_messages_count',
  'paid_messages_count',
  'sold_messages_count',
  'internal_templates_count',
  'copied_messages_count',
  'paid_messages_price_sum',
  'words_count_sum',
  'ai_generated_messages_count',
] as const;

type SummableKey = (typeof SUMMABLE_KEYS)[number];

interface Bucket {
  template: MetricsRow;
  sums: Record<SummableKey, number>;
  replyTimes: number[]; // non-zero only
  count: number;
}

function emptySums(): Record<SummableKey, number> {
  const s = {} as Record<SummableKey, number>;
  for (const k of SUMMABLE_KEYS) s[k] = 0;
  return s;
}

/**
 * Aggregate rows from multiple chatters into one row per date.
 *
 * - 'sum' mode: counts are summed across chatters (agency totals).
 *   reply_time_avg is averaged across chatters.
 * - 'avg' mode: counts are summed then divided by the number of
 *   chatters that contributed that day (per-chatter averages).
 *   reply_time_avg is averaged across chatters (same as 'sum').
 *
 * reply_time_avg is never summed — summing averages is always wrong.
 * We use a simple unweighted mean across chatters (ignoring zero values,
 * which typically indicate "no data" rather than "instant reply").
 */
export function aggregateByDate(
  rows: MetricsRow[],
  mode: AggregationMode = 'avg',
): MetricsRow[] {
  const buckets = new Map<string, Bucket>();

  for (const r of rows) {
    let b = buckets.get(r.date);
    if (!b) {
      b = { template: r, sums: emptySums(), replyTimes: [], count: 0 };
      buckets.set(r.date, b);
    }
    for (const k of SUMMABLE_KEYS) {
      b.sums[k] += num((r.raw as Record<string, unknown>)[k]);
    }
    const rt = num(r.raw.reply_time_avg);
    if (rt > 0) b.replyTimes.push(rt);
    b.count++;
  }

  return Array.from(buckets.values()).map(b => {
    const divisor = mode === 'avg' && b.count > 0 ? b.count : 1;
    const raw: Record<string, number> = {};
    for (const k of SUMMABLE_KEYS) {
      raw[k] = b.sums[k] / divisor;
    }
    raw.reply_time_avg =
      b.replyTimes.length > 0
        ? b.replyTimes.reduce((a, c) => a + c, 0) / b.replyTimes.length
        : 0;

    return {
      ...b.template,
      userId: 0,
      key: `${b.template.date}|ALL`,
      raw: raw as MetricsRaw,
    };
  });
}
