let stopLiquidGlassLoop = null;
let perfTooltipEl = null;

function getPerfButtonLabel(summary) {
  if (summary.mode === PERF_MODE_LOW) return '🐢';
  if (summary.mode === PERF_MODE_HIGH) return '✨';
  return summary.perfLite ? '🔋' : '🚀';
}

function getPerfTooltipText(summary) {
  if (summary.mode === PERF_MODE_LOW) return 'Performance mode: Low';
  if (summary.mode === PERF_MODE_HIGH) return 'Performance mode: High';
  return `Performance mode: Auto (${summary.perfLite ? 'Low active' : 'High active'})`;
}

function syncPerfButton(summary = getPerformanceSummary()) {
  if (!els.btnPerf) return;
  const tooltip = getPerfTooltipText(summary);
  els.btnPerf.textContent = getPerfButtonLabel(summary);
  els.btnPerf.title = tooltip;
  els.btnPerf.setAttribute('aria-label', tooltip);
  if (perfTooltipEl) perfTooltipEl.textContent = tooltip;
}

function ensurePerfTooltip() {
  if (perfTooltipEl) return perfTooltipEl;
  const el = document.createElement('div');
  el.id = 'perf-tooltip';
  el.className = 'perf-tooltip';
  el.setAttribute('role', 'tooltip');
  document.body.appendChild(el);
  perfTooltipEl = el;
  return el;
}

function placePerfTooltip() {
  if (!els.btnPerf || !perfTooltipEl) return;
  const rect = els.btnPerf.getBoundingClientRect();
  const top = Math.max(8, rect.bottom + 10);
  let left = rect.left + rect.width / 2;
  const maxLeft = window.innerWidth - 12;
  const minLeft = 12;
  left = Math.min(maxLeft, Math.max(minLeft, left));
  perfTooltipEl.style.top = `${top}px`;
  perfTooltipEl.style.left = `${left}px`;
}

function setPerfTooltipVisible(visible) {
  const tip = ensurePerfTooltip();
  if (!tip) return;
  if (visible) {
    tip.classList.add('visible');
    placePerfTooltip();
  } else {
    tip.classList.remove('visible');
  }
}

function wireChipBets() {
  const chips = document.querySelectorAll('.chip[data-bet]');
  chips.forEach((chip) => {
    chip.addEventListener('click', (event) => {
      const amount = Number(chip.dataset.bet || 0);
      if (!Number.isFinite(amount) || amount <= 0) return;
      placeBet(amount, event);
    });
  });
}

function wireCustomBet() {
  const input = document.getElementById('custom-bet-input');
  const button = document.getElementById('btn-custom-bet');
  const stepUp = document.getElementById('custom-step-up');
  const stepDown = document.getElementById('custom-step-down');
  if (!input || !button) return;

  const sanitize = () => {
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 9);
  };

  const adjust = (delta) => {
    sanitize();
    const current = Math.max(0, Math.floor(Number(input.value || 0)));
    const next = Math.max(0, current + delta);
    input.value = next > 0 ? String(next) : '';
  };

  const submit = () => placeCustomBet(input.value);
  button.addEventListener('click', submit);
  input.addEventListener('input', sanitize);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit();
    if (event.key === 'ArrowUp') { event.preventDefault(); adjust(5); }
    if (event.key === 'ArrowDown') { event.preventDefault(); adjust(-5); }
  });

  if (stepUp) stepUp.addEventListener('click', () => adjust(5));
  if (stepDown) stepDown.addEventListener('click', () => adjust(-5));
}

function wirePerfTooltip() {
  if (!els.btnPerf) return;
  ensurePerfTooltip();
  els.btnPerf.addEventListener('mouseenter', () => setPerfTooltipVisible(true));
  els.btnPerf.addEventListener('mouseleave', () => setPerfTooltipVisible(false));
  els.btnPerf.addEventListener('focus', () => setPerfTooltipVisible(true));
  els.btnPerf.addEventListener('blur', () => setPerfTooltipVisible(false));
  window.addEventListener('resize', placePerfTooltip);
  window.addEventListener('scroll', placePerfTooltip, { passive: true });
}

function createLiquidGlassLoop() {
  const root = document.body;
  if (!root) return () => {};

  root.style.setProperty('--glass-cx', '50%');
  root.style.setProperty('--glass-cy', '36%');
  root.style.setProperty('--glass-shift-x', '0%');
  root.style.setProperty('--glass-shift-y', '0%');

  return () => {
    root.style.setProperty('--glass-cx', '50%');
    root.style.setProperty('--glass-cy', '36%');
    root.style.setProperty('--glass-shift-x', '0%');
    root.style.setProperty('--glass-shift-y', '0%');
  };
}

function refreshLiquidGlassLoop() {
  if (typeof stopLiquidGlassLoop === 'function') stopLiquidGlassLoop();
  stopLiquidGlassLoop = perfLite ? null : createLiquidGlassLoop();
}

function applyPerformanceUi(summary = getPerformanceSummary()) {
  syncPerfButton(summary);
  refreshLiquidGlassLoop();
  updateUI();
}

function togglePerformanceMode() {
  cyclePerformanceMode();
}

function handlePerfModeChanged(event) {
  applyPerformanceUi(event.detail || getPerformanceSummary());
}

const initGame = () => {
  applyPerformanceMode(perfMode, false);

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

  wireChipBets();
  wireCustomBet();
  wirePerfTooltip();
  window.addEventListener('blackjack:perfmodechange', handlePerfModeChanged);

  applyPerformanceUi(getPerformanceSummary());
  if (els.betUI) els.betUI.classList.remove('hidden');
  dimHands(true);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
