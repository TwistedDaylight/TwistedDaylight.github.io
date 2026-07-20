// ── DISH BOOK ──────────────────────────────────────
// Each dish has 3 tiers of recipes (ordered ingredient stacks).
// Tier grows from a couple of steps up to 5 as the shift progresses.
const dishBook = {
  burger: { icon: '🍔', tiers: [
    ['🍞', '🥩', '🍞'],
    ['🍞', '🥩', '🧀', '🍞'],
    ['🍞', '🥩', '🧀', '🥬', '🍞'],
  ]},
  sandwich: { icon: '🥪', tiers: [
    ['🍞', '🍖', '🍞'],
    ['🍞', '🧀', '🍖', '🍞'],
    ['🍞', '🧀', '🍖', '🍅', '🍞'],
  ]},
  pizza: { icon: '🍕', tiers: [
    ['🫓', '🧀'],
    ['🫓', '🍅', '🧀'],
    ['🫓', '🍅', '🧀', '🍄', '🫒'],
  ]},
  sundae: { icon: '🍨', tiers: [
    ['🍦', '🍫'],
    ['🍦', '🍦', '🍫'],
    ['🍦', '🍦', '🍫', '🍒', '🍓'],
  ]},
  taco: { icon: '🌮', tiers: [
    ['🫓', '🥩'],
    ['🫓', '🥩', '🧀'],
    ['🫓', '🥩', '🧀', '🥬', '🍅'],
  ]},
};

const EXTRA_INGREDIENTS = ['🧅', '🥓', '🍳', '🥒', '🍄', '🫒', '🍓', '🍒'];
const CUSTOMERS = ['🧒', '👧', '👦', '🧑‍🦱', '👩‍🦰', '🧔', '👨‍🦳', '👩', '🧑‍🦳', '👴'];

// ── SETTINGS / PERSISTENCE ────────────────────────
const defaultSettings = {
  shiftLength: 6,
  dishes: { burger: true, sandwich: true, pizza: true, sundae: true, taco: true },
};

function loadSettings() {
  try {
    const s = localStorage.getItem('lc_settings');
    if (s) return { ...defaultSettings, ...JSON.parse(s), dishes: { ...defaultSettings.dishes, ...(JSON.parse(s).dishes || {}) } };
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultSettings));
}
function persistSettings() {
  try { localStorage.setItem('lc_settings', JSON.stringify(settings)); } catch (e) {}
}

let settings = loadSettings();
let editDirty = false;

// ── GAME STATE ─────────────────────────────────────
let orderIndex = 0;          // 0-based index within the current shift
let starsThisShift = [];
let customersThisShift = [];
let currentRecipe = [];
let progressIndex = 0;
let wrongTapsThisOrder = 0;
let lastDish = null;
let currentCustomer = '🧒';

// ── SCREEN ROUTER ──────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  if (name === 'welcome') updateWelcomePreview();
  if (name === 'edit') buildEditScreen();
}

function updateWelcomePreview() {
  document.getElementById('sp-plates').textContent = '🍽️'.repeat(settings.shiftLength);
}

function goWelcome() { showScreen('welcome'); }

// ── STARTING / RUNNING A SHIFT ─────────────────────
function startNewDay() {
  orderIndex = 0;
  starsThisShift = [];
  customersThisShift = [];
  lastDish = null;
  buildProgressPips();
  showScreen('kitchen');
  nextOrder();
}

function buildProgressPips() {
  const wrap = document.getElementById('progress-pips');
  wrap.innerHTML = '';
  for (let i = 0; i < settings.shiftLength; i++) {
    const span = document.createElement('span');
    span.textContent = '🍽️';
    span.id = 'pip-' + i;
    wrap.appendChild(span);
  }
}

function updateProgressPips() {
  for (let i = 0; i < settings.shiftLength; i++) {
    const pip = document.getElementById('pip-' + i);
    if (!pip) continue;
    pip.classList.toggle('filled', i < orderIndex);
    pip.classList.toggle('current', i === orderIndex);
  }
}

function updateSky() {
  const frac = settings.shiftLength > 0 ? orderIndex / settings.shiftLength : 0;
  const sky = document.getElementById('sky');
  sky.classList.remove('day', 'evening');
  if (frac >= 0.66) sky.classList.add('evening');
  else if (frac >= 0.3) sky.classList.add('day');
}

function activeDishIds() {
  return Object.entries(settings.dishes).filter(([, on]) => on).map(([id]) => id);
}

function pickDish() {
  let ids = activeDishIds();
  if (!ids.length) ids = Object.keys(dishBook); // safety net
  if (ids.length > 1 && lastDish) ids = ids.filter(id => id !== lastDish);
  const id = ids[Math.floor(Math.random() * ids.length)];
  lastDish = id;
  return id;
}

function tierForProgress() {
  const frac = settings.shiftLength > 0 ? orderIndex / settings.shiftLength : 0;
  if (frac < 0.34) return 0;
  if (frac < 0.7) return 1;
  return 2;
}

function nextOrder() {
  if (orderIndex >= settings.shiftLength) { showRecap(); return; }

  updateSky();
  updateProgressPips();

  const dishId = pickDish();
  const dish = dishBook[dishId];
  const tier = Math.min(tierForProgress(), dish.tiers.length - 1);
  currentRecipe = dish.tiers[tier].slice();
  progressIndex = 0;
  wrongTapsThisOrder = 0;

  currentCustomer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  document.getElementById('ticket-customer').textContent = currentCustomer;
  document.getElementById('ticket-dish-icon').textContent = dish.icon;

  document.getElementById('board').innerHTML = '';
  const bell = document.getElementById('serve-bell');
  bell.classList.remove('ready');
  bell.disabled = true;

  renderTicket();
  renderTray(dishId, tier);
}

function renderTicket() {
  const wrap = document.getElementById('ticket-recipe');
  wrap.innerHTML = '';
  currentRecipe.forEach((icon, i) => {
    const div = document.createElement('div');
    div.className = 'step ' + (i < progressIndex ? 'done' : i === progressIndex ? 'next' : 'upcoming');
    div.textContent = icon;
    wrap.appendChild(div);
  });
}

function renderTray(dishId, tier) {
  const uniqueNeeded = [...new Set(currentRecipe)];
  const distractorCount = tier; // 0, 1, or 2 extra decoy ingredients
  const pool = EXTRA_INGREDIENTS.filter(i => !uniqueNeeded.includes(i));
  const distractors = shuffle(pool).slice(0, distractorCount);
  const trayIcons = shuffle([...uniqueNeeded, ...distractors]);

  const tray = document.getElementById('tray');
  tray.innerHTML = '';
  trayIcons.forEach(icon => {
    const bowl = document.createElement('div');
    bowl.className = 'bowl';
    bowl.textContent = icon;
    bowl.onclick = () => tapIngredient(icon, bowl);
    tray.appendChild(bowl);
  });
  updateTrayGlow();
}

function updateTrayGlow() {
  const needed = currentRecipe[progressIndex];
  document.querySelectorAll('#tray .bowl').forEach(b => {
    b.classList.toggle('glow', b.textContent === needed);
  });
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── TAP INGREDIENT ─────────────────────────────────
function tapIngredient(icon, bowlEl) {
  if (progressIndex >= currentRecipe.length) return;

  if (icon === currentRecipe[progressIndex]) {
    const board = document.getElementById('board');
    const span = document.createElement('span');
    span.className = 'stacked';
    span.textContent = icon;
    board.appendChild(span);

    progressIndex++;
    renderTicket();
    updateTrayGlow();

    if (progressIndex === currentRecipe.length) {
      const bell = document.getElementById('serve-bell');
      bell.classList.add('ready');
      bell.disabled = false;
    }
  } else {
    bowlEl.classList.remove('shake');
    void bowlEl.offsetWidth;
    bowlEl.classList.add('shake');
    wrongTapsThisOrder++;
  }
}

// ── SERVE ───────────────────────────────────────────
function serveOrder() {
  if (progressIndex < currentRecipe.length) return;

  const stars = Math.max(1, 3 - wrongTapsThisOrder);
  starsThisShift.push(stars);
  customersThisShift.push(currentCustomer);

  document.getElementById('reaction-avatar').textContent = currentCustomer;
  const starsWrap = document.getElementById('reaction-stars');
  starsWrap.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const s = document.createElement('span');
    s.textContent = i < stars ? '⭐' : '☆';
    starsWrap.appendChild(s);
  }

  launchConfetti();
  const overlay = document.getElementById('reaction-overlay');
  overlay.classList.add('show');

  setTimeout(() => {
    overlay.classList.remove('show');
    orderIndex++;
    nextOrder();
  }, 1500);
}

// ── RECAP / SLEEP ───────────────────────────────────
function showRecap() {
  const totalStars = starsThisShift.reduce((a, b) => a + b, 0);
  document.getElementById('recap-stars-earned').textContent = '⭐'.repeat(Math.max(1, totalStars));
  document.getElementById('recap-customers').textContent = customersThisShift.join(' ');

  const scene = document.getElementById('recap-scene');
  scene.className = 'recap-scene phase-evening';
  document.getElementById('wake-btn').style.display = 'none';

  buildRecapStarsBg();
  showScreen('recap');
}

function buildRecapStarsBg() {
  const wrap = document.getElementById('recap-stars-bg');
  wrap.innerHTML = '';
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('span');
    s.textContent = '✨';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 55 + '%';
    s.style.animationDelay = (Math.random() * 2) + 's';
    wrap.appendChild(s);
  }
}

function goToSleep() {
  const scene = document.getElementById('recap-scene');
  scene.className = 'recap-scene phase-night';
  setTimeout(showWake, 3200);
}

function showWake() {
  const scene = document.getElementById('recap-scene');
  scene.className = 'recap-scene phase-morning';
  document.getElementById('wake-btn').style.display = 'flex';
}

function wakeUp() {
  startNewDay();
}

// ── CONFETTI ─────────────────────────────────────────
function launchConfetti() {
  const colors = ['#2BB6A3', '#FFD32A', '#FF6FA5', '#FF9A6B', '#7FCBFF', '#2ED573'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.cssText = `left:${Math.random() * 100}vw;top:-20px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay:${Math.random() * 1}s;animation-duration:${1.6 + Math.random() * 1.2}s;
      transform:rotate(${Math.random() * 360}deg);
      width:${7 + Math.random() * 10}px;height:${7 + Math.random() * 10}px;
      border-radius:${Math.random() > .5 ? '50%' : '3px'};`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3200);
  }
}

// ── EDIT / SETTINGS SCREEN ──────────────────────────
function buildEditScreen() {
  editDirty = false;
  document.getElementById('save-banner').classList.remove('visible');

  const grid = document.getElementById('dish-grid');
  grid.innerHTML = '';
  Object.entries(dishBook).forEach(([id, dish]) => {
    const on = !!settings.dishes[id];
    const el = document.createElement('div');
    el.className = 'dish-toggle' + (on ? ' on' : '');
    el.id = 'dish-toggle-' + id;
    el.innerHTML = `<span class="dt-emoji">${dish.icon}</span><span class="dt-check">✓ ON</span>`;
    el.onclick = () => toggleDish(id);
    grid.appendChild(el);
  });

  document.getElementById('shift-length-val').textContent = settings.shiftLength + ' orders';
}

function toggleDish(id) {
  const activeCount = activeDishIds().length;
  if (settings.dishes[id] && activeCount <= 1) return; // keep at least one dish active
  settings.dishes[id] = !settings.dishes[id];
  document.getElementById('dish-toggle-' + id).classList.toggle('on', settings.dishes[id]);
  markDirty();
}

function changeShiftLength(delta) {
  settings.shiftLength = Math.min(12, Math.max(3, settings.shiftLength + delta));
  document.getElementById('shift-length-val').textContent = settings.shiftLength + ' orders';
  markDirty();
}

function markDirty() {
  editDirty = true;
  document.getElementById('save-banner').classList.add('visible');
}

function saveEdit() {
  persistSettings();
  editDirty = false;
  updateWelcomePreview();

  const banner = document.getElementById('save-banner');
  const orig = banner.innerHTML;
  banner.style.background = 'var(--teal)';
  banner.innerHTML = '<p style="flex:1;text-align:center">✅ Saved!</p>';
  setTimeout(() => {
    banner.style.background = '';
    banner.innerHTML = orig;
    document.getElementById('save-now-btn').onclick = saveEdit;
    banner.classList.remove('visible');
  }, 1200);
}

function cancelEdit() {
  if (editDirty && !confirm('Discard unsaved changes?')) return;
  settings = loadSettings(); // revert
  showScreen('welcome');
}

// ── INIT ──────────────────────────────────────────
updateWelcomePreview();
