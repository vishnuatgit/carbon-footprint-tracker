// --- Application State ---
let state = {
    baseline: 0,
    savedMonthly: 0,
    answers: {},
    activityLog: [], // Array of { date, actionLabel, saving, tip }
    currentQuestionIndex: 0
};

// --- Static Data ---
const questions = [
    {
        id: 'transport',
        text: 'How do you usually commute?',
        options: [
            { text: 'Mostly drive alone', value: 2500 },
            { text: 'Carpool / Public Transit', value: 1200 },
            { text: 'Bike / Walk / Remote', value: 300 }
        ]
    },
    {
        id: 'diet',
        text: 'What is your typical diet profile?',
        options: [
            { text: 'High meat consumption', value: 2500 },
            { text: 'Balanced omnivore', value: 1900 },
            { text: 'Vegetarian / Plant-based', value: 1000 }
        ]
    },
    {
        id: 'energy',
        text: 'What is your primary home energy source?',
        options: [
            { text: 'Standard grid mix', value: 2000 },
            { text: 'Energy efficient / Mixed', value: 1200 },
            { text: '100% Renewable / Solar', value: 300 }
        ]
    },
    {
        id: 'flights',
        text: 'Annual flight frequency?',
        options: [
            { text: '3+ flights', value: 3000 },
            { text: '1-2 short haul', value: 1000 },
            { text: 'None / Rarely', value: 0 }
        ]
    },
    {
        id: 'shopping',
        text: 'General consumption habits?',
        options: [
            { text: 'Frequent new purchases', value: 1500 },
            { text: 'Average consumer', value: 900 },
            { text: 'Minimalist / Second-hand', value: 400 }
        ]
    }
];

const actions = [
    { id: 'transit', label: 'Utilized Public Transit', saving: 4.5, tip: 'High impact: Replaces single-occupancy vehicle emissions.' },
    { id: 'plant_meal', label: 'Plant-based Meal', saving: 2.1, tip: 'Dietary shift: Reduces agricultural methane footprint.' },
    { id: 'second_hand', label: 'Second-hand Purchase', saving: 15.0, tip: 'Circular economy: Extends product lifecycle.' },
    { id: 'line_dry', label: 'Line-dried Laundry', saving: 1.2, tip: 'Energy efficiency: Avoids intensive dryer wattage.' },
    { id: 'bike', label: 'Bicycle Commute', saving: 2.5, tip: 'Zero emission transport utilized.' },
    { id: 'unplug', label: 'Eliminated Phantom Power', saving: 0.5, tip: 'Efficiency: Reduced baseline grid draw.' }
];

// --- DOM Elements ---
const views = {
    onboarding: document.getElementById('onboarding-view'),
    app: document.getElementById('app-layout'),
    logModal: document.getElementById('log-modal')
};

// --- Initialization ---
function init() {
    // Set current date in header
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString(undefined, dateOptions);

    loadState();

    if (state.baseline > 0) {
        showApp();
    } else {
        renderQuestion();
    }

    setupEventListeners();
}

function loadState() {
    const saved = localStorage.getItem('ecoMetricsState');
    if (saved) {
        state = JSON.parse(saved);
        // Ensure activityLog exists (for older versions)
        if (!state.activityLog) state.activityLog = [];
    }
}

function saveState() {
    localStorage.setItem('ecoMetricsState', JSON.stringify(state));
}

// --- Onboarding Logic ---
function renderQuestion() {
    const container = document.getElementById('question-container');
    const progressBar = document.getElementById('onboarding-progress');

    if (state.currentQuestionIndex >= questions.length) {
        finishOnboarding();
        return;
    }

    const q = questions[state.currentQuestionIndex];
    let html = `<div style="margin-bottom: 1.5rem;"><h3 style="font-size: 1.125rem; font-weight: 500;">${q.text}</h3></div>`;
    q.options.forEach((opt) => {
        html += `<button class="option-btn" onclick="handleAnswer(${opt.value})">${opt.text}</button>`;
    });

    container.innerHTML = html;
    
    // Update progress
    const progress = (state.currentQuestionIndex / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

window.handleAnswer = function(value) {
    const qId = questions[state.currentQuestionIndex].id;
    state.answers[qId] = value;
    state.currentQuestionIndex++;
    renderQuestion();
}

function finishOnboarding() {
    state.baseline = Object.values(state.answers).reduce((a, b) => a + b, 0);
    saveState();
    showApp();
}

// --- App Layout Logic ---
function showApp() {
    views.onboarding.classList.remove('active');
    views.onboarding.classList.add('hidden');
    views.app.classList.remove('hidden');
    views.app.classList.add('active');

    updateDashboard();
}

function updateDashboard() {
    // KPI Cards
    document.getElementById('user-baseline').innerText = state.baseline.toLocaleString();
    document.getElementById('user-saved').innerText = state.savedMonthly.toFixed(1);
    
    // Benchmarking Chart
    const maxVal = Math.max(state.baseline, 4000);
    const userPercent = (state.baseline / maxVal) * 100;
    
    setTimeout(() => {
        document.getElementById('chart-user').style.width = `${userPercent}%`;
        document.getElementById('chart-user-val').innerText = state.baseline.toLocaleString();
    }, 100);

    setWeeklyInsight();
    renderActivityTable();
}

function setWeeklyInsight() {
    const el = document.getElementById('weekly-challenge');
    let highestCat = '';
    let highestVal = -1;
    
    for (const [cat, val] of Object.entries(state.answers)) {
        if (val > highestVal) {
            highestVal = val;
            highestCat = cat;
        }
    }

    const insights = {
        transport: "<strong>Commute Optimization:</strong> Telecommuting or transit adoption offers the highest yield for your profile.",
        diet: "<strong>Dietary Shift:</strong> Transitioning 2 meals per week to plant-based protein yields significant footprint reduction.",
        flights: "<strong>Travel Alternatives:</strong> Eliminating one short-haul flight averts ~1,000kg CO₂e.",
        shopping: "<strong>Lifecycle Extension:</strong> Applying a 30-day wait period on non-essential purchases targets your primary emission source.",
        energy: "<strong>Efficiency Audit:</strong> Your grid reliance is high. Focus on LED adoption and eliminating phantom power."
    };

    el.innerHTML = insights[highestCat] || "<strong>Baseline analysis complete:</strong> Begin logging actions to track mitigation.";
}

// --- Activity Logging ---
function setupEventListeners() {
    const modal = views.logModal;
    const select = document.getElementById('action-select');
    const submitBtn = document.getElementById('submit-action-btn');

    // Populate Select
    actions.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.innerText = a.label;
        select.appendChild(opt);
    });

    // Modal Triggers
    document.getElementById('open-log-modal-btn').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    document.getElementById('close-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('cancel-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));

    select.addEventListener('change', () => {
        submitBtn.disabled = !select.value;
    });

    submitBtn.addEventListener('click', () => {
        const act = actions.find(a => a.id === select.value);
        if (act) {
            logAction(act);
            modal.classList.add('hidden');
            select.value = '';
            submitBtn.disabled = true;
        }
    });

    // Reset
    document.getElementById('reset-data-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to reset all data and start over?")) {
            localStorage.removeItem('ecoMetricsState');
            location.reload();
        }
    });
}

function logAction(actionData) {
    state.savedMonthly += actionData.saving;
    
    const entry = {
        date: new Date().toLocaleDateString(),
        label: actionData.label,
        saving: actionData.saving,
        tip: actionData.tip
    };
    
    // Add to top of array
    state.activityLog.unshift(entry);
    
    saveState();
    updateDashboard();
}

function renderActivityTable() {
    const tbody = document.getElementById('activity-table-body');
    const emptyState = document.getElementById('empty-state-row');
    
    // Clear existing dynamic rows
    Array.from(tbody.children).forEach(child => {
        if (child.id !== 'empty-state-row') {
            tbody.removeChild(child);
        }
    });

    if (state.activityLog.length === 0) {
        emptyState.style.display = 'table-row';
        return;
    }

    emptyState.style.display = 'none';

    state.activityLog.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-muted">${log.date}</td>
            <td style="font-weight: 500;">${log.label}</td>
            <td><span class="tag">-${log.saving} kg</span></td>
            <td class="recommendation-cell" title="${log.tip}">${log.tip}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Start App
init();
