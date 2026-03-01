function getPlayerCardsContainer(i) { return i === 0 ? els.pCards0 : els.pCards1; }
function getPlayerScoreEl(i) { return i === 0 ? els.pScore0 : els.pScore1; }

const _prefersReducedMotion = typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const _cpuCores = Number(navigator.hardwareConcurrency || 0);
const _memoryGb = Number(navigator.deviceMemory || 0);
const _conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const _slowConn = _conn && (_conn.effectiveType === 'slow-2g' || _conn.effectiveType === '2g' || _conn.effectiveType === '3g');
const _lowHardware = (_cpuCores > 0 && _cpuCores <= 4) || (_memoryGb > 0 && _memoryGb <= 4);

let perfLite = _prefersReducedMotion || _lowHardware || !!_slowConn;
let perfLiteManual = null;

function isPerfLite() {
  return perfLiteManual !== null ? perfLiteManual : perfLite;
}

function applyPerfMode() {
  document.body.classList.toggle('perf-lite', isPerfLite());
}

function togglePerfMode() {
  if (perfLiteManual === null) {
    perfLiteManual = !perfLite;
  } else {
    perfLiteManual = !perfLiteManual;
  }
  applyPerfMode();
  updatePerfToggleUI();
}

function updatePerfToggleUI() {
  const btn = document.getElementById('btn-perf');
  if (!btn) return;
  const isLite = isPerfLite();
  btn.textContent = isLite ? '🐢' : '✨';
  btn.title = isLite ? 'Low performance mode (click for high)' : 'High performance mode (click for low)';
  btn.classList.toggle('active', isLite);
}

const valueAnimationFrames = new WeakMap();
const winnerPulseTimers = new WeakMap();

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

function motion() {
  return getMotionProfile();
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
  card.style.setProperty('--rot', (Math.random() - 0.5) * 5.5 + 'deg');

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
  if (duration <= 0) {
    obj.textContent = '$' + end;
    return;
  }
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

  const lite = isPerfLite();
  const dur = lite ? Math.round(duration * 0.6) : duration;
  let startTimestamp = null;
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
  obj.classList.add('bump');

  const step = (timestamp) => {
    if (startTimestamp === null) startTimestamp = timestamp;
    const raw = Math.min((timestamp - startTimestamp) / dur, 1);
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
    const profile = motion();
    updateUIRafId = null;
    const lite = isPerfLite();

    animateValue(els.wallet, lastWallet, Math.floor(wallet), lite ? 300 : 480);
    lastWallet = Math.floor(wallet);

    const totalBet = currentBets.reduce((a, b) => a + b, 0) || currentBet;
    animateValue(els.bet, lastTotalBet, Math.floor(totalBet), lite ? 180 : 280);
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
    updatePerfToggleUI();
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
  const lite = isPerfLite();
  const dur = lite ? 200 : 360;

  if (lite) {
    cards.forEach((c, i) => {
      c.animate(
        [
          { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
          { transform: 'translate3d(0,-14px,0) scale(0.9)', opacity: 0 }
        ],
        { duration: dur, easing: EASE, delay: i * 15, fill: 'forwards' }
      ).onfinish = () => c.remove();
    });
    return;
  }

  cards.forEach((c, i) => {
    c.animate(
      [
        { transform: 'translate3d(0,0,0) scale(1) rotate(0deg)', opacity: 1, filter: 'blur(0px)' },
        { transform: 'translate3d(0,-6px,0) scale(0.98)', opacity: 0.9, filter: 'blur(0px)', offset: 0.2 },
        { transform: 'translate3d(0,-16px,0) scale(0.92) rotate(1.5deg)', opacity: 0.5, filter: 'blur(1px)', offset: 0.6 },
        { transform: 'translate3d(0,-24px,0) scale(0.82) rotate(3deg)', opacity: 0, filter: 'blur(3px)' }
      ],
      { duration: dur, easing: EASE, delay: i * 25, fill: 'forwards' }
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
  const profile = motion();
  const existing = winnerPulseTimers.get(container);
  if (existing) window.clearTimeout(existing);
  container.classList.add('winner-pulse');
  const lite = isPerfLite();
  const timeout = window.setTimeout(() => {
    container.classList.remove('winner-pulse');
    winnerPulseTimers.delete(container);
  }, lite ? 800 : 1200);
  winnerPulseTimers.set(container, timeout);
}

function animateChip(x, y) {
  const lite = isPerfLite();
  const chip = document.createElement('div');
  chip.className = 'flying-chip';
  chip.style.left = x + 'px';
  chip.style.top = y + 'px';
  document.body.appendChild(chip);

  const tx = window.innerWidth / 2 - 22;
  const ty = window.innerHeight - 200;
  const dx = tx - x;
  const dy = ty - y;
  const arc = lite ? 16 : 52;
  const dur = lite ? 280 : 520;

  if (lite) {
    chip.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0.4 }
      ],
      { duration: dur, easing: EASE }
    ).onfinish = () => chip.remove();
    return;
  }

  chip.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.25}px, ${dy * 0.12 - arc}px) scale(0.9) rotate(180deg)`, opacity: 0.95, offset: 0.3 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.38 - arc * 0.6}px) scale(0.72) rotate(380deg)`, opacity: 0.85, offset: 0.58 },
      { transform: `translate(${dx * 0.8}px, ${dy * 0.72 - arc * 0.2}px) scale(0.52) rotate(540deg)`, opacity: 0.65, offset: 0.82 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35) rotate(680deg)`, opacity: 0.4 }
    ],
    { duration: dur, easing: 'cubic-bezier(0.23, 0.96, 0.23, 1)' }
  ).onfinish = () => chip.remove();
}

function triggerConfetti() {
  const lite = isPerfLite();
  const colors = ['#e8c547', '#e74c3c', '#3498db', '#fff', '#3dd88a', '#a855f7', '#f59e0b'];
  const fragment = document.createDocumentFragment();
  const count = lite ? 12 : 55;
  const maxDist = lite ? 180 : 340;
  const minDist = lite ? 50 : 80;

  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti confetti-fly';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * maxDist;
    c.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
    c.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    c.style.setProperty('--rot', (Math.random() * 600 + 120) + 'deg');
    const baseDur = lite ? 350 : 700;
    const randDur = lite ? 250 : 500;
    c.style.setProperty('--dur', (baseDur + Math.random() * randDur) + 'ms');
    const size = 4 + Math.random() * 6;
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    c.addEventListener('animationend', () => c.remove(), { once: true });
    fragment.appendChild(c);
  }
  document.body.appendChild(fragment);
}

function spawnCard(handArr, container, faceUp, delay) {
  const profile = motion();
  const cardData = deck.pop();
  handArr.push(cardData);
  const lite = isPerfLite();
  setTimeout(() => {
    playSound('card');

    const cardEl = makeCardDOM(cardData, faceUp);
    const dealDuration = lite ? 340 : 600;
    const flipDuration = lite ? 300 : 560;
    cardEl.style.setProperty('--deal-duration', `${dealDuration}ms`);
    cardEl.style.setProperty('--flip-duration', `${flipDuration}ms`);

    if (faceUp) {
      cardEl.classList.add('face-down');
    }

    container.appendChild(cardEl);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        cardEl.classList.add('dealt');
      });
    });

    if (faceUp) {
      const revealDelay = Math.max(80, Math.round(dealDuration * 0.3));
      setTimeout(() => {
        cardEl.classList.remove('face-down');
      }, revealDelay);
    }
  }, delay);
}

function animateScoreBadge(badgeEl) {
  if (!badgeEl || isPerfLite()) return;
  badgeEl.classList.add('pop-in');
  setTimeout(() => badgeEl.classList.remove('pop-in'), 500);
}
