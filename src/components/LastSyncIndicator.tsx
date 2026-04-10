import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/**
 * Small header chip showing how stale the local data is. Colour thresholds:
 *   <1h   — slate (normal)
 *   <24h  — amber (stale, consider refreshing)
 *   ≥24h  — rose  (really stale)
 *
 * Re-renders every 30s so the relative text stays honest without needing
 * any store updates.
 */
export function LastSyncIndicator() {
  const lastSyncAt = useAppStore(s => s.lastSyncAt);
  const syncing = useAppStore(s => s.syncing);
  const [, bump] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => bump(x => x + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (syncing) {
    return (
      <span className="hidden text-xs text-slate-400 sm:inline">обновляется…</span>
    );
  }

  if (!lastSyncAt) {
    return (
      <span className="hidden text-xs text-slate-400 sm:inline">не синхронизировано</span>
    );
  }

  const ageMs = Date.now() - new Date(lastSyncAt).getTime();
  const { label, tone } = describeAge(ageMs);

  return (
    <span
      className={cn('hidden text-xs sm:inline', toneClass(tone))}
      title={new Date(lastSyncAt).toLocaleString('ru-RU')}
    >
      обновлено {label}
    </span>
  );
}

type Tone = 'fresh' | 'stale' | 'old';

function toneClass(tone: Tone): string {
  switch (tone) {
    case 'fresh':
      return 'text-slate-500 dark:text-slate-400';
    case 'stale':
      return 'text-amber-600 dark:text-amber-400';
    case 'old':
      return 'text-rose-600 dark:text-rose-400';
  }
}

function describeAge(ms: number): { label: string; tone: Tone } {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  let label: string;
  if (sec < 60) label = 'только что';
  else if (min < 60) label = `${min} мин назад`;
  else if (hr < 24) label = `${hr} ч назад`;
  else label = `${day} дн назад`;

  let tone: Tone = 'fresh';
  if (ms >= 24 * 60 * 60 * 1000) tone = 'old';
  else if (ms >= 60 * 60 * 1000) tone = 'stale';

  return { label, tone };
}
