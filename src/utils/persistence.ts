import { Customer, SystemSettings, Transaction } from '../types';

const STORAGE_KEY = 'membership-point-dashboard:data:v1';

export interface PersistedState {
  customers: Customer[];
  transactions: Transaction[];
  settings: SystemSettings;
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.customers) || !Array.isArray(parsed.transactions) || !parsed.settings) {
      return null;
    }
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently skip, in-memory state still works for this session.
  }
}
