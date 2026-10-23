import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, BENCHMARKS, MAX_COUNT, QUESTIONS } from '../src/constants.js';
import {
  actionSaving,
  addDays,
  benchmarkScale,
  calculateFootprint,
  findAction,
  isISODate,
  savedInLastDays,
  sumKg,
  toISODate,
  topCategory,
  totalSaved,
  validateAnswers,
} from '../src/calculator.js';

const highAnswers = { transport: 2500, diet: 2500, energy: 2000, flights: 3000, shopping: 1500 };
const lowAnswers = { transport: 300, diet: 1000, energy: 300, flights: 0, shopping: 400 };

test('constants: ids are unique and every factor is a non-negative number', () => {
  const qIds = QUESTIONS.map((q) => q.id);
  assert.equal(new Set(qIds).size, qIds.length);
  const aIds = ACTIONS.map((a) => a.id);
  assert.equal(new Set(aIds).size, aIds.length);
  for (const q of QUESTIONS) {
    assert.equal(q.options.length, 3);
    for (const o of q.options) assert.ok(Number.isFinite(o.value) && o.value >= 0);
  }
  for (const a of ACTIONS) assert.ok(a.saving > 0 && a.label && a.tip);
  assert.equal(BENCHMARKS.globalAverageKg, 4000);
  assert.equal(BENCHMARKS.targetKg, 2500);
});

test('sumKg avoids floating-point drift', () => {
  assert.equal(sumKg([0.1, 0.2]), 0.3);
  assert.equal(sumKg([2.1, 1.2]), 3.3);
  assert.equal(sumKg([]), 0);
});

test('calculateFootprint adds the five answers', () => {
  assert.equal(calculateFootprint(highAnswers).totalKg, 11500);
  assert.equal(calculateFootprint(lowAnswers).totalKg, 2000);
});

test('calculateFootprint breakdown shares add up to 1', () => {
  const { breakdown } = calculateFootprint(highAnswers);
  assert.equal(breakdown.length, QUESTIONS.length);
  const total = breakdown.reduce((a, b) => a + b.share, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  assert.equal(breakdown.find((b) => b.id === 'flights').kg, 3000);
});

test('validateAnswers reports missing and invalid answers', () => {
  assert.deepEqual(validateAnswers(highAnswers), { valid: true, problems: [] });
  assert.deepEqual(validateAnswers({}).problems, QUESTIONS.map((q) => q.id));
  assert.equal(validateAnswers(null).valid, false);
  const bad = { ...highAnswers, diet: 1234, flights: '3000' };
  assert.deepEqual(validateAnswers(bad).problems, ['diet', 'flights']);
});

test('calculateFootprint throws on incomplete answers', () => {
  assert.throws(() => calculateFootprint({ transport: 2500 }), /Missing or invalid answers/);
  assert.throws(() => calculateFootprint(undefined), /Missing or invalid answers/);
});

test('topCategory picks the largest value, first one wins a tie', () => {
  assert.equal(topCategory(highAnswers), 'flights');
  assert.equal(topCategory({ ...highAnswers, flights: 0 }), 'transport');
  assert.equal(topCategory({}), null);
  assert.equal(topCategory({ transport: 0, flights: 0 }), null);
});

test('actionSaving multiplies by count and validates input', () => {
  assert.equal(actionSaving('transit'), 4.5);
  assert.equal(actionSaving('plant_meal', 3), 6.3);
  assert.equal(actionSaving('unplug', MAX_COUNT), 10);
  assert.throws(() => actionSaving('teleport'), /Unknown action/);
  assert.throws(() => actionSaving('bike', 0), RangeError);
  assert.throws(() => actionSaving('bike', 1.5), RangeError);
  assert.throws(() => actionSaving('bike', MAX_COUNT + 1), RangeError);
});

test('findAction returns null for unknown ids', () => {
  assert.equal(findAction('bike').saving, 2.5);
  assert.equal(findAction('nope'), null);
  assert.equal(findAction(undefined), null);
});

test('date helpers', () => {
  assert.equal(isISODate('2026-02-28'), true);
  assert.equal(isISODate('2026-02-30'), false);
  assert.equal(isISODate('6/15/2026'), false);
  assert.equal(isISODate(null), false);
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2024-12-31', 1), '2025-01-01');
  assert.equal(toISODate(new Date(2026, 0, 5)), '2026-01-05');
});

test('totalSaved sums every entry', () => {
  const log = [{ saving: 4.5 }, { saving: 2.1 }, { saving: 1.2 }];
  assert.equal(totalSaved(log), 7.8);
  assert.equal(totalSaved([]), 0);
  assert.equal(totalSaved(undefined), 0);
});

test('savedInLastDays counts only the window, today included', () => {
  const today = '2026-10-23';
  const log = [
    { saving: 4.5, iso: '2026-10-23' },
    { saving: 2.1, iso: '2026-09-24' }, // 29 days ago: inside a 30-day window
    { saving: 15, iso: '2026-09-23' }, // 30 days ago: outside
    { saving: 1.2, iso: null }, // legacy entry without a date
    { saving: 9, iso: '2026-10-24' }, // future: ignored
  ];
  assert.equal(savedInLastDays(log, 30, today), 6.6);
  assert.equal(savedInLastDays(log, 1, today), 4.5);
  assert.equal(savedInLastDays([], 30, today), 0);
});

test('benchmarkScale scales bars to the largest value', () => {
  assert.deepEqual(benchmarkScale(2000), { user: 50, average: 100, target: 62.5 });
  assert.deepEqual(benchmarkScale(8000), { user: 100, average: 50, target: 31.3 });
  assert.deepEqual(benchmarkScale(0), { user: 0, average: 100, target: 62.5 });
});
