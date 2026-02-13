window.UI = {
    // --- TAB NAVIGATION ---
    switchTab: function(tabName) {
        // Update Buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-btn[onclick*="${tabName}"]`);
        if(activeBtn) activeBtn.classList.add('active');

        // Update Tabs
        document.querySelectorAll('.menu-tab').forEach(tab => tab.classList.remove('active'));
        const activeTab = document.getElementById(`tab-${tabName}`);
        if(activeTab) activeTab.classList.add('active');

        // Refresh data if entering loadout
        if(tabName === 'loadout') this.updateMenuUI();
    },

    // --- MAIN MENU UPDATE ---
    updateMenuUI: function() {
        const creditsEl = document.getElementById('menu-credits');
        if(creditsEl) creditsEl.innerText = window.Game.totalCurrency.toLocaleString();

        const statsEl = document.getElementById('menu-stats');
        if(statsEl && window.GAME_DATA) {
             statsEl.innerHTML = `
                <div class="stat-pill"><span class="label">XP</span> <span class="val text-indigo-400">x${window.GAME_DATA.multipliers.xp.toFixed(1)}</span></div>
                <div class="stat-pill"><span class="label">GOLD</span> <span class="val text-yellow-400">x${window.GAME_DATA.multipliers.gold.toFixed(1)}</span></div>
             `;
        }
        
        const grid = document.getElementById('weapon-grid');
        const actions = document.getElementById('loadout-actions');
        
        if(!grid || !actions) return;
        
        grid.innerHTML = '';
        actions.innerHTML = ''; 

        // --- ACTIONS SECTION ---
        
        // Prestige Button (Only if rich enough)
        if(window.Game.totalCurrency > 50000) {
            this.createActionCard(actions, 'legendary', 'PRESTIGE', 'Reset everything for better bonuses.', 'RESET', () => window.UI.doPrestige());
        }

        // Cosmetic Crate
        const canBuySkin = window.Game.totalCurrency >= 5000;
        this.createActionCard(actions, 'epic', 'SKINS', 'Unlock new looks.', canBuySkin ? '$5,000' : 'LOCKED', (e) => window.UI.openSkinCrate(e), !canBuySkin);

        // Armory Crate
        const canBuyWep = window.Game.totalCurrency >= 1000;
        this.createActionCard(actions, 'rare', 'WEAPON CRATE', 'Get a random weapon.', canBuyWep ? '$1,000' : 'LOCKED', (e) => window.UI.openLootbox(e), !canBuyWep);

        // --- WEAPONS GRID ---
        if(window.WEAPONS) {
            Object.keys(window.WEAPONS).forEach(key => {
                // Only show unlocked weapons in the grid
                if(!window.Game.unlockedWeapons.includes(key)) return; 
                
                const w = window.WEAPONS[key];
                const isSelected = window.Game.currentLoadout === key;
                
                const card = document.createElement('div');
                card.className = `weapon-card rarity-${w.rarity} ${isSelected ? 'selected' : ''}`;
                card.onclick = () => { 
                    window.Game.currentLoadout = key; 
                    window.UI.updateMenuUI(); 
                    if(window.AudioSys) window.AudioSys.play('sine', 400, 0.1);
                };

                const dmgPct = (w.damage/50)*100;
                const spdPct = (15/w.cooldown)*100;

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div class="text-xl font-bold text-white leading-none">${w.name}</div>
                        <div class="text-[10px] font-bold uppercase tracking-widest opacity-60">${w.rarity}</div>
                    </div>
                    <div class="text-xs text-slate-400 mb-4 h-8 leading-tight">${w.desc}</div>
                    
                    <div class="stat-row">
                        <span class="stat-label">DMG</span>
                        <div class="stat-track"><div class="stat-bar" style="width: ${Math.min(100, dmgPct)}%"></div></div>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">SPD</span>
                        <div class="stat-track"><div class="stat-bar" style="width: ${Math.min(100, spdPct)}%"></div></div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    },

    createActionCard: function(parent, rarity, title, desc, btnText, onClick, disabled=false) {
        const div = document.createElement('div');
        div.className = `action-card rarity-${rarity}`;
        div.innerHTML = `
            <div>
                <div class="action-title">${title}</div>
                <div class="action-desc mt-1">${desc}</div>
            </div>
            <div class="action-btn ${disabled ? 'disabled' : ''}">${btnText}</div>
        `;
        div.onclick = disabled ? null : onClick;
        parent.appendChild(div);
    },

    // --- LOOTBOX LOGIC ---
    openLootbox: function(e) {
        if(e) e.stopPropagation();
        if(window.Game.totalCurrency < 1000) return;
        
        window.Game.totalCurrency -= 1000;
        window.Game.saveData();
        this.updateMenuUI();

        const modal = document.createElement('div');
        modal.className = 'lootbox-modal active';
        modal.innerHTML = `
            <div class="crate-container">
                <div class="crate" id="crate-box">📦</div>
                <div class="reward-card" id="reward-card">
                    <div class="text-sm font-bold uppercase mb-2 text-slate-400" id="reward-rarity"></div>
                    <div class="text-3xl font-bold text-white mb-4" id="reward-name"></div>
                    <button class="modern-btn" onclick="this.closest('.lootbox-modal').remove(); window.UI.updateMenuUI();">
                        <span class="btn-text">COLLECT</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const crate = modal.querySelector('#crate-box');
        const card = modal.querySelector('#reward-card');
        
        crate.classList.add('shake');
        if(window.AudioSys) window.AudioSys.play('square', 100, 0.1); 
        
        setTimeout(() => {
            crate.classList.remove('shake'); 
            crate.classList.add('open');
            if(window.AudioSys) window.AudioSys.play('sine', 800, 0.5);
            
            // Weighted Random Weapon
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
                window.Game.unlockedWeapons.push(key); 
                window.Game.saveData();
            }
            
            modal.querySelector('#reward-rarity').innerText = w.rarity;
            modal.querySelector('#reward-rarity').className = `text-sm font-bold uppercase mb-2 text-${w.rarity}`;
            modal.querySelector('#reward-name').innerText = w.name;
            
            card.classList.add('show');
        }, 2000);
    },

    openSkinCrate: function(e) {
        if(e) e.stopPropagation();
        if(window.Game.totalCurrency < 5000) return;
        
        window.Game.totalCurrency -= 5000;
        window.Game.saveData();
        this.updateMenuUI();

        const modal = document.createElement('div');
        modal.className = 'lootbox-modal active';
        modal.innerHTML = `
            <div class="crate-container">
                <div class="crate" id="crate-box" style="border-color:#d946ef; font-size:6rem;">🎨</div>
                <div class="reward-card" id="reward-card">
                    <div class="text-sm font-bold uppercase mb-2 text-fuchsia-400">NEW SKIN UNLOCKED</div>
                    <div class="text-3xl font-bold text-white mb-4" id="reward-name"></div>
                    <button class="modern-btn" onclick="this.closest('.lootbox-modal').remove(); window.UI.updateMenuUI();">
                        <span class="btn-text">EQUIP</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const crate = modal.querySelector('#crate-box');
        const card = modal.querySelector('#reward-card');
        
        crate.classList.add('shake');
        if(window.AudioSys) window.AudioSys.play('square', 100, 0.1); 
        
        setTimeout(() => {
            crate.classList.remove('shake'); 
            crate.classList.add('open');
            if(window.AudioSys) window.AudioSys.play('sine', 1000, 0.5);
            
            const skins = window.GAME_DATA.skins;
            const skin = skins[Math.floor(Math.random() * skins.length)];
            
            skin.unlocked = true;
            window.GAME_DATA.currentSkin = skin.id;
            window.Game.saveData();

            modal.querySelector('#reward-name').innerText = skin.name;
            modal.querySelector('#reward-name').style.color = skin.color;
            card.classList.add('show');
        }, 2000);
    },

    doPrestige: function() {
        if(!confirm("Are you sure? This resets your progress but gives you +0.2x bonus to XP and gold.")) return;
        
        window.GAME_DATA.multipliers.xp += 0.2;
        window.GAME_DATA.multipliers.gold += 0.2;
        window.GAME_DATA.prestigeLevel++;
        
        // Reset Progress
        window.Game.totalCurrency = 0;
        window.Game.unlockedWeapons = ['rifle'];
        
        window.Game.saveData();
        location.reload();
    },

    // --- Upgrade Icons Map ---
    upgradeIcons: {
        dmg: '⚔️', rate: '🔥', speed: '👟', hp: '❤️', mag: '🧲',
        pierce: '🏹', multi: '🎯', regen: '💚', crit: '💥', backshot: '↩️',
        bounce: '🔄', homing: '🎯', explode: '💣', dash_nova: '💨', vamp: '🩸',
        tesla: '⚡', freeze: '❄️', god_mode: '🛡️', black_hole: '🌀',
        chain_lightning: '⛓️', shatter: '💎', cluster: '🧨',
        dash_cd: '⏱️', luck: '🍀', greed: '💰',
        executioner: '🗡️', rage: '😤', ghost: '👻',
        sniper_training: '🎯', spray_pray: '🌪️',
        orbitals: '🪐', split_shot: '🔱', rear_guard: '🛡️',
        time_warp: '⏳', clone: '👥', nuke: '☢️', blood_pact: '🩸'
    },

    // --- IN-GAME UPGRADES ---
    generateUpgrades: function() {
        const container = document.getElementById('upgrade-container');
        container.innerHTML = '';
        document.getElementById('upgrade-screen').classList.remove('hidden');
        
        // Filter Pool
        let pool = window.UPGRADES_DB.filter(u => {
            if(u.minWave && window.Game.wave < u.minWave) return false;
            if(u.req && !window.Game.player[u.req]) return false;
            const currentLvl = window.Game.player.upgradeLevels[u.id] || 0;
            if(currentLvl >= u.max) return false;
            return true;
        });

        // Pick 3 Weighted Options
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
            if(item) {
                selected.push(item);
                pool = pool.filter(u => u !== item);
            }
        }

        selected.forEach((upg, idx) => {
            const currentLvl = window.Game.player.upgradeLevels[upg.id] || 0;
            const icon = this.upgradeIcons[upg.id] || '✨';
            
            // Build level dots
            let dotsHTML = '';
            for(let d = 0; d < upg.max; d++) {
                dotsHTML += `<div class="upgrade-level-dot ${d < currentLvl ? 'filled' : ''} ${d === currentLvl ? 'filled' : ''}"></div>`;
            }

            const el = document.createElement('div');
            el.className = `upgrade-card rarity-${upg.rarity}`;
            el.style.animationDelay = `${0.1 + idx * 0.1}s`;
            el.style.animation = `upgradeCardAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`;
            el.style.opacity = '0';
            el.style.animationDelay = `${0.15 + idx * 0.12}s`;

            el.innerHTML = `
                <div class="upgrade-icon">${icon}</div>
                <div class="upgrade-rarity">${upg.rarity}</div>
                <div class="upgrade-name">${upg.name}</div>
                <div class="upgrade-desc">${upg.desc}</div>
                <div class="upgrade-level">
                    <span>Lv ${currentLvl + 1} / ${upg.max}</span>
                    <div class="upgrade-level-dots">${dotsHTML}</div>
                </div>
            `;

            el.onclick = () => {
                // Apply Effect
                if(upg.type === 'stat') window.Game.player[upg.stat] *= upg.val;
                else if (upg.type === 'add') window.Game.player[upg.stat] += upg.val;
                else if (upg.type === 'heal') { window.Game.player.maxHp += upg.val; window.Game.player.hp += upg.val; }
                else if (upg.type === 'bool') window.Game.player[upg.stat] = true;
                else if (upg.type === 'complex') upg.apply(window.Game.player);
                
                // Track Level
                if(!window.Game.player.upgradeLevels[upg.id]) window.Game.player.upgradeLevels[upg.id] = 0;
                window.Game.player.upgradeLevels[upg.id]++;

                document.getElementById('upgrade-screen').classList.add('hidden');
                window.Game.gameState = 'PLAYING'; 
                window.Game.loop();
            };
            container.appendChild(el);
        });
    },

    // --- IN-GAME HUD ---
    updateHud: function() {
        if (!window.Game.player) return;
        
        // Health Bar
        const hpPct = Math.max(0, (window.Game.player.hp/window.Game.player.maxHp)*100);
        document.getElementById('health-bar').style.width = hpPct + '%';
        document.getElementById('hp-text').innerText = `${Math.ceil(window.Game.player.hp)}/${Math.ceil(window.Game.player.maxHp)}`;
        
        // XP Bar
        const xpPct = (window.Game.currentXp/window.Game.xpNeeded)*100;
        document.getElementById('xp-bar').style.width = xpPct + '%';
        document.getElementById('level-display').innerText = window.Game.level;

        // Boss HUD Visibility Logic
        const bossHud = document.getElementById('boss-hud');
        if(window.Game.bossActive) {
            bossHud.classList.add('active'); 
            const boss = window.Game.enemies.find(e => e.type === 'boss');
            if(boss) {
                const bossPct = (boss.hp / boss.maxHp) * 100;
                document.getElementById('boss-hp-bar').style.width = bossPct + '%';
            }
        } else {
            bossHud.classList.remove('active'); 
        }
    },

    gameOver: function() {
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = window.Game.score.toLocaleString();
        document.getElementById('earned-credits').innerText = "+" + window.Game.sessionCredits.toLocaleString();
    }
};