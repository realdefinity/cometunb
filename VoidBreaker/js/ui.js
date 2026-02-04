window.UI = {
    updateMenuUI: function() {
        document.getElementById('menu-credits').innerText = window.Game.totalCurrency.toLocaleString();
        const grid = document.getElementById('weapon-grid');
        grid.innerHTML = '';

        Object.keys(window.WEAPONS).forEach(key => {
            const w = window.WEAPONS[key];
            const isUnlocked = window.Game.unlockedWeapons.includes(key);
            const isSelected = window.Game.currentLoadout === key;
            const canAfford = window.Game.totalCurrency >= w.price;

            const card = document.createElement('div');
            card.className = `weapon-card ${isSelected && isUnlocked ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
            
            let actionHtml = '';
            if(isUnlocked) {
                card.onclick = () => window.UI.selectWeapon(key);
            } else {
                actionHtml = `
                    <div class="mt-4 pt-4 border-t border-white/10">
                        <div class="text-xs text-slate-400 mb-1 font-bold">LOCKED</div>
                        <div class="buy-btn ${canAfford ? '' : 'disabled'}" onclick="window.UI.buyWeapon(event, '${key}', ${w.price})">
                            ${canAfford ? 'UNLOCK' : 'NEED FUNDS'} $${w.price.toLocaleString()}
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-xl font-bold text-white mb-1">${w.name}</div>
                        <div class="text-xs text-slate-400 mb-3 h-8">${w.desc}</div>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 text-xs text-slate-500 font-bold tracking-wider">DMG <div class="stat-bar flex-grow"><div class="stat-fill" style="width: ${(w.damage/30)*100}%"></div></div></div>
                <div class="flex items-center gap-2 text-xs text-slate-500 font-bold tracking-wider">SPD <div class="stat-bar flex-grow"><div class="stat-fill" style="width: ${(15/w.cooldown)*100}%"></div></div></div>
                
                ${actionHtml}
            `;
            grid.appendChild(card);
        });
    },

    selectWeapon: function(key) {
        if(!window.Game.unlockedWeapons.includes(key)) return;
        window.Game.currentLoadout = key;
        this.updateMenuUI();
    },

    buyWeapon: function(e, key, price) {
        if(e) e.stopPropagation();
        if(window.Game.totalCurrency >= price) {
            window.Game.totalCurrency -= price;
            window.Game.unlockedWeapons.push(key);
            window.Game.currentLoadout = key;
            window.Game.saveData();
            this.updateMenuUI();
            window.AudioSys.init();
            window.AudioSys.buy();
        }
    },

    generateUpgrades: function() {
        const container = document.getElementById('upgrade-container');
        container.innerHTML = '';
        document.getElementById('upgrade-screen').classList.remove('hidden');
        const pool = [...window.UPGRADES_DB];
        for(let i=0; i<3; i++) {
            if(pool.length === 0) break;
            const idx = Math.floor(Math.random()*pool.length);
            const upg = pool[idx]; pool.splice(idx, 1);
            const el = document.createElement('div');
            el.className = `upgrade-card rarity-${upg.rarity}`;
            el.innerHTML = `<div class="text-xs font-bold uppercase mb-1 text-slate-400">${upg.rarity}</div><div class="text-xl font-bold text-white mb-2">${upg.name}</div><div class="text-sm text-slate-300">${upg.desc}</div>`;
            el.onclick = () => {
                if(upg.type === 'stat') window.Game.player[upg.stat] *= upg.val;
                else if (upg.type === 'add') window.Game.player[upg.stat] += upg.val;
                else if (upg.type === 'heal') { window.Game.player.maxHp += upg.val; window.Game.player.hp += upg.val; }
                else if (upg.type === 'bool') window.Game.player[upg.stat] = true;
                else if (upg.type === 'complex') upg.apply(window.Game.player);
                document.getElementById('upgrade-screen').classList.add('hidden');
                window.Game.gameState = 'PLAYING'; window.Game.loop();
            };
            container.appendChild(el);
        }
    },

    updateHud: function() {
        if (!window.Game.player) return;
        const hpPct = Math.max(0, (window.Game.player.hp/window.Game.player.maxHp)*100);
        document.getElementById('health-bar').style.width = hpPct + '%';
        document.getElementById('hp-text').innerText = `${Math.ceil(window.Game.player.hp)}/${Math.ceil(window.Game.player.maxHp)}`;
        const xpPct = (window.Game.currentXp/window.Game.xpNeeded)*100;
        document.getElementById('xp-bar').style.width = xpPct + '%';
        document.getElementById('level-display').innerText = window.Game.level;
        
        // Streak
        if(window.Game.killStreak > 0) {
            document.getElementById('kill-streak').innerText = `${window.Game.killStreak} STREAK`;
            document.getElementById('kill-streak').style.opacity = 1;
        } else {
             document.getElementById('kill-streak').style.opacity = 0;
        }

        // Boss
        if(window.Game.bossActive) {
            const boss = window.Game.enemies.find(e => e.type === 'boss');
            if(boss) {
                const bossPct = (boss.hp / boss.maxHp) * 100;
                document.getElementById('boss-hp-bar').style.width = bossPct + '%';
            }
        }
    },

    gameOver: function() {
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = window.Game.score.toLocaleString();
        document.getElementById('earned-credits').innerText = "+" + window.Game.sessionCredits.toLocaleString();
    }
};