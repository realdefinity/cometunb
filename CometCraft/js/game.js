const canvas = document.getElementById('canvas');
const trash = document.getElementById('trash');

const selectionBox = document.createElement('div');
selectionBox.className = 'selection-box';
canvas.appendChild(selectionBox);

const DRAG_ROTATION_FACTOR = 1.1;
const MERGE_SNAP_DISTANCE = 90;

canvas.addEventListener('mousedown', (e) => {
    if (e.target === canvas || e.target === selectionBox) startSelectionBox(e);
});

window.spawn = (name, icon, x, y, anim = false) => {
    const el = document.createElement('div');
    el.className = 'element';
    el.innerHTML = `<span class="emoji">${icon}</span> ${name}`;
    el.dataset.name = name;
    el.dataset.icon = icon;

    const point = clampToCanvas(x, y);
    el.style.left = `${point.x}px`;
    el.style.top = `${point.y}px`;
    el.style.transform = 'translate(-50%, -50%)';

    if (anim) {
        el.animate([
            { transform: 'translate(-50%, -50%) scale(0)' },
            { transform: 'translate(-50%, -50%) scale(1.15)' },
            { transform: 'translate(-50%, -50%) scale(1)' }
        ], { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }

    el.addEventListener('mousedown', (e) => startDrag(e, el));
    el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const nx = parseFloat(el.style.left) + 20;
        const ny = parseFloat(el.style.top) + 20;
        window.spawn(name, icon, nx, ny, true);
        window.explode(parseFloat(el.style.left), parseFloat(el.style.top), 'white', 8, 50);
    });
    el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        deleteItem(el);
    });

    canvas.appendChild(el);
    return el;
};

window.deleteItem = (el) => deleteItem(el);

function deleteItem(el, withFx = true) {
    if (!el || !el.isConnected) return;

    if (withFx) {
        window.explode(parseFloat(el.style.left), parseFloat(el.style.top), '#ef4444', 12, 60);
    }

    if (window.state.selection.includes(el)) {
        window.state.selection = window.state.selection.filter(i => i !== el);
    }

    if (window.state.dragItem === el) {
        window.state.dragItem = null;
    }

    el.remove();
}

function startDrag(e, el) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.shiftKey) {
        toggleSelection(el);
    } else if (!window.state.selection.includes(el)) {
        clearSelection();
        addToSelection(el);
    }

    if (!window.state.selection.length) {
        addToSelection(el);
    }

    const cursor = toCanvasPoint(e.clientX, e.clientY);
    const leaderX = parseFloat(el.style.left);
    const leaderY = parseFloat(el.style.top);

    window.state.dragItem = el;
    window.state.lastMouse = { x: e.clientX, y: e.clientY };
    window.state.dragMeta = {
        pointerOffsetX: cursor.x - leaderX,
        pointerOffsetY: cursor.y - leaderY,
        leaderStartX: leaderX,
        leaderStartY: leaderY,
        itemStarts: new Map(window.state.selection.map(item => [item, {
            x: parseFloat(item.style.left),
            y: parseFloat(item.style.top)
        }]))
    };

    window.state.selection.forEach(item => item.classList.add('dragging'));

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
}

function onDrag(e) {
    if (!window.state.dragItem || !window.state.dragMeta) return;

    const cursor = toCanvasPoint(e.clientX, e.clientY);
    const bounds = getDragBounds();

    const targetLeaderX = clamp(cursor.x - window.state.dragMeta.pointerOffsetX, bounds.minX, bounds.maxX);
    const targetLeaderY = clamp(cursor.y - window.state.dragMeta.pointerOffsetY, bounds.minY, bounds.maxY);

    const dx = targetLeaderX - window.state.dragMeta.leaderStartX;
    const dy = targetLeaderY - window.state.dragMeta.leaderStartY;
    const velocityX = e.clientX - window.state.lastMouse.x;
    window.state.lastMouse = { x: e.clientX, y: e.clientY };

    window.state.selection.forEach(item => {
        const start = window.state.dragMeta.itemStarts.get(item);
        if (!start) return;

        const nx = clamp(start.x + dx, bounds.minX, bounds.maxX);
        const ny = clamp(start.y + dy, bounds.minY, bounds.maxY);

        item.style.left = `${nx}px`;
        item.style.top = `${ny}px`;

        const rotY = Math.max(-16, Math.min(16, velocityX * DRAG_ROTATION_FACTOR));
        item.style.transform = `translate(-50%, -50%) perspective(800px) rotateY(${rotY}deg) scale(1.05)`;
    });

    const tRect = trash.getBoundingClientRect();
    const inTrash = e.clientX > tRect.left && e.clientX < tRect.right && e.clientY > tRect.top && e.clientY < tRect.bottom;
    trash.classList.toggle('active', inTrash);

    findMergeCandidate(window.state.dragItem);
}

function endDrag() {
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);

    window.state.selection.forEach(item => {
        item.classList.remove('dragging');
        item.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    if (trash.classList.contains('active')) {
        const targets = [...window.state.selection];
        targets.forEach(item => deleteItem(item));
        window.state.selection = [];
        trash.classList.remove('active');
        clearHints();
        window.state.dragItem = null;
        window.state.dragMeta = null;
        window.state.mergeTarget = null;
        return;
    }

    if (window.state.mergeTarget && window.state.dragItem) {
        triggerMerge(window.state.dragItem, window.state.mergeTarget);
        window.state.mergeTarget.classList.remove('hint');
    }

    clearHints();
    window.state.dragItem = null;
    window.state.dragMeta = null;
    window.state.mergeTarget = null;
}

function startSelectionBox(e) {
    if (e.button !== 0) return;

    const p = toCanvasPoint(e.clientX, e.clientY);
    window.state.isSelecting = true;
    window.state.selectionStart = p;

    selectionBox.style.display = 'block';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.left = `${p.x}px`;
    selectionBox.style.top = `${p.y}px`;

    if (!e.shiftKey) clearSelection();

    window.addEventListener('mousemove', updateSelectionBox);
    window.addEventListener('mouseup', endSelectionBox);
}

function updateSelectionBox(e) {
    if (!window.state.isSelecting) return;

    const current = toCanvasPoint(e.clientX, e.clientY);
    const start = window.state.selectionStart;

    const left = Math.min(current.x, start.x);
    const top = Math.min(current.y, start.y);
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);

    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;

    const elements = canvas.querySelectorAll('.element');
    elements.forEach(el => {
        const cx = parseFloat(el.style.left);
        const cy = parseFloat(el.style.top);
        if (cx > left && cx < left + width && cy > top && cy < top + height) {
            addToSelection(el);
        }
    });
}

function endSelectionBox() {
    window.state.isSelecting = false;
    selectionBox.style.display = 'none';
    window.removeEventListener('mousemove', updateSelectionBox);
    window.removeEventListener('mouseup', endSelectionBox);
}

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

function clearHints() {
    document.querySelectorAll('.hint').forEach(el => el.classList.remove('hint'));
}

function findMergeCandidate(active) {
    if (!active) {
        window.state.mergeTarget = null;
        return;
    }

    const items = Array.from(canvas.querySelectorAll('.element:not(.dragging)'))
        .filter(item => !window.state.selection.includes(item));

    let closest = null;
    let minDist = MERGE_SNAP_DISTANCE;

    clearHints();

    const r1 = active.getBoundingClientRect();
    const c1 = { x: r1.left + r1.width / 2, y: r1.top + r1.height / 2 };

    items.forEach(item => {
        const n1 = active.dataset.name;
        const n2 = item.dataset.name;
        const key = [n1, n2].sort().join('+');
        if (!window.recipes[key]) return;

        const r2 = item.getBoundingClientRect();
        const c2 = { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 };
        const dist = Math.hypot(c2.x - c1.x, c2.y - c1.y);

        item.classList.add('hint');
        if (dist < minDist) {
            minDist = dist;
            closest = item;
        }
    });

    window.state.mergeTarget = closest;
}

function triggerMerge(el1, el2) {
    if (!el1 || !el2 || !el1.isConnected || !el2.isConnected || el1 === el2) return;

    const n1 = el1.dataset.name;
    const n2 = el2.dataset.name;
    const key = [n1, n2].sort().join('+');
    const result = window.recipes[key];

    if (window.state.selection.includes(el1)) toggleSelection(el1);
    if (window.state.selection.includes(el2)) toggleSelection(el2);

    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();
    const cRect = canvas.getBoundingClientRect();
    const midX = ((r1.left + r2.left) / 2 - cRect.left) + r1.width / 2;
    const midY = ((r1.top + r2.top) / 2 - cRect.top) + r1.height / 2;

    el1.style.pointerEvents = 'none';
    el2.style.pointerEvents = 'none';
    el1.style.transition = el2.style.transition = 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
    el1.style.left = el2.style.left = `${midX}px`;
    el1.style.top = el2.style.top = `${midY}px`;
    el1.style.transform = el2.style.transform = 'translate(-50%, -50%) scale(0) rotate(160deg)';
    el1.style.opacity = el2.style.opacity = '0';

    setTimeout(() => {
        el1.remove();
        el2.remove();

        if (result) {
            canvas.classList.add('shake');
            setTimeout(() => canvas.classList.remove('shake'), 260);
            window.explode(midX, midY, '#ffffff', 20, 80);
            window.explode(midX, midY, '#818cf8', 40, 150);

            const newItem = window.spawn(result.name, result.icon, midX, midY, true);
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
    }, 280);
}

window.explode = (x, y, color, count, spread) => {
    const point = clampToCanvas(x, y);
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = color;
        p.style.width = `${Math.random() * 8 + 4}px`;
        p.style.height = p.style.width;
        p.style.left = `${point.x}px`;
        p.style.top = `${point.y}px`;
        canvas.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spread + 20;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        p.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], { duration: 560, easing: 'ease-out' }).onfinish = () => p.remove();
    }
};

window.clearCanvas = () => {
    const items = [...canvas.querySelectorAll('.element')];
    if (!items.length) return;
    items.forEach(i => deleteItem(i, false));
    clearSelection();
    window.explode(canvas.clientWidth * 0.5, canvas.clientHeight * 0.5, '#64748b', 30, 240);
};

function getDragBounds() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    return {
        minX: 34,
        maxX: Math.max(34, w - 34),
        minY: 34,
        maxY: Math.max(34, h - 34)
    };
}

function toCanvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function clampToCanvas(x, y) {
    const bounds = getDragBounds();
    return {
        x: clamp(x, bounds.minX, bounds.maxX),
        y: clamp(y, bounds.minY, bounds.maxY)
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
