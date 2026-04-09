import { describe, it, expect } from 'vitest';
import { formatMoney, formatInt, formatPct, formatMinutes, formatNum } from '@/lib/format';

describe('formatters', () => {
  it('formatMoney', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(null)).toBe('—');
  });

  it('formatInt', () => {
    expect(formatInt(1234567)).toBe('1,234,567');
    expect(formatInt(0)).toBe('0');
    expect(formatInt(null)).toBe('—');
  });

  it('formatPct', () => {
    expect(formatPct(0.5)).toBe('50%');
    expect(formatPct(0.1234)).toBe('12%');
    expect(formatPct(0)).toBe('0%');
    expect(formatPct(null)).toBe('—');
  });

  it('formatMinutes', () => {
    expect(formatMinutes(2)).toBe('2:00');
    expect(formatMinutes(2.5)).toBe('2:30');
    expect(formatMinutes(0)).toBe('0:00');
    expect(formatMinutes(null)).toBe('—');
  });

  it('formatNum with 1 decimal', () => {
    expect(formatNum(123.456, 1)).toBe('123.5');
    expect(formatNum(0, 1)).toBe('0.0');
    expect(formatNum(null, 1)).toBe('—');
  });
});
