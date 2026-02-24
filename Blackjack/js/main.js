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
    shopOverlay: document.getElementById('shop-overlay'),
    shopCoinsVal: document.getElementById('shop-coins-val'),
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

  updateUI();
  updateCoinsUI();
  if (els.betUI) els.betUI.classList.remove('hidden');
  dimHands(true);

  const shopOverlay = document.getElementById('shop-overlay');
  const openShop = () => {
    if (!shopOverlay) return;
    document.documentElement.appendChild(shopOverlay);
    shopOverlay.removeAttribute('hidden');
    if (typeof renderShop === 'function') renderShop();
  };
  const closeShop = () => {
    if (!shopOverlay) return;
    shopOverlay.setAttribute('hidden', '');
  };
  const btnShop = document.getElementById('btn-shop');
  const coinsBox = document.getElementById('coins-box');
  const handleShopClick = (e) => {
    const t = e.target;
    if ((btnShop && (t === btnShop || btnShop.contains(t))) || (coinsBox && (t === coinsBox || coinsBox.contains(t)))) {
      e.preventDefault();
      e.stopPropagation();
      openShop();
    }
  };
  document.body.addEventListener('click', handleShopClick, true);
  shopOverlay && shopOverlay.addEventListener('click', (e) => {
    if (e.target === shopOverlay) closeShop();
  });
  const shopPanel = shopOverlay && shopOverlay.querySelector('.shop-panel');
  if (shopPanel) shopPanel.addEventListener('click', (e) => e.stopPropagation());
  const closeBtn = shopOverlay && shopOverlay.querySelector('.shop-close');
  if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeShop(); });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
