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
        this.render();
    }

    savePos() { this.oldX = this.x; this.oldY = this.y; }
    updateTarget(x, y) { this.x = x; this.y = y; }

    render() {
        if(!this.dom) return;
        const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size'));
        const gap = window.CONFIG.gap;
        const xPos = this.x * (size + gap);
        const yPos = this.y * (size + gap);
        // Updated to use CSS variables for smoother transitions
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

// Global Helper Functions for Animations
window.moveTileEl = function(tileEl, x, y, onLanded){
    tileEl.classList.add("moving");

    const done = (e) => {
        if (e.propertyName !== "transform") return;
        tileEl.removeEventListener("transitionend", done);
        tileEl.classList.remove("moving");
        onLanded?.();
    };

    tileEl.addEventListener("transitionend", done, { once: true });

    tileEl.style.setProperty("--x", `${x}px`);
    tileEl.style.setProperty("--y", `${y}px`);
};

window.mergeAtImpact = function(slidingEl, targetEl, mergedEl){
    window.moveTileEl(slidingEl, window.getX(targetEl), window.getY(targetEl), () => {
        slidingEl.remove();
        mergedEl.classList.add("tile-merged");
        requestAnimationFrame(() => {
            // Remove class after animation to reset state if needed
             // mergedEl.classList.remove("tile-merged"); 
        });
    });
};

window.getX = function(el){
    const v = getComputedStyle(el).getPropertyValue("--x").trim();
    return parseFloat(v || "0");
};

window.getY = function(el){
    const v = getComputedStyle(el).getPropertyValue("--y").trim();
    return parseFloat(v || "0");
};