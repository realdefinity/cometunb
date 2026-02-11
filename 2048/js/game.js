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
    }

    init(size) {
        window.CONFIG.size = size;
        this.setupGrid();
        this.restart();
    }

    setupGrid() {
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
        
        document.getElementById('tile-layer').innerHTML = '';
        window.ui.updateStats(0, this.best, this.flux);
        
        this.addTile();
        this.addTile();
        this.animating = false;
        this.disableDestroyMode();
    }

    addTile(force) {
        if (!force) {
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
                return tile;
            }
        }
        return null;
    }

    getPixelPos(gridX, gridY) {
        const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size'));
        const gap = window.CONFIG.gap;
        return {
            x: gridX * (size + gap),
            y: gridY * (size + gap)
        };
    }

    async move(dir) {
        if(this.animating || this.destroyMode) return;

        const vector = this.getVector(dir);
        const traversals = this.buildTraversals(vector);
        
        // Animation Queues
        const moveList = [];
        const mergeList = [];
        const spawnList = [];
        
        let moved = false;
        let points = 0;

        // Reset merge flags
        this.tiles.forEach(t => t.mergedFrom = null);
        this.saveState(); // Save before mutation for undo

        // LOGIC PHASE
        traversals.x.forEach(x => {
            traversals.y.forEach(y => {
                const tile = this.grid[x][y];
                if(tile) {
                    const far = this.findFarthest(x, y, vector);
                    const next = this.grid[far.next.x] && this.grid[far.next.x][far.next.y];

                    if(next && next.value === tile.value && !next.mergedFrom) {
                        // --- MERGE ---
                        const newVal = tile.value * 2;
                        const mergedTile = new window.Tile(far.next.x, far.next.y, newVal);
                        
                        // 1. Update Grid
                        this.grid[x][y] = null;
                        this.grid[far.next.x][far.next.y] = mergedTile;
                        
                        // 2. Mark for Animation
                        // Tile moves to target
                        const dest = this.getPixelPos(far.next.x, far.next.y);
                        moveList.push({ el: tile.dom, x: dest.x, y: dest.y });
                        
                        // Next tile (already at dest) is essentially 'removed' visually when merge happens
                        // But if it was moving previously in same turn? No, standard 2048 only moves existing
                        // Actually, 'next' might have moved into position previously?
                        // Standard logic: 'next' is stationary at the merge target relative to THIS tile, 
                        // but 'next' itself might have been a moved tile.
                        // Actually, 'findFarthest' logic implies 'next' is the tile obstructing us.
                        // The 'next' tile doesn't move in *this* specific iteration, but we process in order.
                        
                        // Since we process traversal in vector order, 'next' has already moved if it was going to.
                        // So 'next.dom' is already at the target visual position? 
                        // Wait, if 'next' moved, its 'x/y' property updated, but DOM might not have if we batch?
                        // If we batch, we need to use the tile's current logical X/Y for pixel calc.
                        
                        // NOTE: In this logic, we update this.grid immediately.
                        // So subsequent iterations see the new state.
                        
                        // Mark merged flags
                        mergedTile.mergedFrom = true; // Simple flag to prevent double merge
                        
                        // Create the DOM for the RESULT tile immediately but hidden?
                        // Or create it after slide?
                        // We mount it now, but maybe class 'hidden'?
                        // Let's mount it.
                        mergedTile.mount();
                        // Hack: Hide it via CSS or just rely on z-index covering?
                        // Better: Opacity 0 until merge pop.
                        mergedTile.dom.style.zIndex = 15; // Below popping animation?
                        
                        mergeList.push({ 
                            removeEl: tile.dom,
                            // 'next' is also removed
                            extraRemove: next.dom, 
                            resultEl: mergedTile.dom 
                        });

                        // Add to tile list
                        this.tiles.push(mergedTile);
                        
                        // Clean up old objects from list later
                        points += newVal;
                        moved = true;
                    } else {
                        // --- SLIDE ---
                        this.grid[x][y] = null;
                        this.grid[far.farthest.x][far.farthest.y] = tile;
                        
                        if(far.farthest.x !== x || far.farthest.y !== y) {
                            tile.updateTarget(far.farthest.x, far.farthest.y);
                            const dest = this.getPixelPos(far.farthest.x, far.farthest.y);
                            moveList.push({ el: tile.dom, x: dest.x, y: dest.y });
                            moved = true;
                        }
                    }
                }
            });
        });

        if(moved) {
            this.animating = true;

            // Generate new tile
            // We need to determine empty cells AFTER the moves.
            // Since this.grid is already updated, we can just find empty.
            // But we shouldn't show it until animation ends.
            const spawnTile = this.addTile(false); // don't push to grid yet? 
            // Wait, addTile modifies grid. 
            // We want it in grid for logic, but DOM animation later.
            // Let's modify addTile to return the object.
            
            // Actually, we already updated grid.
            // Scan for empty cells now.
            const empty = [];
            for(let x=0; x<window.CONFIG.size; x++)
                for(let y=0; y<window.CONFIG.size; y++)
                    if(!this.grid[x][y]) empty.push({x,y});

            if(empty.length) {
                const {x,y} = empty[Math.floor(Math.random()*empty.length)];
                const val = Math.random() < 0.9 ? 2 : 4;
                const t = new window.Tile(x, y, val);
                t.mount();
                // It mounts at position. Add spawning class?
                spawnList.push({ el: t.dom });
                this.grid[x][y] = t;
                this.tiles.push(t);
            }

            // Clean up tiles array (remove old ones that were merged)
            // We need to keep them for now so we don't lose refs before removal
            // The mergeList handles DOM removal. We just need to filter logic list.
            const tilesToRemove = new Set();
            mergeList.forEach(m => {
                // Find the tile objects corresponding to these DOMs?
                // Easier: just filter this.tiles for items not in grid?
                // But merged items are in grid.
                // Items that were source of merge are NOT in grid.
                if(m.extraRemove) {
                     // We need to manually remove the 'next' tile DOM too
                     // Add to merge list for the animator
                     // We can just add it to a list of "to remove"
                }
            });
            
            // Rebuild tiles list based on grid content
            this.tiles = [];
            for(let x=0; x<window.CONFIG.size; x++)
                for(let y=0; y<window.CONFIG.size; y++)
                    if(this.grid[x][y]) this.tiles.push(this.grid[x][y]);


            // EXECUTE ANIMATION
            // We need to pass the secondary removals
            const finalMerges = mergeList.map(m => ([
                { removeEl: m.removeEl, resultEl: m.resultEl },
                { removeEl: m.extraRemove, resultEl: null } 
            ])).flat();

            await window.animateTurn({ 
                moves: moveList, 
                merges: finalMerges, 
                spawns: spawnList 
            });

            // Scoring
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
        } else {
            // Undo save state if nothing happened
            this.history.pop();
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