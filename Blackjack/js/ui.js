function getPlayerCardsContainer(i) { return i === 0 ? els.pCards0 : els.pCards1; }
function getPlayerScoreEl(i) { return i === 0 ? els.pScore0 : els.pScore1; }

const prefersReducedMotion = typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cpuCores = Number(navigator.hardwareConcurrency || 0);
const memoryGb = Number(navigator.deviceMemory || 0);
const hasPerfLiteClass = !!(document.body && document.body.classList.contains('perf-lite'));
const perfLite = hasPerfLiteClass
  || prefersReducedMotion
  || (cpuCores > 0 && cpuCores <= 4)
  || (memoryGb > 0 && memoryGb <= 4);
const valueAnimationFrames = new WeakMap();
const winnerPulseTimers = new WeakMap();
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function updateCoinsUI() {
  if (els.coinsVal) els.coinsVal.textContent = coins;
  const shopCoins = document.getElementById('shop-coins-display');
  if (shopCoins) shopCoins.textContent = coins + ' ⭐';
}

function updateLoanWarning() {
  if (loan <= 0) {
    hideLoanWarning();
    return;
  }
  if (!els.loanWarning || !els.loanWarningText) return;
  const grace = (inventory['grace-period'] || 0) * 3;
  const totalHands = LOAN_DEATH_HANDS + grace;
  const left = totalHands - handsWithUnpaidLoan;
  if (left <= 2 && left > 0) {
    els.loanWarningText.textContent = `Pay your loan! ${left} hand${left === 1 ? '' : 's'} left`;
    els.loanWarning.classList.add('visible');
    els.loanWarning.style.display = 'block';
  } else {
    els.loanWarning.classList.remove('visible');
    els.loanWarning.style.display = 'none';
  }
}

function hideLoanWarning() {
  if (els.loanWarning) {
    els.loanWarning.classList.remove('visible');
    els.loanWarning.style.display = 'none';
  }
}

function updateStatsUI() {
  els.statWins.textContent = stats.wins;
  els.statLosses.textContent = stats.losses;
  els.statPushes.textContent = stats.pushes;
  if (consecutiveWins >= 2) {
    els.streakDisplay.style.display = '';
    els.streakNum.textContent = consecutiveWins;
  } else {
    els.streakDisplay.style.display = 'none';
  }
  els.btnSound.textContent = soundMuted ? '🔇' : '🔊';
}

function toggleSound() {
  soundMuted = !soundMuted;
  updateStatsUI();
}

function suitClass(s) { return (s === '♥' || s === '♦') ? 'pip-red' : 'pip-black'; }

function makeCardDOM(cardData, faceUp = true) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.setProperty('--rot', (Math.random() - 0.5) * 6 + 'deg');

  const inner = document.createElement('div');
  inner.className = 'inner';

  const face = document.createElement('div');
  face.className = 'card-face';

  const back = document.createElement('div');
  back.className = 'card-back';

  const colorCls = suitClass(cardData.s);
  const cornerContent = `<span class="rank">${cardData.v}</span><span class="suit">${cardData.s}</span>`;
  const cornerTL = document.createElement('div');
  cornerTL.className = `corner ${colorCls}`;
  cornerTL.innerHTML = cornerContent;

  const cornerBR = document.createElement('div');
  cornerBR.className = `corner bottom ${colorCls}`;
  cornerBR.innerHTML = cornerContent;

  face.appendChild(cornerTL);
  face.appendChild(cornerBR);

  const content = document.createElement('div');
  content.className = 'card-content';

  if (['J','Q','K'].includes(cardData.v)) {
    const art = document.createElement('div');
    art.className = `face-art ${colorCls}`;
    art.textContent = cardData.v;
    content.appendChild(art);
  } else if (cardData.v === 'A') {
    const ace = document.createElement('div');
    ace.className = `pip ace ${colorCls}`;
    ace.textContent = cardData.s;
    content.appendChild(ace);
  } else {
    const grid = document.createElement('div');
    grid.className = `pip-grid ${colorCls}`;
    const n = parseInt(cardData.v, 10);
    const layout = PIP_LAYOUTS[n] || [];
    for (const [c, r] of layout) {
      const pip = document.createElement('div');
      pip.className = 'pip';
      pip.textContent = cardData.s;
      pip.style.gridColumn = String(c);
      pip.style.gridRow = String(r);
      if (r > 3) pip.style.transform = 'rotate(180deg)';
      grid.appendChild(pip);
    }
    content.appendChild(grid);
  }
  face.appendChild(content);

  const stamp = document.createElement('div');
  stamp.className = 'bust-stamp';
  stamp.textContent = 'BUSTED';
  face.appendChild(stamp);

  inner.appendChild(back);
  inner.appendChild(face);
  card.appendChild(inner);

  if (!faceUp) card.classList.add('face-down');
  return card;
}

function setControlsEnabled(enabled) {
  els.btnHit.disabled = !enabled;
  els.btnStand.disabled = !enabled;
}

function animateValue(obj, start, end, duration) {
  if (!obj) return;
  const existingFrame = valueAnimationFrames.get(obj);
  if (existingFrame) {
    window.cancelAnimationFrame(existingFrame);
    valueAnimationFrames.delete(obj);
  }
  if (start === end) {
    obj.textContent = '$' + end;
    obj.classList.remove('bump');
    return;
  }
  let startTimestamp = null;
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
  obj.classList.add('bump');
  const step = (timestamp) => {
    if (startTimestamp === null) startTimestamp = timestamp;
    const raw = Math.min((timestamp - startTimestamp) / duration, 1);
    const progress = easeOutQuart(raw);
    const val = Math.floor(progress * (end - start) + start);
    obj.textContent = '$' + val;
    if (raw < 1) {
      valueAnimationFrames.set(obj, window.requestAnimationFrame(step));
      return;
    }
    obj.classList.remove('bump');
    valueAnimationFrames.delete(obj);
  };
  valueAnimationFrames.set(obj, window.requestAnimationFrame(step));
}

let lastWallet = 1000;
let lastTotalBet = 0;
let updateUIRafId = null;

function updateUI() {
  if (updateUIRafId != null) return;
  updateUIRafId = requestAnimationFrame(() => {
    updateUIRafId = null;
    animateValue(els.wallet, lastWallet, Math.floor(wallet), 480);
    lastWallet = Math.floor(wallet);
    const totalBet = currentBets.reduce((a, b) => a + b, 0) || currentBet;
    animateValue(els.bet, lastTotalBet, Math.floor(totalBet), 280);
    lastTotalBet = Math.floor(totalBet);
    els.btnDeal.disabled = gameState !== 'BETTING' || currentBet <= 0;
    els.btnRebet.disabled = !(gameState === 'BETTING' && lastBet > 0 && wallet > 0);
    els.btnDouble.disabled = !canDoubleDown(activeHandIndex);
    els.btnSplit.disabled = !canSplit();
    els.btnSurrender.style.display = canSurrender() ? '' : 'none';
    if (loan > 0) {
      els.loanBox.style.display = '';
      els.loanVal.textContent = '$' + Math.floor(loan);
    } else {
      els.loanBox.style.display = 'none';
    }
    const totalBetNow = currentBets.reduce((a, b) => a + b, 0) || currentBet;
    const showTakeLoan = gameState === 'BETTING' && wallet <= 0 && totalBetNow <= 0;
    els.takeLoanStrip.style.display = showTakeLoan ? 'flex' : 'none';
    const showPayback = gameState === 'BETTING' && loan > 0 && wallet > 0;
    els.btnPayback.style.display = showPayback ? '' : 'none';
    els.btnPayall.style.display = showPayback ? '' : 'none';
    els.btnPayback.textContent = 'Pay $' + Math.min(100, Math.floor(wallet), Math.floor(loan));
    setControlsEnabled(gameState === 'PLAYING');
    updateStatsUI();
    updateCoinsUI();
    updateLoanWarning();
  });
}

function showMsg(text, color = 'white') {
  els.msgText.textContent = text;
  els.msgText.style.color = color;
  els.msgText.classList.add('visible');
}

function hideMsg() {
  els.msgText.classList.remove('visible');
}

function clearTable() {
  const cards = document.querySelectorAll('.card');
  const dur = perfLite ? 240 : 320;
  cards.forEach((c, i) => {
    c.animate(
      [
        { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
        { transform: 'translate3d(0,-12px,0) scale(0.94)', opacity: 0.45, offset: 0.45 },
        { transform: 'translate3d(0,-20px,0) scale(0.86) rotate(2deg)', opacity: 0 }
      ],
      { duration: dur, easing: EASE, delay: i * 20, fill: 'forwards' }
    ).onfinish = () => c.remove();
  });
}

function dimHands(dim) {
  els.playerHandsRow.classList.toggle('dimmed', dim);
  els.dCards.parentElement.classList.toggle('dimmed', dim);
}

function markBusted(container) {
  if (!container) return;
  container.querySelectorAll('.card').forEach(c => c.classList.add('busted'));
}

function highlightWinner(container) {
  if (!container) return;
  const existing = winnerPulseTimers.get(container);
  if (existing) window.clearTimeout(existing);
  container.classList.add('winner-pulse');
  winnerPulseTimers.set(container, window.setTimeout(() => {
    container.classList.remove('winner-pulse');
    winnerPulseTimers.delete(container);
  }, perfLite ? 800 : 1050));
}

function animateChip(x, y) {
  const chip = document.createElement('div');
  chip.className = 'flying-chip';
  chip.style.left = x + 'px';
  chip.style.top = y + 'px';
  document.body.appendChild(chip);
  const tx = window.innerWidth / 2 - 22;
  const ty = window.innerHeight - 200;
  const dx = tx - x;
  const dy = ty - y;
  const arc = perfLite ? 20 : 44;
  const dur = perfLite ? 360 : 580;
  const easeOut = 'cubic-bezier(0.22, 1, 0.36, 1)';
  chip.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.28}px, ${dy * 0.12 - arc}px) scale(0.9) rotate(180deg)`, opacity: 0.95, offset: 0.35 },
      { transform: `translate(${dx * 0.62}px, ${dy * 0.45 - arc * 0.4}px) scale(0.7) rotate(400deg)`, opacity: 0.85, offset: 0.68 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.45) rotate(720deg)`, opacity: 0.6 }
    ],
    { duration: dur, easing: easeOut }
  ).onfinish = () => chip.remove();
}

function triggerConfetti() {
  const colors = ['#e8c547', '#e74c3c', '#3498db', '#fff', '#3dd88a', '#a855f7', '#f472b6'];
  const fragment = document.createDocumentFragment();
  const count = perfLite ? 20 : 55;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti confetti-fly';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = (perfLite ? 80 : 120) + Math.random() * (perfLite ? 160 : 320);
    c.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
    c.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    c.style.setProperty('--rot', (Math.random() * 720 + 180) + 'deg');
    c.style.setProperty('--dur', ((perfLite ? 450 : 800) + Math.random() * (perfLite ? 350 : 600)) + 'ms');
    const size = 4 + Math.random() * 5;
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    c.addEventListener('animationend', () => c.remove(), { once: true });
    fragment.appendChild(c);
  }
  document.body.appendChild(fragment);
}

function spawnCard(handArr, container, faceUp, delay) {
  const cardData = deck.pop();
  handArr.push(cardData);
  setTimeout(() => {
    playSound('card');
    const cardEl = makeCardDOM(cardData, faceUp);
    const dealDuration = perfLite ? 380 : 560;
    const flipDuration = perfLite ? 340 : 520;
    cardEl.style.setProperty('--deal-duration', `${dealDuration}ms`);
    cardEl.style.setProperty('--flip-duration', `${flipDuration}ms`);
    if (faceUp) cardEl.classList.add('face-down');
    container.appendChild(cardEl);
    requestAnimationFrame(() => cardEl.classList.add('dealt'));
    if (faceUp) {
      setTimeout(() => cardEl.classList.remove('face-down'), Math.max(60, Math.round(dealDuration * 0.28)));
    }
  }, delay);
}
