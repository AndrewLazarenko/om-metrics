const DASH = '—';

function isNil(n: unknown): n is null | undefined {
  return n === null || n === undefined || (typeof n === 'number' && !Number.isFinite(n));
}

export function formatMoney(n: number | null | undefined): string {
  if (isNil(n)) return DASH;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatInt(n: number | null | undefined): string {
  if (isNil(n)) return DASH;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

export function formatPct(n: number | null | undefined): string {
  if (isNil(n)) return DASH;
  return `${Math.round(n * 100)}%`;
}

export function formatMinutes(n: number | null | undefined): string {
  if (isNil(n)) return DASH;
  const total = Math.max(0, n);
  const minutes = Math.floor(total);
  const seconds = Math.round((total - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatNum(n: number | null | undefined, decimals = 1): string {
  if (isNil(n)) return DASH;
  return n.toFixed(decimals);
}
