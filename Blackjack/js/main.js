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
  const state = { x: 50, y: 36, tx: 50, ty: 36, rafId: null };
  const root = document.body;
  if (!root || perfLite) return () => {};

  const setVars = (x, y) => {
    root.style.setProperty('--glass-cx', `${x.toFixed(2)}%`);
    root.style.setProperty('--glass-cy', `${y.toFixed(2)}%`);
    root.style.setProperty('--glass-shift-x', `${((x - 50) * 0.24).toFixed(2)}%`);
    root.style.setProperty('--glass-shift-y', `${((y - 50) * 0.24).toFixed(2)}%`);
  };

  setVars(state.x, state.y);

  const onPointerMove = (event) => {
    state.tx = (event.clientX / Math.max(1, window.innerWidth)) * 100;
    state.ty = (event.clientY / Math.max(1, window.innerHeight)) * 100;
  };

  const onPointerReset = () => {
    state.tx = 50;
    state.ty = 36;
  };

  const step = (ts) => {
    const driftX = Math.sin(ts * 0.00026) * 2.6;
    const driftY = Math.cos(ts * 0.00022) * 1.9;
    state.x += ((state.tx + driftX) - state.x) * 0.11;
    state.y += ((state.ty + driftY) - state.y) * 0.11;
    setVars(state.x, state.y);
    state.rafId = window.requestAnimationFrame(step);
  };

  state.rafId = window.requestAnimationFrame(step);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerReset);
  window.addEventListener('blur', onPointerReset);

  return () => {
    if (state.rafId != null) window.cancelAnimationFrame(state.rafId);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerleave', onPointerReset);
    window.removeEventListener('blur', onPointerReset);
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
