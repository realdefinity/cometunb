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
        this.dom.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    remove() {
        if(this.dom) {
            this.dom.remove();
            this.dom = null;
        }
    }
}
window.Tile = Tile;