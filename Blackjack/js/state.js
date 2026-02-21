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
