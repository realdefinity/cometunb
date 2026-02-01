// State
let mouse = { x: 0, y: 0, lastX: 0, lastY: 0, down: false, right: false };

// --- EVENT HANDLERS ---
const updateMouse = (e) => {
    // Safety check if canvas exists
    if(!canvas) return; 
    
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Calculate position relative to canvas resolution
    mouse.x = Math.floor((cx - rect.left) / (rect.width) * width);
    mouse.y = Math.floor((cy - rect.top) / (rect.height) * height);
};

const handleStart = (e) => { 
    // Ignore clicks on the UI
    if(e.target.closest('#ui-container')) {
        mouse.down = false;
        return;
    }

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
    if ((mouse.down || mouse.right) && canvas) {
        drawLine(mouse.lastX, mouse.lastY, mouse.x, mouse.y);
    }
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
};

// --- DRAWING ALGORITHM ---
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
        if(safety > 1000) break; // Prevent infinite loops
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

                    // Don't randomly noise-draw solid structures (Walls/Glass)
                    // But DO add noise to sand/liquids so they look natural
                    const isSolidDraw = (type === T.STONE || type === T.BRICK || type === T.CONCRETE || type === T.METAL || type === T.GLASS || type === T.C4 || type === T.EMPTY);
                    if (!isSolidDraw && Math.random() < 0.1) continue;

                    const targetProp = PROPS[cells[i]];
                    const isTargetSolid = targetProp && targetProp.state === 0;
                    
                    // Logic: Can we overwrite this pixel?
                    // 1. Always overwrite Empty
                    // 2. Always overwrite if we are Eraser
                    // 3. If target is Liquid/Gas, we can overwrite it (Solids displace liquids)
                    // 4. If target is Solid, we generally don't overwrite unless we are explicitly drawing a solid (optional)
                    if (type === T.EMPTY || cells[i] === T.EMPTY || !isTargetSolid || (PROPS[type] && PROPS[type].state === 0)) {
                        setCell(i, type);
                    }
                }
            }
        }
    }
}

// --- UI LOGIC (Event Delegation) ---
function initToolbar() {
    const toolbar = document.getElementById('toolbar');
    if(!toolbar) return;

    toolbar.addEventListener('click', (e) => {
        // Find the closest parent .tool element (in case you clicked the icon inside)
        const btn = e.target.closest('.tool');
        if(!btn) return;

        const id = btn.getAttribute('data-id');
        if(!id) return; // Ignore separators

        // Handle System Buttons
        if (id === 'clear') {
            if(window.clearSim) window.clearSim();
            return;
        }
        if (id === 'pause') {
            if(window.togglePause) window.togglePause();
            return;
        }

        // Handle Tools
        setTool(parseInt(id));
    });
}

function setTool(id) {
    currentTool = id;
    // Visual Update
    document.querySelectorAll('.tool').forEach(e => e.classList.remove('active'));
    const btn = document.querySelector(`.tool[data-id="${id}"]`);
    if(btn) btn.classList.add('active');
}

// --- TOOLTIPS ---
function initTooltips() {
    const tooltip = document.getElementById('global-tooltip');
    if(!tooltip) return;

    const show = (e) => {
        const btn = e.target.closest('.tool');
        if(!btn) return;
        const name = btn.getAttribute('data-name');
        if(!name) return;

        const rect = btn.getBoundingClientRect();
        tooltip.innerText = name;
        tooltip.style.left = `${rect.left + rect.width/2}px`;
        tooltip.style.top = `${rect.top}px`;
        tooltip.classList.add('visible');
    };

    const hide = () => tooltip.classList.remove('visible');

    // Attach to toolbar for better performance
    const tb = document.getElementById('toolbar');
    if(tb) {
        tb.addEventListener('mouseover', show);
        tb.addEventListener('mouseout', hide);
        // Also hide on scroll/click to prevent stuck tooltips
        tb.addEventListener('scroll', hide);
        tb.addEventListener('click', hide);
    }
}

// --- BINDINGS ---
// Input
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('blur', handleEnd);
window.addEventListener('touchstart', handleStart, {passive:false});
window.addEventListener('touchmove', handleMove, {passive:false});
window.addEventListener('touchend', handleEnd);
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('wheel', e => brushSize = Math.max(1, Math.min(30, brushSize - Math.sign(e.deltaY))));

// UI
// Use setTimeout to ensure DOM is ready if script loads fast
setTimeout(() => {
    initToolbar();
    initTooltips();
}, 100);

// Global Exposure
window.setTool = setTool;