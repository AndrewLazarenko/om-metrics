import { useEffect, useState } from 'react';
import {
  db,
  type MetricsRow,
  getMetricsForWindow,
  getPreviousMetricsForWindow,
} from '@/lib/db';
import { liveQuery } from 'dexie';

export function useMetricsWindow(windowDays: number): MetricsRow[] {
  const [rows, setRows] = useState<MetricsRow[]>([]);
  useEffect(() => {
    const sub = liveQuery(() => getMetricsForWindow(windowDays)).subscribe({
      next: setRows,
      error: e => console.error('useMetricsWindow', e),
    });
    return () => sub.unsubscribe();
  }, [windowDays]);
  return rows;
}

/**
 * Returns the previous equal-length period (used for "Δ vs prev" deltas).
 * Empty when IDB hasn't accumulated enough history yet — tables handle
 * that case gracefully by hiding the delta row.
 */
export function usePreviousMetricsWindow(windowDays: number): MetricsRow[] {
  const [rows, setRows] = useState<MetricsRow[]>([]);
  useEffect(() => {
    const sub = liveQuery(() => getPreviousMetricsForWindow(windowDays)).subscribe({
      next: setRows,
      error: e => console.error('usePreviousMetricsWindow', e),
    });
    return () => sub.unsubscribe();
  }, [windowDays]);
  return rows;
}

export function useMembers() {
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    const sub = liveQuery(() => db.members.toArray()).subscribe({
      next: setMembers,
      error: e => console.error('useMembers', e),
    });
    return () => sub.unsubscribe();
  }, []);
  return members;
}
