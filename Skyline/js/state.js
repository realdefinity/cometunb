window.state = {
    canvas: document.getElementById('gameCanvas'),
    bgCanvas: document.getElementById('bgCanvas'),
    ctx: null,
    bgCtx: null,
    width: 0,
    height: 0,

    actx: null,

    isPlaying: false,
    inputLocked: false,

    blocks: [],
    debris: [],
    particles: [],
    bgStars: [],
    current: null,

    score: 0,
    highScore: Number(localStorage.getItem('skyline_highScore') || 0),
    combo: 0,
    speed: window.CONFIG.startSpeed,
    direction: 1,
    cameraY: 0,
    hue: 210,
    shake: 0,
    gridOffset: 0
};

window.ui = {
    scoreEl: document.getElementById('scoreEl'),
    scoreVal: document.getElementById('scoreVal'),
    highScoreVal: document.getElementById('highScoreVal'),
    startMenu: document.getElementById('startMenu'),
    gameOverMenu: document.getElementById('gameOverMenu'),
    finalScore: document.getElementById('finalScore'),
    finalBest: document.getElementById('finalBest'),
    startBtn: document.getElementById('startBtn'),
    restartBtn: document.getElementById('restartBtn'),
    popups: document.getElementById('popups'),
    flash: document.getElementById('flash')
};
