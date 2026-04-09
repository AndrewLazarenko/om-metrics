import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getKyivDayRange, listLastNDays } from '@/lib/kyiv-dates';

describe('getKyivDayRange', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-09T14:00:00.000Z'));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns today when daysAgo=0', () => {
    const r = getKyivDayRange(0);
    expect(r.day).toBe('2026-04-09');
    expect(r.from).toBe('2026-04-08T21:00:00.000Z');
    expect(r.to).toBe('2026-04-09T20:59:59.999Z');
  });

  it('returns yesterday for daysAgo=1', () => {
    const r = getKyivDayRange(1);
    expect(r.day).toBe('2026-04-08');
  });

  it('returns 20 days ago for daysAgo=20', () => {
    const r = getKyivDayRange(20);
    expect(r.day).toBe('2026-03-20');
    expect(r.from).toBe('2026-03-19T22:00:00.000Z');
    expect(r.to).toBe('2026-03-20T21:59:59.999Z');
  });
});

describe('DST: EET → EEST (spring forward 2026-03-29)', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-30T12:00:00.000Z'));
  });
  afterAll(() => { vi.useRealTimers(); });

  it('computes 2026-03-28 (before DST, +2) correctly', () => {
    const r = getKyivDayRange(2);
    expect(r.day).toBe('2026-03-28');
    expect(r.from).toBe('2026-03-27T22:00:00.000Z');
  });

  it('computes 2026-03-30 (after DST, +3) correctly', () => {
    const r = getKyivDayRange(0);
    expect(r.day).toBe('2026-03-30');
    expect(r.from).toBe('2026-03-29T21:00:00.000Z');
  });
});

describe('DST: EEST → EET (fall back 2026-10-25)', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T12:00:00.000Z'));
  });
  afterAll(() => { vi.useRealTimers(); });

  it('computes 2026-10-24 (EEST, +3) correctly', () => {
    const r = getKyivDayRange(2);
    expect(r.day).toBe('2026-10-24');
    expect(r.from).toBe('2026-10-23T21:00:00.000Z');
  });

  it('computes 2026-10-26 (EET, +2) correctly', () => {
    const r = getKyivDayRange(0);
    expect(r.day).toBe('2026-10-26');
    expect(r.from).toBe('2026-10-25T22:00:00.000Z');
  });
});

describe('listLastNDays', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-09T12:00:00.000Z'));
  });
  afterAll(() => { vi.useRealTimers(); });

  it('returns N days from newest to oldest', () => {
    const days = listLastNDays(3);
    expect(days).toHaveLength(3);
    expect(days[0].day).toBe('2026-04-09');
    expect(days[1].day).toBe('2026-04-08');
    expect(days[2].day).toBe('2026-04-07');
  });
});
