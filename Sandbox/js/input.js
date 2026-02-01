// State
let mouse = { x: 0, y: 0, lastX: 0, lastY: 0, down: false, right: false };

// --- EVENT HANDLERS ---
const updateMouse = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Update coordinates, but don't draw yet
    mouse.x = Math.floor((cx - rect.left) / (rect.width) * width);
    mouse.y = Math.floor((cy - rect.top) / (rect.height) * height);
};

const handleStart = (e) => { 
    if (e.type === 'mousedown') {
        if (e.button === 2) mouse.right = true;
        else mouse.down = true;
    } else {
        mouse.down = true; // Touch
    }
    updateMouse(e);
    // Snap 'last' position to current so we don't draw a line from the previous stroke
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
};

const handleMove = (e) => { 
    updateMouse(e); 
    // We don't spawn here anymore. The game loop handles it via processInput()
};

const handleEnd = () => { mouse.down = false; mouse.right = false; };

// --- MAIN INPUT LOOP (Called by render.js) ---
window.processInput = function() {
    if (mouse.down || mouse.right) {
        // Draw line from previous frame's position to current position
        // This handles both "standing still" (distance 0) and "moving fast" (interpolation)
        drawLine(mouse.lastX, mouse.lastY, mouse.x, mouse.y);
    }
    
    // Update history
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
};

// --- DRAWING LOGIC ---
function drawLine(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    // Safety Loop Break (max 1000 pixels) to prevent freezing on glitches
    let safety = 0; 

    while (true) {
        spawn(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
        
        safety++;
        if(safety > 1000) break;
    }
}

function spawn(mx, my) {
    // Determine Type
    const type = mouse.right ? T.EMPTY : currentTool;
    
    // Brush Size
    const r = brushSize; 
    const rSq = r * r;

    for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
            if (x*x + y*y <= rSq) {
                const px = mx + x;
                const py = my + y;
                
                // Bounds Check
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const i = py * width + px;
                    
                    // Optimization: Don't replace a pixel with itself
                    if (cells[i] === type) continue;

                    // Probability / Noise (Makes sand/liquids feel natural)
                    // We reduce noise for Stone/C4/Glass/Empty so they draw solid
                    const isSolidDraw = (type === T.STONE || type === T.C4 || type === T.GLASS || type === T.EMPTY);
                    if (!isSolidDraw && Math.random() < 0.1) continue;

                    // Overwrite Logic
                    const targetProp = PROPS[cells[i]];
                    const isTargetSolid = targetProp && targetProp.state === 0;
                    
                    // We can overwrite if:
                    // 1. We are erasing (type is EMPTY)
                    // 2. The target is EMPTY
                    // 3. The target is NOT solid (we can paint over water/gas)
                    // 4. We are painting a solid (Solids force their way in)
                    if (type === T.EMPTY || cells[i] === T.EMPTY || !isTargetSolid || (PROPS[type] && PROPS[type].state === 0)) {
                        setCell(i, type);
                    }
                }
            }
        }
    }
}

function setTool(id) {
    currentTool = id;
    document.querySelectorAll('.tool').forEach(e => e.classList.remove('active'));
    const btn = document.querySelector(`.tool[onclick*="${id}"]`);
    if(btn) btn.classList.add('active');
}

// --- BINDINGS ---
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('blur', handleEnd); // Stop drawing if tab loses focus
window.addEventListener('touchstart', handleStart, {passive:false});
window.addEventListener('touchmove', handleMove, {passive:false});
window.addEventListener('touchend', handleEnd);
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('wheel', e => brushSize = Math.max(1, Math.min(30, brushSize - Math.sign(e.deltaY))));
window.setTool = setTool;