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
  KEEP_DAYS: 20,
  BACKFILL_DAYS: 7,
  API_RETRIES: 4,
  API_RETRY_BASE_MS: 1200,
  PAGE_SLEEP_MS: 300,
  REQUEST_TIMEOUT_MS: 30_000,
  AUTO_SYNC_THRESHOLD_MS: 6 * 60 * 60 * 1000,
} as const;

export const DEFAULT_SETTINGS = {
  shiftHours: 6,
  commissionRate: 0.2,
  windowDays: 20 as 7 | 14 | 20 | 30,
  theme: 'dark' as 'light' | 'dark',
};

export const WINDOW_OPTIONS = [7, 14, 20, 30] as const;
export type WindowDays = typeof WINDOW_OPTIONS[number];
