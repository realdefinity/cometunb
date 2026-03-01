class Game {
    constructor() {
        this.grid = [];
        this.tiles = [];
        this.score = 0;
        this.flux = 50;
        this.best = Number(localStorage.getItem('game_2048_best_score') || 0);
        this.history = [];
        this.animating = false;
        this.destroyMode = false;
        this.combo = 0;
        this.moves = 0;
        this.hasWon = false;
        this.turnStartMs = 0;
        this.roundStartedAt = 0;
        this.stats = this.loadStats();
    }

    init(size) {
        window.CONFIG.size = size;
        this.setupGrid();
        this.restart();
    }

    loadStats() {
        const defaults = {
            gamesPlayed: 0,
            wins: 0,
            gameOvers: 0,
            currentWinStreak: 0,
            bestWinStreak: 0,
            totalScore: 0,
            bestScore: 0,
            totalMoves: 0,
            totalMerges: 0,
            highestTile: 0,
            biggestMerge: 0,
            highestCombo: 0,
            currentCombo: 0,
            totalPowerUsed: 0,
            totalUndos: 0,
            totalSmashes: 0,
            totalPowerEarned: 0,
            totalPowerSpent: 0,
            highestPower: 50,
            luckySpawns: 0,
            bonusDrops: 0,
            spawned2: 0,
            spawned4: 0,
            spawned8: 0,
            sessionScore: 0,
            sessionMoves: 0,
            sessionMerges: 0,
            sessionHighestTile: 0,
            sessionHighestCombo: 0,
            totalPlayMs: 0,
            bestMoveTimeMs: 0
        };

        try {
            const parsed = JSON.parse(localStorage.getItem('game_2048_stats') || '{}');
            return { ...defaults, ...parsed };
        } catch {
            return defaults;
        }
    }

    saveStats() {
        localStorage.setItem('game_2048_stats', JSON.stringify(this.stats));
    }

    setupGrid() {
        const bg = document.getElementById('grid-bg');

        const w = window.innerWidth;
        const h = window.innerHeight;
        const uiHeight = 320;
        const maxH = Math.max(300, h - uiHeight);
        const maxW = Math.min(w - 32, 480);

        const availableSpace = Math.min(maxW, maxH);
        const totalGap = (window.CONFIG.size - 1) * window.CONFIG.gap;
        const tileSize = Math.floor((availableSpace - totalGap) / window.CONFIG.size);

        document.documentElement.style.setProperty('--tile-size', `${tileSize}px`);
        document.documentElement.style.setProperty('--grid-gap', `${window.CONFIG.gap}px`);
        document.documentElement.style.setProperty('--size', window.CONFIG.size);

        bg.innerHTML = '';
        for (let i = 0; i < window.CONFIG.size * window.CONFIG.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            bg.appendChild(cell);
        }
    }

    restart() {
        if (this.roundStartedAt) {
            this.stats.totalPlayMs += Date.now() - this.roundStartedAt;
        }

        this.grid = Array(window.CONFIG.size).fill(null).map(() => Array(window.CONFIG.size).fill(null));
        this.tiles = [];
        this.score = 0;
        this.flux = 50;
        this.history = [];
        this.combo = 0;
        this.moves = 0;
        this.hasWon = false;
        this.roundStartedAt = Date.now();

        this.stats.gamesPlayed += 1;
        this.stats.sessionScore = 0;
        this.stats.sessionMoves = 0;
        this.stats.sessionMerges = 0;
        this.stats.sessionHighestTile = 0;
        this.stats.sessionHighestCombo = 0;
        this.stats.currentCombo = 0;

        document.getElementById('tile-layer').innerHTML = '';
        window.ui.updateStats(0, this.best, this.flux, this.moves, this.combo);

        this.addTile();
        this.addTile();
        this.animating = false;
        this.disableDestroyMode();
        this.refreshStatsPanel();
        this.saveStats();
    }

    addTile() {
        const empty = [];
        for (let x = 0; x < window.CONFIG.size; x++) {
            for (let y = 0; y < window.CONFIG.size; y++) {
                if (!this.grid[x][y]) empty.push({ x, y });
            }
        }

        if (empty.length) {
            const { x, y } = empty[Math.floor(Math.random() * empty.length)];
            let val = Math.random() < 0.9 ? 2 : 4;

            if (this.combo >= 4 && Math.random() < 0.15) {
                val = 8;
                this.stats.luckySpawns += 1;
                window.ui.spawnFloatText('Lucky 8', 'center');
            }

            if (val === 2) this.stats.spawned2 += 1;
            if (val === 4) this.stats.spawned4 += 1;
            if (val === 8) this.stats.spawned8 += 1;

            const tile = new window.Tile(x, y, val);
            tile.mount();
            this.grid[x][y] = tile;
            this.tiles.push(tile);
        }
    }

    async move(dir) {
        if (this.animating || this.destroyMode) return;
        this.turnStartMs = performance.now();

        const vector = this.getVector(dir);
        const traversals = this.buildTraversals(vector);
        let moved = false;
        const mergedTiles = [];
        let points = 0;

        this.tiles.forEach(t => {
            t.mergedFrom = null;
            t.savePos();
        });

        traversals.x.forEach(x => {
            traversals.y.forEach(y => {
                const tile = this.grid[x][y];
                if (!tile) return;

                const far = this.findFarthest(x, y, vector);
                const next = this.grid[far.next.x] && this.grid[far.next.x][far.next.y];

                if (next && next.value === tile.value && !next.mergedFrom) {
                    const newVal = tile.value * 2;
                    const merged = new window.Tile(far.next.x, far.next.y, newVal);
                    merged.mergedFrom = [tile, next];

                    this.grid[x][y] = null;
                    this.grid[far.next.x][far.next.y] = merged;
                    tile.updateTarget(far.next.x, far.next.y);
                    next.isGarbage = true;

                    mergedTiles.push(merged);
                    points += newVal;
                    this.stats.biggestMerge = Math.max(this.stats.biggestMerge, newVal);
                    moved = true;
                } else {
                    this.grid[x][y] = null;
                    this.grid[far.farthest.x][far.farthest.y] = tile;

                    if (far.farthest.x !== x || far.farthest.y !== y) {
                        tile.updateTarget(far.farthest.x, far.farthest.y);
                        moved = true;
                    }
                }
            });
        });

        if (!moved) return;

        this.saveState();
        this.animating = true;
        this.tiles.forEach(t => t.render());
        await window.sleep(window.CONFIG.animSpeed);

        this.tiles = this.tiles.filter(t => {
            if (t.mergedFrom) return false;
            if (mergedTiles.some(m => m.mergedFrom.includes(t))) {
                t.remove();
                return false;
            }
            return true;
        });

        mergedTiles.forEach(m => {
            m.mount();
            m.dom.classList.add('tile-merged');
            const clearMergeClass = () => m.dom && m.dom.classList.remove('tile-merged');
            m.dom.addEventListener('animationend', clearMergeClass, { once: true });
            window.setTimeout(clearMergeClass, 760);
            this.tiles.push(m);
        });

        this.addTile();

        if (points > 0) {
            this.score += points;
            this.combo += 1;
            const gain = Math.floor(Math.sqrt(points)) + Math.min(6, this.combo);
            this.addFlux(gain);
            this.stats.totalPowerEarned += gain;
            window.ui.spawnFloatText(`+${points}`, 'center');
        } else {
            this.combo = 0;
        }

        if (this.combo > 0 && this.combo % 5 === 0) {
            this.addFlux(10);
            this.stats.totalPowerEarned += 10;
            this.stats.bonusDrops += 1;
            window.ui.spawnFloatText('Combo bonus +10', 'center');
        }

        this.moves += 1;
        this.stats.totalMoves += 1;
        this.stats.sessionMoves += 1;
        this.stats.totalMerges += mergedTiles.length;
        this.stats.sessionMerges += mergedTiles.length;
        this.stats.currentCombo = this.combo;
        this.stats.highestCombo = Math.max(this.stats.highestCombo, this.combo);
        this.stats.sessionHighestCombo = Math.max(this.stats.sessionHighestCombo, this.combo);
        this.stats.highestPower = Math.max(this.stats.highestPower, this.flux);

        this.updateHighestTile();
        this.stats.totalScore += points;
        this.stats.sessionScore = this.score;

        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('game_2048_best_score', this.best);
        }
        this.stats.bestScore = Math.max(this.stats.bestScore, this.score);

        const elapsed = Math.round(performance.now() - this.turnStartMs);
        if (!this.stats.bestMoveTimeMs || elapsed < this.stats.bestMoveTimeMs) {
            this.stats.bestMoveTimeMs = elapsed;
        }

        window.ui.updateStats(this.score, this.best, this.flux, this.moves, this.combo);
        this.animating = false;
        this.refreshStatsPanel();
        this.saveStats();
        this.checkGameOver();
    }

    updateHighestTile() {
        let highest = 0;
        this.tiles.forEach(t => {
            highest = Math.max(highest, t.value);
        });

        if (highest > this.stats.highestTile) {
            this.stats.highestTile = highest;
            this.addFlux(8);
            this.stats.totalPowerEarned += 8;
            window.ui.spawnFloatText(`New best tile ${highest}`, 'center');
        }

        this.stats.sessionHighestTile = Math.max(this.stats.sessionHighestTile, highest);

        if (!this.hasWon && highest >= 2048) {
            this.hasWon = true;
            this.stats.wins += 1;
            this.stats.currentWinStreak += 1;
            this.stats.bestWinStreak = Math.max(this.stats.bestWinStreak, this.stats.currentWinStreak);
            window.ui.spawnFloatText('You reached 2048!', 'center');
        }
    }

    triggerUndo() {
        if (this.animating || this.destroyMode) return;
        if (this.flux < window.CONFIG.costs.undo) {
            window.ui.spawnFloatText('Not enough power', 'btn-undo');
            return;
        }
        if (this.history.length === 0) return;

        this.addFlux(-window.CONFIG.costs.undo);
        this.stats.totalPowerUsed += window.CONFIG.costs.undo;
        this.stats.totalPowerSpent += window.CONFIG.costs.undo;
        this.stats.totalUndos += 1;

        const state = this.history.pop();
        this.score = state.score;

        document.getElementById('tile-layer').innerHTML = '';
        this.tiles = [];
        this.grid = Array(window.CONFIG.size).fill(null).map(() => Array(window.CONFIG.size).fill(null));

        state.grid.forEach((row, x) => {
            row.forEach((val, y) => {
                if (val) {
                    const t = new window.Tile(x, y, val);
                    t.mount();
                    this.grid[x][y] = t;
                    this.tiles.push(t);
                }
            });
        });

        this.updateHighestTile();
        window.ui.updateStats(this.score, this.best, this.flux, this.moves, this.combo);
        this.refreshStatsPanel();
        this.saveStats();
    }

    triggerDestroy() {
        if (this.destroyMode) {
            this.disableDestroyMode();
            return;
        }
        if (this.flux < window.CONFIG.costs.destroy) {
            window.ui.spawnFloatText('Not enough power', 'btn-destroy');
            return;
        }

        this.destroyMode = true;
        document.getElementById('btn-destroy').classList.add('btn-mode-active');
        const board = document.getElementById('game-board');
        board.style.cursor = 'crosshair';
        board.classList.add('destroy-mode');
        window.ui.spawnFloatText('Pick a tile', 'center');
    }

    disableDestroyMode() {
        this.destroyMode = false;
        document.getElementById('btn-destroy').classList.remove('btn-mode-active');
        const board = document.getElementById('game-board');
        board.style.cursor = 'default';
        board.classList.remove('destroy-mode');
    }

    executeDestroy(tile) {
        this.addFlux(-window.CONFIG.costs.destroy);
        this.stats.totalPowerUsed += window.CONFIG.costs.destroy;
        this.stats.totalPowerSpent += window.CONFIG.costs.destroy;
        this.stats.totalSmashes += 1;

        tile.remove();
        this.grid[tile.x][tile.y] = null;
        this.tiles = this.tiles.filter(t => t !== tile);
        this.disableDestroyMode();
        this.combo = 0;
        window.ui.shakeBoard();
        window.ui.updateStats(this.score, this.best, this.flux, this.moves, this.combo);
        this.refreshStatsPanel();
        this.saveStats();
    }

    saveState() {
        if (this.history.length > 8) this.history.shift();
        this.history.push({
            grid: this.grid.map(row => row.map(t => (t ? t.value : 0))),
            score: this.score
        });
    }

    addFlux(amount) {
        this.flux = Math.min(window.CONFIG.maxFlux, Math.max(0, this.flux + amount));
    }

    getVector(dir) {
        const map = { 0: { x: 0, y: -1 }, 1: { x: 1, y: 0 }, 2: { x: 0, y: 1 }, 3: { x: -1, y: 0 } };
        return map[dir];
    }

    buildTraversals(vector) {
        const t = { x: [], y: [] };
        for (let i = 0; i < window.CONFIG.size; i++) {
            t.x.push(i);
            t.y.push(i);
        }
        if (vector.x === 1) t.x.reverse();
        if (vector.y === 1) t.y.reverse();
        return t;
    }

    findFarthest(x, y, vector) {
        let prev = { x, y };
        let next = { x: x + vector.x, y: y + vector.y };
        while (next.x >= 0 && next.x < window.CONFIG.size && next.y >= 0 && next.y < window.CONFIG.size && !this.grid[next.x][next.y]) {
            prev = next;
            next = { x: next.x + vector.x, y: next.y + vector.y };
        }
        return { farthest: prev, next };
    }

    checkGameOver() {
        if (this.tiles.length < window.CONFIG.size * window.CONFIG.size) return;

        for (let x = 0; x < window.CONFIG.size; x++) {
            for (let y = 0; y < window.CONFIG.size; y++) {
                const t = this.grid[x][y];
                if (!t) return;
                const dirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
                for (const d of dirs) {
                    const nx = x + d.x;
                    const ny = y + d.y;
                    if (nx < window.CONFIG.size && ny < window.CONFIG.size) {
                        if (this.grid[nx][ny].value === t.value) return;
                    }
                }
            }
        }

        this.stats.gameOvers += 1;
        this.stats.currentWinStreak = 0;
        this.stats.totalPlayMs += Date.now() - this.roundStartedAt;
        this.roundStartedAt = 0;
        this.refreshStatsPanel();
        this.saveStats();
        setTimeout(() => alert(`Game Over! Score: ${this.score}`), 500);
    }

    refreshStatsPanel() {
        window.ui.renderStatsPanel(this.stats);
    }

    start() {
        document.getElementById('menu').classList.add('hidden');
        this.init(window.CONFIG.selectedSize);
    }
}

window.Game = Game;
