// Bumped by hand on every change that gets deployed — shown in Kitchen
// Settings so it's obvious at a glance whether a device is running the
// latest build (no build step in this project to stamp it automatically).
const BUILD_STAMP = '2026-07-24 15:42 UTC';

// ── DISH BOOK ──────────────────────────────────────
// Each dish has 4 tiers of recipes (ordered ingredient stacks).
// Tier grows from a couple of steps up to 6 as the shift/days progress.
const dishBook = {
  burger: { icon: '🍔', tiers: [
    ['🍞', '🥩', '🍞'],
    ['🍞', '🥩', '🧀', '🍞'],
    ['🍞', '🥩', '🧀', '🥬', '🍞'],
    ['🍞', '🥩', '🧀', '🥬', '🍅', '🍞'],
  ]},
  sandwich: { icon: '🥪', tiers: [
    ['🍞', '🍖', '🍞'],
    ['🍞', '🧀', '🍖', '🍞'],
    ['🍞', '🧀', '🍖', '🍅', '🍞'],
    ['🍞', '🧀', '🍖', '🍅', '🥬', '🍞'],
  ]},
  pizza: { icon: '🍕', tiers: [
    ['🫓', '🧀'],
    ['🫓', '🍅', '🧀'],
    ['🫓', '🍅', '🧀', '🍄', '🫒'],
    ['🫓', '🍅', '🧀', '🍄', '🫒', '🧅'],
  ]},
  sundae: { icon: '🍨', tiers: [
    ['🍦', '🍫'],
    ['🍦', '🍦', '🍫'],
    ['🍦', '🍦', '🍫', '🍒', '🍓'],
    ['🍦', '🍦', '🍦', '🍫', '🍒', '🍓'],
  ]},
  taco: { icon: '🌮', tiers: [
    ['🫓', '🥩'],
    ['🫓', '🥩', '🧀'],
    ['🫓', '🥩', '🧀', '🥬', '🍅'],
    ['🫓', '🥩', '🧀', '🥬', '🍅', '🧅'],
  ]},
  wrap: { icon: '🌯', tiers: [
    ['🫓', '🥬'],
    ['🫓', '🥬', '🍗'],
    ['🫓', '🥬', '🍗', '🧀', '🍅'],
    ['🫓', '🥬', '🍗', '🧀', '🍅', '🥑'],
  ]},
  // minTier: only enters the rotation once an order's tier has reached
  // this floor — keeps baking recipes from showing up on day one.
  // 🥣 (bowl) and 🍯 (honey) stand in for flour and sugar since Unicode
  // has no dedicated emoji for either.
  cake: { icon: '🍰', minTier: 2, tiers: [
    ['🥣', '🥚'],
    ['🥣', '🥚', '🥛'],
    ['🥣', '🥚', '🥛', '🧈', '🍫'],
    ['🥣', '🥚', '🥛', '🧈', '🍫', '🍓'],
  ]},
  // Base is butter+egg (no bowl/flour step), sweetened with honey third,
  // then decorated with cherry and candy sprinkles — deliberately a
  // different ingredient set from cake so the two never look alike.
  cupcake: { icon: '🧁', minTier: 2, tiers: [
    ['🧈', '🥚'],
    ['🧈', '🥚', '🍯'],
    ['🧈', '🥚', '🍯', '🍒', '🍬'],
    ['🧈', '🥚', '🍯', '🍒', '🍬', '🍫'],
  ]},
};

const EXTRA_INGREDIENTS = ['🧅', '🥓', '🍳', '🥒', '🍄', '🫒', '🍓', '🍒', '🥑', '🍗'];
const CUSTOMERS = ['🧒', '👧', '👦', '🧑‍🦱', '👩‍🦰', '🧔', '👨‍🦳', '👩', '🧑‍🦳', '👴'];

// ── SETTINGS / PERSISTENCE ────────────────────────
const defaultSettings = {
  shiftLength: 6,
  hintHighlight: false,
  minIngredients: 2,
  dishes: { burger: true, sandwich: true, pizza: true, sundae: true, taco: true, wrap: true, cake: true, cupcake: true },
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

// ── PROGRESS (persists difficulty ramp across days) ─
function loadProgress() {
  try {
    const p = localStorage.getItem('lc_progress');
    if (p) return { daysPlayed: 0, ...JSON.parse(p) };
  } catch (e) {}
  return { daysPlayed: 0 };
}
function persistProgress() {
  try { localStorage.setItem('lc_progress', JSON.stringify(progress)); } catch (e) {}
}

let progress = loadProgress();

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
let currentScreenName = 'welcome';

function showScreen(name) {
  currentScreenName = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  if (name === 'welcome') updateWelcomePreview();
  if (name === 'edit') buildEditScreen();
}

function updateWelcomePreview() {
  document.getElementById('sp-plates').textContent = '🍽️'.repeat(settings.shiftLength);
  document.getElementById('sp-day').textContent = 'Day ' + (progress.daysPlayed + 1);
}

function goWelcome() {
  resetChopOverlay();
  showScreen('welcome');
}

// ── BACK BUTTON TRAP ─────────────────────────────────
// The ingredient tray sits near the bottom edge, right where a phone's
// back gesture/button lives, so an accidental swipe/tap there shouldn't
// exit the game. Instead of leaving the page, a back press asks for
// confirmation and — if confirmed — bounces to the welcome screen (or
// cancels the edit screen, which has its own unsaved-changes check).
// Only a back press from the welcome screen itself is allowed to leave.
function armBackTrap() {
  history.pushState({ lcTrap: true }, '', location.href);
}
window.addEventListener('popstate', () => {
  if (currentScreenName === 'welcome') return;
  armBackTrap();
  if (currentScreenName === 'edit') { cancelEdit(); return; }
  if (confirm("Go back to the start? You'll lose this order.")) goWelcome();
});
armBackTrap();

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
  // dishBook[id] guard: ignores any stale dish id left in a returning
  // player's saved settings after a menu item is removed from the game.
  return Object.entries(settings.dishes).filter(([id, on]) => on && dishBook[id]).map(([id]) => id);
}

function pickDish(tier) {
  let ids = activeDishIds().filter(id => tier >= (dishBook[id].minTier || 0));
  if (!ids.length) ids = activeDishIds(); // nothing unlocked yet at this tier
  if (!ids.length) ids = Object.keys(dishBook); // safety net
  if (ids.length > 1 && lastDish && ids.includes(lastDish)) ids = ids.filter(id => id !== lastDish);
  const id = ids[Math.floor(Math.random() * ids.length)];
  lastDish = id;
  return id;
}

const MAX_TIER = 3; // each dish has 4 tiers, indices 0-3

// Tier climbs within a shift (simple orders first, harder ones later),
// and the starting floor rises the more days the child has played —
// every 2 days completed bumps the minimum tier by one, so returning
// players see harder recipes sooner instead of re-starting from scratch.
function tierForProgress() {
  const frac = settings.shiftLength > 0 ? orderIndex / settings.shiftLength : 0;
  const withinShiftTier = frac < 0.25 ? 0 : frac < 0.5 ? 1 : frac < 0.75 ? 2 : 3;
  const dayBoost = Math.floor(progress.daysPlayed / 2);
  return Math.min(MAX_TIER, withinShiftTier + dayBoost);
}

// Walks up from the computed tier until the recipe meets the parent-set
// minimum ingredient count (or runs out of harder tiers to try).
function tierMeetingMinimum(dish, tier) {
  let idx = Math.min(tier, dish.tiers.length - 1);
  while (idx < dish.tiers.length - 1 && dish.tiers[idx].length < settings.minIngredients) idx++;
  return idx;
}

function nextOrder() {
  if (orderIndex >= settings.shiftLength) { showRecap(); return; }

  updateSky();
  updateProgressPips();

  const baseTier = tierForProgress();
  const dishId = pickDish(baseTier);
  const dish = dishBook[dishId];
  const tier = tierMeetingMinimum(dish, baseTier);
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
  // Force a column count that always fits the tray in 2 rows, regardless
  // of how many ingredients + decoys are in it, instead of letting
  // auto-fill wrap to however many rows the width happens to allow.
  const cols = Math.max(1, Math.ceil(trayIcons.length / 2));
  tray.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
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
  const needed = settings.hintHighlight ? currentRecipe[progressIndex] : null;
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
// These ingredients need a quick chop on the board before they'll stack —
// a global set rather than a per-recipe flag, so only recipes that
// happen to include one of these ever trigger the mini-game.
const CHOPPABLE = new Set(['🍅', '🧅', '🧀', '🥬']);

function tapIngredient(icon, bowlEl) {
  if (progressIndex >= currentRecipe.length || choppingIcon) return;

  if (icon === currentRecipe[progressIndex]) {
    if (CHOPPABLE.has(icon)) openChop(icon);
    else stackIngredient(icon);
  } else {
    bowlEl.classList.remove('shake');
    void bowlEl.offsetWidth;
    bowlEl.classList.add('shake');
    wrongTapsThisOrder++;
  }
}

function stackIngredient(icon) {
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
}

// ── CHOPPING MINIGAME ────────────────────────────────
// Drag the knife back and forth over the ingredient to chop it. Tracks
// cumulative drag distance rather than requiring a precise swipe
// direction, so a young child sawing the knife back and forth works fine.
const CHOPS_NEEDED = 3;
const CHOP_DRAG_DISTANCE = 55; // px of cumulative movement per chop

let choppingIcon = null;
let choppedCount = 0;
let chopDragAccum = 0;
let chopDragging = false;
let chopLastX = 0;

function openChop(icon) {
  choppingIcon = icon;
  choppedCount = 0;
  chopDragAccum = 0;

  const wrap = document.getElementById('chop-ingredient-wrap');
  // Suppress the CSS transition while resetting, otherwise removing
  // 'split' animates the halves back together instead of snapping
  // instantly to whole, which read as the ingredient starting in two
  // fading-together pieces.
  wrap.classList.add('no-anim');
  wrap.classList.remove('split', 'hit');
  document.getElementById('chop-ingredient-top').textContent = icon;
  document.getElementById('chop-ingredient-bottom').textContent = icon;
  positionKnifeAt(null); // center it
  void wrap.offsetWidth;
  wrap.classList.remove('no-anim');

  document.getElementById('chop-overlay').classList.add('show');
}

// Positions the knife under the given pointer clientX (or centered when
// clientX is null), clamped to the board. The track spans the whole
// board, so a drag anywhere across the ingredient — not just on the
// small knife icon — moves it.
function positionKnifeAt(clientX) {
  const knife = document.getElementById('chop-knife');
  const track = document.getElementById('knife-track');
  const maxLeft = track.clientWidth - knife.clientWidth;
  let left;
  if (clientX === null) {
    left = maxLeft / 2;
  } else {
    const rect = track.getBoundingClientRect();
    left = clientX - rect.left - knife.clientWidth / 2;
  }
  knife.style.left = Math.max(0, Math.min(maxLeft, left)) + 'px';
}

function chopPointerDown(e) {
  if (!choppingIcon) return;
  chopDragging = true;
  chopLastX = e.clientX;
  positionKnifeAt(e.clientX);
  e.target.setPointerCapture(e.pointerId);
}

function chopPointerMove(e) {
  if (!chopDragging) return;
  const dx = e.clientX - chopLastX;
  chopLastX = e.clientX;
  positionKnifeAt(e.clientX);

  chopDragAccum += Math.abs(dx);
  if (chopDragAccum >= CHOP_DRAG_DISTANCE) {
    chopDragAccum -= CHOP_DRAG_DISTANCE;
    registerChop();
  }
}

function chopPointerUp() {
  chopDragging = false;
}

function registerChop() {
  if (!choppingIcon || choppedCount >= CHOPS_NEEDED) return;
  choppedCount++;

  const wrap = document.getElementById('chop-ingredient-wrap');
  wrap.classList.remove('hit');
  void wrap.offsetWidth;
  wrap.classList.add('hit');

  if (choppedCount >= CHOPS_NEEDED) finishChop();
}

function finishChop() {
  const icon = choppingIcon;
  const overlay = document.getElementById('chop-overlay');
  document.getElementById('chop-ingredient-wrap').classList.add('split');

  setTimeout(() => {
    overlay.classList.remove('show');
    choppingIcon = null;
    stackIngredient(icon);
  }, 550);
}

function resetChopOverlay() {
  choppingIcon = null;
  chopDragging = false;
  document.getElementById('chop-overlay').classList.remove('show');
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
  progress.daysPlayed++;
  persistProgress();
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
  document.getElementById('build-stamp').textContent = 'Updated ' + BUILD_STAMP;

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
  document.getElementById('hint-toggle').checked = !!settings.hintHighlight;
  document.getElementById('day-count-val').textContent = 'Day ' + (progress.daysPlayed + 1);
  document.getElementById('min-ingredients-val').textContent = settings.minIngredients + ' min';
}

function changeMinIngredients(delta) {
  settings.minIngredients = Math.min(6, Math.max(2, settings.minIngredients + delta));
  document.getElementById('min-ingredients-val').textContent = settings.minIngredients + ' min';
  markDirty();
}

function toggleHint() {
  settings.hintHighlight = document.getElementById('hint-toggle').checked;
  markDirty();
}

function resetDifficulty() {
  if (!confirm('Reset back to Day 1 difficulty?')) return;
  progress.daysPlayed = 0;
  persistProgress();
  document.getElementById('day-count-val').textContent = 'Day 1';
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

// Drag handlers live on the track (the whole board), not the knife icon
// itself, so the child can drag anywhere across the ingredient.
const chopTrack = document.getElementById('knife-track');
chopTrack.addEventListener('pointerdown', chopPointerDown);
chopTrack.addEventListener('pointermove', chopPointerMove);
chopTrack.addEventListener('pointerup', chopPointerUp);
chopTrack.addEventListener('pointercancel', chopPointerUp);
