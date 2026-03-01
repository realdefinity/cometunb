window.state = {
    isDrawing: false,
    points: [],
    particles: [],
    analysis: null,
    bestScore: Number(localStorage.getItem('perfectcircle_best') || 0),
    width: 0,
    height: 0,
    hue: 0,
    ghostProgress: 0
};

window.elements = {
    canvas: document.getElementById('gameCanvas'),
    score: document.getElementById('score'),
    instruction: document.getElementById('instruction'),
    rank: document.getElementById('rank'),
    feedback: document.getElementById('feedback'),
    best: document.getElementById('best-score-val')
};

window.elements.best.innerText = window.state.bestScore.toFixed(1);
