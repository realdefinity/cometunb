class Tile {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.id = window.randomID();
        this.dom = null;
    }

    mount() {
        if(this.dom) return;
        const el = document.createElement('div');
        el.className = `tile t-${this.value}`;
        el.innerHTML = `<div class="tile-inner">${this.value}</div>`;
        el.onclick = () => { if(window.game && window.game.destroyMode) window.game.executeDestroy(this); };
        
        document.getElementById('tile-layer').appendChild(el);
        this.dom = el;
        
        // Initial Position
        const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size'));
        const gap = window.CONFIG.gap;
        const xPos = this.x * (size + gap);
        const yPos = this.y * (size + gap);
        el.style.setProperty('--x', `${xPos}px`);
        el.style.setProperty('--y', `${yPos}px`);
    }

    savePos() { this.oldX = this.x; this.oldY = this.y; }
    updateTarget(x, y) { this.x = x; this.y = y; }

    // Fallback render (for resize events)
    render() {
        if(!this.dom) return;
        const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size'));
        const gap = window.CONFIG.gap;
        const xPos = this.x * (size + gap);
        const yPos = this.y * (size + gap);
        this.dom.style.setProperty('--x', `${xPos}px`);
        this.dom.style.setProperty('--y', `${yPos}px`);
    }

    remove() {
        if(this.dom) {
            this.dom.remove();
            this.dom = null;
        }
    }
}
window.Tile = Tile;

// --- ANIMATION ORCHESTRATOR ---
const MOVE_MS = 120;
const MERGE_MS = 180;

const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

function setPos(el, x, y){
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
}

function waitTransformEnd(el){
    return new Promise(resolve => {
        const onEnd = (e) => {
            if (e.propertyName !== "transform") return;
            el.removeEventListener("transitionend", onEnd);
            resolve();
        };
        el.addEventListener("transitionend", onEnd);
        // Fallback for safety
        setTimeout(() => {
            el.removeEventListener("transitionend", onEnd);
            resolve();
        }, MOVE_MS + 50);
    });
}

async function moveElements(moves){
    // 1. Enable Transitions
    for (const m of moves){
        m.el.classList.add("moving");
    }

    await nextFrame();

    // 2. Set new positions (triggers transition)
    for (const m of moves){
        setPos(m.el, m.x, m.y);
    }

    // 3. Wait for all to finish
    await Promise.all(moves.map(m => waitTransformEnd(m.el)));

    // 4. Cleanup
    for (const m of moves){
        m.el.classList.remove("moving");
    }
}

function playMerge(el){
    el.classList.remove("merging");
    void el.offsetWidth; // Trigger reflow
    el.classList.add("merging");
    setTimeout(() => el.classList.remove("merging"), MERGE_MS);
}

function playSpawn(el){
    el.classList.add("spawning");
    setTimeout(() => el.classList.remove("spawning"), 170);
}

// Global Animation Entry Point
window.animateTurn = async function({ moves, merges, spawns }){
    // Phase 1: Slide everything
    await moveElements(moves);

    // Phase 2: Resolve logic (Remove old, Show new)
    for (const mg of merges){
        if (mg.removeEl) mg.removeEl.remove();
        if (mg.resultEl) {
            // Ensure result tile is visible/positioned if hidden
            playMerge(mg.resultEl);
        }
    }

    for (const s of spawns){
        playSpawn(s.el);
    }
};