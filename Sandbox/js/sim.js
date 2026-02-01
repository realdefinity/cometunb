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
            if (temp[i] !== 22) { // Ambient is 22
                const diff = (22 - temp[i]) * 0.01; // Slow return to ambient
                temp[i] += diff;
                
                // Conduction
                const nDir = [i-1, i+1, i-width, i+width][Math.floor(Math.random()*4)];
                if (nDir >= 0 && nDir < width*height) {
                    const tDiff = (temp[i] - temp[nDir]) * 0.2; // Heat transfer rate
                    temp[nDir] += tDiff; temp[i] -= tDiff;
                }
            }
            
            // --- ELEMENT LOGIC ---
            const props = PROPS[type];
            if(!props) continue;

            // 1. STATE CHANGES (Melting / Freezing)
            if (props.melt && temp[i] > props.melt) {
                if(Math.random() < 0.1) setCell(i, props.meltTo);
            }
            // Water freezes to ice
            if (type === T.WATER && temp[i] < 0) {
                if(Math.random() < 0.1) setCell(i, T.ICE);
            }
            // Lava cools to Stone
            if (type === T.LAVA && temp[i] < 600) {
                 if(Math.random() < 0.05) setCell(i, T.STONE);
            }

            // 2. VIRUS (Infection)
            if (type === T.VIRUS) {
                const nbs = [i-1, i+1, i-width, i+width];
                for (let n of nbs) {
                    if (n>=0 && n<width*height) {
                        const nt = cells[n];
                        // Infects organic stuff
                        if (nt === T.PLANT || nt === T.WOOD || nt === T.SPORE) {
                            if (Math.random() < 0.2) setCell(n, T.VIRUS);
                        }
                    }
                }
                // Dies if isolated or random death
                if (Math.random() < 0.01) setCell(i, T.SLIME);
            }

            // 3. ANTIMATTER (Destruction)
            if (type === T.ANTIMATTER) {
                const nbs = [i-1, i+1, i-width, i+width];
                for (let n of nbs) {
                    if (n>=0 && n<width*height && cells[n] !== T.EMPTY && cells[n] !== T.ANTIMATTER) {
                        setCell(n, T.EMPTY);
                        setCell(i, T.EMPTY); // Destroy self too
                        // Explosion effect
                        if(Math.random()<0.5) { setCell(n, T.FIRE); temp[n] = 2000; }
                        break;
                    }
                }
            }

            // 4. FIRE & BURNING
            if (type === T.FIRE || type === T.LAVA || type === T.THERMITE) {
                temp[i] += (type === T.FIRE ? 20 : 50);
                if(type === T.THERMITE) temp[i] = 2500; // Thermite is HOT

                const nbs = [i-1, i+1, i-width, i+width];
                for(let n of nbs) {
                    if (n >= 0 && n < width*height) {
                        temp[n] += (type === T.FIRE ? 30 : 5);
                        const nt = cells[n];
                        
                        // Nitro explodes instantly on heat
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
                
                // Color Flicker
                if(Math.random() < 0.5 && type !== T.THERMITE) {
                    const pal = PALETTES[type];
                    pixels[i] = pal[Math.floor(Math.random() * pal.length)];
                }

                if (type === T.FIRE) {
                    extra[i] -= Math.random();
                    if (extra[i] <= 0) setCell(i, Math.random() < 0.4 ? T.SMOKE : T.EMPTY);
                }
            }

            // 5. PLANTS (Photosynthesis / Water Drinking)
            if (type === T.PLANT || type === T.SPORE) {
                if (Math.random() < (type === T.SPORE ? 0.2 : 0.05)) {
                    // Drink Water
                    const nbs = [i-width, i-1, i+1, i+width];
                    let drank = false;
                    for (let n of nbs) {
                        if (n >= 0 && n < width*height && (cells[n] === T.WATER || cells[n] === T.MUD)) {
                            setCell(n, T.PLANT); drank = true;
                            break;
                        }
                    }
                    // Grow
                    if (drank || Math.random() < 0.02) {
                        const growOptions = [i-width, i-width-1, i-width+1, i-1, i+1];
                        const target = growOptions[Math.floor(Math.random() * growOptions.length)];
                        if (target >= 0 && target < width*height && cells[target] === T.EMPTY) {
                             if(drank) setCell(target, T.PLANT);
                             else if(type === T.SPORE) setCell(target, T.PLANT); // Spores grow fast
                        }
                    }
                }
            }

            // Acid / Heat Color (Standard)
            if (type === T.ACID) { /* Acid logic from before */
                 const nbs = [i+1, i-1, i+width, i-width];
                 for(let n of nbs) {
                     if(n>=0 && n<width*height && cells[n]!==T.EMPTY && cells[n]!==T.ACID && cells[n]!==T.GLASS) {
                         if(Math.random()<0.05) { setCell(n, T.SMOKE); if(Math.random()<0.1) setCell(i, T.SMOKE); }
                     }
                 }
            }
            if (type === T.METAL || type === T.STONE || type === T.BRICK) {
                if (temp[i] > 300) pixels[i] = 0xFF0000FF;
                else if (temp[i] > 100 && frameCount%10===0) pixels[i] = PALETTES[type][0];
            }

            // --- PHYSICS ---
            let moved = false;
            const canMoveTo = (dest) => {
                if (dest < 0 || dest >= width * height) return false;
                const tDest = cells[dest];
                if (tDest === T.EMPTY) return true;
                const pDest = PROPS[tDest];
                if (pDest && pDest.state !== 0 && pDest.density < props.density) return true;
                return false;
            };

            // Solids/Liquids
            if (props.state !== 2 && props.density > 0) { 
                const below = i + width;
                if (canMoveTo(below)) { move(i, below); moved = true; }
                else if (props.loose || props.state === 1) {
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
            // Gases
            else if (props.state === 2) { 
                const above = i - width;
                if (canMoveTo(above)) { move(i, above); }
                else {
                    const rDir = Math.random() < 0.5;
                    const al = above - 1, ar = above + 1;
                    const first = rDir ? al : ar;
                    const second = rDir ? ar : al;
                    if (x > 0 && x < width - 1) {
                        if (canMoveTo(first)) { move(i, first); }
                        else if (canMoveTo(second)) { move(i, second); }
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