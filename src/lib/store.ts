import { create } from 'zustand';
import { type WindowDays } from './config';
import {
  loadSettings,
  loadToken,
  loadUiState,
  saveSettings,
  saveToken,
  saveUiState,
  clearToken,
  type StoredSettings,
} from './token-storage';
import type { AggregationMode } from './aggregate';
import type { SyncProgress } from './sync';

interface AppState {
  // Token
  token: string | null;
  setToken: (t: string) => void;
  clearTokenAction: () => void;

  // Settings
  settings: StoredSettings;
  updateSettings: (patch: Partial<StoredSettings>) => void;

  // Selection (persisted)
  selectedUserId: number | null;
  setSelectedUserId: (id: number | null) => void;

  // Aggregation mode for "all chatters" view (persisted)
  aggMode: AggregationMode;
  setAggMode: (m: AggregationMode) => void;

  // Sync state
  syncing: boolean;
  syncProgress: SyncProgress | null;
  syncError: string | null;
  setSyncing: (v: boolean) => void;
  setSyncProgress: (p: SyncProgress | null) => void;
  setSyncError: (e: string | null) => void;

  // Last metrics sync timestamp — bumped after every successful sync,
  // read by the header indicator and the visibility auto-refresh hook.
  lastSyncAt: string | null;
  setLastSyncAt: (iso: string | null) => void;

  // Window (days)
  setWindowDays: (n: WindowDays) => void;
}

const initialUi = loadUiState();

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

  selectedUserId: initialUi.selectedUserId,
  setSelectedUserId: (id) => {
    saveUiState({ selectedUserId: id, aggMode: get().aggMode });
    set({ selectedUserId: id });
  },

  aggMode: initialUi.aggMode,
  setAggMode: (m) => {
    saveUiState({ selectedUserId: get().selectedUserId, aggMode: m });
    set({ aggMode: m });
  },

  syncing: false,
  syncProgress: null,
  syncError: null,
  setSyncing: (v) => set({ syncing: v }),
  setSyncProgress: (p) => set({ syncProgress: p }),
  setSyncError: (e) => set({ syncError: e }),

  lastSyncAt: null,
  setLastSyncAt: (iso) => set({ lastSyncAt: iso }),

  setWindowDays: (n) => {
    const next = { ...get().settings, windowDays: n };
    saveSettings(next);
    set({ settings: next });
  },
}));
