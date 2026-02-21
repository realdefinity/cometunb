function getPlayerCardsContainer(i) { return i === 0 ? els.pCards0 : els.pCards1; }
function getPlayerScoreEl(i) { return i === 0 ? els.pScore0 : els.pScore1; }

const prefersReducedMotion = typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function isPerfLite() {
  if (window.__bjPerf && typeof window.__bjPerf.isLite === 'boolean') return window.__bjPerf.isLite;
  return document.documentElement.classList.contains('perf-lite')
    || !!(document.body && document.body.classList.contains('perf-lite'));
}
const valueAnimationFrames = new WeakMap();
const winnerPulseTimers = new WeakMap();

/** Matches CSS --ease for WAAPI and inline animations */
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function getMotionSpec() {
  const lite = prefersReducedMotion || isPerfLite();
  return lite
    ? {
      lite: true,
      staggerMs: 200,
      dealMs: 380,
      flipMs: 340,
      scoreDelayMs: 240,
      clearTableMs: 220,
      chipArcPx: 20,
      chipMs: 320,
      confettiCount: 12,
      winnerPulseMs: 800,
    }
    : {
      lite: false,
      staggerMs: 240,
      dealMs: 620,
      flipMs: 520,
      scoreDelayMs: 320,
      clearTableMs: 320,
      chipArcPx: 46,
      chipMs: 480,
      confettiCount: 44,
      winnerPulseMs: 1050,
    };
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

  if (!faceUp) {
    card.classList.add('face-down');
  }

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

  if (prefersReducedMotion || isPerfLite()) {
    obj.textContent = '$' + end;
    obj.classList.remove('bump');
    return;
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
      const frameId = window.requestAnimationFrame(step);
      valueAnimationFrames.set(obj, frameId);
      return;
    }

    obj.classList.remove('bump');
    valueAnimationFrames.delete(obj);
  };

  const frameId = window.requestAnimationFrame(step);
  valueAnimationFrames.set(obj, frameId);
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

    els.btnDeal.disabled = !(gameState === 'BETTING' && currentBet > 0);
    els.btnRebet.disabled = !(gameState === 'BETTING' && lastBet > 0 && wallet >= lastBet);
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

    const canPlay = gameState === 'PLAYING';
    setControlsEnabled(canPlay);
    updateStatsUI();
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
  if (prefersReducedMotion) {
    cards.forEach((c) => c.remove());
    return;
  }
  const dur = getMotionSpec().clearTableMs;
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
  const timeout = window.setTimeout(() => {
    container.classList.remove('winner-pulse');
    winnerPulseTimers.delete(container);
  }, getMotionSpec().winnerPulseMs);
  winnerPulseTimers.set(container, timeout);
}

function animateChip(x, y) {
  if (prefersReducedMotion) return;
  const chip = document.createElement('div');
  chip.className = 'flying-chip';
  chip.style.left = x + 'px';
  chip.style.top = y + 'px';
  document.body.appendChild(chip);

  const tx = window.innerWidth / 2 - 22;
  const ty = window.innerHeight - 200;
  const dx = tx - x;
  const dy = ty - y;
  const m = getMotionSpec();
  const arc = m.chipArcPx;
  const dur = m.chipMs;

  chip.animate(
    [
      { transform: 'translate3d(0,0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate3d(${dx * 0.36}px, ${dy * 0.18 - arc}px, 0) scale(0.86) rotate(220deg)`, opacity: 0.92, offset: 0.4 },
      { transform: `translate3d(${dx * 0.7}px, ${dy * 0.58 - arc * 0.3}px, 0) scale(0.66) rotate(460deg)`, opacity: 0.78, offset: 0.74 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.4) rotate(640deg)`, opacity: 0.5 }
    ],
    { duration: dur, easing: EASE }
  ).onfinish = () => chip.remove();
}

function triggerConfetti() {
  if (prefersReducedMotion) return;
  const colors = ['#e8c547', '#e74c3c', '#3498db', '#fff', '#3dd88a', '#a855f7'];
  const fragment = document.createDocumentFragment();
  const m = getMotionSpec();
  const count = m.confettiCount;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti confetti-fly';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = (m.lite ? 60 : 95) + Math.random() * (m.lite ? 140 : 280);
    c.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
    c.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    c.style.setProperty('--rot', (Math.random() * 500 + 100) + 'deg');
    c.style.setProperty('--dur', ((m.lite ? 380 : 650) + Math.random() * (m.lite ? 280 : 550)) + 'ms');
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
    const m = getMotionSpec();
    const dealDuration = m.dealMs;
    const flipDuration = m.flipMs;
    cardEl.style.setProperty('--deal-duration', `${dealDuration}ms`);
    cardEl.style.setProperty('--flip-duration', `${flipDuration}ms`);

    if (faceUp) {
      cardEl.classList.add('face-down');
    }

    container.appendChild(cardEl);
    window.requestAnimationFrame(() => {
      cardEl.classList.add('dealt');
    });

    if (faceUp) {
      const revealDelay = Math.max(55, Math.round(dealDuration * 0.26));
      setTimeout(() => {
        cardEl.classList.remove('face-down');
      }, revealDelay);
    }
  }, delay);
}
