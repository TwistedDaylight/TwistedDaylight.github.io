'use strict';

// ── STATE ────────────────────────────────────────────────────────────────────

let activeTab = 'rules';
let activeCategory = 'all';
let searchQuery = '';

let compareQuery = '';
let compareResults = [];
let compareIndex = 0;

const TRACKER_KEY = 'kt-tracker-v1';
let tracker = loadTracker();

// ── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  buildCategoryPills();
  buildRules();
  bindRulesSearch();
  bindCompareSearch();
  bindNav();
  renderTracker();
  bindTracker();
  bindCompareHints();
});

// ── NAVIGATION ───────────────────────────────────────────────────────────────

function bindNav() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + tabId).classList.add('active');
  document.querySelector(`.nav-tab[data-tab="${tabId}"]`).classList.add('active');
}

// ── RULES TAB ─────────────────────────────────────────────────────────────────

function buildCategoryPills() {
  const wrap = document.getElementById('cat-pills');
  const all = document.createElement('button');
  all.className = 'pill active';
  all.textContent = 'All';
  all.dataset.cat = 'all';
  all.addEventListener('click', () => setCat('all'));
  wrap.appendChild(all);

  KILL_TEAM_DATA.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.textContent = cat.label;
    btn.dataset.cat = cat.id;
    btn.addEventListener('click', () => setCat(cat.id));
    wrap.appendChild(btn);
  });
}

function setCat(catId) {
  activeCategory = catId;
  document.querySelectorAll('#cat-pills .pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === catId);
  });
  buildRules();
}

function bindRulesSearch() {
  const input = document.getElementById('rules-search');
  input.addEventListener('input', () => {
    searchQuery = input.value.trim().toLowerCase();
    buildRules();
  });
}

function buildRules() {
  const container = document.getElementById('rules-list');
  const filtered = filterRules(searchQuery, activeCategory);

  if (!filtered.length) {
    container.innerHTML = '<p class="empty-state">No rules match your search.</p>';
    return;
  }

  // Group by category
  const grouped = {};
  filtered.forEach(rule => {
    if (!grouped[rule.category]) grouped[rule.category] = [];
    grouped[rule.category].push(rule);
  });

  const catOrder = KILL_TEAM_DATA.categories.map(c => c.id);
  let html = '';

  catOrder.forEach(catId => {
    if (!grouped[catId]) return;
    const cat = KILL_TEAM_DATA.categories.find(c => c.id === catId);
    html += `<div class="cat-header">${escHtml(cat.label)}</div>`;
    grouped[catId].forEach(rule => {
      html += renderRuleCard(rule);
    });
  });

  container.innerHTML = html;

  container.querySelectorAll('.rule-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.rule-card');
      card.classList.toggle('open');
    });
  });
}

function filterRules(query, catId) {
  return KILL_TEAM_DATA.rules.filter(rule => {
    if (catId !== 'all' && rule.category !== catId) return false;
    if (!query) return true;
    const corpus = [
      rule.keyword,
      ...(rule.tags || []),
      ...Object.values(rule.editions).map(e => edText(e)),
    ].join(' ').toLowerCase();
    return corpus.includes(query);
  });
}

function renderRuleCard(rule) {
  const edKeys = Object.keys(rule.editions);
  const badges = edKeys.map(k => {
    const ed = KILL_TEAM_DATA.editions[k];
    return `<span class="ed-badge ed-${k}">${ed.shortLabel}</span>`;
  }).join('');

  const bodySections = Object.entries(rule.editions).map(([k, entry]) => {
    const ed = KILL_TEAM_DATA.editions[k];
    const text = formatRuleText(edText(entry));
    return `<div class="ed-section">
      <span class="ed-label ed-${k}">${ed.label}</span>
      <div class="rule-text">${text}</div>
    </div>`;
  }).join('');

  return `<div class="rule-card" data-id="${escHtml(rule.id)}">
    <div class="rule-header">
      <span class="rule-keyword">${escHtml(rule.keyword)}</span>
      <span class="rule-badges">${badges}</span>
      <span class="expand-arrow">▼</span>
    </div>
    <div class="rule-body">${bodySections}</div>
  </div>`;
}

function formatRuleText(text) {
  // highlight ⚠ warnings
  const escaped = escHtml(text);
  return escaped.replace(/⚠/g, '<span class="warn-marker">⚠</span>');
}

// ── COMPARE TAB ───────────────────────────────────────────────────────────────

function bindCompareSearch() {
  const input = document.getElementById('compare-search');
  input.addEventListener('input', () => {
    compareQuery = input.value.trim().toLowerCase();
    buildCompareSuggestions();
  });
}

function bindCompareHints() {
  // prev/next wired after render; just pre-bind container
}

function buildCompareSuggestions() {
  const suggestEl = document.getElementById('compare-suggestions');
  const viewEl = document.getElementById('compare-view');

  if (!compareQuery) {
    suggestEl.innerHTML = '';
    viewEl.innerHTML = '<p class="compare-hint">Search for a rule above to compare it between editions.</p>';
    return;
  }

  const matches = KILL_TEAM_DATA.rules.filter(rule => {
    const corpus = [rule.keyword, ...(rule.tags || [])].join(' ').toLowerCase();
    return corpus.includes(compareQuery);
  });

  compareResults = matches;
  compareIndex = 0;

  if (!matches.length) {
    suggestEl.innerHTML = '';
    viewEl.innerHTML = '<p class="compare-hint">No rules found. Try a different keyword.</p>';
    return;
  }

  if (matches.length === 1) {
    suggestEl.innerHTML = '';
    renderCompareView(matches[0]);
    return;
  }

  // Show suggestions
  suggestEl.innerHTML = matches.slice(0, 8).map((rule, i) => {
    return `<div class="suggestion-item" data-i="${i}">${escHtml(rule.keyword)}</div>`;
  }).join('');

  suggestEl.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      compareIndex = parseInt(item.dataset.i);
      suggestEl.innerHTML = '';
      renderCompareView(compareResults[compareIndex]);
    });
  });

  viewEl.innerHTML = '';
}

function renderCompareView(rule) {
  const viewEl = document.getElementById('compare-view');
  const allEdKeys = Object.keys(KILL_TEAM_DATA.editions);

  const blocks = allEdKeys.map(k => {
    const ed = KILL_TEAM_DATA.editions[k];
    const entry = rule.editions[k];
    const contentHtml = entry
      ? `<div class="compare-ed-text">${formatRuleText(edText(entry))}</div>`
      : `<div class="compare-ed-absent">Not present in this edition.</div>`;
    return `<div class="compare-ed-block ed-${k}">
      <div class="compare-ed-title">${escHtml(ed.label)}</div>
      ${contentHtml}
    </div>`;
  }).join('');

  const prevDisabled = compareIndex <= 0 ? 'disabled' : '';
  const nextDisabled = compareIndex >= compareResults.length - 1 ? 'disabled' : '';
  const navHtml = compareResults.length > 1 ? `<div class="compare-nav-row">
    <button class="compare-nav-btn" id="compare-prev" ${prevDisabled}>◀ Prev</button>
    <button class="compare-nav-btn" id="compare-next" ${nextDisabled}>Next ▶</button>
  </div>` : '';

  viewEl.innerHTML = `<div class="compare-rule-header">${escHtml(rule.keyword)}</div>${blocks}${navHtml}`;

  const prevBtn = viewEl.querySelector('#compare-prev');
  const nextBtn = viewEl.querySelector('#compare-next');
  if (prevBtn) prevBtn.addEventListener('click', () => navigateCompare(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateCompare(1));
}

function navigateCompare(delta) {
  compareIndex = Math.max(0, Math.min(compareResults.length - 1, compareIndex + delta));
  renderCompareView(compareResults[compareIndex]);
}

// ── TRACKER TAB ───────────────────────────────────────────────────────────────

function loadTracker() {
  try {
    const raw = localStorage.getItem(TRACKER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultTracker();
}

function defaultTracker() {
  return {
    tp: 1,
    players: [
      { name: 'Player 1', cp: 0, killOps: 0, critOps: 0, tacOps: 0 },
      { name: 'Player 2', cp: 0, killOps: 0, critOps: 0, tacOps: 0 },
    ]
  };
}

function saveTracker() {
  try { localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker)); } catch {}
}

function bindTracker() {
  document.getElementById('tp-prev').addEventListener('click', () => {
    if (tracker.tp > 1) { tracker.tp--; saveTracker(); renderTracker(); }
  });
  document.getElementById('tp-next').addEventListener('click', () => {
    if (tracker.tp < 4) { tracker.tp++; saveTracker(); renderTracker(); }
  });
  document.getElementById('reset-game').addEventListener('click', () => {
    if (confirm('Reset the game? All counters will be cleared.')) {
      // preserve names
      const names = tracker.players.map(p => p.name);
      tracker = defaultTracker();
      tracker.players.forEach((p, i) => { p.name = names[i]; });
      saveTracker();
      renderTracker();
    }
  });
}

function renderTracker() {
  // Turning point
  document.getElementById('tp-current').textContent = tracker.tp;
  document.getElementById('tp-prev').disabled = tracker.tp <= 1;
  document.getElementById('tp-next').disabled = tracker.tp >= 4;

  // Players
  tracker.players.forEach((player, pi) => {
    const col = document.getElementById(`player-col-${pi}`);

    // Name (don't overwrite while user is typing)
    const nameEl = col.querySelector('.player-name');
    if (nameEl.contentEditable !== 'true') nameEl.textContent = player.name;

    // Counters
    const stats = ['cp', 'killOps', 'critOps', 'tacOps'];
    stats.forEach(stat => {
      col.querySelector(`.cnt-value[data-stat="${stat}"]`).textContent = player[stat];
    });

    // VP (KillOps + CritOps + TacOps)
    col.querySelector('.counter-vp-val').textContent = player.killOps + player.critOps + player.tacOps;
  });
}

function adjustStat(pi, stat, delta) {
  tracker.players[pi][stat] = Math.max(0, tracker.players[pi][stat] + delta);
  saveTracker();
  renderTracker();
}

// Name editing
function enableNameEdit(pi) {
  const col = document.getElementById(`player-col-${pi}`);
  const nameEl = col.querySelector('.player-name');
  nameEl.contentEditable = 'true';
  nameEl.focus();
  // Select all
  const range = document.createRange();
  range.selectNodeContents(nameEl);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  const finish = () => {
    nameEl.contentEditable = 'false';
    const newName = nameEl.textContent.trim() || `Player ${pi + 1}`;
    nameEl.textContent = newName;
    tracker.players[pi].name = newName;
    saveTracker();
    renderTracker();
  };

  nameEl.addEventListener('blur', finish, { once: true });
  nameEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
  }, { once: true });
}

// ── UTILS ─────────────────────────────────────────────────────────────────────

// editions values can be a plain string OR an object { text, notes }
function edText(entry) {
  if (!entry) return '';
  return typeof entry === 'string' ? entry : (entry.text || '');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
