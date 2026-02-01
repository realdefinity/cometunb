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
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const type = cells[i];

            // Thermodynamics
            if (temp[i] > 22) {
                temp[i] -= 1;
                const nDir = [i-1, i+1, i-width, i+width][Math.floor(Math.random()*4)];
                if (nDir >= 0 && nDir < width*height && temp[i] > temp[nDir]) {
                    const diff = (temp[i] - temp[nDir]) * 0.1;
                    temp[nDir] += diff; temp[i] -= diff;
                }
            }

            if (type === T.EMPTY) continue;
            const props = PROPS[type];
            if (!props) continue;

            // Fire/Lava Logic
            if (type === T.FIRE || type === T.LAVA) {
                temp[i] += (type === T.FIRE ? 10 : 2);
                const nbs = [i-1, i+1, i-width, i+width];
                for(let n of nbs) {
                    if (n >= 0 && n < width*height) {
                        temp[n] += (type === T.FIRE ? 30 : 5);
                        const nt = cells[n];
                        if (PROPS[nt] && PROPS[nt].burn && temp[n] > PROPS[nt].burn) {
                            if (nt === T.C4) explode(n);
                            else if (nt === T.GUNPOWDER) setCell(n, T.FIRE);
                            else if (Math.random() < 0.1) setCell(n, PROPS[nt].burnTo || T.FIRE);
                        }
                        if (nt === T.SAND && temp[n] > 500) setCell(n, T.GLASS);
                        if (nt === T.WATER && temp[n] > 100) setCell(n, T.STEAM);
                    }
                }
                if (type === T.FIRE) {
                    extra[i]--;
                    if (Math.random() < 0.1) setCell(i, T.SMOKE);
                    if (extra[i] <= 0) setCell(i, T.EMPTY);
                }
            }
            
            // Heat Color
            if (type === T.METAL || type === T.STONE || type === T.GLASS) {
                if (temp[i] > 300) pixels[i] = 0xFF0000FF;
                else if (temp[i] > 100 && frameCount%10===0) pixels[i] = PALETTES[type][0];
            }

            let moved = false;
            const below = i + width;
            
            // Gravity
            if (props.state !== 2 && props.density > 0) {
                if (y < height - 1) {
                    const tBelow = cells[below];
                    const pBelow = PROPS[tBelow];
                    const canDisplace = tBelow === T.EMPTY || (pBelow && pBelow.state !== 0 && pBelow.density < props.density);

                    if (canDisplace) {
                        move(i, below); moved = true;
                    } else if (props.loose || props.state === 1) {
                        const dirA = leftFirst ? -1 : 1;
                        const dirB = leftFirst ? 1 : -1;
                        const bl = below + dirA;
                        const br = below + dirB;
                        const canL = (leftFirst ? x > 0 : x < width - 1);
                        const canR = (leftFirst ? x < width - 1 : x > 0);
                        
                        const validL = canL && (cells[bl] === T.EMPTY || (PROPS[cells[bl]] && PROPS[cells[bl]].state !== 0 && PROPS[cells[bl]].density < props.density));
                        const validR = canR && (cells[br] === T.EMPTY || (PROPS[cells[br]] && PROPS[cells[br]].state !== 0 && PROPS[cells[br]].density < props.density));

                        if (validL) { move(i, bl); moved = true; }
                        else if (validR) { move(i, br); moved = true; }
                    }
                }
                if (!moved && props.state === 1) {
                    const dir = Math.random() < 0.5 ? -1 : 1;
                    const side = i + dir;
                    if (x + dir >= 0 && x + dir < width) {
                        if (cells[side] === T.EMPTY || (PROPS[cells[side]] && PROPS[cells[side]].state === 2)) move(i, side);
                    }
                }
            } else if (props.state === 2 && props.density < 0) {
                const above = i - width;
                if (y > 0) {
                    if (cells[above] === T.EMPTY || (PROPS[cells[above]] && PROPS[cells[above]].density > props.density && PROPS[cells[above]].state !== 0)) {
                        move(i, above);
                    } else if (Math.random() < 0.5) {
                        const side = i + (Math.random() < 0.5 ? -1 : 1);
                        if (side >= 0 && side < width*height && cells[side] === T.EMPTY) move(i, side);
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