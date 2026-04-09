import { useEffect, useState } from 'react';
import { db, type MetricsRow, getMetricsForWindow } from '@/lib/db';
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
