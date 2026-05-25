'use strict';

// ── STATE ────────────────────────────────────────────────────────────────────

let activeTab = 'rules';
let activeCategory = 'all';
let searchQuery = '';
let fromYear = null;
let toYear = null;

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
  bindYearFilter();
  bindCompareSearch();
  bindNav();
  renderTracker();
  bindTracker();
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

// ── DATE HELPERS ──────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 1) return parts[0];
  const idx = parseInt(parts[1], 10) - 1;
  return MONTHS[idx] + ' ' + parts[0];
}

function getYear(dateStr) {
  return parseInt(dateStr.split('-')[0], 10);
}

// Sort versions newest first, optionally filtered to a year range.
function sortedVersions(versions, from, to) {
  return (versions || [])
    .filter(v => {
      const y = getYear(v.date);
      if (from && y < from) return false;
      if (to && y > to) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── RULES TAB ─────────────────────────────────────────────────────────────────

function buildCategoryPills() {
  const wrap = document.getElementById('cat-pills');
  const allBtn = document.createElement('button');
  allBtn.className = 'pill active';
  allBtn.textContent = 'All';
  allBtn.dataset.cat = 'all';
  allBtn.addEventListener('click', () => setCat('all'));
  wrap.appendChild(allBtn);

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

function bindYearFilter() {
  const fromEl = document.getElementById('year-from');
  const toEl = document.getElementById('year-to');
  const clearBtn = document.getElementById('year-clear');

  const update = () => {
    fromYear = fromEl.value ? parseInt(fromEl.value, 10) : null;
    toYear = toEl.value ? parseInt(toEl.value, 10) : null;
    clearBtn.style.display = (fromEl.value || toEl.value) ? 'flex' : 'none';
    buildRules();
  };

  fromEl.addEventListener('input', update);
  toEl.addEventListener('input', update);
  clearBtn.addEventListener('click', () => {
    fromEl.value = '';
    toEl.value = '';
    fromYear = null;
    toYear = null;
    clearBtn.style.display = 'none';
    buildRules();
  });
}

function buildRules() {
  const container = document.getElementById('rules-list');
  const filtered = filterRules();

  if (!filtered.length) {
    container.innerHTML = '<p class="empty-state">No rules match your filters.</p>';
    return;
  }

  // Group by category preserving category order
  const grouped = {};
  filtered.forEach(({ rule }) => {
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
      const vers = sortedVersions(rule.versions, fromYear, toYear);
      html += renderRuleCard(rule, vers);
    });
  });

  container.innerHTML = html;

  container.querySelectorAll('.rule-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.rule-card').classList.toggle('open');
    });
  });
}

// Returns array of { rule, versions } where versions is already filtered + sorted.
function filterRules() {
  return KILL_TEAM_DATA.rules
    .map(rule => {
      const vers = sortedVersions(rule.versions, fromYear, toYear);
      return { rule, vers };
    })
    .filter(({ rule, vers }) => {
      if (vers.length === 0) return false;
      if (activeCategory !== 'all' && rule.category !== activeCategory) return false;
      if (!searchQuery) return true;
      const corpus = [
        rule.keyword,
        ...(rule.tags || []),
        ...vers.map(v => v.text || ''),
        ...vers.map(v => v.source || ''),
      ].join(' ').toLowerCase();
      return corpus.includes(searchQuery);
    });
}

function renderRuleCard(rule, versions) {
  // Header badges: up to 3 version dates shown
  const shownBadges = versions.slice(0, 3).map(v =>
    `<span class="ver-badge">${escHtml(formatDate(v.date))}</span>`
  ).join('');
  const moreBadge = versions.length > 3
    ? `<span class="ver-badge ver-badge-more">+${versions.length - 3}</span>` : '';

  const bodySections = versions.map((v, i) => {
    const isNewest = i === 0;
    return `<div class="ver-section${isNewest ? ' ver-newest' : ''}">
      <div class="ver-section-head">
        <span class="ver-date-pill${isNewest ? ' newest' : ''}">${escHtml(formatDate(v.date))}</span>
        <span class="ver-source">${escHtml(v.source || '')}</span>
      </div>
      <div class="rule-text">${formatRuleText(v.text || '')}</div>
    </div>`;
  }).join('');

  return `<div class="rule-card" data-id="${escHtml(rule.id)}">
    <div class="rule-header">
      <span class="rule-keyword">${escHtml(rule.keyword)}</span>
      <span class="rule-badges">${shownBadges}${moreBadge}</span>
      <span class="expand-arrow">▼</span>
    </div>
    <div class="rule-body">${bodySections}</div>
  </div>`;
}

function formatRuleText(text) {
  return escHtml(text).replace(/⚠/g, '<span class="warn-marker">⚠</span>');
}

// ── COMPARE TAB ───────────────────────────────────────────────────────────────

function bindCompareSearch() {
  const input = document.getElementById('compare-search');
  input.addEventListener('input', () => {
    compareQuery = input.value.trim().toLowerCase();
    buildCompareSuggestions();
  });
}

function buildCompareSuggestions() {
  const suggestEl = document.getElementById('compare-suggestions');
  const viewEl = document.getElementById('compare-view');

  if (!compareQuery) {
    suggestEl.innerHTML = '';
    viewEl.innerHTML = '<p class="compare-hint">Search for a rule above to see its full version history.</p>';
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

  suggestEl.innerHTML = matches.slice(0, 8).map((rule, i) =>
    `<div class="suggestion-item" data-i="${i}">${escHtml(rule.keyword)}</div>`
  ).join('');

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
  const versions = sortedVersions(rule.versions); // no date filter in compare — show full history

  const blocks = versions.map((v, i) => {
    const isNewest = i === 0;
    return `<div class="compare-ver-block${isNewest ? ' compare-newest' : ''}">
      <div class="compare-ver-head">
        <span class="ver-date-pill${isNewest ? ' newest' : ''}">${escHtml(formatDate(v.date))}</span>
        <span class="ver-source">${escHtml(v.source || '')}</span>
        ${isNewest ? '<span class="newest-label">Latest</span>' : ''}
      </div>
      <div class="compare-ver-text">${formatRuleText(v.text || '')}</div>
    </div>`;
  }).join('');

  const prevDisabled = compareIndex <= 0 ? 'disabled' : '';
  const nextDisabled = compareIndex >= compareResults.length - 1 ? 'disabled' : '';
  const navHtml = compareResults.length > 1 ? `<div class="compare-nav-row">
    <button class="compare-nav-btn" id="compare-prev" ${prevDisabled}>◀ Prev</button>
    <button class="compare-nav-btn" id="compare-next" ${nextDisabled}>Next ▶</button>
  </div>` : '';

  viewEl.innerHTML = `<div class="compare-rule-header">${escHtml(rule.keyword)}</div>
    <div class="compare-ver-count">${versions.length} version${versions.length !== 1 ? 's' : ''} — newest first</div>
    ${blocks}${navHtml}`;

  const prevBtn = viewEl.querySelector('#compare-prev');
  const nextBtn = viewEl.querySelector('#compare-next');
  if (prevBtn) prevBtn.addEventListener('click', () => navigateCompare(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateCompare(1));
}

function navigateCompare(delta) {
  compareIndex = Math.max(0, Math.min(compareResults.length - 1, compareIndex + delta));
  renderCompareView(compareResults[compareIndex]);
}

// ── TRACKER ────────────────────────────────────────────────────────────────────

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
      const names = tracker.players.map(p => p.name);
      tracker = defaultTracker();
      tracker.players.forEach((p, i) => { p.name = names[i]; });
      saveTracker();
      renderTracker();
    }
  });
}

function renderTracker() {
  document.getElementById('tp-current').textContent = tracker.tp;
  document.getElementById('tp-prev').disabled = tracker.tp <= 1;
  document.getElementById('tp-next').disabled = tracker.tp >= 4;

  tracker.players.forEach((player, pi) => {
    const col = document.getElementById(`player-col-${pi}`);
    const nameEl = col.querySelector('.player-name');
    if (nameEl.contentEditable !== 'true') nameEl.textContent = player.name;

    ['cp', 'killOps', 'critOps', 'tacOps'].forEach(stat => {
      col.querySelector(`.cnt-value[data-stat="${stat}"]`).textContent = player[stat];
    });

    col.querySelector('.counter-vp-val').textContent =
      player.killOps + player.critOps + player.tacOps;
  });
}

function adjustStat(pi, stat, delta) {
  tracker.players[pi][stat] = Math.max(0, tracker.players[pi][stat] + delta);
  saveTracker();
  renderTracker();
}

function enableNameEdit(pi) {
  const col = document.getElementById(`player-col-${pi}`);
  const nameEl = col.querySelector('.player-name');
  nameEl.contentEditable = 'true';
  nameEl.focus();
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

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
