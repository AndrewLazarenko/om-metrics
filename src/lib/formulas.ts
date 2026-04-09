export interface MetricsRaw {
  tips_amount_sum?: number | null;
  sold_messages_price_sum?: number | null;
  fans_count?: number | null;
  messages_count?: number | null;
  reply_time_avg?: number | null;
  media_messages_count?: number | null;
  paid_messages_count?: number | null;
  sold_messages_count?: number | null;
  internal_templates_count?: number | null;
  copied_messages_count?: number | null;
  paid_messages_price_sum?: number | null;
  words_count_sum?: number | null;
  ai_generated_messages_count?: number | null;
  user_id?: number | string;
}

export interface MetricsDerived {
  grossSales: number;
  sales: number;
  msgPerHour: number;
  chatPerHour: number;
  replyMinutes: number;
  openRate: number;
  avgPriceSent: number;
  avgPriceSold: number;
}

export interface FormulaSettings {
  shiftHours: number;
  commissionRate: number;
}

export function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function toDerived(raw: MetricsRaw, settings: FormulaSettings): MetricsDerived {
  const tips = num(raw.tips_amount_sum);
  const soldSum = num(raw.sold_messages_price_sum);
  const fans = num(raw.fans_count);
  const messages = num(raw.messages_count);
  const replySec = num(raw.reply_time_avg);
  const ppvSent = num(raw.paid_messages_count);
  const ppvSold = num(raw.sold_messages_count);
  const sentSum = num(raw.paid_messages_price_sum);

  const grossSales = tips + soldSum;
  const sales = round2(grossSales * (1 - settings.commissionRate));
  const shift = settings.shiftHours || 1;

  return {
    grossSales,
    sales,
    msgPerHour: messages / shift,
    chatPerHour: fans / shift,
    replyMinutes: replySec / 60,
    openRate: ppvSent ? ppvSold / ppvSent : 0,
    avgPriceSent: ppvSent ? sentSum / ppvSent : 0,
    avgPriceSold: ppvSold ? soldSum / ppvSold : 0,
  };
}

export function sumArr(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

export function avgArr(xs: number[]): number {
  if (xs.length === 0) return 0;
  return sumArr(xs) / xs.length;
}
