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

// Boot
init();