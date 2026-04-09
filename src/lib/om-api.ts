import { OM_CONFIG } from './config';
import type { MetricsRaw } from './formulas';

export class OmApiError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string, message?: string) {
    super(message ?? `OM API ${status}: ${body}`);
    this.name = 'OmApiError';
    this.status = status;
    this.body = body;
  }
}

interface RawMetricsResponse {
  items: MetricsRaw[];
  total: number;
}

interface RawMembersResponse {
  items: Array<{ id: number; name: string }>;
  total: number;
}

export interface OmMember {
  id: number;
  name: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

function buildUrl(path: string, params: Record<string, string | number>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  return `${OM_CONFIG.BASE_URL}${path}?${q.toString()}`;
}

async function omGet<T>(path: string, params: Record<string, string | number>, token: string): Promise<T> {
  const url = buildUrl(path, params);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= OM_CONFIG.API_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), OM_CONFIG.REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-om-auth-token': token,
        },
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      const body = await res.text();

      if (res.status >= 200 && res.status < 300) {
        return body ? JSON.parse(body) : ({} as T);
      }

      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === OM_CONFIG.API_RETRIES) {
        throw new OmApiError(res.status, body);
      }

      const delayMs = OM_CONFIG.API_RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await sleep(delayMs);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof OmApiError) {
        if (err.status === 429 || err.status >= 500) {
          lastError = err;
          if (attempt === OM_CONFIG.API_RETRIES) throw err;
          const delayMs = OM_CONFIG.API_RETRY_BASE_MS * Math.pow(2, attempt - 1);
          await sleep(delayMs);
          continue;
        }
        throw err;
      }
      lastError = err as Error;
      if (attempt === OM_CONFIG.API_RETRIES) break;
      const delayMs = OM_CONFIG.API_RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await sleep(delayMs);
    }
  }

  throw lastError ?? new Error('OM API request failed');
}

/**
 * Cheap token validation: fetch one member.
 */
export async function validateToken(token: string): Promise<boolean> {
  await omGet<RawMembersResponse>('/members', { offset: 0, limit: 1 }, token);
  return true;
}

/**
 * Fetches ALL items for a single Kyiv day, paginating with METRICS_PAGE_LIMIT=100.
 */
export async function fetchMetricsRange(token: string, from: string, to: string): Promise<MetricsRaw[]> {
  let offset = 0;
  const out: MetricsRaw[] = [];
  const limit = OM_CONFIG.METRICS_PAGE_LIMIT;

  while (true) {
    const json = await omGet<RawMetricsResponse>('/users/metrics', { from, to, offset, limit }, token);
    const items = Array.isArray(json.items) ? json.items : [];
    out.push(...items);
    if (items.length < limit) break;
    offset += limit;
    await sleep(OM_CONFIG.PAGE_SLEEP_MS);
  }
  return out;
}

/**
 * Fetches ALL members, paginating with MEMBERS_PAGE_LIMIT=50.
 * Returns only { id, name } — other fields discarded.
 */
export async function fetchAllMembers(token: string): Promise<OmMember[]> {
  let offset = 0;
  const out: OmMember[] = [];
  const limit = OM_CONFIG.MEMBERS_PAGE_LIMIT;

  while (true) {
    const json = await omGet<RawMembersResponse>('/members', { offset, limit }, token);
    const items = Array.isArray(json.items) ? json.items : [];
    items.forEach(m => out.push({ id: m.id, name: m.name }));
    if (items.length < limit) break;
    offset += limit;
    await sleep(OM_CONFIG.PAGE_SLEEP_MS);
  }
  return out;
}
