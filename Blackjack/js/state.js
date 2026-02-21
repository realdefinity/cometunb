let deck = [];
let playerHands = [[]];  // array of hands; after split: [hand0, hand1]
let dealerHand = [];
let wallet = 1000;
let loan = 0;
const LOAN_INTEREST = 1.1;
let currentBet = 0;
let currentBets = [0];
let lastBet = 0;
let gameState = 'BETTING';
let audioCtx = null;
let hasDoubled = [false];
let activeHandIndex = 0;
let stats = { wins: 0, losses: 0, pushes: 0 };
let consecutiveWins = 0;
let soundMuted = false;
let insuranceBet = 0;
let surrenderedHands = [];

// Will be populated in main.js
let els = {};

const PERF_STORAGE_KEY = 'blackjack-perf-mode';
const PERF_MODE_AUTO = 'auto';
const PERF_MODE_LOW = 'low';
const PERF_MODE_HIGH = 'high';
const PERF_MODE_ORDER = [PERF_MODE_AUTO, PERF_MODE_LOW, PERF_MODE_HIGH];

const MOTION_PROFILES = Object.freeze({
  high: Object.freeze({
    walletValueDuration: 520,
    betValueDuration: 320,
    clearDuration: 360,
    clearStagger: 18,
    winnerPulseDuration: 1120,
    chipArc: 52,
    chipDuration: 560,
    confettiCount: 52,
    confettiMinDist: 100,
    confettiRandDist: 320,
    confettiBaseDuration: 680,
    confettiRandDuration: 560,
    dealDuration: 620,
    flipDuration: 520,
    dealGap: 190,
    revealRatio: 0.3,
    actionResolveDelay: 340,
    dealerStepDelay: 460,
    dealerStepFastDelay: 240,
    revealPause: 320,
    postDealPause: 340,
    controlsInDelay: 120,
    handSwitchDelay: 420,
    roundResetDelay: 2500
  }),
  low: Object.freeze({
    walletValueDuration: 320,
    betValueDuration: 220,
    clearDuration: 230,
    clearStagger: 10,
    winnerPulseDuration: 780,
    chipArc: 22,
    chipDuration: 320,
    confettiCount: 14,
    confettiMinDist: 56,
    confettiRandDist: 150,
    confettiBaseDuration: 360,
    confettiRandDuration: 270,
    dealDuration: 380,
    flipDuration: 320,
    dealGap: 150,
    revealRatio: 0.22,
    actionResolveDelay: 220,
    dealerStepDelay: 310,
    dealerStepFastDelay: 180,
    revealPause: 190,
    postDealPause: 200,
    controlsInDelay: 80,
    handSwitchDelay: 280,
    roundResetDelay: 1800
  })
});

function clampPerfMode(mode) {
  if (mode === PERF_MODE_LOW || mode === PERF_MODE_HIGH || mode === PERF_MODE_AUTO) return mode;
  return PERF_MODE_AUTO;
}

function readStoredPerfMode() {
  try {
    const stored = window.localStorage && window.localStorage.getItem(PERF_STORAGE_KEY);
    return clampPerfMode(stored);
  } catch (err) {
    return PERF_MODE_AUTO;
  }
}

function writeStoredPerfMode(mode) {
  try {
    if (!window.localStorage) return;
    window.localStorage.setItem(PERF_STORAGE_KEY, mode);
  } catch (err) {
    // Ignore storage failures (private mode / policy restrictions).
  }
}

function detectPerformanceSignals() {
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cpuCores = Number(navigator.hardwareConcurrency || 0);
  const memoryGb = Number(navigator.deviceMemory || 0);
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slowConnection = !!(conn && (
    conn.effectiveType === 'slow-2g'
    || conn.effectiveType === '2g'
    || conn.effectiveType === '3g'
  ));
  const lowPowerDevice = (cpuCores > 0 && cpuCores <= 4) || (memoryGb > 0 && memoryGb <= 4);
  return { prefersReducedMotion, cpuCores, memoryGb, slowConnection, lowPowerDevice };
}

let perfMode = readStoredPerfMode();
let perfSignals = detectPerformanceSignals();
let perfLite = false;

function shouldUsePerfLite(mode = perfMode) {
  if (perfSignals.prefersReducedMotion) return true;
  if (mode === PERF_MODE_LOW) return true;
  if (mode === PERF_MODE_HIGH) return false;
  return perfSignals.lowPowerDevice || perfSignals.slowConnection;
}

function getMotionProfile() {
  return perfLite ? MOTION_PROFILES.low : MOTION_PROFILES.high;
}

const motionProfile = getMotionProfile;

function getPerformanceSummary() {
  return {
    mode: perfMode,
    perfLite,
    autoLow: perfSignals.lowPowerDevice || perfSignals.slowConnection || perfSignals.prefersReducedMotion,
    signals: perfSignals
  };
}

function applyPerformanceMode(mode = perfMode, persist = true) {
  perfMode = clampPerfMode(mode);
  perfSignals = detectPerformanceSignals();
  perfLite = shouldUsePerfLite(perfMode);

  if (persist) writeStoredPerfMode(perfMode);

  if (document.body) {
    document.body.classList.toggle('perf-lite', perfLite);
    document.body.classList.toggle('perf-rich', !perfLite);
    document.body.dataset.perfMode = perfMode;
    document.body.dataset.perfTier = perfLite ? 'low' : 'high';
  }

  window.dispatchEvent(new CustomEvent('blackjack:perfmodechange', {
    detail: getPerformanceSummary()
  }));

  return getPerformanceSummary();
}

function cyclePerformanceMode() {
  const idx = PERF_MODE_ORDER.indexOf(perfMode);
  const next = PERF_MODE_ORDER[(idx + 1) % PERF_MODE_ORDER.length];
  return applyPerformanceMode(next, true);
}

// Initialize mode early so ui.js/game.js consume the right profile on first render.
applyPerformanceMode(perfMode, false);
