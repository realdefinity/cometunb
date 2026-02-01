function initPalettes() {
    const p = (r,g,b,v) => genPal(r,g,b,v);
    PALETTES = {
        [T.SAND]: p(235, 200, 110, 25),
        [T.DIRT]: p(115, 78, 59, 15),
        [T.MUD]: p(92, 64, 51, 10),
        [T.SANDSTONE]: p(180, 130, 80, 10),
        
        [T.WATER]: p(50, 150, 255, 15),
        [T.SALT_WATER]: p(60, 170, 240, 15),
        [T.SLIME]: p(100, 230, 100, 20),
        [T.ACID]: p(180, 255, 50, 20),
        [T.OIL]: p(50, 40, 20, 10),
        [T.NITRO]: p(200, 255, 100, 30), 
        
        [T.STONE]: p(120, 120, 130, 20),
        [T.BRICK]: p(180, 80, 60, 15),
        [T.CONCRETE]: p(150, 150, 150, 10),
        [T.METAL]: p(140, 145, 150, 10),
        [T.GLASS]: p(200, 230, 255, 5),
        [T.WAX]: p(240, 240, 200, 10),
        
        [T.WOOD]: p(100, 70, 40, 15),
        [T.PLANT]: p(60, 200, 60, 30),
        [T.SPORE]: p(180, 200, 50, 50),
        [T.VIRUS]: p(150, 0, 150, 40),
        
        [T.ICE]: p(180, 220, 255, 10),
        [T.SNOW]: p(240, 240, 255, 5),
        
        [T.FIRE]: p(255, 80, 10, 10),
        [T.LAVA]: p(255, 100, 0, 20),
        [T.THERMITE]: p(255, 150, 150, 20),
        [T.GUNPOWDER]: p(80, 80, 80, 10),
        [T.C4]: p(230, 230, 210, 10),
        [T.FUSE]: p(50, 150, 100, 20),
        
        [T.GAS]: p(200, 100, 255, 30),
        [T.METHANE]: p(80, 100, 60, 20),
        [T.HELIUM]: p(255, 200, 255, 10),
        [T.STEAM]: p(210, 220, 230, 10),
        [T.SMOKE]: p(120, 120, 120, 15),
        
        [T.ANTIMATTER]: p(20, 0, 40, 5)
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
    const cvs = document.getElementById('simCanvas');
    if(!cvs) { window.animId = requestAnimationFrame(draw); return; }
    
    const ctx = cvs.getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels.buffer), width, height), 0, 0);
    
    // Process input (Drawing)
    if (window.processInput) window.processInput();

    // Update Simulation (if not paused)
    if (!window.isPaused && window.update) {
        update();
    }
    
    frameCount++;
    const stats = document.getElementById('stats');
    if(stats && frameCount % 20 === 0 && mouse.y < height && mouse.x < width) {
        // Safe access to temp
        const tVal = temp ? temp[mouse.y*width+mouse.x] : 0;
        stats.innerText = `FPS: 60 | Temp: ${tVal}°C`;
    }
    window.animId = requestAnimationFrame(draw);
}