window.UI = {
    // Tab switching logic
    switchTab: function(tabName) {
        // Update Buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-btn[onclick*="${tabName}"]`);
        if(activeBtn) activeBtn.classList.add('active');

        // Update Tabs with Fade
        const tabs = document.querySelectorAll('.menu-tab');
        tabs.forEach(tab => {
            if (tab.id === `tab-${tabName}`) {
                tab.classList.add('active');
                // Retrigger animations
                const cards = tab.querySelectorAll('.weapon-card, .menu-hero, .stats-panel');
                cards.forEach(c => {
                    c.style.animation = 'none';
                    c.offsetHeight; /* trigger reflow */
                    c.style.animation = null; 
                });
            } else {
                tab.classList.remove('active');
            }
        });

        if(tabName === 'loadout') this.updateMenuUI();
    },

    updateMenuUI: function() {
        const creditsEl = document.getElementById('menu-credits');
        if(creditsEl) creditsEl.innerText = window.Game.totalCurrency.toLocaleString();

        const statsEl = document.getElementById('menu-stats');
        if(statsEl) {
             statsEl.innerHTML = `
                <div class="stat-pill"><span class="label">XP MULT</span> <span class="val text-indigo-400">x${window.GAME_DATA.multipliers.xp.toFixed(1)}</span></div>
                <div class="stat-pill"><span class="label">GOLD MULT</span> <span class="val text-yellow-400">x${window.GAME_DATA.multipliers.gold.toFixed(1)}</span></div>
             `;
        }
        
        const grid = document.getElementById('weapon-grid');
        const actions = document.getElementById('loadout-actions');
        
        if(!grid || !actions) return;
        
        grid.innerHTML = '';
        actions.innerHTML = ''; 

        // --- PRESTIGE & CRATES (ACTIONS AREA) ---
        
        // Prestige
        if(window.Game.totalCurrency > 50000) {
            this.createActionCard(actions, 'legendary', 'PRESTIGE RESET', 'Reset for permanent power.', 'RESET', 'bg-red-500', 0, () => window.UI.doPrestige());
        }

        // Cosmetic Crate
        const canBuySkin = window.Game.totalCurrency >= 5000;
        this.createActionCard(actions, 'epic', 'COSMETIC CACHE', 'Unlock visual styles.', canBuySkin ? 'BUY $5k' : 'NEED $5k', 'bg-fuchsia-500', 0.1, (e) => window.UI.openSkinCrate(e), !canBuySkin);

        // Armory Crate
        const canBuyWep = window.Game.totalCurrency >= 1000;
        this.createActionCard(actions, 'rare', 'ARMORY CRATE', 'Random weapon drop.', canBuyWep ? 'BUY $1k' : 'NEED $1k', 'bg-yellow-500', 0.2, (e) => window.UI.openLootbox(e), !canBuyWep);


        // --- WEAPON GRID ---
        if(window.WEAPONS) {
            const keys = Object.keys(window.WEAPONS);
            let delayIndex = 0;
            
            keys.forEach(key => {
                if(!window.Game.unlockedWeapons.includes(key)) return;
                
                const w = window.WEAPONS[key];
                const isSelected = window.Game.currentLoadout === key;
                delayIndex++;

                const card = document.createElement('div');
                card.className = `weapon-card rarity-${w.rarity} ${isSelected ? 'selected' : ''}`;
                card.style.animationDelay = `${delayIndex * 0.05}s`;
                card.onclick = () => { 
                    window.Game.currentLoadout = key; 
                    window.UI.updateMenuUI(); 
                    window.AudioSys.play('sine', 400, 0.1);
                };

                const dmgPct = (w.damage/50)*100;
                const spdPct = (15/w.cooldown)*100;

                card.innerHTML = `
                    <div class="card-glow"></div>
                    <div class="card-content">
                        <div class="card-header">
                            <div class="card-title">${w.name}</div>
                            <div class="card-badge ${w.rarity}">${w.rarity}</div>
                        </div>
                        <div class="card-desc">${w.desc}</div>
                        
                        <div class="stat-row">
                            <span class="stat-label">DMG</span>
                            <div class="stat-track"><div class="stat-bar" style="width: ${Math.min(100, dmgPct)}%"></div></div>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">ROF</span>
                            <div class="stat-track"><div class="stat-bar" style="width: ${Math.min(100, spdPct)}%"></div></div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    },

    createActionCard: function(parent, rarity, title, desc, btnText, btnColorClass, delay, onClick, disabled=false) {
        const div = document.createElement('div');
        div.className = `action-card rarity-${rarity} ${disabled ? 'disabled' : ''}`;
        div.style.animationDelay = `${delay}s`;
        div.innerHTML = `
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="action-title">${title}</div>
                <div class="action-desc">${desc}</div>
                <div class="action-btn ${disabled ? 'opacity-50' : btnColorClass}">${btnText}</div>
            </div>
        `;
        div.onclick = disabled ? null : onClick;
        parent.appendChild(div);
    },

    openLootbox: function(e) {
        if(e) e.stopPropagation();
        if(window.Game.totalCurrency < 1000) return;
        window.Game.totalCurrency -= 1000;
        window.Game.saveData();
        this.updateMenuUI();

        this.showLootModal('📦', 'WEAPON FOUND', (modal, card) => {
            const keys = Object.keys(window.WEAPONS);
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
        });
    },

    openSkinCrate: function(e) {
        if(e) e.stopPropagation();
        if(window.Game.totalCurrency < 5000) return;
        window.Game.totalCurrency -= 5000;
        window.Game.saveData();
        this.updateMenuUI();

        this.showLootModal('🎨', 'COSMETIC UNLOCKED', (modal, card) => {
             const skins = window.GAME_DATA.skins;
             const skin = skins[Math.floor(Math.random() * skins.length)];
             skin.unlocked = true;
             window.GAME_DATA.currentSkin = skin.id;
             window.Game.saveData();
 
             modal.querySelector('#reward-name').innerText = skin.name;
             modal.querySelector('#reward-name').style.color = skin.color;
             card.classList.add('show');
        });
    },

    showLootModal: function(icon, title, onReveal) {
        const modal = document.createElement('div');
        modal.className = 'lootbox-modal active';
        modal.innerHTML = `
            <div class="crate-container">
                <div class="crate" id="crate-box">${icon}</div>
                <div class="reward-card" id="reward-card">
                    <div class="text-sm font-bold uppercase mb-2 text-slate-400" id="reward-rarity">${title}</div>
                    <div class="text-3xl font-bold text-white mb-4" id="reward-name"></div>
                    <button class="modern-btn" style="margin:20px auto 0;" onclick="this.closest('.lootbox-modal').remove(); window.UI.updateMenuUI();">COLLECT</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const crate = modal.querySelector('#crate-box');
        const card = modal.querySelector('#reward-card');
        
        crate.classList.add('shake');
        window.AudioSys.play('square', 100, 0.1); 
        
        setTimeout(() => {
            crate.classList.remove('shake'); 
            crate.classList.add('open');
            window.AudioSys.play('sine', 800, 0.5);
            onReveal(modal, card);
        }, 2000);
    },

    doPrestige: function() {
        if(!confirm("WARNING: RESET PROGRESS FOR +0.2x MULTIPLIER?")) return;
        window.GAME_DATA.multipliers.xp += 0.2;
        window.GAME_DATA.multipliers.gold += 0.2;
        window.GAME_DATA.prestigeLevel++;
        window.Game.totalCurrency = 0;
        window.Game.unlockedWeapons = ['rifle'];
        window.Game.saveData();
        location.reload();
    },

    generateUpgrades: function() {
        const container = document.getElementById('upgrade-container');
        container.innerHTML = '';
        document.getElementById('upgrade-screen').classList.remove('hidden');
        
        let pool = window.UPGRADES_DB.filter(u => {
            if(u.minWave && window.Game.wave < u.minWave) return false;
            if(u.req && !window.Game.player[u.req]) return false;
            const currentLvl = window.Game.player.upgradeLevels[u.id] || 0;
            if(currentLvl >= u.max) return false;
            return true;
        });

        const selected = [];
        for(let i=0; i<3; i++) {
            if(pool.length === 0) break;
            let totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
            let rand = Math.random() * totalWeight;
            let item = null;
            for(let u of pool) {
                if(rand < u.weight) { item = u; break; }
                rand -= u.weight;
            }
            if(item) { selected.push(item); pool = pool.filter(u => u !== item); }
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
                if(upg.type === 'stat') window.Game.player[upg.stat] *= upg.val;
                else if (upg.type === 'add') window.Game.player[upg.stat] += upg.val;
                else if (upg.type === 'heal') { window.Game.player.maxHp += upg.val; window.Game.player.hp += upg.val; }
                else if (upg.type === 'bool') window.Game.player[upg.stat] = true;
                else if (upg.type === 'complex') upg.apply(window.Game.player);
                
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
        
        // Streak Card Logic
        let streakCard = document.getElementById('kill-streak-card');
        if(!streakCard) {
            streakCard = document.createElement('div');
            streakCard.id = 'kill-streak-card';
            streakCard.className = 'kill-streak-card glass-panel';
            document.getElementById('ui-layer').appendChild(streakCard);
        }

        if(window.Game.killStreak > 4) {
            streakCard.innerText = `${window.Game.killStreak} KILL STREAK`;
            streakCard.classList.add('active');
        } else {
             streakCard.classList.remove('active');
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