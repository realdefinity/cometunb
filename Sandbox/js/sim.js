function setCell(i, type) {
    if (i < 0 || i >= width * height) return;
    cells[i] = type;
    extra[i] = 0; 
    const pal = PALETTES[type];
    pixels[i] = pal ? pal[Math.floor(Math.random() * pal.length)] : 0xFF080808;
    const p = PROPS[type];
    if (p) {
        if(p.life) extra[i] = p.life + Math.random() * 10;
        if(p.temp) temp[i] = p.temp;
    }
}

function move(a, b) {
    if (a < 0 || b < 0 || a >= width*height || b >= width*height) return;
    const tA = cells[a], tB = cells[b];
    cells[b] = tA; cells[a] = tB;
    const cA = pixels[a], cB = pixels[b];
    pixels[b] = cA; pixels[a] = cB;
    const eA = extra[a], eB = extra[b];
    extra[b] = eA; extra[a] = eB;
    const tmpA = temp[a], tmpB = temp[b];
    temp[b] = tmpA; temp[a] = tmpB;
}

function explode(i) {
    const cx = i % width;
    const cy = Math.floor(i / width);
    const r = 15;
    for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
            if (x*x + y*y > r*r) continue;
            const tx = cx + x, ty = cy + y;
            if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;
            const ti = ty * width + tx;
            if (cells[ti] !== T.STONE && cells[ti] !== T.METAL && cells[ti] !== T.CONCRETE) {
                if (Math.random() < 0.7) setCell(ti, T.FIRE);
                else setCell(ti, T.SMOKE);
                temp[ti] = 2000;
            } else if (Math.random() < 0.1) {
                setCell(ti, T.EMPTY);
            }
        }
    }
}

function canDisplace(i, sourceProps) {
    if (i < 0 || i >= width * height) return false;
    const t = cells[i];
    if (t === T.EMPTY) return true;
    const p = PROPS[t];
    if (!p) return false;
    if (sourceProps.state === 0 && p.state !== 0) return true;
    if (sourceProps.state === 1 && p.state === 2) return true;
    if (sourceProps.state === sourceProps.state && sourceProps.density > p.density) return true;
    return false;
}

// --- BEHAVIOR FUNCTIONS ---

function processThermodynamics(i) {
    if (temp[i] === 22) return;
    temp[i] += (22 - temp[i]) * 0.1;
    const nDir = [i-1, i+1, i-width, i+width][Math.floor(Math.random()*4)];
    if (nDir >= 0 && nDir < width*height) {
        const diff = (temp[i] - temp[nDir]) * 0.2;
        temp[nDir] += diff; temp[i] -= diff;
    }
}

function processPhaseChanges(i, type, props) {
    if (props.melt && temp[i] > props.melt) {
        if(Math.random() < 0.1) setCell(i, props.meltTo);
    }
    if (type === T.WATER && temp[i] < 0 && Math.random() < 0.1) setCell(i, T.ICE);
    if (type === T.LAVA && temp[i] < 600 && Math.random() < 0.05) setCell(i, T.STONE);
}

function processFire(i, type) {
    temp[i] += (type === T.FIRE ? 20 : 50);
    if(type === T.THERMITE) temp[i] = 2500;
    
    if(Math.random() < 0.5 && type !== T.THERMITE) {
        const pal = PALETTES[type];
        pixels[i] = pal[Math.floor(Math.random() * pal.length)];
    }
    if (type === T.FIRE) {
        extra[i] -= Math.random();
        if (extra[i] <= 0) setCell(i, Math.random() < 0.4 ? T.SMOKE : T.EMPTY);
    }

    const nbs = [i-1, i+1, i-width, i+width];
    for(let n of nbs) {
        if (n >= 0 && n < width*height) {
            temp[n] += (type === T.FIRE ? 30 : 5);
            const nt = cells[n];
            if (nt === T.NITRO && temp[n] > 50) { explode(n); continue; }
            if (PROPS[nt] && PROPS[nt].burn && temp[n] > PROPS[nt].burn) {
                if (nt === T.C4) explode(n);
                else if (nt === T.GUNPOWDER) setCell(n, T.FIRE);
                else setCell(n, PROPS[nt].burnTo || T.FIRE);
            }
            if (nt === T.SAND && temp[n] > 500) setCell(n, T.GLASS);
            if (nt === T.WATER && temp[n] > 100) setCell(n, T.STEAM);
            if (nt === T.ICE) setCell(n, T.WATER);
        }
    }
}

function processPlant(i, type) {
    if (Math.random() > (type === T.SPORE ? 0.2 : 0.05)) return;
    const nbs = [i-width, i-1, i+1, i+width];
    let drank = false;
    for (let n of nbs) {
        if (n >= 0 && n < width*height && (cells[n] === T.WATER || cells[n] === T.MUD)) {
            setCell(n, T.PLANT); drank = true;
            break;
        }
    }
    if (drank || Math.random() < 0.02) {
        const growOptions = [i-width, i-width-1, i-width+1, i-1, i+1];
        const target = growOptions[Math.floor(Math.random() * growOptions.length)];
        if (target >= 0 && target < width*height && cells[target] === T.EMPTY) {
                if(drank) setCell(target, T.PLANT);
                else if(type === T.SPORE) setCell(target, T.PLANT);
        }
    }
}

function processVirus(i) {
    const nbs = [i-1, i+1, i-width, i+width];
    for (let n of nbs) {
        if (n>=0 && n<width*height) {
            const nt = cells[n];
            if (nt === T.PLANT || nt === T.WOOD || nt === T.SPORE) {
                if (Math.random() < 0.2) setCell(n, T.VIRUS);
            }
        }
    }
    if (Math.random() < 0.01) setCell(i, T.SLIME);
}

function processAcid(i) {
    const nbs = [i+1, i-1, i+width, i-width];
    for(let n of nbs) {
        if(n>=0 && n<width*height && cells[n]!==T.EMPTY && cells[n]!==T.ACID && cells[n]!==T.GLASS) {
            if(Math.random()<0.05) { setCell(n, T.SMOKE); if(Math.random()<0.1) setCell(i, T.SMOKE); }
        }
    }
}

function processAntimatter(i) {
    const nbs = [i-1, i+1, i-width, i+width];
    for (let n of nbs) {
        if (n>=0 && n<width*height && cells[n] !== T.EMPTY && cells[n] !== T.ANTIMATTER) {
            setCell(n, T.EMPTY); setCell(i, T.EMPTY);
            if(Math.random()<0.5) { setCell(n, T.FIRE); temp[n] = 2000; }
            break;
        }
    }
}

// --- MOVEMENT FUNCTIONS ---

function moveSolid(i, x, props) {
    const down = i + width;
    if (canDisplace(down, props)) { move(i, down); return; }
    
    if (props.loose) {
        const rDir = Math.random() < 0.5 ? -1 : 1;
        const d1 = i + width + rDir;
        const d2 = i + width - rDir;
        
        if (x + rDir >= 0 && x + rDir < width && canDisplace(d1, props)) { move(i, d1); return; }
        if (x - rDir >= 0 && x - rDir < width && canDisplace(d2, props)) { move(i, d2); return; }
    }
}

function moveLiquid(i, x, props, leftFirst) {
    const down = i + width;
    if (canDisplace(down, props)) { move(i, down); return; }

    if (props.flow && Math.random() > props.flow) return;

    const rDir = Math.random() < 0.5 ? -1 : 1;
    const d1 = i + width + rDir;
    const d2 = i + width - rDir;
    
    if (x + rDir >= 0 && x + rDir < width && canDisplace(d1, props)) { move(i, d1); return; }
    if (x - rDir >= 0 && x - rDir < width && canDisplace(d2, props)) { move(i, d2); return; }

    const safeSide = leftFirst ? (i - 1) : (i + 1);
    const canSlide = (leftFirst && x > 0) || (!leftFirst && x < width - 1);
    
    if (canSlide && canDisplace(safeSide, props)) move(i, safeSide);
}

function moveGas(i, x, props, leftFirst) {
    if (Math.random() < 0.3) {
        const up = i - width;
        if (canDisplace(up, props)) { move(i, up); return; }
        
        const rDir = Math.random() < 0.5 ? -1 : 1;
        const u1 = i - width + rDir;
        const u2 = i - width - rDir;
        if (x + rDir >= 0 && x + rDir < width && canDisplace(u1, props)) { move(i, u1); return; }
        if (x - rDir >= 0 && x - rDir < width && canDisplace(u2, props)) { move(i, u2); return; }
        
        const safeSide = leftFirst ? (i - 1) : (i + 1);
        const canSlide = (leftFirst && x > 0) || (!leftFirst && x < width - 1);
        if (canSlide && canDisplace(safeSide, props)) move(i, safeSide);
    }
    if (props.life) {
        extra[i]--;
        if (extra[i] <= 0) setCell(i, T.EMPTY);
    }
}

// --- MAIN LOOP ---

function update() {
    if (!cells) return;
    const leftFirst = frameCount % 2 === 0;

    for (let y = height - 1; y >= 0; y--) {
        for (let iX = 0; iX < width; iX++) {
            const x = leftFirst ? iX : (width - 1 - iX);
            const i = y * width + x;
            const type = cells[i];

            if (type === T.EMPTY) continue;
            const props = PROPS[type];

            // 1. General Physics
            processThermodynamics(i);
            
            if (props) {
                processPhaseChanges(i, type, props);
                
                // 2. Specific Behaviors
                if (type === T.FIRE || type === T.LAVA || type === T.THERMITE) processFire(i, type);
                else if (type === T.PLANT || type === T.SPORE) processPlant(i, type);
                else if (type === T.VIRUS) processVirus(i);
                else if (type === T.ACID) processAcid(i);
                else if (type === T.ANTIMATTER) processAntimatter(i);

                if (type === T.METAL || type === T.STONE || type === T.BRICK) {
                    if (temp[i] > 300) pixels[i] = 0xFF0000FF;
                    else if (temp[i] > 100 && frameCount%10===0) pixels[i] = PALETTES[type][0];
                }

                // 3. Movement Physics
                if (props.state === 0 && props.density > 0) moveSolid(i, x, props);
                else if (props.state === 1) moveLiquid(i, x, props, leftFirst);
                else if (props.state === 2) moveGas(i, x, props, leftFirst);
            }
        }
    }
    frameCount++;
}