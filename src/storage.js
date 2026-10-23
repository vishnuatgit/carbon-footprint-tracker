// Loads, saves and sanitises the app state kept in localStorage.
import { findAction, isISODate, validateAnswers } from './calculator.js';

export const STORAGE_KEY = 'ecoMetricsState';
export const SCHEMA_VERSION = 2;

export function createEmptyState() {
  return { version: SCHEMA_VERSION, answers: {}, activityLog: [] };
}

function normaliseEntry(e) {
  if (!e || typeof e !== 'object') return null;
  const saving = Number(e.saving);
  if (!Number.isFinite(saving) || saving < 0 || saving > 10000) return null;
  const action = findAction(e.actionId);
  const label = action ? action.label : typeof e.label === 'string' ? e.label.slice(0, 120) : '';
  if (!label) return null;
  return {
    actionId: action ? action.id : null,
    label,
    saving,
    count: Number.isInteger(e.count) && e.count > 0 ? e.count : 1,
    iso: isISODate(e.iso) ? e.iso : null,
    // Version 1 stored only a locale date string; keep it for display.
    date: typeof e.date === 'string' ? e.date.slice(0, 40) : '',
  };
}

/** Turns any parsed value (version 1, version 2 or junk) into a valid version 2 state. */
export function migrate(raw) {
  const state = createEmptyState();
  if (!raw || typeof raw !== 'object') return state;
  if (raw.answers && typeof raw.answers === 'object' && validateAnswers(raw.answers).valid) {
    state.answers = { ...raw.answers };
  }
  if (Array.isArray(raw.activityLog)) {
    state.activityLog = raw.activityLog.map(normaliseEntry).filter(Boolean);
  }
  return state;
}

export function serialize(state) {
  return JSON.stringify(migrate(state));
}

/** Never throws: corrupt or missing data gives an empty state. */
export function deserialize(text) {
  if (typeof text !== 'string' || text === '') return createEmptyState();
  try {
    return migrate(JSON.parse(text));
  } catch {
    return createEmptyState();
  }
}

export function loadState(storage) {
  try {
    return deserialize(storage.getItem(STORAGE_KEY));
  } catch {
    return createEmptyState();
  }
}

/** Returns false when the browser refuses to save (private mode, full quota). */
export function saveState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, serialize(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(storage) {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
