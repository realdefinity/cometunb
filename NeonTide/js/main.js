import { NeonTideGame } from './game.js';

const canvas = document.getElementById('gameCanvas');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const dashBarEl = document.getElementById('dashBar');
const dashTextEl = document.getElementById('dashText');

const startPanel = document.getElementById('startPanel');
const gameOverPanel = document.getElementById('gameOverPanel');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const runSummaryEl = document.getElementById('runSummary');

const game = new NeonTideGame(canvas);

const resize = () => {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  game.resize(window.innerWidth, window.innerHeight, dpr);
};
resize();
window.addEventListener('resize', resize);

let prev = performance.now();
let isPlaying = false;

function animate(now) {
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;

  const ended = game.update(dt);

  if (isPlaying) {
    scoreEl.textContent = Math.floor(game.score);
    comboEl.textContent = `x${game.combo.toFixed(1)}`;
    dashBarEl.style.width = `${(game.player.dashCd * 100).toFixed(1)}%`;
    dashTextEl.textContent = game.player.dashCd >= 1 ? 'Ready' : `${Math.ceil((1 - game.player.dashCd) * 10) / 10}s`;
  }

  if (ended) {
    isPlaying = false;
    finalScoreEl.textContent = String(ended.score);
    bestScoreEl.textContent = String(ended.best);
    runSummaryEl.textContent = `You surfed for ${ended.time}s before the tide got rough.`;
    gameOverPanel.classList.add('active');
  }

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

function startRun() {
  game.start();
  isPlaying = true;
  startPanel.classList.remove('active');
  gameOverPanel.classList.remove('active');
}

startBtn.addEventListener('click', startRun);
restartBtn.addEventListener('click', startRun);

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) {
    event.preventDefault();
    game.setKey(key, true);
  }
});

window.addEventListener('keyup', (event) => {
  game.setKey(event.key.toLowerCase(), false);
});

canvas.addEventListener('pointerdown', () => {
  if (!isPlaying && !gameOverPanel.classList.contains('active')) startRun();
});

canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  game.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
});

canvas.addEventListener('pointerleave', () => {
  game.pointer = null;
});
