import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { OM_CONFIG } from './config';

export interface DayRange {
  day: string;
  from: string;
  to: string;
}

export function getKyivDayRange(daysAgo: number): DayRange {
  const now = new Date();
  const nowKyiv = toZonedTime(now, OM_CONFIG.TZ);
  const targetKyiv = new Date(nowKyiv);
  targetKyiv.setDate(targetKyiv.getDate() - daysAgo);

  const day = formatInTimeZone(fromZonedTime(targetKyiv, OM_CONFIG.TZ), OM_CONFIG.TZ, 'yyyy-MM-dd');

  const fromLocalStr = `${day}T00:00:00.000`;
  const toLocalStr = `${day}T23:59:59.999`;

  const fromUtc = fromZonedTime(fromLocalStr, OM_CONFIG.TZ);
  const toUtc = fromZonedTime(toLocalStr, OM_CONFIG.TZ);

  return {
    day,
    from: fromUtc.toISOString(),
    to: toUtc.toISOString(),
  };
}

export function listLastNDays(n: number): DayRange[] {
  const out: DayRange[] = [];
  for (let i = 0; i < n; i++) {
    out.push(getKyivDayRange(i));
  }
  return out;
}
