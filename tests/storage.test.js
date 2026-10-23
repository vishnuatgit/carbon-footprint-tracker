import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  clearState,
  createEmptyState,
  deserialize,
  loadState,
  migrate,
  saveState,
  serialize,
} from '../src/storage.js';

const answers = { transport: 1200, diet: 1900, energy: 2000, flights: 1000, shopping: 900 };

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
    data,
  };
}

test('empty state shape', () => {
  assert.deepEqual(createEmptyState(), { version: SCHEMA_VERSION, answers: {}, activityLog: [] });
});

test('serialize and deserialize round-trip', () => {
  const state = {
    ...createEmptyState(),
    answers,
    activityLog: [{ actionId: 'bike', label: 'Bicycle commute', saving: 2.5, count: 1, iso: '2026-10-20', date: '10/20/2026' }],
  };
  assert.deepEqual(deserialize(serialize(state)), state);
});

test('deserialize never throws on corrupt input', () => {
  for (const bad of ['{not json', 'null', '42', '"text"', '[]', '', undefined, null]) {
    assert.deepEqual(deserialize(bad), createEmptyState());
  }
});

test('migrates version 1 data (old app.js format)', () => {
  const v1 = {
    baseline: 7000,
    savedMonthly: 6.6000000001,
    answers,
    currentQuestionIndex: 5,
    activityLog: [
      { date: '6/15/2026', label: 'Utilized Public Transit', saving: 4.5, tip: 'old tip' },
      { date: '6/14/2026', label: 'Plant-based Meal', saving: 2.1, tip: 'old tip' },
    ],
  };
  const state = migrate(v1);
  assert.equal(state.version, SCHEMA_VERSION);
  assert.deepEqual(state.answers, answers);
  assert.equal(state.activityLog.length, 2);
  assert.deepEqual(state.activityLog[0], {
    actionId: null,
    label: 'Utilized Public Transit',
    saving: 4.5,
    count: 1,
    iso: null,
    date: '6/15/2026',
  });
  assert.equal('baseline' in state, false);
  assert.equal('savedMonthly' in state, false);
});

test('migrate drops invalid answers and bad log entries', () => {
  const state = migrate({
    answers: { ...answers, diet: 99999 },
    activityLog: [
      null,
      'text',
      { label: 'No saving' },
      { label: 'Negative', saving: -1 },
      { label: 'Huge', saving: 1e9 },
      { label: '', saving: 1 },
      { actionId: 'bike', saving: 2.5, iso: 'not-a-date', count: -3 },
    ],
  });
  assert.deepEqual(state.answers, {});
  assert.equal(state.activityLog.length, 1);
  assert.equal(state.activityLog[0].label, 'Bicycle commute');
  assert.equal(state.activityLog[0].iso, null);
  assert.equal(state.activityLog[0].count, 1);
});

test('migrate uses the current label for known actions and trims long text', () => {
  const state = migrate({ activityLog: [{ actionId: 'bike', label: 'Old name', saving: 2.5 }, { label: 'x'.repeat(500), saving: 1 }] });
  assert.equal(state.activityLog[0].label, 'Bicycle commute');
  assert.equal(state.activityLog[1].label.length, 120);
});

test('loadState and saveState use the storage key', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadState(storage), createEmptyState());
  const state = { ...createEmptyState(), answers };
  assert.equal(saveState(storage, state), true);
  assert.ok(storage.data[STORAGE_KEY]);
  assert.deepEqual(loadState(storage), state);
  clearState(storage);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('storage failures are handled without throwing', () => {
  const broken = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => {
      throw new Error('SecurityError');
    },
  };
  assert.deepEqual(loadState(broken), createEmptyState());
  assert.equal(saveState(broken, createEmptyState()), false);
  assert.doesNotThrow(() => clearState(broken));
});
