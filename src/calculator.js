// Pure calculation helpers. No DOM and no storage, so they are easy to unit test.
import { ACTIONS, BENCHMARKS, MAX_COUNT, QUESTIONS } from './constants.js';

/** Sums kg values in integer tenths so 0.1 + 0.2 is exactly 0.3. */
export function sumKg(values) {
  const tenths = values.reduce((acc, v) => acc + Math.round(Number(v) * 10), 0);
  return tenths / 10;
}

/** Lists the ids of questions that are missing or have an invalid answer. */
export function validateAnswers(answers) {
  const problems = [];
  for (const q of QUESTIONS) {
    const v = answers ? answers[q.id] : undefined;
    if (!q.options.some((o) => o.value === v)) problems.push(q.id);
  }
  return { valid: problems.length === 0, problems };
}

/** Annual baseline in kg CO2e plus a per-category breakdown. */
export function calculateFootprint(answers) {
  const { valid, problems } = validateAnswers(answers);
  if (!valid) throw new Error(`Missing or invalid answers: ${problems.join(', ')}`);
  const totalKg = QUESTIONS.reduce((acc, q) => acc + answers[q.id], 0);
  const breakdown = QUESTIONS.map((q) => ({
    id: q.id,
    kg: answers[q.id],
    share: totalKg === 0 ? 0 : answers[q.id] / totalKg,
  }));
  return { totalKg, breakdown };
}

/** The category with the largest value (the first one wins a tie), or null. */
export function topCategory(answers) {
  let best = null;
  for (const q of QUESTIONS) {
    const v = answers ? answers[q.id] : undefined;
    if (typeof v === 'number' && v > 0 && (best === null || v > answers[best])) best = q.id;
  }
  return best;
}

export function findAction(id) {
  return ACTIONS.find((a) => a.id === id) || null;
}

/** kg CO2e saved by doing an action `count` times. */
export function actionSaving(actionId, count = 1) {
  const action = findAction(actionId);
  if (!action) throw new Error(`Unknown action: ${actionId}`);
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    throw new RangeError(`Count must be a whole number from 1 to ${MAX_COUNT}`);
  }
  return sumKg(Array(count).fill(action.saving));
}

export function isISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Local calendar date as YYYY-MM-DD. */
export function toISODate(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function totalSaved(log) {
  return sumKg((log || []).map((e) => e.saving));
}

/** kg saved in the last `days` days, today included. Entries without an ISO date are skipped. */
export function savedInLastDays(log, days, today) {
  const from = addDays(today, -(days - 1));
  return sumKg(
    (log || []).filter((e) => isISODate(e.iso) && e.iso >= from && e.iso <= today).map((e) => e.saving),
  );
}

/** Bar widths (0 to 100) for the benchmark chart, scaled to the largest value. */
export function benchmarkScale(baselineKg) {
  const { globalAverageKg, targetKg } = BENCHMARKS;
  const max = Math.max(baselineKg, globalAverageKg, targetKg);
  const pct = (v) => Math.round((v / max) * 1000) / 10;
  return { user: pct(baselineKg), average: pct(globalAverageKg), target: pct(targetKg) };
}
