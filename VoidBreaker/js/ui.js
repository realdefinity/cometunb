window.UI = {
    updateMenuUI: function() {
        document.getElementById('menu-credits').innerText = window.Game.totalCurrency.toLocaleString();
        const grid = document.getElementById('weapon-grid');
        grid.innerHTML = '';

        // Lootbox
        const boxBtn = document.createElement('div');
        boxBtn.className = "weapon-card rarity-legendary mb-8";
        boxBtn.style.background = "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(0,0,0,0))";
        boxBtn.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <div class="text-2xl font-bold text-yellow-400 mb-1">ARMORY CRATE</div>
                    <div class="text-xs text-slate-300">Contains 1 random weapon</div>
                </div>
                <div class="buy-btn ${window.Game.totalCurrency >= 1000 ? '' : 'disabled'}" style="margin:0; width:120px;" onclick="window.UI.openLootbox(event)">
                    ${window.Game.totalCurrency >= 1000 ? 'BUY $1,000' : 'NEED $1,000'}
                </div>
            </div>
        `;
        grid.appendChild(boxBtn);

        // Weapons
        Object.keys(window.WEAPONS).forEach(key => {
            if(!window.Game.unlockedWeapons.includes(key)) return;
            const w = window.WEAPONS[key];
            const isSelected = window.Game.currentLoadout === key;
            const card = document.createElement('div');
            card.className = `weapon-card rarity-${w.rarity} ${isSelected ? 'selected' : ''}`;
            card.onclick = () => { window.Game.currentLoadout = key; window.UI.updateMenuUI(); };
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div><div class="text-xl font-bold text-white mb-1">${w.name}</div><div class="text-xs text-slate-400 mb-3 h-8">${w.desc}</div></div>
                    <div class="text-xs font-bold uppercase text-${w.rarity}">${w.rarity}</div>
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-500 font-bold tracking-wider">DMG <div class="stat-bar flex-grow"><div class="stat-fill" style="width: ${(w.damage/50)*100}%"></div></div></div>
                <div class="flex items-center gap-2 text-xs text-slate-500 font-bold tracking-wider">SPD <div class="stat-bar flex-grow"><div class="stat-fill" style="width: ${(15/w.cooldown)*100}%"></div></div></div>
            `;
            grid.appendChild(card);
        });
    },

    openLootbox: function(e) {
        if(e) e.stopPropagation();
        if(window.Game.totalCurrency < 1000) return;
        window.Game.totalCurrency -= 1000;
        window.Game.saveData();
        this.updateMenuUI();

        const modal = document.createElement('div');
        modal.className = 'lootbox-modal active';
        modal.innerHTML = `
            <div class="crate-container"><div class="crate" id="crate-box">📦</div><div class="reward-card" id="reward-card"><div class="text-sm font-bold uppercase mb-2 text-slate-400" id="reward-rarity"></div><div class="text-3xl font-bold text-white mb-4" id="reward-name"></div><button class="modern-btn" onclick="this.closest('.lootbox-modal').remove(); window.UI.updateMenuUI();">COLLECT</button></div></div>
        `;
        document.body.appendChild(modal);

        const crate = modal.querySelector('#crate-box');
        const card = modal.querySelector('#reward-card');
        crate.classList.add('shake');
        window.AudioSys.play('square', 100, 0.1); 
        
        setTimeout(() => {
            crate.classList.remove('shake'); crate.classList.add('open');
            window.AudioSys.play('sine', 800, 0.5);
            const keys = Object.keys(window.WEAPONS);
            // Weighted Random for Lootbox
            let wKeys = [];
            keys.forEach(k => {
                const r = window.WEAPONS[k].rarity;
                const weight = r==='common'?60 : r==='rare'?30 : r==='epic'?9 : 1;
                for(let i=0; i<weight; i++) wKeys.push(k);
            });
            const key = wKeys[Math.floor(Math.random() * wKeys.length)];
            const w = window.WEAPONS[key];
            
            if(!window.Game.unlockedWeapons.includes(key)) {
                window.Game.unlockedWeapons.push(key); window.Game.saveData();
            }
            modal.querySelector('#reward-rarity').innerText = w.rarity;
            modal.querySelector('#reward-rarity').className = `text-sm font-bold uppercase mb-2 text-${w.rarity}`;
            modal.querySelector('#reward-name').innerText = w.name;
            card.classList.add('show');
        }, 2000);
    },

    generateUpgrades: function() {
        const container = document.getElementById('upgrade-container');
        container.innerHTML = '';
        document.getElementById('upgrade-screen').classList.remove('hidden');
        
        // Filter Pool based on Wave, Prereqs, and Max Level
        let pool = window.UPGRADES_DB.filter(u => {
            // Check Wave
            if(u.minWave && window.Game.wave < u.minWave) return false;
            // Check Prereqs
            if(u.req && !window.Game.player[u.req]) return false;
            // Check Max Level
            const currentLvl = window.Game.player.upgradeLevels[u.id] || 0;
            if(currentLvl >= u.max) return false;
            return true;
        });

        // Weighted Random Selection
        const selected = [];
        for(let i=0; i<3; i++) {
            if(pool.length === 0) break;
            
            // Calculate Total Weight
            let totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
            let rand = Math.random() * totalWeight;
            
            // Pick Item
            let item = null;
            for(let u of pool) {
                if(rand < u.weight) { item = u; break; }
                rand -= u.weight;
            }
            
            if(item) {
                selected.push(item);
                pool = pool.filter(u => u !== item); // Remove to prevent duplicates in one hand
            }
        }

        selected.forEach(upg => {
            const currentLvl = window.Game.player.upgradeLevels[upg.id] || 0;
            const el = document.createElement('div');
            el.className = `upgrade-card rarity-${upg.rarity}`;
            el.innerHTML = `
                <div class="flex justify-between">
                    <div class="text-xs font-bold uppercase mb-1 text-slate-400">${upg.rarity}</div>
                    <div class="text-xs font-bold text-white">Lvl ${currentLvl} > ${currentLvl+1}</div>
                </div>
                <div class="text-xl font-bold text-white mb-2">${upg.name}</div>
                <div class="text-sm text-slate-300">${upg.desc}</div>
            `;
            el.onclick = () => {
                // Apply Upgrade
                if(upg.type === 'stat') window.Game.player[upg.stat] *= upg.val;
                else if (upg.type === 'add') window.Game.player[upg.stat] += upg.val;
                else if (upg.type === 'heal') { window.Game.player.maxHp += upg.val; window.Game.player.hp += upg.val; }
                else if (upg.type === 'bool') window.Game.player[upg.stat] = true;
                else if (upg.type === 'complex') upg.apply(window.Game.player);
                
                // Increment Level
                if(!window.Game.player.upgradeLevels[upg.id]) window.Game.player.upgradeLevels[upg.id] = 0;
                window.Game.player.upgradeLevels[upg.id]++;

                document.getElementById('upgrade-screen').classList.add('hidden');
                window.Game.gameState = 'PLAYING'; window.Game.loop();
            };
            container.appendChild(el);
        });
    },

    updateHud: function() {
        if (!window.Game.player) return;
        const hpPct = Math.max(0, (window.Game.player.hp/window.Game.player.maxHp)*100);
        document.getElementById('health-bar').style.width = hpPct + '%';
        document.getElementById('hp-text').innerText = `${Math.ceil(window.Game.player.hp)}/${Math.ceil(window.Game.player.maxHp)}`;
        const xpPct = (window.Game.currentXp/window.Game.xpNeeded)*100;
        document.getElementById('xp-bar').style.width = xpPct + '%';
        document.getElementById('level-display').innerText = window.Game.level;
        
        if(window.Game.killStreak > 0) {
            document.getElementById('kill-streak').innerText = `${window.Game.killStreak} STREAK`;
            document.getElementById('kill-streak').style.opacity = 1;
        } else {
             document.getElementById('kill-streak').style.opacity = 0;
        }

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