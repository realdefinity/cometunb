// State
let mouse = { x: 0, y: 0, lastX: 0, lastY: 0, down: false, right: false };

// --- EVENT HANDLERS ---
const updateMouse = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    
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
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
};

const handleMove = (e) => { 
    updateMouse(e); 
};

const handleEnd = () => { mouse.down = false; mouse.right = false; };

// --- MAIN INPUT LOOP ---
window.processInput = function() {
    if (mouse.down || mouse.right) {
        drawLine(mouse.lastX, mouse.lastY, mouse.x, mouse.y);
    }
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
};

// --- DRAWING LOGIC (Bresenham) ---
function drawLine(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
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
                    if (cells[i] === type) continue;

                    const isSolidDraw = (type === T.STONE || type === T.C4 || type === T.GLASS || type === T.EMPTY);
                    if (!isSolidDraw && Math.random() < 0.1) continue;

                    const targetProp = PROPS[cells[i]];
                    const isTargetSolid = targetProp && targetProp.state === 0;
                    
                    if (type === T.EMPTY || cells[i] === T.EMPTY || !isTargetSolid || (PROPS[type] && PROPS[type].state === 0)) {
                        setCell(i, type);
                    }
                }
            }
        }
    }
}

// --- UI LOGIC ---

// 1. Tool Selection (Fixed)
function setTool(id) {
    currentTool = id;
    document.querySelectorAll('.tool').forEach(e => e.classList.remove('active'));
    // Strict Selector using data-id
    const btn = document.querySelector(`.tool[data-id="${id}"]`);
    if(btn) btn.classList.add('active');
}

// 2. Tooltip Logic
const tooltip = document.getElementById('global-tooltip');

const showTooltip = (e) => {
    const name = e.target.getAttribute('data-name');
    if(!name) return;
    
    // Get button position
    const rect = e.target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const topY = rect.top;

    tooltip.innerText = name;
    tooltip.style.left = `${centerX}px`;
    tooltip.style.top = `${topY}px`;
    tooltip.classList.add('visible');
};

const hideTooltip = () => {
    tooltip.classList.remove('visible');
};

// Bind Tooltip Events
document.querySelectorAll('.tool').forEach(t => {
    t.addEventListener('mouseenter', showTooltip);
    t.addEventListener('mouseleave', hideTooltip);
    // Also update on click in case layout shifts
    t.addEventListener('click', showTooltip); 
});

// Bind Input Events
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('blur', handleEnd);
window.addEventListener('touchstart', handleStart, {passive:false});
window.addEventListener('touchmove', handleMove, {passive:false});
window.addEventListener('touchend', handleEnd);
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('wheel', e => brushSize = Math.max(1, Math.min(30, brushSize - Math.sign(e.deltaY))));
window.setTool = setTool;