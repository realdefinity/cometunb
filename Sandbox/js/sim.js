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
            // Ambient cooling and heat diffusion
            if (temp[i] > 22) {
                temp[i] -= 0.5; 
                const nDir = [i-1, i+1, i-width, i+width][Math.floor(Math.random()*4)];
                if (nDir >= 0 && nDir < width*height && temp[i] > temp[nDir]) {
                    const diff = (temp[i] - temp[nDir]) * 0.15;
                    temp[nDir] += diff; temp[i] -= diff;
                }
            }

            // --- ELEMENT LOGIC ---
            
            // 1. FIRE & LAVA (The New Logic)
            if (type === T.FIRE || type === T.LAVA) {
                // A. ANIMATION (Flicker Effect)
                // Re-roll the color every frame to make it look like blazing fire
                if (Math.random() < 0.5) {
                    const pal = PALETTES[type];
                    pixels[i] = pal[Math.floor(Math.random() * pal.length)];
                }

                // B. HEAT GENERATION
                temp[i] = Math.min(temp[i] + (type === T.FIRE ? 20 : 5), 2500);

                // C. BURNING NEIGHBORS
                // Check a random neighbor to ignite
                const nbs = [i-1, i+1, i-width, i+width];
                const rNb = nbs[Math.floor(Math.random() * nbs.length)];
                
                if (rNb >= 0 && rNb < width*height) {
                    // Transfer Heat
                    temp[rNb] += (type === T.FIRE ? 40 : 10);
                    
                    const nt = cells[rNb];
                    if (nt !== T.FIRE && nt !== T.EMPTY && nt !== T.SMOKE) {
                        const nProp = PROPS[nt];
                        // Check ignition threshold
                        if (nProp && nProp.burn && temp[rNb] > nProp.burn) {
                            if (nt === T.C4) explode(rNb);
                            else if (nt === T.GUNPOWDER) setCell(rNb, T.FIRE);
                            else {
                                // Burn it!
                                setCell(rNb, nProp.burnTo || T.FIRE);
                                // Transfer some life to the new fire so it sustains
                                extra[rNb] = (PROPS[T.FIRE].life || 10) + Math.random() * 20;
                            }
                        }
                        // State Changes (Sand->Glass, Water->Steam)
                        if (nt === T.SAND && temp[rNb] > 500) setCell(rNb, T.GLASS);
                        if (nt === T.WATER && temp[rNb] > 100) setCell(rNb, T.STEAM);
                    }
                }

                // D. LIFE CYCLE
                if (type === T.FIRE) {
                    // Random decay - some pixels last longer than others
                    extra[i] -= Math.random(); 
                    if (extra[i] <= 0) {
                        // 40% chance to turn into Smoke, otherwise just disappear
                        setCell(i, Math.random() < 0.4 ? T.SMOKE : T.EMPTY);
                    }
                }
            }

            // 2. PLANT GROWTH (Preserved)
            if (type === T.PLANT) {
                if (Math.random() < 0.1) {
                    const nbs = [i-width, i-1, i+1, i+width];
                    let drank = false;
                    for (let n of nbs) {
                        if (n >= 0 && n < width*height && cells[n] === T.WATER) {
                            setCell(n, T.PLANT); drank = true;
                            if(Math.random() < 0.5) break; 
                        }
                    }
                    if (drank || Math.random() < 0.02) {
                        const growOptions = [i-width, i-width-1, i-width+1, i-1, i+1];
                        const target = growOptions[Math.floor(Math.random() * growOptions.length)];
                        if (target >= 0 && target < width*height && cells[target] === T.EMPTY) {
                            if (drank) setCell(target, T.PLANT);
                        }
                    }
                }
            }

            // 3. ACID LOGIC (Preserved)
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
            
            // Heat Color for Metals/Stones
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
                if (!moved && props.state === 1) { // Liquid flow
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
                
                // Fire Specific: Turbulence
                // Fire sometimes moves side-to-side before going up, creating a "wavy" look
                let gasMoved = false;
                
                if (type === T.FIRE && Math.random() < 0.3) {
                     const rDir = Math.random() < 0.5;
                     const s1 = i - 1, s2 = i + 1;
                     const side = rDir ? s1 : s2;
                     if(x > 0 && x < width-1 && canMoveTo(side)) {
                         move(i, side); gasMoved = true;
                     }
                }

                if (!gasMoved) {
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
                }
                
                // Gas Life Cycle
                if (props.life && type !== T.FIRE) { // Fire handles its own life above
                    extra[i]--;
                    if (extra[i] <= 0) setCell(i, T.EMPTY);
                }
            }
        }
    }
    frameCount++;
}