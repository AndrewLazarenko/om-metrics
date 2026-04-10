import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadToken,
  saveToken,
  clearToken,
  loadSettings,
  saveSettings,
  loadUiState,
  saveUiState,
} from '@/lib/token-storage';
import { DEFAULT_SETTINGS } from '@/lib/config';

describe('token-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saveToken + loadToken roundtrip', () => {
    saveToken('om_token_abc');
    expect(loadToken()).toBe('om_token_abc');
  });

  it('loadToken returns null when not set', () => {
    expect(loadToken()).toBeNull();
  });

  it('clearToken removes from storage', () => {
    saveToken('x');
    clearToken();
    expect(loadToken()).toBeNull();
  });

  it('loadSettings returns defaults when missing', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('saveSettings + loadSettings roundtrip', () => {
    saveSettings({ ...DEFAULT_SETTINGS, shiftHours: 8, theme: 'light' });
    const s = loadSettings();
    expect(s.shiftHours).toBe(8);
    expect(s.theme).toBe('light');
  });

  it('loadSettings backfills missing keys from defaults', () => {
    localStorage.setItem('om-metrics-settings', JSON.stringify({ shiftHours: 4 }));
    const s = loadSettings();
    expect(s.shiftHours).toBe(4);
    expect(s.commissionRate).toBe(DEFAULT_SETTINGS.commissionRate);
  });

  describe('ui state', () => {
    it('returns defaults when nothing stored', () => {
      expect(loadUiState()).toEqual({ selectedUserId: null, aggMode: 'avg' });
    });

    it('roundtrips selectedUserId + aggMode', () => {
      saveUiState({ selectedUserId: 42, aggMode: 'sum' });
      expect(loadUiState()).toEqual({ selectedUserId: 42, aggMode: 'sum' });
    });

    it('coerces invalid aggMode back to "avg"', () => {
      localStorage.setItem(
        'om-metrics-ui-state',
        JSON.stringify({ selectedUserId: 1, aggMode: 'wat' }),
      );
      expect(loadUiState().aggMode).toBe('avg');
    });

    it('coerces non-numeric selectedUserId back to null', () => {
      localStorage.setItem(
        'om-metrics-ui-state',
        JSON.stringify({ selectedUserId: 'nope', aggMode: 'avg' }),
      );
      expect(loadUiState().selectedUserId).toBeNull();
    });

    it('tolerates corrupt JSON', () => {
      localStorage.setItem('om-metrics-ui-state', '{not json');
      expect(loadUiState()).toEqual({ selectedUserId: null, aggMode: 'avg' });
    });
  });
});
