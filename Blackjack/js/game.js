
function nextRoundToken() {
  roundToken += 1;
  return roundToken;
}

function isRoundActive(roundId) {
  return roundId === roundToken;
}

function scheduleAction(delay, fn, roundId = roundToken) {
  return window.setTimeout(() => {
    if (!isRoundActive(roundId)) return;
    fn();
  }, delay);
}

function waitForAnimation(animation, roundId) {
  if (!animation || !animation.finished) return Promise.resolve(isRoundActive(roundId));
  return animation.finished
    .then(() => isRoundActive(roundId))
    .catch(() => isRoundActive(roundId));
}

function waitForCardDeal(cardEl, roundId) {
  if (!cardEl) return Promise.resolve(isRoundActive(roundId));
  const anim = cardEl.getAnimations().find((a) => {
    const name = a.animationName || (a.effect && a.effect.getKeyframes && a.effect.getKeyframes()[0] && a.effect.getKeyframes()[0].offset != null ? 'keyframes' : '');
    return name !== '';
  }) || cardEl.getAnimations()[0];
  return waitForAnimation(anim, roundId);
}

function revealFaceDownCard(cardEl, roundId = roundToken) {
  if (!cardEl || !isRoundActive(roundId)) return Promise.resolve(false);
  cardEl.classList.remove('face-down');
  const inner = cardEl.querySelector('.inner');
  if (!inner) return Promise.resolve(isRoundActive(roundId));
  const flipAnimation = inner.getAnimations()[0];
  return waitForAnimation(flipAnimation, roundId);
}

async function dealCardTo(handArr, container, faceUp, roundId = roundToken) {
  if (!isRoundActive(roundId)) return null;
  const cardEl = spawnCard(handArr, container, faceUp);
  await waitForCardDeal(cardEl, roundId);
  if (!isRoundActive(roundId)) return null;
  if (faceUp) await revealFaceDownCard(cardEl, roundId);
  return cardEl;
}

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
  const canNormally = hand && hand.length === 2;
  const canWithPerk = perks.doubleAnywhereRemaining > 0 && hand && hand.length >= 2;
  return gameState === 'PLAYING' && (canNormally || canWithPerk) && !doubled && wallet >= betForHand && activeHandIndex === handIndex;
}

function canSplit() {
  if (gameState !== 'PLAYING') return false;
  if (playerHands.length !== 1) return false;
  const hand = playerHands[0];
  if (hand.length !== 2) return false;
  if (wallet < currentBet) return false;
  return sameValue(hand[0], hand[1]) || perks.splitMasterRemaining > 0;
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
  handsWithUnpaidLoan = 0;
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
  if (loan <= 0) handsWithUnpaidLoan = 0;
  initAudio();
  playSound('chip');
  updateUI();
  updateLoanWarning();
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
  let amt = lastBet;
  if (perks.rebetBoostRemaining > 0) {
    amt = Math.floor(lastBet * 1.5);
    perks.rebetBoostRemaining--;
  }
  if (wallet < amt) amt = Math.min(amt, wallet);
  if (amt <= 0) return;
  initAudio();
  playSound('chip');
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

function getStartingWallet() {
  if (perks.highRoller) return 2000;
  if (perks.luckyStart) return 1500;
  return 1000;
}

function restartAfterDeath() {
  const deathEl = document.getElementById('death-overlay');
  if (deathEl) deathEl.style.display = 'none';
  wallet = getStartingWallet();
  loan = 0;
  handsWithUnpaidLoan = 0;
  currentBet = 0;
  currentBets = [0];
  lastBet = 0;
  gameState = 'BETTING';
  playerHands = [[]];
  hasDoubled = [false];
  surrenderedHands = [];
  hideMsg();
  hideLoanWarning();
  clearTable();
  els.betUI.classList.remove('hidden');
  dimHands(true);
  updateUI();
  updateCoinsUI();
}

function checkLoanDeath() {
  if (loan <= 0) return false;
  const grace = (inventory['grace-period'] || 0) * 3;
  const totalHands = LOAN_DEATH_HANDS + grace;
  if (handsWithUnpaidLoan >= totalHands) {
    if ((inventory['extra-life'] || 0) > 0) {
      inventory['extra-life']--;
      handsWithUnpaidLoan = 0;
      showMsg('Extra Life!', 'var(--ok)');
      return false;
    }
    return true;
  }
  return false;
}

async function deal() {
  initAudio();
  if (gameState !== 'BETTING' || currentBet <= 0) return;

  const roundId = nextRoundToken();
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

  await dealCardTo(playerHands[0], els.pCards0, true, roundId);
  await dealCardTo(dealerHand, els.dCards, true, roundId);
  await dealCardTo(playerHands[0], els.pCards0, true, roundId);
  await dealCardTo(dealerHand, els.dCards, false, roundId);
  if (!isRoundActive(roundId)) return;

  updateAllPlayerScores(false);
  const dealerAce = dealerHand.length > 0 && dealerHand[0].v === 'A';
  if (dealerAce && !isBlackjack(playerHands[0])) {
    let insAmt = perks.insuranceProRemaining > 0 ? 0 : Math.floor(currentBet / 2);
    if (insAmt > 0 && perks.insuranceDiscountRemaining > 0) insAmt = Math.floor(insAmt / 2);
    els.insuranceAmt.textContent = insAmt;
    els.insuranceStrip.style.display = 'flex';
    return;
  }
  if (dealerAce && isBlackjack(playerHands[0])) {
    stand(true);
    return;
  }
  scheduleAction(120, () => {
    els.gameControls.classList.add('active');
    updateUI();
  }, roundId);
}

function takeInsurance() {
  const usedPro = perks.insuranceProRemaining > 0;
  let insAmt = usedPro ? 0 : Math.floor(currentBet / 2);
  const usedDiscount = !usedPro && perks.insuranceDiscountRemaining > 0;
  if (usedDiscount) insAmt = Math.floor(insAmt / 2);
  if (wallet < insAmt) return;
  initAudio();
  playSound('chip');
  if (usedPro) perks.insuranceProRemaining--;
  else if (usedDiscount) perks.insuranceDiscountRemaining--;
  saveProgress();
  wallet -= insAmt;
  insuranceBet = usedPro ? Math.floor(currentBet / 2) : insAmt;
  els.insuranceStrip.style.display = 'none';
  if (isBlackjack(playerHands[0])) stand(true);
  else scheduleAction(120, () => { els.gameControls.classList.add('active'); updateUI(); });
}

function declineInsurance() {
  els.insuranceStrip.style.display = 'none';
  if (isBlackjack(playerHands[0])) stand(true);
  else scheduleAction(120, () => { els.gameControls.classList.add('active'); updateUI(); });
}

function surrender() {
  if (!canSurrender()) return;
  const roundId = roundToken;
  const bet = currentBets[activeHandIndex] != null ? currentBets[activeHandIndex] : currentBet;
  wallet += Math.floor(bet / 2);
  surrenderedHands[activeHandIndex] = true;
  if (playerHands.length === 1) {
    gameState = 'END';
    els.gameControls.classList.remove('active');
    showMsg('Surrendered', 'rgba(255,255,255,0.8)');
    updateUI();
    scheduleAction(2000, () => {
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
    }, roundId);
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
      getPlayerScoreEl(i).textContent = String(getScore(hand));
      getPlayerScoreEl(i).classList.add('visible');
    }
  }
  if (showDealer) {
    els.dScore.textContent = String(getScore(dealerHand));
    els.dScore.classList.add('visible');
  } else if (dealerHand.length > 0) {
    els.dScore.textContent = String(getVal(dealerHand[0]));
    els.dScore.classList.add('visible');
  }
}

async function split() {
  if (!canSplit()) return;
  initAudio();
  playSound('chip');
  const usedSplitMaster = perks.splitMasterRemaining > 0 && !sameValue(playerHands[0][0], playerHands[0][1]);
  if (usedSplitMaster) {
    perks.splitMasterRemaining--;
    saveProgress();
  }
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

  const roundId = roundToken;
  for (const cardData of hand0) {
    if (!isRoundActive(roundId)) return;
    const el = makeCardDOM(cardData, true);
    playSound('card');
    el.style.setProperty('--deal-duration', (perfLite ? 400 : 560) + 'ms');
    el.style.setProperty('--flip-duration', (perfLite ? 360 : 520) + 'ms');
    els.pCards0.appendChild(el);
    requestAnimationFrame(() => el.classList.add('dealt'));
    await waitForCardDeal(el, roundId);
  }
  for (const cardData of hand1) {
    if (!isRoundActive(roundId)) return;
    const el = makeCardDOM(cardData, true);
    playSound('card');
    el.style.setProperty('--deal-duration', (perfLite ? 400 : 560) + 'ms');
    el.style.setProperty('--flip-duration', (perfLite ? 360 : 520) + 'ms');
    els.pCards1.appendChild(el);
    requestAnimationFrame(() => el.classList.add('dealt'));
    await waitForCardDeal(el, roundId);
  }

  if (!isRoundActive(roundId)) return;
  activeHandIndex = 0;
  els.playerHandsRow.querySelectorAll('.hand-slot').forEach((slot, i) => {
    slot.classList.toggle('active', i === 0);
    slot.classList.toggle('inactive', i !== 0);
  });
  updateAllPlayerScores(false);
  updateUI();
}

async function hit() {
  if (gameState !== 'PLAYING') return;
  const roundId = roundToken;
  els.btnDouble.disabled = true;
  const hand = playerHands[activeHandIndex];
  const container = getPlayerCardsContainer(activeHandIndex);
  await dealCardTo(hand, container, true, roundId);
  if (!isRoundActive(roundId)) return;
  updateAllPlayerScores(false);
  const score = getScore(hand);
  if (score > 21) {
    markBusted(container);
    playSound('bust');
    advanceToNextHandOrDealer();
  }
  updateUI();
}

function stand(revealInstant = false) {
  if (gameState !== 'PLAYING') return;
  const roundId = roundToken;
  const holeCardEl = els.dCards.children[1];
  const doReveal = async () => {
    if (!isRoundActive(roundId)) return;
    if (playerHands.length === 1) {
      if (holeCardEl) await revealFaceDownCard(holeCardEl, roundId);
      if (!isRoundActive(roundId)) return;
      gameState = 'DEALER_TURN';
      els.gameControls.classList.remove('active');
      scheduleAction(revealInstant ? 160 : 320, () => {
        updateAllPlayerScores(true);
        scheduleAction(revealInstant ? 160 : 380, () => dealerAI(revealInstant, roundId), roundId);
      }, roundId);
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
    if (holeCardEl) await revealFaceDownCard(holeCardEl, roundId);
    if (!isRoundActive(roundId)) return;
    gameState = 'DEALER_TURN';
    els.gameControls.classList.remove('active');
    scheduleAction(320, () => {
      updateAllPlayerScores(true);
      scheduleAction(380, () => dealerAI(false, roundId), roundId);
    }, roundId);
  };

  const goingToDealer = playerHands.length === 1 || activeHandIndex + 1 >= playerHands.length;
  const showPeek = !revealInstant && goingToDealer && holeCardEl && dealerUpcardIsAceOr10();
  if (showPeek) {
    els.peekMsg.style.display = 'block';
    scheduleAction(720, () => {
      els.peekMsg.style.display = 'none';
      doReveal();
    }, roundId);
  } else {
    doReveal();
  }
}

async function advanceToNextHandOrDealer() {
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
    const roundId = roundToken;
    gameState = 'DEALER_TURN';
    els.gameControls.classList.remove('active');
    const holeCardEl = els.dCards.children[1];
    if (holeCardEl) await revealFaceDownCard(holeCardEl, roundId);
    if (!isRoundActive(roundId)) return;
    scheduleAction(120, () => {
      updateAllPlayerScores(true);
      dealerAI(false, roundId);
    }, roundId);
  }
}

async function doubleDown() {
  if (!canDoubleDown(activeHandIndex)) return;
  const roundId = roundToken;
  initAudio();
  playSound('chip');
  if (playerHands[activeHandIndex].length > 2 && perks.doubleAnywhereRemaining > 0) {
    perks.doubleAnywhereRemaining--;
    saveProgress();
  }
  const addBet = currentBets[activeHandIndex] != null ? currentBets[activeHandIndex] : currentBet;
  wallet -= addBet;
  if (currentBets[activeHandIndex] != null) currentBets[activeHandIndex] *= 2;
  else currentBet *= 2;
  hasDoubled[activeHandIndex] = true;

  const hand = playerHands[activeHandIndex];
  const container = getPlayerCardsContainer(activeHandIndex);
  await dealCardTo(hand, container, true, roundId);
  if (!isRoundActive(roundId)) return;
  updateAllPlayerScores(false);
  const score = getScore(hand);
  if (score > 21) {
    markBusted(container);
    playSound('bust');
    advanceToNextHandOrDealer();
    return;
  }
  stand(false);
}

async function dealerAI(isFast, roundId = roundToken) {
  if (!isRoundActive(roundId)) return;
  const d = getScore(dealerHand);
  if (d < 17) {
    await dealCardTo(dealerHand, els.dCards, true, roundId);
    if (!isRoundActive(roundId)) return;
    updateAllPlayerScores(true);
    scheduleAction(isFast ? 180 : 280, () => dealerAI(isFast, roundId), roundId);
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
  els.gameControls.classList.remove('active');
  if (els.peekMsg) els.peekMsg.style.display = 'none';

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

  if (loan > 0) handsWithUnpaidLoan++;

  const handCount = playerHands.reduce((n, h) => n + (h && h.length ? 1 : 0), 0) || 1;
  coins += handCount;
  for (const r of results) {
    if (r.result === 'BLACKJACK') coins += 4;
    else if (r.result === 'WIN') coins += 2;
  }
  if (perks.comebackCoinRemaining > 0) {
    if (anyWin) { coins += 5; perks.comebackCoinRemaining--; }
    else if (anyLoss) {
      const firstLostBet = results.find(r => r.result === 'LOSE' || r.result === 'BUST');
      if (firstLostBet) {
        const refundBet = bets[firstLostBet.handIndex] != null ? bets[firstLostBet.handIndex] : currentBet / results.length;
        wallet += refundBet;
        perks.comebackCoinRemaining--;
      }
    }
  }

  saveProgress();

  if (checkLoanDeath()) {
    scheduleAction(2400, () => {
      gameState = 'DEAD';
      els.betUI.classList.add('hidden');
      els.insuranceStrip.style.display = 'none';
      hideMsg();
      const d = document.getElementById('death-overlay');
      if (d) {
        d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:2147483647;background:rgba(0,0,0,0.7);';
      }
      updateUI();
    }, roundToken);
    return;
  }

  scheduleAction(2600, () => {
    gameState = 'BETTING';
    currentBet = 0;
    currentBets = [0];
    playerHands = [[]];
    hasDoubled = [false];
    surrenderedHands = [];
    insuranceBet = 0;
    activeHandIndex = 0;
    els.gameControls.classList.remove('active');
    els.betUI.classList.remove('hidden');
    els.insuranceStrip.style.display = 'none';
    dimHands(true);
    updateUI();
    updateCoinsUI();
  }, roundToken);
}
