import { create } from 'zustand';
import { DEFAULT_SETTINGS, type WindowDays } from './config';
import { loadSettings, loadToken, saveSettings, saveToken, clearToken, type StoredSettings } from './token-storage';
import type { SyncProgress } from './sync';

interface AppState {
  // Token
  token: string | null;
  setToken: (t: string) => void;
  clearTokenAction: () => void;

  // Settings
  settings: StoredSettings;
  updateSettings: (patch: Partial<StoredSettings>) => void;

  // Selection
  selectedUserId: number | null;
  setSelectedUserId: (id: number | null) => void;

  // Sync state
  syncing: boolean;
  syncProgress: SyncProgress | null;
  syncError: string | null;
  setSyncing: (v: boolean) => void;
  setSyncProgress: (p: SyncProgress | null) => void;
  setSyncError: (e: string | null) => void;

  // Window (days)
  setWindowDays: (n: WindowDays) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  token: loadToken(),
  setToken: (t) => {
    saveToken(t);
    set({ token: t });
  },
  clearTokenAction: () => {
    clearToken();
    set({ token: null });
  },

  settings: loadSettings(),
  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    saveSettings(next);
    set({ settings: next });
  },

  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),

  syncing: false,
  syncProgress: null,
  syncError: null,
  setSyncing: (v) => set({ syncing: v }),
  setSyncProgress: (p) => set({ syncProgress: p }),
  setSyncError: (e) => set({ syncError: e }),

  setWindowDays: (n) => {
    const next = { ...get().settings, windowDays: n };
    saveSettings(next);
    set({ settings: next });
  },
}));
