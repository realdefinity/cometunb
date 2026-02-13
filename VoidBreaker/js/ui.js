window.UI = {
    // --- TAB NAVIGATION ---
    switchTab: function(tabName) {
        // Update Nav Buttons
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update Tabs - Fade transition
        document.querySelectorAll('.content-tab').forEach(tab => {
            if (tab.id === `tab-${tabName}`) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Refresh data if entering loadout
        if (tabName === 'loadout') this.updateMenuUI();
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
        const equippedCard = document.getElementById('loadout-equipped-card');
        const armoryCount = document.getElementById('armory-count');
        
        if(!grid || !actions) return;
        
        grid.innerHTML = '';
        actions.innerHTML = '';

        // --- EQUIPPED PREVIEW ---
        if (equippedCard && window.WEAPONS) {
            const w = window.WEAPONS[window.Game.currentLoadout];
            if (w) {
                const dmgPct = (w.damage/50)*100;
                const spdPct = (15/w.cooldown)*100;
                // equippedCard.className = `equipped-card-display rarity-${w.rarity}`; // Keeps ID styling, add rarity class if needed
                const eqLvl = window.GAME_DATA.weaponLevels?.[window.Game.currentLoadout] || 1;
                
                equippedCard.innerHTML = `
                    <div class="weapon-card-name" style="font-size: 1.5rem; margin-bottom: 2px;">${w.name} <span style="font-size: 0.5em; opacity: 0.6; vertical-align: middle;">LVL ${eqLvl}</span></div>
                    <div class="weapon-card-meta" style="margin-bottom: 16px;">
                        <span class="rarity-${w.rarity}" style="color: var(--card-color);">${w.rarity}</span>
                        <span>TYPE: RANGED</span>
                    </div>
                    
                    <div class="stat-row" style="margin-bottom: 12px;">
                        <span class="stat-label">DMG</span>
                        <div class="stat-track"><div class="stat-bar rarity-${w.rarity}" style="width: ${Math.min(100,dmgPct)}%"></div></div>
                    </div>
                    <div class="stat-row" style="margin-bottom: 20px;">
                        <span class="stat-label">SPD</span>
                        <div class="stat-track"><div class="stat-bar rarity-${w.rarity}" style="width: ${Math.min(100,spdPct)}%"></div></div>
                    </div>
                    
                    <div style="font-size: 0.85rem; color: #94a3b8; line-height: 1.5;">${w.desc}</div>
                `;
            } else {
                equippedCard.innerHTML = '<div style="opacity:0.5; text-align:center; padding: 20px;">Select a weapon</div>';
            }
        }

        // --- ACTIONS SECTION ---
        if(window.Game.totalCurrency > 50000) {
            this.createActionCard(actions, 'legendary', 'Prestige', 'Reset', () => window.UI.doPrestige());
        }
        const canBuySkin = window.Game.totalCurrency >= 5000;
        this.createActionCard(actions, 'epic', 'Skin Crate', canBuySkin ? '5,000' : 'LOCKED', (e) => window.UI.openSkinCrate(e), !canBuySkin);
        const canBuyWep = window.Game.totalCurrency >= 1000;
        this.createActionCard(actions, 'rare', 'Weapon Crate', canBuyWep ? '1,000' : 'LOCKED', (e) => window.UI.openLootbox(e), !canBuyWep);

        // --- WEAPONS GRID ---
        if(window.WEAPONS) {
            if(!window.GAME_DATA.weaponLevels) window.GAME_DATA.weaponLevels = {};
            const keys = Object.keys(window.WEAPONS);
            const unlocked = keys.filter(k => window.Game.unlockedWeapons.includes(k));
            
            if(armoryCount) armoryCount.innerText = `${unlocked.length}/${keys.length}`;

            keys.forEach(key => {
                if(!window.Game.unlockedWeapons.includes(key)) return; 
                
                const w = window.WEAPONS[key];
                const isSelected = window.Game.currentLoadout === key;
                const lvl = window.GAME_DATA.weaponLevels[key] || 1;
                const upgradeCost = 500 * lvl;
                const canUpgrade = lvl < 10 && window.Game.totalCurrency >= upgradeCost;
                
                const card = document.createElement('div');
                card.className = `weapon-card rarity-${w.rarity} ${isSelected ? 'selected' : ''}`;
                card.onclick = (e) => { 
                    if(e.target.closest('.weapon-upgrade-btn')) return;
                    window.Game.currentLoadout = key; 
                    window.UI.updateMenuUI(); 
                    if(window.AudioSys) window.AudioSys.play('sine', 400, 0.1);
                };

                const dmgPct = (w.damage/50)*100;
                const spdPct = (15/w.cooldown)*100;

                card.innerHTML = `
                    <div class="weapon-card-name">${w.name}</div>
                    <div class="weapon-card-meta">
                        <span>${w.rarity}</span>
                        <span>LVL ${lvl}</span>
                    </div>
                    
                    <div class="stat-row">
                        <span class="stat-label">DMG</span>
                        <div class="stat-track"><div class="stat-bar" style="width: ${Math.min(100, dmgPct)}%"></div></div>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">SPD</span>
                        <div class="stat-track"><div class="stat-bar" style="width: ${Math.min(100, spdPct)}%"></div></div>
                    </div>
                    
                    ${lvl < 10 ? `
                    <button class="weapon-upgrade-btn ${canUpgrade ? '' : 'disabled'}" ${canUpgrade ? '' : 'disabled'}>
                        UPGRADE <span style="opacity:0.7">$${upgradeCost}</span>
                    </button>
                    ` : '<div class="weapon-maxed">MAX LEVEL</div>'}
                `;
                
                const upgradeBtn = card.querySelector('.weapon-upgrade-btn');
                if(upgradeBtn && canUpgrade) {
                    upgradeBtn.onclick = (e) => {
                        e.stopPropagation();
                        window.Game.totalCurrency -= upgradeCost;
                        window.GAME_DATA.weaponLevels[key] = (window.GAME_DATA.weaponLevels[key] || 1) + 1;
                        window.Game.saveData();
                        window.UI.updateMenuUI();
                        if(window.AudioSys) window.AudioSys.play('sine', 600, 0.15);
                    };
                }
                grid.appendChild(card);
            });
        }
    },

    createActionCard: function(parent, rarity, title, btnText, onClick, disabled=false) {
        const div = document.createElement('div');
        div.className = `action-card rarity-${rarity}`;
        div.innerHTML = `
            <div class="action-title">${title}</div>
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
            
            const rarityColors = { common: '#94a3b8', rare: '#38bdf8', epic: '#a855f7', legendary: '#fbbf24' };
            modal.querySelector('#reward-rarity').innerText = w.rarity;
            modal.querySelector('#reward-rarity').style.color = rarityColors[w.rarity] || '#94a3b8';
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
                    <div class="text-sm font-bold uppercase mb-2 text-fuchsia-400">COSMETIC UNLOCKED</div>
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
        if(!confirm("Reset everything for +20% bonus to XP and Gold?")) return;
        
        window.GAME_DATA.multipliers.xp += 0.2;
        window.GAME_DATA.multipliers.gold += 0.2;
        window.GAME_DATA.prestigeLevel++;
        
        // Reset Progress
        window.Game.totalCurrency = 0;
        window.Game.unlockedWeapons = ['rifle'];
        
        window.Game.saveData();
        location.reload();
    },

    // --- IN-GAME UPGRADES ---
    generateUpgrades: function() {
        const container = document.getElementById('upgrade-container');
        container.innerHTML = '';
        document.getElementById('upgrade-screen').classList.remove('hidden');
        
        const icons = {
            dmg: '💥', rate: '⏩', speed: '👟', hp: '❤️', mag: '🧲',
            pierce: '🏹', multi: '🥢', regen: '🩹', crit: '🎯', backshot: '🔙',
            bounce: '🎱', homing: '🧠', explode: '💣', dash_nova: '💨',
            vamp: '🩸', tesla: '⚡', freeze: '❄️', god_mode: '🛡️',
            black_hole: '⚫', chain_lightning: '⛓️', shatter: '🧊', cluster: '🧨',
            dash_cd: '⏱️', luck: '🍀', greed: '💰', executioner: '☠️', rage: '😡',
            ghost: '👻', sniper_training: '🔭', spray_pray: '🔫', orbitals: '🪐',
            split_shot: '🔱', rear_guard: '🔙', time_warp: '⏳', clone: '👥',
            nuke: '☢️', blood_pact: '🩸'
        };

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

        selected.forEach(upg => {
            const currentLvl = window.Game.player.upgradeLevels[upg.id] || 0;
            const el = document.createElement('div');
            el.className = `upgrade-card rarity-${upg.rarity}`;
            el.innerHTML = `
                <div class="upgrade-card-header">
                    <span class="upgrade-rarity">${upg.rarity}</span>
                    <span class="upgrade-level">Lv.${currentLvl} &rarr; ${currentLvl+1}</span>
                </div>
                <div class="upgrade-icon">${icons[upg.id] || '✨'}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upg.name}</div>
                    <div class="upgrade-desc">${upg.desc}</div>
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
        
        const scoreEl = document.getElementById('scoreDisplay');
        if(scoreEl) scoreEl.innerText = window.Game.score.toLocaleString();
        
        // Health Bar
        const hpPct = Math.max(0, (window.Game.player.hp/window.Game.player.maxHp)*100);
        const healthBar = document.getElementById('health-bar');
        const hpText = document.getElementById('hp-text');
        if (healthBar) healthBar.style.width = hpPct + '%';
        if (hpText) hpText.innerText = `${Math.ceil(window.Game.player.hp)}/${Math.ceil(window.Game.player.maxHp)}`;
        
        // XP Bar
        const xpPct = (window.Game.currentXp/window.Game.xpNeeded)*100;
        const xpBar = document.getElementById('xp-bar');
        const levelDisplay = document.getElementById('level-display');
        if (xpBar) xpBar.style.width = xpPct + '%';
        if (levelDisplay) levelDisplay.innerText = window.Game.level;
        
        // Boss HUD Visibility Logic
        const bossHud = document.getElementById('boss-hud');
        if(bossHud && window.Game.bossActive) {
            bossHud.classList.add('active'); 
            const boss = window.Game.enemies.find(e => e.type === 'boss');
            if(boss) {
                const bossPct = (boss.hp / boss.maxHp) * 100;
                const bossHpBar = document.getElementById('boss-hp-bar');
                if (bossHpBar) bossHpBar.style.width = bossPct + '%';
            }
        } else if (bossHud) {
            bossHud.classList.remove('active'); 
        }
    },

    gameOver: function() {
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = window.Game.score.toLocaleString();
        const earned = window.Game.lastAwardedGold ?? window.Game.sessionCredits;
        document.getElementById('earned-credits').innerText = "+" + earned.toLocaleString();
    }
};