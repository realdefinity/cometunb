const initGame = () => {
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cpuCores = Number(navigator.hardwareConcurrency || 0);
  const memoryGb = Number(navigator.deviceMemory || 0);
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slowConnection = conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g');
  const lowPowerDevice = (cpuCores > 0 && cpuCores <= 4) || (memoryGb > 0 && memoryGb <= 4);
  document.body.classList.toggle('perf-lite', prefersReducedMotion || lowPowerDevice || slowConnection);

  els = {
    wallet: document.getElementById('wallet-val'),
    coinsBox: document.getElementById('coins-box'),
    coinsVal: document.getElementById('coins-val'),
    shopCoinsVal: null,
    deathOverlay: document.getElementById('death-overlay'),
    loanWarning: document.getElementById('loan-warning'),
    loanWarningText: document.getElementById('loan-warning-text'),
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
  };

  loadProgress();
  updateUI();
  updateCoinsUI();
  if (els.betUI) els.betUI.classList.remove('hidden');
  dimHands(true);

  let shopBackdrop = null;
  const openShop = () => {
    if (shopBackdrop && shopBackdrop.parentNode) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'shop-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', 'VIP Lounge shop');
    backdrop.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(0,0,0,0.7);';
    const panel = document.createElement('div');
    panel.className = 'shop-panel';
    panel.style.cssText = 'background:var(--glass-tint-strong);border:1px solid var(--glass-border);border-radius:24px;width:100%;max-width:560px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--glass-shadow-xl);';
    panel.innerHTML = `
      <div class="shop-header" style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;">
        <h2 class="shop-title" style="margin:0;font-size:1.6rem;color:var(--gold);">VIP Lounge</h2>
        <div class="shop-coins" style="font-weight:700;padding:6px 14px;border-radius:999px;background:rgba(232,197,71,0.15);" id="shop-coins-display" title="Your coin balance">${typeof coins === 'number' ? coins : 0} ⭐</div>
        <button type="button" class="btn-icon shop-close" style="width:40px;height:40px;cursor:pointer;font-size:1.1rem;">✕</button>
      </div>
      <div class="shop-grid" id="shop-grid-dynamic" style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(2,1fr);gap:14px;padding:20px 24px 28px;overflow-y:auto;"></div>
    `;
    backdrop.appendChild(panel);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeShop();
    });
    panel.querySelector('.shop-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeShop();
    });
    panel.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(backdrop);
    shopBackdrop = backdrop;
    els.shopCoinsVal = document.getElementById('shop-coins-display');
    const grid = document.getElementById('shop-grid-dynamic');
    const coinsDisp = document.getElementById('shop-coins-display');
    if (typeof renderShop === 'function' && grid) renderShop(grid, coinsDisp);
    document.addEventListener('keydown', escHandler);
  };
  const closeShop = () => {
    if (shopBackdrop && shopBackdrop.parentNode) {
      shopBackdrop.parentNode.removeChild(shopBackdrop);
      shopBackdrop = null;
      document.removeEventListener('keydown', escHandler);
    }
  };
  const escHandler = (e) => {
    if (e.key === 'Escape') closeShop();
  };
  document.getElementById('btn-shop')?.addEventListener('click', openShop);
  document.getElementById('coins-box')?.addEventListener('click', openShop);

  document.getElementById('btn-sound')?.addEventListener('click', () => { toggleSound(); });
  document.getElementById('death-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'death-overlay') restartAfterDeath();
  });
  document.querySelector('.death-restart')?.addEventListener('click', restartAfterDeath);

  if (typeof window.initResponsiveLayout === 'function') {
    window.initResponsiveLayout();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
