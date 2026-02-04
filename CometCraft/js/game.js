const canvas = document.getElementById('canvas');
const trash = document.getElementById('trash');

// Create Selection Box Element
const selectionBox = document.createElement('div');
selectionBox.className = 'selection-box';
canvas.appendChild(selectionBox);

// --- INPUT HANDLERS ---
canvas.addEventListener('mousedown', (e) => {
    if (e.target === canvas || e.target === selectionBox) startSelectionBox(e);
});

window.spawn = (name, icon, x, y, anim = false) => {
    const el = document.createElement('div');
    el.className = 'element';
    el.innerHTML = `<span class="emoji">${icon}</span> ${name}`;
    el.dataset.name = name;
    el.dataset.icon = icon;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.transform = "translate(-50%, -50%)";

    if (anim) {
        el.animate([
            { transform: 'translate(-50%, -50%) scale(0)' },
            { transform: 'translate(-50%, -50%) scale(1.2)' },
            { transform: 'translate(-50%, -50%) scale(1)' }
        ], { duration: 400, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
    }

    el.addEventListener('mousedown', (e) => startDrag(e, el));
    el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        window.spawn(name, icon, parseFloat(el.style.left) + 20, parseFloat(el.style.top) + 20, true);
        window.explode(parseFloat(el.style.left), parseFloat(el.style.top), 'white', 8, 50);
    });
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); deleteItem(el); });

    canvas.appendChild(el);
    return el;
};

window.deleteItem = (el) => {
    window.explode(parseFloat(el.style.left), parseFloat(el.style.top), '#ef4444', 12, 60);
    if (window.state.selection.includes(el)) {
        window.state.selection = window.state.selection.filter(i => i !== el);
    }
    el.remove();
};

// --- DRAG LOGIC (MULTI-SELECT SUPPORT) ---
function startDrag(e, el) {
    if (e.button !== 0) return;
    e.stopPropagation();

    // Handle Selection Logic
    if (e.shiftKey) {
        toggleSelection(el);
    } else {
        if (!window.state.selection.includes(el)) {
            clearSelection();
            addToSelection(el);
        }
    }

    window.state.dragItem = el; // Leader of the drag
    window.state.lastMouse = { x: e.clientX, y: e.clientY };
    
    // Visuals
    window.state.selection.forEach(item => item.classList.add('dragging'));
    
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
}

function onDrag(e) {
    if (!window.state.dragItem) return;

    const dx = e.clientX - window.state.lastMouse.x;
    const dy = e.clientY - window.state.lastMouse.y;
    window.state.lastMouse = { x: e.clientX, y: e.clientY };

    // Move ALL selected items
    window.state.selection.forEach(item => {
        const currentLeft = parseFloat(item.style.left);
        const currentTop = parseFloat(item.style.top);
        item.style.left = (currentLeft + dx) + 'px';
        item.style.top = (currentTop + dy) + 'px';
        
        // Tilt Effect
        const rotX = Math.max(-20, Math.min(20, dx * 1.5));
        item.style.transform = `translate(-50%, -50%) perspective(800px) rotateY(${rotX}deg) scale(1.05)`;
    });

    // Trash Detection
    const tRect = trash.getBoundingClientRect();
    const inTrash = (e.clientX > tRect.left && e.clientX < tRect.right && e.clientY > tRect.top && e.clientY < tRect.bottom);
    if (inTrash) trash.classList.add('active'); else trash.classList.remove('active');

    // Hinting & Merging (Only check for the leader item to save performance)
    findMergeCandidate(window.state.dragItem);
}

function endDrag() {
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);

    // Clean up visuals
    window.state.selection.forEach(item => {
        item.classList.remove('dragging');
        item.style.transform = `translate(-50%, -50%) scale(1)`;
    });

    // Action: Delete
    if (trash.classList.contains('active')) {
        window.state.selection.forEach(item => deleteItem(item));
        window.state.selection = [];
        trash.classList.remove('active');
        return;
    }

    // Action: Merge
    if (window.state.mergeTarget && window.state.dragItem) {
        // Attempt to merge the Leader with the Target
        triggerMerge(window.state.dragItem, window.state.mergeTarget);
        
        // Clear hints
        window.state.mergeTarget.classList.remove('hint');
    }
    
    // Clear global hints
    document.querySelectorAll('.hint').forEach(el => el.classList.remove('hint'));

    window.state.dragItem = null;
    window.state.mergeTarget = null;
}

// --- SELECTION BOX LOGIC ---
function startSelectionBox(e) {
    if (e.button !== 0) return;
    window.state.isSelecting = true;
    window.state.selectionStart = { x: e.clientX, y: e.clientY };
    
    // Reset box
    selectionBox.style.display = 'block';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.left = e.clientX + 'px';
    selectionBox.style.top = e.clientY + 'px';

    if (!e.shiftKey) clearSelection();

    window.addEventListener('mousemove', updateSelectionBox);
    window.addEventListener('mouseup', endSelectionBox);
}

function updateSelectionBox(e) {
    if (!window.state.isSelecting) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    const startX = window.state.selectionStart.x;
    const startY = window.state.selectionStart.y;

    // Calculate dimensions
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';

    // Check collisions
    const elements = document.querySelectorAll('.element');
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elCenterX = rect.left + rect.width / 2;
        const elCenterY = rect.top + rect.height / 2;

        if (elCenterX > left && elCenterX < left + width && 
            elCenterY > top && elCenterY < top + height) {
            addToSelection(el);
        } else if (!e.shiftKey) {
            // Only deselect if we aren't holding shift (additive selection)
            // But checking previous state is complex here, so we stick to additive box
        }
    });
}

function endSelectionBox() {
    window.state.isSelecting = false;
    selectionBox.style.display = 'none';
    window.removeEventListener('mousemove', updateSelectionBox);
    window.removeEventListener('mouseup', endSelectionBox);
}

// --- HELPERS ---
function addToSelection(el) {
    if (!window.state.selection.includes(el)) {
        window.state.selection.push(el);
        el.classList.add('selected');
    }
}

function toggleSelection(el) {
    if (window.state.selection.includes(el)) {
        window.state.selection = window.state.selection.filter(i => i !== el);
        el.classList.remove('selected');
    } else {
        addToSelection(el);
    }
}

function clearSelection() {
    window.state.selection.forEach(el => el.classList.remove('selected'));
    window.state.selection = [];
}

// --- MERGE LOGIC & HINTING ---
function findMergeCandidate(active) {
    const items = Array.from(canvas.querySelectorAll('.element:not(.dragging)'));
    let closest = null; 
    let minDist = 80; // Snap distance

    // Clear previous hints
    document.querySelectorAll('.hint').forEach(el => el.classList.remove('hint'));

    const r1 = active.getBoundingClientRect();
    const c1 = { x: r1.left + r1.width / 2, y: r1.top + r1.height / 2 };

    items.forEach(item => {
        const r2 = item.getBoundingClientRect();
        const c2 = { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 };
        const dist = Math.hypot(c2.x - c1.x, c2.y - c1.y);

        // Check if recipe exists
        const n1 = active.dataset.name;
        const n2 = item.dataset.name;
        const key = [n1, n2].sort().join('+');
        
        if (window.recipes[key]) {
            item.classList.add('hint'); // Glow effect
            if (dist < minDist) { 
                minDist = dist; 
                closest = item; 
            }
        }
    });

    window.state.mergeTarget = closest;
}

function triggerMerge(el1, el2) {
    const n1 = el1.dataset.name;
    const n2 = el2.dataset.name;
    const key = [n1, n2].sort().join('+');
    const result = window.recipes[key];

    // Remove from selection to prevent errors
    if(window.state.selection.includes(el1)) toggleSelection(el1);
    
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();
    const cRect = canvas.getBoundingClientRect();
    const midX = ((r1.left + r2.left) / 2 - cRect.left) + r1.width / 2;
    const midY = ((r1.top + r2.top) / 2 - cRect.top) + r1.height / 2;

    el1.style.pointerEvents = 'none'; el2.style.pointerEvents = 'none';
    el1.style.transition = el2.style.transition = "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)";
    el1.style.left = el2.style.left = midX + 'px';
    el1.style.top = el2.style.top = midY + 'px';
    el1.style.transform = el2.style.transform = "translate(-50%, -50%) scale(0) rotate(180deg)";
    el1.style.opacity = el2.style.opacity = "0";

    setTimeout(() => {
        el1.remove(); el2.remove();
        
        if (result) {
            canvas.classList.add('shake');
            setTimeout(() => canvas.classList.remove('shake'), 300);
            window.explode(midX, midY, '#ffffff', 20, 80);
            window.explode(midX, midY, '#818cf8', 40, 150);
            
            const newItem = window.spawn(result.name, result.icon, midX, midY, true);
            
            // Auto-select new item if we were dragging
            addToSelection(newItem);

            if (!window.state.discovered.some(d => d.name === result.name)) {
                window.state.discovered.push({ ...result, date: Date.now() });
                window.saveGame();
                window.renderInventory();
                window.showModal(result);
            }
        } else {
            window.explode(midX, midY, '#94a3b8', 15, 60);
            window.spawn(n1, el1.dataset.icon, midX - 35, midY, true);
            window.spawn(n2, el2.dataset.icon, midX + 35, midY, true);
        }
    }, 300);
}

// FX: Explode
window.explode = (x, y, color, count, spread) => {
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = color;
        p.style.width = Math.random() * 8 + 4 + 'px';
        p.style.height = p.style.width;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        canvas.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spread + 20;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        p.animate([
            { transform: `translate(0,0) scale(1)`, opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], { duration: 600, easing: 'ease-out' }).onfinish = () => p.remove();
    }
};

window.clearCanvas = () => {
    canvas.querySelectorAll('.element').forEach(i => deleteItem(i));
    clearSelection();
};