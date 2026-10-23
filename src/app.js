// UI wiring for EcoMetrics. All maths lives in calculator.js; persistence in storage.js.
import { ACTIONS, BENCHMARKS, QUESTIONS } from './constants.js';
import {
  benchmarkScale,
  calculateFootprint,
  findAction,
  savedInLastDays,
  toISODate,
  topCategory,
  totalSaved,
  validateAnswers,
} from './calculator.js';
import { clearState, loadState, saveState } from './storage.js';

const $ = (id) => document.getElementById(id);
const fmt = (n, digits = 0) =>
  n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

let state = loadState(window.localStorage);
let questionIndex = 0;
let draftAnswers = {};
let lastFocus = null;

const INSIGHTS = {
  transport: ['Commute', 'Working remotely or switching to transit has the biggest effect on your estimate.'],
  diet: ['Diet', 'Swapping two meals a week for plant-based ones is an easy first step.'],
  flights: ['Travel', 'Flying is your largest category. Replacing one short-haul flight with a train makes a real dent.'],
  shopping: ['Shopping', 'Try a 30-day wait before non-essential purchases, and buy second-hand when you can.'],
  energy: ['Home energy', 'Look at LED bulbs, cutting standby power, or a renewable tariff.'],
};

function init() {
  $('current-date').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  setupEventListeners();
  if (validateAnswers(state.answers).valid) showApp();
  else startOnboarding();
  document.documentElement.dataset.ready = 'true';
}

// --- Onboarding ---
function startOnboarding() {
  questionIndex = 0;
  draftAnswers = {};
  $('app-layout').classList.add('hidden');
  $('onboarding-view').classList.remove('hidden');
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[questionIndex];
  const container = $('question-container');
  container.replaceChildren();

  const step = document.createElement('p');
  step.className = 'question-step';
  step.textContent = `Question ${questionIndex + 1} of ${QUESTIONS.length}`;

  const heading = document.createElement('h3');
  heading.className = 'question-title';
  heading.id = 'question-title';
  heading.tabIndex = -1;
  heading.textContent = q.text;

  const group = document.createElement('div');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-labelledby', 'question-title');
  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => handleAnswer(q.id, opt.value));
    group.appendChild(btn);
  });

  container.append(step, heading, group);
  const pct = Math.round((questionIndex / QUESTIONS.length) * 100);
  $('onboarding-progress').style.width = `${pct}%`;
  $('onboarding-progress-track').setAttribute('aria-valuenow', String(pct));
  if (questionIndex > 0) heading.focus();
}

function handleAnswer(questionId, value) {
  draftAnswers[questionId] = value;
  questionIndex += 1;
  if (questionIndex < QUESTIONS.length) {
    renderQuestion();
    return;
  }
  state.answers = { ...draftAnswers };
  persist();
  showApp();
}

// --- Dashboard ---
function showApp() {
  $('onboarding-view').classList.add('hidden');
  $('app-layout').classList.remove('hidden');
  updateDashboard();
}

function updateDashboard() {
  const { totalKg } = calculateFootprint(state.answers);
  const today = toISODate(new Date());

  $('user-baseline').textContent = fmt(totalKg);
  $('user-saved').textContent = fmt(savedInLastDays(state.activityLog, 30, today), 1);
  const count = state.activityLog.length;
  $('user-saved-total').textContent =
    `${fmt(totalSaved(state.activityLog), 1)} kg saved across ${count} ${count === 1 ? 'entry' : 'entries'} in total`;
  $('target-value').textContent = fmt(BENCHMARKS.targetKg);

  const scale = benchmarkScale(totalKg);
  $('chart-user').style.width = `${scale.user}%`;
  $('chart-avg').style.width = `${scale.average}%`;
  $('chart-target').style.width = `${scale.target}%`;
  $('chart-user-val').textContent = fmt(totalKg);
  $('chart-avg-val').textContent = fmt(BENCHMARKS.globalAverageKg);
  $('chart-target-val').textContent = fmt(BENCHMARKS.targetKg);

  const top = topCategory(state.answers);
  const [title, body] = INSIGHTS[top] || ['Nice work', 'Your answers are already low across the board. Keep logging actions.'];
  $('insight-title').textContent = title;
  $('insight-body').textContent = body;

  renderActivityTable();
}

function renderActivityTable() {
  const tbody = $('activity-table-body');
  tbody.querySelectorAll('tr:not(#empty-state-row)').forEach((tr) => tr.remove());
  $('empty-state-row').hidden = state.activityLog.length > 0;

  state.activityLog.forEach((log, index) => {
    const tr = document.createElement('tr');
    const action = findAction(log.actionId);
    const shownDate = log.iso
      ? new Date(`${log.iso}T00:00:00`).toLocaleDateString()
      : log.date || 'Unknown date';

    const addCell = (text, className) => {
      const td = document.createElement('td');
      td.textContent = text;
      if (className) td.className = className;
      tr.appendChild(td);
      return td;
    };
    addCell(shownDate, 'text-muted');
    addCell(log.label, 'cell-strong');
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = `-${fmt(log.saving, 1)} kg`;
    addCell('').appendChild(tag);
    addCell(action ? action.tip : '', 'recommendation-cell');

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'text-btn';
    del.textContent = 'Delete';
    del.setAttribute('aria-label', `Delete ${log.label} on ${shownDate}`);
    del.addEventListener('click', () => {
      state.activityLog.splice(index, 1);
      persist();
      updateDashboard();
      announce(`Deleted ${log.label}.`);
      $('open-log-modal-btn').focus();
    });
    addCell('').appendChild(del);
    tbody.appendChild(tr);
  });
}

// --- Log action dialog ---
function openModal() {
  lastFocus = document.activeElement;
  $('log-modal').classList.remove('hidden');
  $('action-select').focus();
}

function closeModal() {
  $('log-modal').classList.add('hidden');
  $('action-select').value = '';
  $('submit-action-btn').disabled = true;
  if (lastFocus) lastFocus.focus();
}

function logAction(action) {
  const now = new Date();
  state.activityLog.unshift({
    actionId: action.id,
    label: action.label,
    saving: action.saving,
    count: 1,
    iso: toISODate(now),
    date: now.toLocaleDateString(),
  });
  persist();
  updateDashboard();
  announce(`Logged ${action.label}: ${fmt(action.saving, 1)} kg CO2e avoided.`);
}

function setupEventListeners() {
  const select = $('action-select');
  const submitBtn = $('submit-action-btn');
  ACTIONS.forEach((a) => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.label} (${fmt(a.saving, 1)} kg)`;
    select.appendChild(opt);
  });

  $('open-log-modal-btn').addEventListener('click', openModal);
  $('close-modal-btn').addEventListener('click', closeModal);
  $('cancel-modal-btn').addEventListener('click', closeModal);
  $('log-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('log-modal').classList.contains('hidden')) closeModal();
  });
  select.addEventListener('change', () => {
    submitBtn.disabled = !select.value;
  });
  submitBtn.addEventListener('click', () => {
    const action = findAction(select.value);
    if (!action) return;
    logAction(action);
    closeModal();
  });

  $('retake-btn').addEventListener('click', startOnboarding);
  $('reset-data-btn').addEventListener('click', () => {
    if (window.confirm('Reset all data and start over? This cannot be undone.')) {
      clearState(window.localStorage);
      state = loadState(window.localStorage);
      startOnboarding();
    }
  });
}

function persist() {
  if (!saveState(window.localStorage, state)) {
    announce('Your browser blocked saving, so this data will be lost when you close the tab.');
  }
}

function announce(message) {
  const el = $('status');
  el.textContent = '';
  window.setTimeout(() => {
    el.textContent = message;
  }, 50);
}

init();
