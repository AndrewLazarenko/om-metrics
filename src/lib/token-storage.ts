import { DEFAULT_SETTINGS, type WindowDays } from './config';

const TOKEN_KEY = 'om-metrics-token';
const SETTINGS_KEY = 'om-metrics-settings';
const UI_STATE_KEY = 'om-metrics-ui-state';

export interface StoredSettings {
  shiftHours: number;
  commissionRate: number;
  windowDays: WindowDays;
  theme: 'light' | 'dark';
}

/**
 * Ephemeral UI selections that should survive a page reload but do not
 * belong in `StoredSettings` (those are user-facing, editable in the
 * Settings dialog). These are "where I left off" bookmarks.
 */
export interface StoredUiState {
  selectedUserId: number | null;
  aggMode: 'sum' | 'avg';
}

const DEFAULT_UI_STATE: StoredUiState = {
  selectedUserId: null,
  aggMode: 'avg',
};

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

export function loadUiState(): StoredUiState {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (!raw) return { ...DEFAULT_UI_STATE };
    const parsed = JSON.parse(raw);
    const uid = parsed?.selectedUserId;
    const mode = parsed?.aggMode;
    return {
      selectedUserId:
        typeof uid === 'number' && Number.isFinite(uid) ? uid : null,
      aggMode: mode === 'sum' || mode === 'avg' ? mode : 'avg',
    };
  } catch {
    return { ...DEFAULT_UI_STATE };
  }
}

export function saveUiState(s: StoredUiState): void {
  try {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode — swallow, next session just defaults */
  }
}
