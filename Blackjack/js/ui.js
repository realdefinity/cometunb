function getPlayerCardsContainer(i) { return i === 0 ? els.pCards0 : els.pCards1; }
function getPlayerScoreEl(i) { return i === 0 ? els.pScore0 : els.pScore1; }

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
  
  // ——— Corners ———
  const cornerContent = `<span class="rank">${cardData.v}</span><span class="suit">${cardData.s}</span>`;
  const cornerTL = document.createElement('div');
  cornerTL.className = `corner ${colorCls}`;
  cornerTL.innerHTML = cornerContent;
  
  const cornerBR = document.createElement('div');
  cornerBR.className = `corner bottom ${colorCls}`;
  cornerBR.innerHTML = cornerContent;
  
  face.appendChild(cornerTL);
  face.appendChild(cornerBR);

  // ——— Center Content ———
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

  // Bust Stamp
  const stamp = document.createElement('div');
  stamp.className = 'bust-stamp';
  stamp.textContent = 'BUSTED';
  face.appendChild(stamp);

  // Assemble
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

// Smooth number animation with easing
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const raw = Math.min((timestamp - startTimestamp) / duration, 1);
    const progress = easeOutCubic(raw);
    const val = Math.floor(progress * (end - start) + start);
    obj.textContent = '$' + val;
    if (raw < 1) {
      window.requestAnimationFrame(step);
    } else {
        obj.classList.remove('bump');
    }
  };
  if(start !== end) {
      obj.classList.add('bump');
      window.requestAnimationFrame(step);
  } else {
      obj.textContent = '$' + end;
  }
}

let lastWallet = 1000;
let lastTotalBet = 0;

function updateUI() {
  animateValue(els.wallet, lastWallet, Math.floor(wallet), 600);
  lastWallet = Math.floor(wallet);

  const totalBet = currentBets.reduce((a, b) => a + b, 0) || currentBet;
  animateValue(els.bet, lastTotalBet, Math.floor(totalBet), 350);
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
  cards.forEach((c, i) => {
    c.animate(
      [
        { transform: c.style.transform || 'translate(0,0) scale(1)', opacity: 1 }, 
        { transform: 'translateY(-20px) scale(0.88) rotate(4deg)', opacity: 0 }
      ],
      { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', delay: i * 30, fill: 'forwards' }
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
  container.classList.add('winner-pulse');
}

function animateChip(x, y) {
  const chip = document.createElement('div');
  chip.className = 'flying-chip';
  chip.style.left = x + 'px';
  chip.style.top = y + 'px';
  document.body.appendChild(chip);
  
  const tx = window.innerWidth / 2 - 22;
  const ty = window.innerHeight - 230;
  
  chip.animate(
    [
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 }, 
        { transform: `translate(${(tx - x) * 0.5}px, ${(ty - y) * 0.3 - 60}px) scale(0.85) rotate(360deg)`, opacity: 0.95, offset: 0.5 },
        { transform: `translate(${tx - x}px, ${ty - y}px) scale(0.5) rotate(720deg)`, opacity: 0.7 }
    ],
    { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  ).onfinish = () => chip.remove();
}

function triggerConfetti() {
  const colors = ['#e8c547', '#e74c3c', '#3498db', '#fff', '#3dd88a', '#a855f7'];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'confetti confetti-fly';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 350;
    c.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
    c.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    c.style.setProperty('--rot', Math.random() * 720 + 'deg');
    c.style.setProperty('--dur', (800 + Math.random() * 700) + 'ms');
    c.style.width = (6 + Math.random() * 6) + 'px';
    c.style.height = (6 + Math.random() * 6) + 'px';
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
    
    if (faceUp) {
        cardEl.classList.add('face-down');
    }
    
    container.appendChild(cardEl);
    
    void cardEl.offsetWidth;
    
    cardEl.classList.add('dealt');
    
    if (faceUp) {
        setTimeout(() => {
            cardEl.classList.remove('face-down');
        }, 120); 
    }
  }, delay);
}
