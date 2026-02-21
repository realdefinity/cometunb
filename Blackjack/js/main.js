const PERF_STORAGE_KEY = 'bj_perf_mode';

function detectAutoPerfLite() {
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cpuCores = Number(navigator.hardwareConcurrency || 0);
  const memoryGb = Number(navigator.deviceMemory || 0);
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slowConnection = conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g');
  const saveData = !!(conn && conn.saveData);
  const lowPowerDevice = (cpuCores > 0 && cpuCores <= 4) || (memoryGb > 0 && memoryGb <= 4);
  return prefersReducedMotion || lowPowerDevice || slowConnection || saveData;
}

function readPerfMode() {
  try {
    const v = localStorage.getItem(PERF_STORAGE_KEY);
    return (v === 'lite' || v === 'full' || v === 'auto') ? v : 'auto';
  } catch {
    return 'auto';
  }
}

function writePerfMode(mode) {
  try { localStorage.setItem(PERF_STORAGE_KEY, mode); } catch {}
}

function applyPerfMode(mode) {
  const autoLite = detectAutoPerfLite();
  const isLite = mode === 'lite' ? true : mode === 'full' ? false : autoLite;
  document.documentElement.classList.toggle('perf-lite', isLite);
  document.body.classList.toggle('perf-lite', isLite);
  document.body.dataset.perfMode = mode;
  window.__bjPerf = { mode, isLite, autoLite };
  updatePerfButton();
}

function updatePerfButton() {
  if (!els || !els.btnPerf) return;
  const isLite = !!(window.__bjPerf ? window.__bjPerf.isLite : document.body.classList.contains('perf-lite'));
  els.btnPerf.textContent = isLite ? '⚡' : '✨';
  els.btnPerf.classList.toggle('active', isLite);
  els.btnPerf.setAttribute('aria-pressed', isLite ? 'true' : 'false');
  els.btnPerf.title = isLite ? 'Performance mode (effects reduced)' : 'Quality mode (full effects)';
}

function togglePerfMode() {
  const currentLite = !!(window.__bjPerf ? window.__bjPerf.isLite : document.body.classList.contains('perf-lite'));
  const nextMode = currentLite ? 'full' : 'lite';
  writePerfMode(nextMode);
  applyPerfMode(nextMode);
}

const initGame = () => {
  applyPerfMode(readPerfMode());

  els = {
    wallet: document.getElementById('wallet-val'),
    bet: document.getElementById('bet-val'),
    playerHandsRow: document.getElementById('player-hands-row'),
    pCards0: document.getElementById('player-cards-0'),
    pCards1: document.getElementById('player-cards-1'),
    pScore0: document.getElementById('player-score-0'),
    pScore1: document.getElementById('player-score-1'),
    dCards: document.getElementById('dealer-cards'),
    dScore: document.getElementById('dealer-score'),
    betUI: document.getElementById('betting-overlay'),
    gameControls: document.getElementById('gameplay-controls'),
    msgText: document.getElementById('msg-text'),
    btnDeal: document.getElementById('btn-deal'),
    btnDouble: document.getElementById('btn-double'),
    btnHit: document.getElementById('btn-hit'),
    btnStand: document.getElementById('btn-stand'),
    btnSplit: document.getElementById('btn-split'),
    btnRebet: document.getElementById('btn-rebet'),
    statWins: document.getElementById('stat-wins'),
    statLosses: document.getElementById('stat-losses'),
    statPushes: document.getElementById('stat-pushes'),
    loanBox: document.getElementById('loan-box'),
    loanVal: document.getElementById('loan-val'),
    takeLoanStrip: document.getElementById('take-loan-strip'),
    btnPayback: document.getElementById('btn-payback'),
    btnPayall: document.getElementById('btn-payall'),
    insuranceStrip: document.getElementById('insurance-strip'),
    insuranceAmt: document.getElementById('insurance-amt'),
    btnSurrender: document.getElementById('btn-surrender'),
    streakDisplay: document.getElementById('streak-display'),
    streakNum: document.getElementById('streak-num'),
    peekMsg: document.getElementById('peek-msg'),
    btnSound: document.getElementById('btn-sound'),
    btnPerf: document.getElementById('btn-perf'),
  };

  updatePerfButton();
  updateUI();
  if (els.betUI) els.betUI.classList.remove('hidden');
  dimHands(true);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
