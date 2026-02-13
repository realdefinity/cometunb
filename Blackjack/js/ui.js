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

  // Front (Face)
  const face = document.createElement('div');
  face.className = 'card-face';
  
  // Back
  const back = document.createElement('div');
  back.className = 'card-back';
  
  // Design Logic
  const colorCls = suitClass(cardData.s);
  
  // Top Left
  const cornerTL = document.createElement('div');
  cornerTL.className = `corner ${colorCls}`;
  cornerTL.innerHTML = `<span class="rank">${cardData.v}</span><span class="suit">${cardData.s}</span>`;
  
  // Bottom Right
  const cornerBR = document.createElement('div');
  cornerBR.className = `corner bottom ${colorCls}`;
  cornerBR.innerHTML = `<span class="rank">${cardData.v}</span><span class="suit">${cardData.s}</span>`;
  
  // Middle Grid
  const grid = document.createElement('div');
  grid.className = `pip-grid ${colorCls}`;
  
  // Simple Pip Logic for now (can be expanded)
  if (['J','Q','K'].includes(cardData.v)) {
      const art = document.createElement('div');
      art.className = 'face-card-art';
      art.textContent = cardData.s; // Placeholder
      face.appendChild(art);
  } else {
      // Basic Pips (reuse existing if logic)
      if (!isNaN(parseInt(cardData.v, 10))) {
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
      } else if (cardData.v === 'A') {
         const pip = document.createElement('div');
         pip.className = 'pip big';
         pip.textContent = cardData.s;
         pip.style.gridColumn = '2';
         pip.style.gridRow = '3';
         grid.appendChild(pip);
      }
      face.appendChild(grid);
  }
  
  const stamp = document.createElement('div');
  stamp.className = 'bust-stamp';
  stamp.textContent = 'BUSTED';

  face.appendChild(cornerTL);
  face.appendChild(cornerBR);
  face.appendChild(stamp);

  inner.appendChild(face);
  inner.appendChild(back);
  card.appendChild(inner);

  // New Logic: Default is Back Visible (no class).
  // If we want it Face Up eventually, spawnCard will add 'flipped' class.
  // If we want it Hole Card (Face Down), we never add 'flipped'.
  
  return card;
}

function setControlsEnabled(enabled) {
  els.btnHit.disabled = !enabled;
  els.btnStand.disabled = !enabled;
}

// Helper for number animation
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const val = Math.floor(progress * (end - start) + start);
    obj.textContent = '$' + val;
    if (progress < 1) {
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
  // Animate Wallet
  animateValue(els.wallet, lastWallet, Math.floor(wallet), 500);
  lastWallet = Math.floor(wallet);

  const totalBet = currentBets.reduce((a, b) => a + b, 0) || currentBet;
  animateValue(els.bet, lastTotalBet, Math.floor(totalBet), 300);
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
      [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translateY(-28px) scale(0.92)', opacity: 0 }],
      { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', delay: i * 22 }
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
  
  // More dynamic curve
  chip.animate(
    [
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 }, 
        { transform: `translate(${tx - x}px, ${ty - y}px) scale(0.6) rotate(720deg)`, opacity: 0.8 }
    ],
    { duration: 500, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
  ).onfinish = () => chip.remove();
}

function triggerConfetti() {
  const colors = ['#e8c547', '#e74c3c', '#3498db', '#fff', '#3dd88a'];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.className = 'confetti confetti-fly';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 400;
    c.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
    c.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    c.style.setProperty('--rot', Math.random() * 720 + 'deg');
    c.style.setProperty('--dur', (800 + Math.random() * 800) + 'ms');
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
    
    // Create card (Default is Face Down/Back Visible)
    const cardEl = makeCardDOM(cardData, faceUp);
    container.appendChild(cardEl);
    
    // Force reflow
    void cardEl.offsetWidth;
    
    // Fly in
    cardEl.classList.add('dealt');
    
    // If it should be Face Up, flip it after a short delay
    if (faceUp) {
        setTimeout(() => {
            cardEl.classList.add('flipped');
        }, 150); 
    }
  }, delay);
}
