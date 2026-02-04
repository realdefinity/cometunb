// Physics and Interaction Logic
const canvas = document.getElementById('canvas');
const trash = document.getElementById('trash');

// Spawn Item on Canvas
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

    el.addEventListener('mousedown', startDrag);
    el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        spawn(name, icon, parseFloat(el.style.left) + 20, parseFloat(el.style.top) + 20, true);
        explode(parseFloat(el.style.left), parseFloat(el.style.top), 'white', 8, 50);
    });
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); deleteItem(el); });

    canvas.appendChild(el);
    return el;
};

window.deleteItem = (el) => {
    explode(parseFloat(el.style.left), parseFloat(el.style.top), '#ef4444', 12, 60);
    el.remove();
};

// Drag & Physics
function startDrag(e) {
    if (e.button !== 0) return;
    e.stopPropagation();
    window.state.dragItem = this;
    const rect = window.state.dragItem.getBoundingClientRect();
    window.state.dragOffset.x = e.clientX - (rect.left + rect.width / 2);
    window.state.dragOffset.y = e.clientY - (rect.top + rect.height / 2);
    window.state.lastMouse = { x: e.clientX, y: e.clientY };
    window.state.velocity = { x: 0, y: 0 };
    window.state.dragItem.classList.add('dragging');
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
    dragLoop();
}

function onDrag(e) {
    if (!window.state.dragItem) return;
    window.state.velocity.x = e.clientX - window.state.lastMouse.x;
    window.state.velocity.y = e.clientY - window.state.lastMouse.y;
    window.state.lastMouse = { x: e.clientX, y: e.clientY };

    const cRect = canvas.getBoundingClientRect();
    window.state.dragItem.style.left = (e.clientX - cRect.left - window.state.dragOffset.x) + 'px';
    window.state.dragItem.style.top = (e.clientY - cRect.top - window.state.dragOffset.y) + 'px';

    const tRect = trash.getBoundingClientRect();
    const inTrash = (e.clientX > tRect.left && e.clientX < tRect.right && e.clientY > tRect.top && e.clientY < tRect.bottom);
    if (inTrash) trash.classList.add('active'); else trash.classList.remove('active');

    findMergeCandidate(window.state.dragItem);
}

function dragLoop() {
    if (!window.state.dragItem) return;
    const rotX = Math.max(-20, Math.min(20, window.state.velocity.x * 1.5));
    // const rotY = Math.max(-10, Math.min(10, -window.state.velocity.y * 1.5)); // Unused
    window.state.dragItem.style.transform = `translate(-50%, -50%) rotate(${rotX}deg) scale(1.1)`;
    window.state.velocity.x *= 0.8;
    window.state.velocity.y *= 0.8;
    window.state.dragFrame = requestAnimationFrame(dragLoop);
}

function endDrag() {
    if (!window.state.dragItem) return;
    cancelAnimationFrame(window.state.dragFrame);
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);
    window.state.dragItem.classList.remove('dragging');
    window.state.dragItem.style.transform = `translate(-50%, -50%)`;

    if (trash.classList.contains('active')) {
        deleteItem(window.state.dragItem);
        trash.classList.remove('active');
    } else if (window.state.mergeTarget) {
        triggerMerge(window.state.dragItem, window.state.mergeTarget);
        window.state.mergeTarget.style.boxShadow = 'none';
        window.state.mergeTarget.style.transform = 'translate(-50%, -50%)';
    }
    window.state.dragItem = null;
    window.state.mergeTarget = null;
}

function findMergeCandidate(active) {
    const items = Array.from(canvas.querySelectorAll('.element:not(.dragging)'));
    let closest = null; let minDist = 90;
    const r1 = active.getBoundingClientRect();
    const c1 = { x: r1.left + r1.width / 2, y: r1.top + r1.height / 2 };

    items.forEach(item => {
        const r2 = item.getBoundingClientRect();
        const c2 = { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 };
        const dist = Math.hypot(c2.x - c1.x, c2.y - c1.y);
        if (dist < minDist) { minDist = dist; closest = item; }
    });

    if (window.state.mergeTarget && window.state.mergeTarget !== closest) {
        window.state.mergeTarget.style.boxShadow = 'none';
        window.state.mergeTarget.style.transform = 'translate(-50%, -50%)';
    }
    window.state.mergeTarget = closest;
    if (window.state.mergeTarget) {
        window.state.mergeTarget.style.boxShadow = `0 0 0 3px #818cf8, 0 0 20px rgba(129, 140, 248, 0.5)`;
        window.state.mergeTarget.style.transform = 'translate(-50%, -50%) scale(1.05)';
    }
}

// Logic: Merge
function triggerMerge(el1, el2) {
    const n1 = el1.dataset.name;
    const n2 = el2.dataset.name;
    const key = [n1, n2].sort().join('+');
    const result = window.recipes[key];

    // 1. Calculate Center Point
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();
    const cRect = canvas.getBoundingClientRect();
    const midX = ((r1.left + r2.left) / 2 - cRect.left) + r1.width / 2;
    const midY = ((r1.top + r2.top) / 2 - cRect.top) + r1.height / 2;

    // 2. Lock Elements & Move to Center
    el1.style.pointerEvents = 'none'; el2.style.pointerEvents = 'none';
    el1.style.transition = el2.style.transition = "left 0.3s ease-in, top 0.3s ease-in";
    el1.style.left = el2.style.left = midX + 'px';
    el1.style.top = el2.style.top = midY + 'px';

    // 3. Play "Vortex" Animation (Spin & Shrink)
    const anim = [
        { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(0.1) rotate(180deg)', opacity: 0.5 }
    ];
    const timing = { duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
    
    el1.animate(anim, timing);
    el2.animate(anim, timing);

    // 4. Resolve Match
    setTimeout(() => {
        el1.remove(); el2.remove();
        
        if (result) {
            // SUCCESS: Flash + Screen Shake + Particles
            canvas.classList.add('shake');
            setTimeout(() => canvas.classList.remove('shake'), 300);
            
            window.explode(midX, midY, '#ffffff', 20, 80); // White flash
            window.explode(midX, midY, '#818cf8', 40, 150); // Color explosion
            
            window.spawn(result.name, result.icon, midX, midY, true);

            // Save if new
            if (!window.state.discovered.some(d => d.name === result.name)) {
                window.state.discovered.push({ ...result, date: Date.now() });
                window.saveGame();
                window.renderInventory();
                window.showModal(result);
            }
        } else {
            // FAILURE: Grey Puff + Bounce Back
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
        p.style.width = Math.random() * 10 + 4 + 'px';
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
        ], { duration: 500, easing: 'ease-out' }).onfinish = () => p.remove();
    }
};

window.clearCanvas = () => {
    canvas.querySelectorAll('.element').forEach(i => deleteItem(i));
};