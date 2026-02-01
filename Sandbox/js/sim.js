// --- SIMULATION LOOP ---

function setCell(i, type) {
    if (i < 0 || i >= width * height) return;
    cells[i] = type;
    extra[i] = 0; 
    
    // Set Pixel Color
    const pal = PALETTES[type];
    pixels[i] = pal ? pal[Math.floor(Math.random() * pal.length)] : 0xFF080808;

    // Set Properties
    const p = PROPS[type];
    if (p) {
        if(p.life) extra[i] = p.life + Math.random() * 10;
        if(p.temp) temp[i] = p.temp;
        // Default temp for others is usually 22, unless specified
    }
}

function move(a, b) {
    if (a < 0 || b < 0 || a >= width*height || b >= width*height) return;
    // Swap Type
    const tA = cells[a], tB = cells[b];
    cells[b] = tA; cells[a] = tB;
    // Swap Color
    const cA = pixels[a], cB = pixels[b];
    pixels[b] = cA; pixels[a] = cB;
    // Swap Extra Data
    const eA = extra[a], eB = extra[b];
    extra[b] = eA; extra[a] = eB;
    // Swap Temperature
    const tmpA = temp[a], tmpB = temp[b];
    temp[b] = tmpA; temp[a] = tmpB;
}

function explode(i) {
    const cx = i % width;
    const cy = Math.floor(i / width);
    const r = 15; // Radius
    for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
            if (x*x + y*y > r*r) continue;
            const tx = cx + x, ty = cy + y;
            if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;
            const ti = ty * width + tx;
            
            // Stone/Metal resists explosions slightly better
            if (cells[ti] !== T.STONE && cells[ti] !== T.METAL && cells[ti] !== T.CONCRETE) {
                if (Math.random() < 0.7) setCell(ti, T.FIRE);
                else setCell(ti, T.SMOKE);
                temp[ti] = 2000; // Extreme Heat
            } else if (Math.random() < 0.1) {
                setCell(ti, T.EMPTY); // Chance to break stone
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

            if (temp[i] !== 22) {
                temp[i] += (22 - temp[i]) * 0.1;
                const nDir = [i-1, i+1, i-width, i+width][Math.floor(Math.random()*4)];
                if (nDir >= 0 && nDir < width*height) {
                    const diff = (temp[i] - temp[nDir]) * 0.2;
                    temp[nDir] += diff; temp[i] -= diff;
                }
            }

            const props = PROPS[type];
            if (!props) continue;

            if (props.melt && temp[i] > props.melt) {
                if(Math.random() < 0.1) setCell(i, props.meltTo);
            }
            if (type === T.WATER && temp[i] < 0 && Math.random() < 0.1) setCell(i, T.ICE);
            if (type === T.LAVA && temp[i] < 600 && Math.random() < 0.05) setCell(i, T.STONE);

            if (type === T.VIRUS) {
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

            if (type === T.ANTIMATTER) {
                const nbs = [i-1, i+1, i-width, i+width];
                for (let n of nbs) {
                    if (n>=0 && n<width*height && cells[n] !== T.EMPTY && cells[n] !== T.ANTIMATTER) {
                        setCell(n, T.EMPTY); setCell(i, T.EMPTY);
                        if(Math.random()<0.5) { setCell(n, T.FIRE); temp[n] = 2000; }
                        break;
                    }
                }
            }

            if (type === T.FIRE || type === T.LAVA || type === T.THERMITE) {
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

            if (type === T.PLANT || type === T.SPORE) {
                if (Math.random() < (type === T.SPORE ? 0.2 : 0.05)) {
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
            }

            if (type === T.ACID) {
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

            const canDisplace = (dest) => {
                if (dest < 0 || dest >= width * height) return false;
                const tDest = cells[dest];
                if (tDest === T.EMPTY) return true;
                
                const pDest = PROPS[tDest];
                if (!pDest) return false;

                if (props.state === 0 && pDest.state !== 0) return true;
                if (props.state === 1 && pDest.state === 2) return true;
                if (props.state === pDest.state && props.density > pDest.density) return true;
                
                return false;
            };

            const doMove = (dest) => move(i, dest);

            if (props.state === 0 && props.density > 0) {
                const down = i + width;
                if (canDisplace(down)) { doMove(down); continue; }
                
                if (props.loose) {
                    const rDir = Math.random() < 0.5;
                    const dl = down - 1, dr = down + 1;
                    const first = rDir ? dl : dr;
                    const second = rDir ? dr : dl;
                    
                    if (x > 0 && x < width-1 && canDisplace(first)) { doMove(first); continue; }
                    if (x > 0 && x < width-1 && canDisplace(second)) { doMove(second); continue; }
                }
            }
            else if (props.state === 1) {
                const down = i + width;
                if (canDisplace(down)) { doMove(down); continue; }

                if (props.flow && Math.random() > props.flow) continue;

                const left = i - 1;
                const right = i + 1;
                const openL = (x > 0) && canDisplace(left);
                const openR = (x < width - 1) && canDisplace(right);

                if (leftFirst) {
                    if (openL) doMove(left); 
                } else {
                    if (openR) doMove(right);
                }
            }
            else if (props.state === 2) {
                const up = i - width;
                if (canDisplace(up)) { doMove(up); continue; }
                
                const ul = up - 1, ur = up + 1;
                if (x > 0 && canDisplace(ul)) { doMove(ul); continue; }
                if (x < width - 1 && canDisplace(ur)) { doMove(ur); continue; }
                
                const left = i - 1, right = i + 1;
                if (x > 0 && canDisplace(left)) { doMove(left); continue; }
                if (x < width - 1 && canDisplace(right)) { doMove(right); continue; }

                if (props.life) {
                    extra[i]--;
                    if (extra[i] <= 0) setCell(i, T.EMPTY);
                }
            }
        }
    }
    frameCount++;
}