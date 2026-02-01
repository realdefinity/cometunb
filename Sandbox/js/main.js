let isPaused = false;

function resize() {
    canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    
    width = Math.ceil(window.innerWidth / SCALE);
    height = Math.ceil(window.innerHeight / SCALE);
    canvas.width = width;
    canvas.height = height;

    cells = new Uint8Array(width * height).fill(0);
    pixels = new Uint32Array(width * height).fill(0xFF080808);
    extra = new Uint8Array(width * height).fill(0);
    temp = new Int16Array(width * height).fill(22); // Ambient 22C
}

function init() {
    initPalettes();
    resize();
    window.addEventListener('resize', resize);
    
    if (window.animId) cancelAnimationFrame(window.animId);
    window.animId = requestAnimationFrame(draw);
}

// --- SYSTEM FUNCTIONS ---

function toggleUI() {
    const ui = document.getElementById('ui-container');
    ui.classList.toggle('minimized');
    const btn = document.getElementById('ui-toggle');
    // Change icon based on state
    if(ui.classList.contains('minimized')) btn.innerText = "⬆️";
    else btn.innerText = "⬇️";
}

function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('pauseBtn');
    btn.innerText = isPaused ? "▶️" : "⏸️";
    btn.style.background = isPaused ? "rgba(255, 215, 64, 0.2)" : "";
}

function clearSim() {
    if(!cells) return;
    // Fast clear
    cells.fill(T.EMPTY);
    pixels.fill(0xFF080808);
    extra.fill(0);
    temp.fill(22);
}

// Make functions global so HTML can see them
window.toggleUI = toggleUI;
window.togglePause = togglePause;
window.clearSim = clearSim;

// Boot
init();