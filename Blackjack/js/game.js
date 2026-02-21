function cryptoRandInt(max) {
  if (max <= 0) return 0;
  const arr = new Uint32Array(1);
  (window.crypto || window.msCrypto).getRandomValues(arr);
  return arr[0] % max;
}

function createDeck() {
  deck = [];
  const NUM_DECKS = 6;
  for (let d = 0; d < NUM_DECKS; d++) {
    for (const s of SUITS) {
      for (const v of VALUES) {
        deck.push({ s, v });
      }
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = cryptoRandInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function getVal(card) {
  if (['J','Q','K'].includes(card.v)) return 10;
  if (card.v === 'A') return 11;
  return parseInt(card.v, 10);
}

function getScore(hand) {
  let score = 0, aces = 0;
  for (const c of hand) {
    score += getVal(c);
    if (c.v === 'A') aces++;
  }
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

function isBlackjack(hand) {
  return hand.length === 2 && getScore(hand) === 21;
}

function sameValue(c1, c2) {
  return getVal(c1) === getVal(c2);
}

function canDoubleDown(handIndex) {
  const hand = playerHands[handIndex];
  const doubled = hasDoubled[handIndex];
  const betForHand = currentBets[handIndex] != null ? currentBets[handIndex] : currentBet;
  return gameState === 'PLAYING' && hand && hand.length === 2 && !doubled && wallet >= betForHand && activeHandIndex === handIndex;
}

function canSplit() {
  if (gameState !== 'PLAYING') return false;
  if (playerHands.length !== 1) return false;
  const hand = playerHands[0];
  if (hand.length !== 2) return false;
  if (wallet < currentBet) return false;
  return sameValue(hand[0], hand[1]);
}

function canSurrender() {
  if (gameState !== 'PLAYING') return false;
  const hand = playerHands[activeHandIndex];
  if (!hand || hand.length !== 2) return false;
  if (surrenderedHands[activeHandIndex]) return false;
  return true;
}

function dealerUpcardIsAceOr10() {
  return dealerHand.length > 0 && (dealerHand[0].v === 'A' || getVal(dealerHand[0]) === 10);
}

function takeLoan(amount) {
  if (wallet > 0 || gameState !== 'BETTING') return;
  const totalBetNow = currentBets.reduce((a, b) => a + b, 0) || currentBet;
  if (totalBetNow > 0) return;
  const owe = Math.floor(amount * LOAN_INTEREST);
  wallet += amount;
  loan += owe;
  initAudio();
  playSound('chip');
  updateUI();
}

function payBack(amount) {
  if (gameState !== 'BETTING' || loan <= 0 || wallet <= 0) return;
  const amt = amount === -1 ? Math.min(wallet, loan) : Math.min(amount, Math.floor(wallet), Math.floor(loan));
  if (amt <= 0) return;
  wallet -= amt;
  loan -= amt;
  initAudio();
  playSound('chip');
  updateUI();
}

function placeBet(amt, e) {
  initAudio();
  if (gameState !== 'BETTING') return;
  if (wallet < amt) return;
  playSound('chip');
  if (e) animateChip(e.clientX, e.clientY);
  wallet -= amt;
  currentBet += amt;
  updateUI();
}

function clearBet() {
  if (gameState !== 'BETTING') return;
  wallet += currentBet;
  currentBet = 0;
  updateUI();
}

function rebet() {
  if (gameState !== 'BETTING' || lastBet <= 0) return;
  if (wallet < lastBet) return;
  initAudio();
  playSound('chip');
  const amt = Math.min(lastBet, wallet);
  wallet -= amt;
  currentBet = amt;
  updateUI();
}

function allIn() {
  if (gameState !== 'BETTING') return;
  if (wallet <= 0) return;
  initAudio();
  playSound('chip');
  currentBet += wallet;
  wallet = 0;
  updateUI();
}

function deal() {
  initAudio();
  if (gameState !== 'BETTING' || currentBet <= 0) return;

  const lite = isPerfLite();
  lastBet = currentBet;
  gameState = 'PLAYING';
  playerHands = [[]];
  currentBets = [currentBet];
  hasDoubled = [false];
  surrenderedHands = [];
  insuranceBet = 0;
  activeHandIndex = 0;
  dealerHand = [];
  createDeck();

  hideMsg();
  dimHands(false);
  clearTable();

  els.playerHandsRow.classList.add('single');
  els.playerHandsRow.querySelectorAll('.hand-slot').forEach((slot, i) => {
    slot.classList.toggle('active', i === 0);
    slot.classList.toggle('inactive', i !== 0);
  });
  els.pScore0.classList.remove('visible');
  els.pScore1.classList.remove('visible');
  els.dScore.classList.remove('visible');
  els.betUI.classList.add('hidden');

  const cardDelay = lite ? 180 : 240;
  spawnCard(playerHands[0], els.pCards0, true, 0);
  spawnCard(dealerHand, els.dCards, true, cardDelay);
  spawnCard(playerHands[0], els.pCards0, true, cardDelay * 2);
  spawnCard(dealerHand, els.dCards, false, cardDelay * 3);

  const totalDealTime = cardDelay * 3 + (lite ? 380 : 600);
  setTimeout(() => {
    updateAllPlayerScores(false);
    const dealerAce = dealerHand.length > 0 && dealerHand[0].v === 'A';
    if (dealerAce && !isBlackjack(playerHands[0])) {
      const insAmt = Math.floor(currentBet / 2);
      els.insuranceAmt.textContent = insAmt;
      els.insuranceStrip.style.display = 'flex';
      return;
    }
    if (dealerAce && isBlackjack(playerHands[0])) stand(true);
    else {
      setTimeout(() => { els.gameControls.classList.add('active'); updateUI(); }, lite ? 60 : 120);
    }
  }, totalDealTime);
}

function takeInsurance() {
  const insAmt = Math.floor(currentBet / 2);
  if (wallet < insAmt) return;
  initAudio();
  playSound('chip');
  wallet -= insAmt;
  insuranceBet = insAmt;
  els.insuranceStrip.style.display = 'none';
  const lite = isPerfLite();
  if (isBlackjack(playerHands[0])) stand(true);
  else { setTimeout(() => { els.gameControls.classList.add('active'); updateUI(); }, lite ? 60 : 120); }
}

function declineInsurance() {
  els.insuranceStrip.style.display = 'none';
  const lite = isPerfLite();
  if (isBlackjack(playerHands[0])) stand(true);
  else { setTimeout(() => { els.gameControls.classList.add('active'); updateUI(); }, lite ? 60 : 120); }
}

function surrender() {
  if (!canSurrender()) return;
  const bet = currentBets[activeHandIndex] != null ? currentBets[activeHandIndex] : currentBet;
  wallet += Math.floor(bet / 2);
  surrenderedHands[activeHandIndex] = true;
  if (playerHands.length === 1) {
    gameState = 'END';
    els.gameControls.classList.remove('active');
    showMsg('Surrendered', 'rgba(255,255,255,0.8)');
    updateUI();
    setTimeout(() => {
      gameState = 'BETTING';
      currentBet = 0;
      currentBets = [0];
      playerHands = [[]];
      hasDoubled = [false];
      surrenderedHands = [];
      activeHandIndex = 0;
      els.betUI.classList.remove('hidden');
      dimHands(true);
      updateUI();
    }, 2000);
    return;
  }
  stand(false);
}

function bet2x() {
  if (gameState !== 'BETTING' || currentBet <= 0) return;
  if (wallet < currentBet) return;
  initAudio();
  playSound('chip');
  wallet -= currentBet;
  currentBet *= 2;
  updateUI();
}

function updateAllPlayerScores(showDealer) {
  for (let i = 0; i < playerHands.length; i++) {
    const hand = playerHands[i];
    if (hand && hand.length) {
      const scoreEl = getPlayerScoreEl(i);
      const newScore = String(getScore(hand));
      const changed = scoreEl.textContent !== newScore;
      scoreEl.textContent = newScore;
      if (!scoreEl.classList.contains('visible')) {
        scoreEl.classList.add('visible');
        animateScoreBadge(scoreEl);
      } else if (changed) {
        animateScoreBadge(scoreEl);
      }
    }
  }
  if (showDealer) {
    const newDScore = String(getScore(dealerHand));
    const dChanged = els.dScore.textContent !== newDScore;
    els.dScore.textContent = newDScore;
    if (!els.dScore.classList.contains('visible')) {
      els.dScore.classList.add('visible');
      animateScoreBadge(els.dScore);
    } else if (dChanged) {
      animateScoreBadge(els.dScore);
    }
  } else if (dealerHand.length > 0) {
    const upVal = String(getVal(dealerHand[0]));
    const dChanged = els.dScore.textContent !== upVal;
    els.dScore.textContent = upVal;
    if (!els.dScore.classList.contains('visible')) {
      els.dScore.classList.add('visible');
      animateScoreBadge(els.dScore);
    } else if (dChanged) {
      animateScoreBadge(els.dScore);
    }
  }
}

function split() {
  if (!canSplit()) return;
  initAudio();
  playSound('chip');
  wallet -= currentBet;
  currentBets = [currentBet, currentBet];

  const hand0 = playerHands[0];
  const card1 = hand0.pop();
  const hand1 = [card1];
  hand0.push(deck.pop());
  hand1.push(deck.pop());
  playerHands = [hand0, hand1];
  hasDoubled = [false, false];

  els.playerHandsRow.classList.remove('single');
  els.pCards0.innerHTML = '';
  els.pCards1.innerHTML = '';
  els.pScore0.classList.remove('visible');
  els.pScore1.classList.remove('visible');

  const lite = isPerfLite();
  const cardInterval = lite ? 180 : 240;

  const buildHandDOM = (hand, container, delayStart) => {
    hand.forEach((cardData, idx) => {
      const d = delayStart + idx * cardInterval;
      setTimeout(() => {
        playSound('card');
        const el = makeCardDOM(cardData, true);
        el.style.setProperty('--deal-duration', (lite ? 340 : 600) + 'ms');
        el.style.setProperty('--flip-duration', (lite ? 300 : 560) + 'ms');
        container.appendChild(el);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => { el.classList.add('dealt'); });
        });
      }, d);
    });
  };

  buildHandDOM(hand0, els.pCards0, 0);
  buildHandDOM(hand1, els.pCards1, cardInterval * 2.5);

  const totalSplitTime = cardInterval * 2.5 + cardInterval + (lite ? 200 : 340);
  setTimeout(() => {
    activeHandIndex = 0;
    els.playerHandsRow.querySelectorAll('.hand-slot').forEach((slot, i) => {
      slot.classList.toggle('active', i === 0);
      slot.classList.toggle('inactive', i !== 0);
    });
    updateAllPlayerScores(false);
    updateUI();
  }, totalSplitTime);
}

function hit() {
  if (gameState !== 'PLAYING') return;
  els.btnDouble.disabled = true;
  const hand = playerHands[activeHandIndex];
  const container = getPlayerCardsContainer(activeHandIndex);
  const lite = isPerfLite();
  spawnCard(hand, container, true, 0);
  const checkDelay = lite ? 220 : 320;
  setTimeout(() => {
    updateAllPlayerScores(false);
    const score = getScore(hand);
    if (score > 21) {
      markBusted(container);
      playSound('bust');
      advanceToNextHandOrDealer();
    }
    updateUI();
  }, checkDelay);
}

function stand(revealInstant = false) {
  if (gameState !== 'PLAYING') return;

  const lite = isPerfLite();
  const holeCardEl = els.dCards.children[1];
  const doReveal = () => {
    if (playerHands.length === 1) {
      if (holeCardEl) holeCardEl.classList.remove('face-down');
      gameState = 'DEALER_TURN';
      els.gameControls.classList.remove('active');
      const flipDelay = revealInstant ? (lite ? 120 : 180) : (lite ? 220 : 320);
      setTimeout(() => {
        updateAllPlayerScores(true);
        setTimeout(() => dealerAI(revealInstant), revealInstant ? (lite ? 140 : 220) : (lite ? 300 : 440));
      }, flipDelay);
      return;
    }
    activeHandIndex++;
    if (activeHandIndex < playerHands.length) {
      els.playerHandsRow.querySelectorAll('.hand-slot').forEach((slot, i) => {
        slot.classList.toggle('active', i === activeHandIndex);
        slot.classList.toggle('inactive', i !== activeHandIndex);
      });
      updateUI();
      return;
    }
    if (holeCardEl) holeCardEl.classList.remove('face-down');
    gameState = 'DEALER_TURN';
    els.gameControls.classList.remove('active');
    const flipDelay = lite ? 220 : 320;
    setTimeout(() => {
      updateAllPlayerScores(true);
      setTimeout(() => dealerAI(false), lite ? 300 : 440);
    }, flipDelay);
  };

  const goingToDealer = playerHands.length === 1 || activeHandIndex + 1 >= playerHands.length;
  const showPeek = !revealInstant && goingToDealer && holeCardEl && dealerUpcardIsAceOr10();
  if (showPeek) {
    els.peekMsg.style.display = 'block';
    setTimeout(() => {
      els.peekMsg.style.display = 'none';
      doReveal();
    }, lite ? 500 : 750);
  } else {
    doReveal();
  }
}

function advanceToNextHandOrDealer() {
  const lite = isPerfLite();
  if (playerHands.length === 1) {
    endRoundMulti([{ result: 'BUST', handIndex: 0 }]);
    return;
  }
  activeHandIndex++;
  if (activeHandIndex < playerHands.length) {
    els.playerHandsRow.querySelectorAll('.hand-slot').forEach((slot, i) => {
      slot.classList.toggle('active', i === activeHandIndex);
      slot.classList.toggle('inactive', i !== activeHandIndex);
    });
    els.btnDouble.disabled = !canDoubleDown(activeHandIndex);
    updateUI();
  } else {
    gameState = 'DEALER_TURN';
    els.gameControls.classList.remove('active');
    const holeCardEl = els.dCards.children[1];
    if (holeCardEl) holeCardEl.classList.remove('face-down');
    setTimeout(() => {
      updateAllPlayerScores(true);
      dealerAI(false);
    }, lite ? 260 : 360);
  }
}

function doubleDown() {
  if (!canDoubleDown(activeHandIndex)) return;
  initAudio();
  playSound('chip');
  const addBet = currentBets[activeHandIndex] != null ? currentBets[activeHandIndex] : currentBet;
  wallet -= addBet;
  if (currentBets[activeHandIndex] != null) currentBets[activeHandIndex] *= 2;
  else currentBet *= 2;
  hasDoubled[activeHandIndex] = true;

  const hand = playerHands[activeHandIndex];
  const container = getPlayerCardsContainer(activeHandIndex);
  const lite = isPerfLite();
  spawnCard(hand, container, true, 0);
  const checkDelay = lite ? 220 : 320;
  setTimeout(() => {
    updateAllPlayerScores(false);
    const score = getScore(hand);
    if (score > 21) {
      markBusted(container);
      playSound('bust');
      advanceToNextHandOrDealer();
      return;
    }
    stand(false);
  }, checkDelay);
}

function dealerAI(isFast) {
  const lite = isPerfLite();
  const d = getScore(dealerHand);
  if (d < 17) {
    spawnCard(dealerHand, els.dCards, true, 0);
    const hitDelay = isFast ? (lite ? 200 : 280) : (lite ? 360 : 520);
    setTimeout(() => {
      updateAllPlayerScores(true);
      dealerAI(isFast);
    }, hitDelay);
  } else {
    if (playerHands.length === 1) {
      const res = determineSingleResult();
      endRoundMulti([{ result: res.result, handIndex: 0, msg: res.msg }]);
    } else {
      endRoundMulti(getMultiResults());
    }
  }
}

function determineSingleResult() {
  const p = getScore(playerHands[0]);
  const d = getScore(dealerHand);
  const pBJ = isBlackjack(playerHands[0]);
  const dBJ = isBlackjack(dealerHand);
  if (pBJ && dBJ) return { result: 'PUSH', msg: 'PUSH' };
  if (pBJ) return { result: 'BLACKJACK', msg: 'BLACKJACK!' };
  if (dBJ) return { result: 'LOSE', msg: 'HOUSE BLACKJACK' };
  if (d > 21) return { result: 'WIN', msg: 'DEALER BUSTS' };
  if (p > d) return { result: 'WIN', msg: 'YOU WIN' };
  if (p < d) return { result: 'LOSE', msg: 'HOUSE WINS' };
  return { result: 'PUSH', msg: 'PUSH' };
}

function getMultiResults() {
  const results = [];
  const d = getScore(dealerHand);
  const dBJ = isBlackjack(dealerHand);
  for (let i = 0; i < playerHands.length; i++) {
    if (surrenderedHands[i]) continue;
    const hand = playerHands[i];
    const p = getScore(hand);
    if (p > 21) results.push({ result: 'BUST', handIndex: i });
    else if (isBlackjack(hand) && !dBJ) results.push({ result: 'BLACKJACK', handIndex: i, msg: 'BLACKJACK!' });
    else if (dBJ) results.push({ result: 'LOSE', handIndex: i, msg: 'House BJ' });
    else if (d > 21) results.push({ result: 'WIN', handIndex: i, msg: 'Dealer busts' });
    else if (p > d) results.push({ result: 'WIN', handIndex: i, msg: 'Win' });
    else if (p < d) results.push({ result: 'LOSE', handIndex: i, msg: 'Lose' });
    else results.push({ result: 'PUSH', handIndex: i, msg: 'Push' });
  }
  return results;
}

function endRoundMulti(results) {
  gameState = 'END';

  if (isBlackjack(dealerHand) && insuranceBet > 0) {
    wallet += insuranceBet * 2;
  }

  const bets = currentBets.length === playerHands.length ? currentBets : playerHands.map(() => currentBet);
  let totalPayout = 0;
  let anyWin = false;
  let anyLoss = false;

  if (dealerHand.length && getScore(dealerHand) > 21) markBusted(els.dCards);

  for (const r of results) {
    const bet = bets[r.handIndex] != null ? bets[r.handIndex] : currentBet / results.length;
    if (r.result === 'WIN') {
      anyWin = true;
      totalPayout += bet * 2;
      stats.wins++;
      highlightWinner(getPlayerCardsContainer(r.handIndex));
    } else if (r.result === 'BLACKJACK') {
      anyWin = true;
      totalPayout += bet * 2.5;
      stats.wins++;
      highlightWinner(getPlayerCardsContainer(r.handIndex));
    } else if (r.result === 'LOSE' || r.result === 'BUST') {
      anyLoss = true;
      stats.losses++;
    } else if (r.result === 'PUSH') {
      totalPayout += bet;
      stats.pushes++;
    }
  }

  if (anyWin) {
    playSound('win');
    triggerConfetti();
    consecutiveWins++;
  } else {
    consecutiveWins = 0;
  }
  wallet += totalPayout;

  const displayMsg = results.length === 1 ? (results[0].msg || results[0].result) : (anyWin ? 'Round over' : anyLoss ? 'Round over' : 'Push');
  let msgColor = 'white';
  if (anyWin && !anyLoss) msgColor = 'var(--gold)';
  else if (anyLoss && !anyWin) msgColor = 'var(--danger)';
  showMsg(displayMsg, msgColor);
  updateStatsUI();
  updateUI();

  setTimeout(() => {
    gameState = 'BETTING';
    currentBet = 0;
    currentBets = [0];
    playerHands = [[]];
    hasDoubled = [false];
    surrenderedHands = [];
    insuranceBet = 0;
    activeHandIndex = 0;
    els.betUI.classList.remove('hidden');
    els.insuranceStrip.style.display = 'none';
    dimHands(true);
    updateUI();
  }, 2600);
}
