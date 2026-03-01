let deck = [];
let playerHands = [[]];
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
let els = {};
let handsWithUnpaidLoan = 0;
let coins = 25;
let inventory = {};
let perks = {
  luckyStart: false,
  highRoller: false,
  insuranceDiscountRemaining: 0,
  doubleAnywhereRemaining: 0,
  rebetBoostRemaining: 0,
  splitMasterRemaining: 0,
  insuranceProRemaining: 0,
  comebackCoinRemaining: 0
};

let roundToken = 0;
