import { describe, it, expect } from 'vitest';
import { num, round2, toDerived, sumArr, avgArr, type MetricsRaw } from '@/lib/formulas';

const baseRaw: MetricsRaw = {
  tips_amount_sum: 100,
  sold_messages_price_sum: 400,
  fans_count: 60,
  messages_count: 1200,
  reply_time_avg: 120,
  media_messages_count: 10,
  paid_messages_count: 30,
  sold_messages_count: 15,
  internal_templates_count: 5,
  copied_messages_count: 2,
  paid_messages_price_sum: 600,
  words_count_sum: 5000,
  ai_generated_messages_count: 0,
};

describe('num', () => {
  it('returns 0 for null/undefined/NaN', () => {
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
    expect(num(NaN)).toBe(0);
    expect(num('abc')).toBe(0);
  });
  it('parses numeric strings', () => {
    expect(num('42.5')).toBe(42.5);
  });
  it('passes through finite numbers', () => {
    expect(num(3.14)).toBe(3.14);
    expect(num(0)).toBe(0);
    expect(num(-5)).toBe(-5);
  });
});

describe('round2', () => {
  it('rounds to two decimals', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(1.004)).toBe(1);
    expect(round2(1000)).toBe(1000);
  });
});

describe('toDerived', () => {
  it('computes sales with 20% commission', () => {
    const d = toDerived(baseRaw, { shiftHours: 6, commissionRate: 0.2 });
    expect(d.sales).toBe(400);
    expect(d.grossSales).toBe(500);
  });

  it('computes msgPerHour and chatPerHour using shiftHours', () => {
    const d = toDerived(baseRaw, { shiftHours: 6, commissionRate: 0.2 });
    expect(d.msgPerHour).toBe(200);
    expect(d.chatPerHour).toBe(10);
  });

  it('converts reply_time_avg seconds to minutes', () => {
    const d = toDerived(baseRaw, { shiftHours: 6, commissionRate: 0.2 });
    expect(d.replyMinutes).toBe(2);
  });

  it('computes open rate, avgPriceSent, avgPriceSold', () => {
    const d = toDerived(baseRaw, { shiftHours: 6, commissionRate: 0.2 });
    expect(d.openRate).toBe(0.5);
    expect(d.avgPriceSent).toBe(20);
    expect(d.avgPriceSold).toBeCloseTo(26.666666666666668);
  });

  it('returns 0 for ratios when denominator is 0', () => {
    const zero: MetricsRaw = { ...baseRaw, paid_messages_count: 0, sold_messages_count: 0 };
    const d = toDerived(zero, { shiftHours: 6, commissionRate: 0.2 });
    expect(d.openRate).toBe(0);
    expect(d.avgPriceSent).toBe(0);
    expect(d.avgPriceSold).toBe(0);
  });

  it('handles missing/null raw fields gracefully', () => {
    const sparse: Partial<MetricsRaw> = { tips_amount_sum: 50 };
    const d = toDerived(sparse as MetricsRaw, { shiftHours: 6, commissionRate: 0.2 });
    expect(d.sales).toBe(40);
    expect(d.msgPerHour).toBe(0);
  });

  it('uses custom shiftHours', () => {
    const d = toDerived(baseRaw, { shiftHours: 8, commissionRate: 0.2 });
    expect(d.msgPerHour).toBe(150);
  });

  it('uses custom commissionRate', () => {
    const d = toDerived(baseRaw, { shiftHours: 6, commissionRate: 0.3 });
    expect(d.sales).toBe(350);
  });
});

describe('sumArr / avgArr', () => {
  it('sums numeric arrays', () => {
    expect(sumArr([1, 2, 3, 4])).toBe(10);
    expect(sumArr([])).toBe(0);
  });
  it('averages numeric arrays, empty = 0', () => {
    expect(avgArr([2, 4, 6])).toBe(4);
    expect(avgArr([])).toBe(0);
  });
});
