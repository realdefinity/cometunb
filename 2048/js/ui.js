window.ui = {
    themes: ['midnight', 'paper', 'forest', 'ocean'],
    currentThemeIndex: 0,

    selectSize: (n, targetEl) => {
        document.querySelectorAll('.size-opt').forEach(b => b.classList.remove('selected'));
        if (targetEl) targetEl.classList.add('selected');
        window.CONFIG.selectedSize = n;
    },

    initTheme: () => {
        const storedTheme = localStorage.getItem('game_2048_theme') || 'midnight';
        const idx = window.ui.themes.indexOf(storedTheme);
        window.ui.currentThemeIndex = idx >= 0 ? idx : 0;
        window.ui.applyTheme(window.ui.themes[window.ui.currentThemeIndex]);
    },

    applyTheme: (themeName) => {
        document.body.classList.remove(...window.ui.themes.map(t => `theme-${t}`));
        document.body.classList.add(`theme-${themeName}`);
        const name = document.getElementById('theme-name');
        if (name) name.innerText = themeName.toUpperCase();
        const tag = document.getElementById('mode-tag');
        if (tag) tag.innerText = themeName.toUpperCase();
        localStorage.setItem('game_2048_theme', themeName);
    },

    cycleTheme: () => {
        window.ui.currentThemeIndex = (window.ui.currentThemeIndex + 1) % window.ui.themes.length;
        window.ui.applyTheme(window.ui.themes[window.ui.currentThemeIndex]);
    },

    updateStats: (score, best, flux, moves = 0, combo = 0) => {
        document.getElementById('score').innerText = score;
        document.getElementById('best').innerText = best;

        const movesEl = document.getElementById('moves');
        if (movesEl) movesEl.innerText = moves;

        const comboEl = document.getElementById('combo');
        if (comboEl) {
            comboEl.innerText = `x${combo}`;
            comboEl.classList.toggle('combo-hot', combo >= 3);
        }

        const pct = Math.min(100, (flux / window.CONFIG.maxFlux) * 100);
        document.getElementById('flux-bar').style.width = `${pct}%`;
        document.getElementById('flux-val').innerText = Math.floor(flux);

        document.getElementById('btn-undo').disabled = flux < window.CONFIG.costs.undo;
        document.getElementById('btn-destroy').disabled = flux < window.CONFIG.costs.destroy;
    },

    openStats: () => {
        document.getElementById('stats-panel').classList.remove('hidden');
        if (window.game && typeof window.game.refreshStatsPanel === 'function') {
            window.game.refreshStatsPanel();
        }
    },

    closeStats: () => {
        document.getElementById('stats-panel').classList.add('hidden');
    },

    renderStatsPanel: (stats) => {
        const map = {
            'Games played': stats.gamesPlayed,
            'Wins': stats.wins,
            'Game over count': stats.gameOvers,
            'Current streak': stats.currentWinStreak,
            'Best streak': stats.bestWinStreak,
            'Total score': stats.totalScore,
            'Best score': stats.bestScore,
            'Average score': stats.gamesPlayed ? Math.round(stats.totalScore / stats.gamesPlayed) : 0,
            'Total moves': stats.totalMoves,
            'Average moves/game': stats.gamesPlayed ? Math.round(stats.totalMoves / stats.gamesPlayed) : 0,
            'Total merges': stats.totalMerges,
            'Highest tile ever': stats.highestTile,
            'Biggest merge': stats.biggestMerge,
            'Highest combo': stats.highestCombo,
            'Current combo': stats.currentCombo,
            'Total power used': stats.totalPowerUsed,
            'Undo used': stats.totalUndos,
            'Smash used': stats.totalSmashes,
            'Power earned': stats.totalPowerEarned,
            'Power spent': stats.totalPowerSpent,
            'Highest power': stats.highestPower,
            'Lucky spawns': stats.luckySpawns,
            'Bonus drops': stats.bonusDrops,
            '2 tiles spawned': stats.spawned2,
            '4 tiles spawned': stats.spawned4,
            '8 tiles spawned': stats.spawned8,
            'Session score': stats.sessionScore,
            'Session moves': stats.sessionMoves,
            'Session merges': stats.sessionMerges,
            'Session highest tile': stats.sessionHighestTile,
            'Session longest combo': stats.sessionHighestCombo,
            'Time played (min)': (stats.totalPlayMs / 60000).toFixed(1),
            'Best move time (ms)': stats.bestMoveTimeMs || 0
        };

        const body = document.getElementById('stats-body');
        body.innerHTML = '';
        Object.entries(map).forEach(([label, value]) => {
            const row = document.createElement('div');
            row.className = 'stats-item';
            row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
            body.appendChild(row);
        });
    },

    shakeBoard: () => {
        const b = document.getElementById('game-board');
        b.classList.remove('shake');
        void b.offsetWidth;
        b.classList.add('shake');
    },

    spawnFloatText: (text, context) => {
        const el = document.createElement('div');
        el.className = 'float-text';
        el.innerText = text;

        if (context === 'center') {
            el.style.left = '50%';
            el.style.top = '50%';
            el.style.transform = 'translate(-50%, -50%)';
            document.getElementById('app').appendChild(el);
        } else if (document.getElementById(context)) {
            const rect = document.getElementById(context).getBoundingClientRect();
            el.style.left = (rect.left + rect.width / 2) + 'px';
            el.style.top = (rect.top - 20) + 'px';
            document.body.appendChild(el);
        }

        setTimeout(() => el.remove(), 1000);
    }
};
