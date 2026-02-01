let mouse = { x: 0, y: 0, lastX: 0, lastY: 0, down: false, right: false };

const updateMouse = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Update current position
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
    // Reset last position to current so we don't draw a line from the previous stroke
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
    spawn(mouse.x, mouse.y); 
};

const handleMove = (e) => { 
    updateMouse(e); 
    if (mouse.down || mouse.right) {
        // Draw a continuous line from last position to current position
        drawLine(mouse.lastX, mouse.lastY, mouse.x, mouse.y);
    }
    // Update last position for the next frame
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
};

const handleEnd = () => { mouse.down = false; mouse.right = false; };

// Uses Bresenham's algorithm to connect two points smoothly
function drawLine(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        spawn(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
}

function spawn(mx, my) {
    const type = mouse.right ? T.EMPTY : currentTool;
    const r = brushSize; 
    const rSq = r * r;

    for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
            if (x*x + y*y <= rSq) {
                const px = mx + x;
                const py = my + y;
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const i = py * width + px;
                    
                    // Don't overwrite if it's the same type
                    if (cells[i] === type) continue;

                    // Random noise for sand/liquids (makes it look less artificial)
                    if (Math.random() < 0.1 && type !== T.EMPTY && type !== T.STONE && type !== T.C4 && type !== T.GLASS) continue;

                    // Overwrite logic:
                    // 1. Eraser always works
                    // 2. Empty space can always be filled
                    // 3. Heavier elements shouldn't be easily overwritten by lighter ones automatically, 
                    //    but for "drawing", we usually want the brush to force placement.
                    //    We allow overwriting liquids/gases easily. Solids require empty space or replacing liquids.
                    
                    const targetProp = PROPS[cells[i]];
                    const isTargetSolid = targetProp && targetProp.state === 0;

                    // If we are erasing, or the target is empty/liquid/gas, or we are drawing a solid
                    if (type === T.EMPTY || cells[i] === T.EMPTY || !isTargetSolid || PROPS[type].state === 0) {
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

// Bind Events
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
// Ensure dragging outside the window releases the mouse
window.addEventListener('blur', handleEnd);

window.addEventListener('touchstart', handleStart, {passive:false});
window.addEventListener('touchmove', handleMove, {passive:false});
window.addEventListener('touchend', handleEnd);
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('wheel', e => brushSize = Math.max(1, Math.min(30, brushSize - Math.sign(e.deltaY))));
window.setTool = setTool;