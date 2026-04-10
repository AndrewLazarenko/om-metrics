// In production (vercel.app) the direct upstream is CORS-blocked for the
// `x-om-auth-token` header. We use a Vercel same-origin rewrite
// (`/api/omproxy/*` → `https://omapi.onlymonster.ai/api/v0/*`, see vercel.json).
// In dev and tests the upstream is reached directly because localhost is
// allowed by the OM API CORS policy and msw handlers match the absolute URL.
const API_BASE = import.meta.env.PROD
  ? '/api/omproxy'
  : 'https://omapi.onlymonster.ai/api/v0';

export const OM_CONFIG = {
  BASE_URL: API_BASE,
  TZ: 'Europe/Kyiv',
  METRICS_PAGE_LIMIT: 100,
  MEMBERS_PAGE_LIMIT: 50,
  // Always fetch exactly this many days on initial sync and keep them in IDB.
  // Must be >= 2 × max(WINDOW_OPTIONS) so the "Δ vs prev" delta row in the
  // table footers can always compare the selected window against an equally
  // sized preceding window. For windowDays=30 this means we need 60 days of
  // history locally. Sync stays fast thanks to the parallel fetch pool.
  KEEP_DAYS: 60,
  BACKFILL_DAYS: 7,
  API_RETRIES: 4,
  API_RETRY_BASE_MS: 1200,
  PAGE_SLEEP_MS: 300,
  REQUEST_TIMEOUT_MS: 30_000,
  AUTO_SYNC_THRESHOLD_MS: 6 * 60 * 60 * 1000,
  // On tab visibility change (user returns to the app), auto-trigger an
  // incremental sync if the last sync is older than this. Shorter than
  // AUTO_SYNC_THRESHOLD_MS because this is cheap (only BACKFILL_DAYS=7).
  VISIBILITY_SYNC_THRESHOLD_MS: 5 * 60 * 1000,
  // How many day-ranges to fetch in parallel during initial/incremental sync.
  // 6 matches the browser's per-origin HTTP/1.1 connection limit; on Vercel's
  // HTTP/2 proxy we could go higher but 6 keeps the OM API happy and our
  // retry logic (429/5xx backoff) takes care of the rare burst rejection.
  SYNC_CONCURRENCY: 6,
  // Any chatter-day with fewer than this many `messages_count` is treated as
  // a "day off" (выходной) even if the API returned a couple of stray
  // messages (e.g. the chatter tested the login or wrote one quick reply).
  // Such days are muted in the table AND excluded from the heatmap color
  // scale + Σ/⌀ totals, so they don't squish the real working-day range.
  DAYOFF_MIN_MESSAGES: 15,
} as const;

export const DEFAULT_SETTINGS = {
  shiftHours: 6,
  commissionRate: 0.2,
  windowDays: 20 as 7 | 14 | 20 | 30,
  theme: 'dark' as 'light' | 'dark',
};

export const WINDOW_OPTIONS = [7, 14, 20, 30] as const;
export type WindowDays = typeof WINDOW_OPTIONS[number];
