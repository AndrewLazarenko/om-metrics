import { describe, it, expect } from 'vitest';
import { toDerived } from '@/lib/formulas';
import day1 from '@/__fixtures__/metrics-day-1.json';
import day2 from '@/__fixtures__/metrics-day-2.json';
import day3 from '@/__fixtures__/metrics-day-3.json';
import expected from '@/__fixtures__/expected-derived.json';

const SETTINGS = { shiftHours: 6, commissionRate: 0.2 };

describe('parity with Apps Script (chatter_metrics.gs)', () => {
  it('day1 item 1001 matches expected derived', () => {
    const item = day1.items.find(x => x.user_id === 1001)!;
    expect(toDerived(item, SETTINGS)).toMatchObject(expected['1001_day1']);
  });

  it('day1 item 1002 matches expected derived', () => {
    const item = day1.items.find(x => x.user_id === 1002)!;
    expect(toDerived(item, SETTINGS)).toMatchObject(expected['1002_day1']);
  });

  it('day2 item 1001 matches expected derived', () => {
    const item = day2.items.find(x => x.user_id === 1001)!;
    expect(toDerived(item, SETTINGS)).toMatchObject(expected['1001_day2']);
  });

  it('day3 zero-values chatter 1003 matches expected (no NaN)', () => {
    const item = day3.items.find(x => x.user_id === 1003)!;
    const d = toDerived(item, SETTINGS);
    expect(d).toMatchObject(expected['1003_day3']);
    Object.values(d).forEach(v => expect(Number.isFinite(v)).toBe(true));
  });

  it('day3 chatter 1004 with null sold_messages_price_sum treats as 0', () => {
    const item = day3.items.find(x => x.user_id === 1004)!;
    expect(toDerived(item, SETTINGS)).toMatchObject(expected['1004_day3']);
  });
});
