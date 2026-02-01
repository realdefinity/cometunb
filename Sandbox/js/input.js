let mouse = { x: 0, y: 0, down: false, right: false };

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
    spawn(mouse.x, mouse.y); 
};

const handleMove = (e) => { 
    updateMouse(e); 
    if (mouse.down || mouse.right) spawn(mouse.x, mouse.y); 
};

const handleEnd = () => { mouse.down = false; mouse.right = false; };

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
                    if (Math.random() < 0.2 && type !== T.EMPTY && type !== T.STONE && type !== T.C4) continue;
                    if (cells[i] === T.EMPTY || type === T.EMPTY || PROPS[cells[i]].state !== 0) {
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
    // Find the button that called this
    const btn = document.querySelector(`.tool[onclick*="${id}"]`);
    if(btn) btn.classList.add('active');
}

// Bind Events
window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('touchstart', handleStart, {passive:false});
window.addEventListener('touchmove', handleMove, {passive:false});
window.addEventListener('touchend', handleEnd);
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('wheel', e => brushSize = Math.max(1, Math.min(30, brushSize - Math.sign(e.deltaY))));
window.setTool = setTool;