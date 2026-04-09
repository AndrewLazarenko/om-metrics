import { DEFAULT_SETTINGS, type WindowDays } from './config';

const TOKEN_KEY = 'om-metrics-token';
const SETTINGS_KEY = 'om-metrics-settings';

export interface StoredSettings {
  shiftHours: number;
  commissionRate: number;
  windowDays: WindowDays;
  theme: 'light' | 'dark';
}

export function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: StoredSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
