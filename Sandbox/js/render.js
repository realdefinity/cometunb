function initPalettes() {
    const p = (r,g,b,v) => genPal(r,g,b,v);
    PALETTES = {
        [T.SAND]: p(235, 200, 110, 25),
        [T.WATER]: p(50, 150, 255, 15),
        [T.STONE]: p(120, 120, 130, 20),
        [T.FIRE]: p(255, 80, 10, 10),
        [T.ACID]: p(100, 255, 50, 20),
        [T.STEAM]: p(210, 220, 230, 10),
        [T.METAL]: p(160, 160, 170, 10),
        [T.WOOD]: p(100, 70, 40, 15),
        [T.PLANT]: p(60, 200, 60, 30),
        [T.OIL]: p(50, 40, 20, 10),
        [T.C4]: p(230, 230, 210, 10),
        [T.LAVA]: p(255, 100, 0, 20),
        [T.GUNPOWDER]: p(80, 80, 80, 10),
        [T.FUSE]: p(50, 150, 100, 20),
        [T.GLASS]: p(200, 230, 255, 5),
        [T.GAS]: p(200, 100, 255, 30),
        [T.SMOKE]: p(120, 120, 120, 15),
        [T.EMBER]: p(255, 200, 100, 50)
    };
}

function genPal(r, g, b, varAmt) {
    const arr = [];
    for (let i = 0; i < 32; i++) {
        const v = (Math.random() * varAmt * 2) - varAmt;
        const nr = Math.min(255, Math.max(0, r + v));
        const ng = Math.min(255, Math.max(0, g + v));
        const nb = Math.min(255, Math.max(0, b + v));
        arr.push((255 << 24) | (nb << 16) | (ng << 8) | nr);
    }
    return arr;
}

function draw() {
    // 1. Render the pixels
    const ctx = document.getElementById('simCanvas').getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels.buffer), width, height), 0, 0);
    
    // 2. Handle Mouse Input (Continuous Drawing)
    if (window.processInput) window.processInput();

    // 3. Update Physics
    update();
    
    // 4. Update Stats
    frameCount++;
    const stats = document.getElementById('stats');
    if(stats && frameCount % 20 === 0 && mouse.y < height && mouse.x < width) {
        stats.innerText = `FPS: 60 | Temp: ${temp[mouse.y*width+mouse.x]}°C`;
    }
    
    // 5. Loop
    window.animId = requestAnimationFrame(draw);
}