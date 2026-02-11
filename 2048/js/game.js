class Game {
    constructor() {
        this.grid = [];
        this.tiles = [];
        this.score = 0;
        this.flux = 50;
        this.best = localStorage.getItem('flux_2048_best') || 0;
        this.history = [];
        this.animating = false;
        this.destroyMode = false;
        this.combo = 0;
    }

    init(size) {
        window.CONFIG.size = size;
        this.setupGrid();
        this.restart();
    }

    setupGrid() {
        const container = document.getElementById('game-board');
        const bg = document.getElementById('grid-bg');
        
        const w = window.innerWidth;
        const h = window.innerHeight;
        const uiHeight = 300; 
        const maxH = Math.max(300, h - uiHeight);
        const maxW = Math.min(w - 32, 480);
        
        const availableSpace = Math.min(maxW, maxH);
        const totalGap = (window.CONFIG.size - 1) * window.CONFIG.gap;
        const tileSize = Math.floor((availableSpace - totalGap) / window.CONFIG.size);
        
        document.documentElement.style.setProperty('--tile-size', `${tileSize}px`);
        document.documentElement.style.setProperty('--grid-gap', `${window.CONFIG.gap}px`);
        document.documentElement.style.setProperty('--size', window.CONFIG.size);

        bg.innerHTML = '';
        for(let i=0; i<window.CONFIG.size*window.CONFIG.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            bg.appendChild(cell);
        }
    }

    restart() {
        this.grid = Array(window.CONFIG.size).fill(null).map(() => Array(window.CONFIG.size).fill(null));
        this.tiles = [];
        this.score = 0;
        this.flux = 50;
        this.history = [];
        this.combo = 0;
        
        document.getElementById('tile-layer').innerHTML = '';
        window.ui.updateStats(0, this.best, this.flux);
        
        this.addTile();
        this.addTile();
        this.animating = false;
        this.disableDestroyMode();
    }

    addTile() {
        const empty = [];
        for(let x=0; x<window.CONFIG.size; x++)
            for(let y=0; y<window.CONFIG.size; y++)
                if(!this.grid[x][y]) empty.push({x,y});

        if(empty.length) {
            const {x,y} = empty[Math.floor(Math.random()*empty.length)];
            const val = Math.random() < 0.9 ? 2 : 4;
            const tile = new window.Tile(x, y, val);
            tile.mount();
            this.grid[x][y] = tile;
            this.tiles.push(tile);
        }
    }

    async move(dir) {
        if(this.animating || this.destroyMode) return;

        const vector = this.getVector(dir);
        const traversals = this.buildTraversals(vector);
        let moved = false;
        let mergedTiles = [];
        let points = 0;

        this.tiles.forEach(t => { t.mergedFrom = null; t.savePos(); });

        traversals.x.forEach(x => {
            traversals.y.forEach(y => {
                const tile = this.grid[x][y];
                if(tile) {
                    const far = this.findFarthest(x, y, vector);
                    const next = this.grid[far.next.x] && this.grid[far.next.x][far.next.y];

                    if(next && next.value === tile.value && !next.mergedFrom) {
                        const newVal = tile.value * 2;
                        const merged = new window.Tile(far.next.x, far.next.y, newVal);
                        merged.mergedFrom = [tile, next];

                        this.grid[x][y] = null;
                        this.grid[far.next.x][far.next.y] = merged;
                        
                        tile.updateTarget(far.next.x, far.next.y);
                        next.isGarbage = true;

                        mergedTiles.push(merged);
                        points += newVal;
                        moved = true;
                    } else {
                        this.grid[x][y] = null;
                        this.grid[far.farthest.x][far.farthest.y] = tile;
                        
                        if(far.farthest.x !== x || far.farthest.y !== y) {
                            tile.updateTarget(far.farthest.x, far.farthest.y);
                            moved = true;
                        }
                    }
                }
            });
        });

        if(moved) {
            this.saveState();
            this.animating = true;
            this.tiles.forEach(t => t.render());
            await window.sleep(window.CONFIG.animSpeed);

            this.tiles = this.tiles.filter(t => {
                if(t.mergedFrom) return false;
                if(mergedTiles.some(m => m.mergedFrom.includes(t))) {
                    t.remove();
                    return false;
                }
                return true;
            });

            mergedTiles.forEach(m => {
                m.mount();
                m.dom.classList.add('tile-merged');
                this.tiles.push(m);
            });

            this.addTile();
            
            if(points > 0) {
                this.score += points;
                this.addFlux(Math.floor(Math.sqrt(points)));
                if(points >= 128) window.ui.shakeBoard();
                window.ui.spawnFloatText(`+${points}`, 'center');
            }

            if(this.score > this.best) {
                this.best = this.score;
                localStorage.setItem('flux_2048_best', this.best);
            }

            window.ui.updateStats(this.score, this.best, this.flux);
            this.animating = false;
            this.checkGameOver();
        }
    }

    triggerUndo() {
        if(this.animating || this.destroyMode) return;
        if(this.flux < window.CONFIG.costs.undo) {
            window.ui.spawnFloatText("Need Flux!", "btn-undo");
            return;
        }
        if(this.history.length === 0) return;

        this.addFlux(-window.CONFIG.costs.undo);
        const state = this.history.pop();
        this.score = state.score;
        
        document.getElementById('tile-layer').innerHTML = '';
        this.tiles = [];
        this.grid = Array(window.CONFIG.size).fill(null).map(() => Array(window.CONFIG.size).fill(null));

        state.grid.forEach((row, x) => {
            row.forEach((val, y) => {
                if(val) {
                    const t = new window.Tile(x, y, val);
                    t.mount();
                    this.grid[x][y] = t;
                    this.tiles.push(t);
                }
            });
        });
        window.ui.updateStats(this.score, this.best, this.flux);
    }

    triggerDestroy() {
        if(this.destroyMode) {
            this.disableDestroyMode();
            return;
        }
        if(this.flux < window.CONFIG.costs.destroy) {
            window.ui.spawnFloatText("Need Flux!", "btn-destroy");
            return;
        }
        
        this.destroyMode = true;
        document.getElementById('btn-destroy').classList.add('btn-mode-active');
        document.getElementById('game-board').style.cursor = 'crosshair';
        window.ui.spawnFloatText("Select Tile", "center");
    }

    disableDestroyMode() {
        this.destroyMode = false;
        document.getElementById('btn-destroy').classList.remove('btn-mode-active');
        document.getElementById('game-board').style.cursor = 'default';
    }

    executeDestroy(tile) {
        this.addFlux(-window.CONFIG.costs.destroy);
        tile.remove();
        this.grid[tile.x][tile.y] = null;
        this.tiles = this.tiles.filter(t => t !== tile);
        window.ui.shakeBoard();
        this.disableDestroyMode();
        window.ui.updateStats(this.score, this.best, this.flux);
    }

    saveState() {
        if(this.history.length > 8) this.history.shift();
        this.history.push({
            grid: this.grid.map(row => row.map(t => t ? t.value : 0)),
            score: this.score
        });
    }

    addFlux(amount) {
        this.flux = Math.min(window.CONFIG.maxFlux, Math.max(0, this.flux + amount));
    }

    getVector(dir) {
        const map = { 0: {x:0, y:-1}, 1: {x:1, y:0}, 2: {x:0, y:1}, 3: {x:-1, y:0} };
        return map[dir];
    }

    buildTraversals(vector) {
        const t = { x: [], y: [] };
        for(let i=0; i<window.CONFIG.size; i++) { t.x.push(i); t.y.push(i); }
        if(vector.x === 1) t.x.reverse();
        if(vector.y === 1) t.y.reverse();
        return t;
    }

    findFarthest(x, y, vector) {
        let prev = {x, y};
        let next = {x: x + vector.x, y: y + vector.y};
        while(next.x >= 0 && next.x < window.CONFIG.size && next.y >= 0 && next.y < window.CONFIG.size && !this.grid[next.x][next.y]) {
            prev = next;
            next = {x: next.x + vector.x, y: next.y + vector.y};
        }
        return { farthest: prev, next: next };
    }

    checkGameOver() {
        if(this.tiles.length < window.CONFIG.size * window.CONFIG.size) return;
        for(let x=0; x<window.CONFIG.size; x++) {
            for(let y=0; y<window.CONFIG.size; y++) {
                const t = this.grid[x][y];
                if(!t) return;
                const dirs = [{x:1,y:0}, {x:0,y:1}];
                for(let d of dirs) {
                    const nx = x+d.x, ny = y+d.y;
                    if(nx < window.CONFIG.size && ny < window.CONFIG.size) {
                        if(this.grid[nx][ny].value === t.value) return;
                    }
                }
            }
        }
        setTimeout(() => alert("Game Over! Score: " + this.score), 500);
    }
    
    start() {
        document.getElementById('menu').classList.add('hidden');
        this.init(window.CONFIG.selectedSize);
    }
}
window.Game = Game;