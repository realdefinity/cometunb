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
        if(type === T.WOOD || type === T.PLANT || type === T.GUNPOWDER) temp[i] = 22; 
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
            if (cells[ti] !== T.STONE) {
                if (Math.random() < 0.7) setCell(ti, T.FIRE);
                else setCell(ti, T.SMOKE);
                temp[ti] = 1000;
            }
        }
    }
}
function update() {
    if (!cells) return;
    
    const leftFirst = frameCount % 2 === 0;

    for (let y = height - 1; y >= 0; y--) {
        for (let iX = 0; iX < width; iX++) {
            const x = leftFirst ? iX : (width - 1 - iX);
            const i = y * width + x;
            const type = cells[i];

            if (type === T.EMPTY) continue;

            // --- THERMODYNAMICS ---
            if (temp[i] > 22) {
                temp[i] -= 0.5;
                const nDir = [i-1, i+1, i-width, i+width][Math.floor(Math.random()*4)];
                if (nDir >= 0 && nDir < width*height && temp[i] > temp[nDir]) {
                    const diff = (temp[i] - temp[nDir]) * 0.15;
                    temp[nDir] += diff; temp[i] -= diff;
                }
            }

            // --- ELEMENT LOGIC ---
            
            // 1. PLANT GROWTH
            if (type === T.PLANT) {
                // Check neighbors for water to "drink"
                if (Math.random() < 0.1) { // Growth tick rate
                    const nbs = [i-width, i-1, i+1, i+width]; // Up, Left, Right, Down
                    let drank = false;
                    
                    for (let n of nbs) {
                        if (n >= 0 && n < width*height && cells[n] === T.WATER) {
                            // Turn the water into plant immediately (Roots/Spreading)
                            setCell(n, T.PLANT); 
                            drank = true;
                            // Only drink one pixel per tick per plant pixel
                            if(Math.random() < 0.5) break; 
                        }
                    }

                    // If we drank (or randomly anyway), try to grow into empty air (Vines/Stems)
                    // We need water nearby to support air-growth
                    if (drank || Math.random() < 0.02) {
                        const up = i - width;
                        const upL = i - width - 1;
                        const upR = i - width + 1;
                        const growOptions = [up, upL, upR, i-1, i+1];
                        const target = growOptions[Math.floor(Math.random() * growOptions.length)];
                        
                        if (target >= 0 && target < width*height && cells[target] === T.EMPTY) {
                            // Only grow into air if we have a "water source" nearby or pure luck
                            // Use a simple heat check or neighbor check to limit infinite growth?
                            // For now, let's let them grow wild if water was consumed.
                            if (drank) setCell(target, T.PLANT);
                        }
                    }
                }
            }

            // 2. ACID LOGIC
            if (type === T.ACID) {
                const nbs = [i+1, i-1, i+width, i-width];
                for (let n of nbs) {
                    if (n >= 0 && n < width * height) {
                        const neighbor = cells[n];
                        if (neighbor !== T.EMPTY && neighbor !== T.ACID && neighbor !== T.GLASS && neighbor !== T.SMOKE && neighbor !== T.FIRE && neighbor !== T.STONE) {
                            if (Math.random() < 0.1) {
                                setCell(n, T.SMOKE);
                                if (Math.random() < 0.2) { setCell(i, T.SMOKE); break; }
                            }
                        }
                    }
                }
            }

            // 3. FIRE / LAVA
            if (type === T.FIRE || type === T.LAVA) {
                const heat = type === T.FIRE ? 10 : 2;
                temp[i] += heat;
                const nbs = [i-1, i+1, i-width, i+width];
                for(let n of nbs) {
                    if (n >= 0 && n < width*height) {
                        temp[n] += (type === T.FIRE ? 30 : 5);
                        const nt = cells[n];
                        if (PROPS[nt] && PROPS[nt].burn && temp[n] > PROPS[nt].burn) {
                            if (nt === T.C4) explode(n);
                            else if (nt === T.GUNPOWDER) setCell(n, T.FIRE);
                            else if (Math.random() < 0.15) setCell(n, PROPS[nt].burnTo || T.FIRE);
                        }
                        if (nt === T.SAND && temp[n] > 500) setCell(n, T.GLASS);
                        if (nt === T.WATER && temp[n] > 100) setCell(n, T.STEAM);
                    }
                }
                if (type === T.FIRE) {
                    extra[i]--;
                    if (Math.random() < 0.05) setCell(i, T.SMOKE);
                    if (extra[i] <= 0) setCell(i, T.EMPTY);
                }
            }
            
            // Heat Color
            if (type === T.METAL || type === T.STONE || type === T.GLASS) {
                if (temp[i] > 300) pixels[i] = 0xFF0000FF;
                else if (temp[i] > 100 && frameCount%10===0) pixels[i] = PALETTES[type][0];
            }

            // --- PHYSICS MOVEMENT ---
            const props = PROPS[type];
            if (!props) continue;

            let moved = false;
            const canMoveTo = (dest) => {
                if (dest < 0 || dest >= width * height) return false;
                const tDest = cells[dest];
                if (tDest === T.EMPTY) return true;
                const pDest = PROPS[tDest];
                if (pDest && pDest.state !== 0 && pDest.density < props.density) return true;
                return false;
            };

            // 1. SOLIDS & LIQUIDS (Gravity Down)
            // Note: density > 0 ensures plants/wood/glass (density 0) don't fall
            if (props.state !== 2 && props.density > 0) { 
                const below = i + width;
                if (canMoveTo(below)) {
                    move(i, below); moved = true;
                } else if (props.loose || props.state === 1) {
                    const rDir = Math.random() < 0.5;
                    const bl = below - 1, br = below + 1;
                    const first = rDir ? bl : br;
                    const second = rDir ? br : bl;
                    if (x > 0 && x < width - 1) {
                        if (canMoveTo(first)) { move(i, first); moved = true; }
                        else if (canMoveTo(second)) { move(i, second); moved = true; }
                    }
                }
                if (!moved && props.state === 1) {
                    const rDir = Math.random() < 0.5;
                    const left = i - 1, right = i + 1;
                    const first = rDir ? left : right;
                    const second = rDir ? right : left;
                    if (x > 0 && x < width - 1) {
                        if (canMoveTo(first)) { move(i, first); moved = true; }
                        else if (canMoveTo(second)) { move(i, second); moved = true; }
                    }
                }
            } 
            // 2. GASES (Gravity Up)
            else if (props.state === 2) { 
                const above = i - width;
                if (canMoveTo(above)) { move(i, above); moved = true; }
                else {
                    const rDir = Math.random() < 0.5;
                    const al = above - 1, ar = above + 1;
                    const first = rDir ? al : ar;
                    const second = rDir ? ar : al;
                    if (x > 0 && x < width - 1) {
                        if (canMoveTo(first)) { move(i, first); moved = true; }
                        else if (canMoveTo(second)) { move(i, second); moved = true; }
                    }
                    if (!moved) {
                         const left = i - 1, right = i + 1;
                         const sideFirst = rDir ? left : right;
                         const sideSecond = rDir ? right : left;
                         if (x > 0 && x < width -1) {
                             if(canMoveTo(sideFirst)) move(i, sideFirst);
                             else if(canMoveTo(sideSecond)) move(i, sideSecond);
                         }
                    }
                }
                if (props.life) {
                    extra[i]--;
                    if (extra[i] <= 0) setCell(i, T.EMPTY);
                }
            }
        }
    }
    frameCount++;
}