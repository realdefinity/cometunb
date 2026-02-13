window.Game = {
    canvas: null, ctx: null, width: 0, height: 0,
    gameState: 'MENU', currentLoadout: 'rifle',
    score: 0, frameCount: 0, sessionCredits: 0,
    
    // Wave System
    wave: 1, waveEnemiesTotal: 0, waveEnemiesSpawned: 0,
    bossActive: false,
    
    enemies: [], bullets: [], enemyBullets: [], particles: [], textPopups: [], xpOrbs: [], stars: [],
    player: null, level: 1, currentXp: 0, xpNeeded: 100,
    
    shake: { val: 0, add: (v) => window.Game.shake.val = Math.min(30, window.Game.shake.val + v) },
    totalCurrency: 0, unlockedWeapons: ['rifle'],

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.resize();
        window.addEventListener('resize', () => this.resize());
        for(let i=0; i<100; i++) this.stars.push({x:Math.random()*this.width, y:Math.random()*this.height, z:Math.random()*2});
        this.loadData();
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        if(this.canvas) { this.canvas.width = this.width; this.canvas.height = this.height; }
    },

    loadData() {
        try {
            const c = localStorage.getItem('void_breaker_currency');
            const w = localStorage.getItem('void_breaker_unlocks');
            const g = localStorage.getItem('void_breaker_gamedata');
            if(c) this.totalCurrency = parseInt(c);
            if(w) this.unlockedWeapons = JSON.parse(w);
            if(g) window.GAME_DATA = { ...window.GAME_DATA, ...JSON.parse(g) };
            
            // Safety Check: Ensure valid loadout
            if(!this.unlockedWeapons.includes(this.currentLoadout)) this.currentLoadout = 'rifle';
        } catch(e) { console.warn('Save file corrupted, resetting basics.'); }
        
        if(window.UI && window.UI.updateMenuUI) window.UI.updateMenuUI();
    },

    saveData() {
        localStorage.setItem('void_breaker_currency', this.totalCurrency);
        localStorage.setItem('void_breaker_unlocks', JSON.stringify(this.unlockedWeapons));
        localStorage.setItem('void_breaker_gamedata', JSON.stringify(window.GAME_DATA));
    },

    startGame() {
        this.player = new Player(this.currentLoadout);
        this.enemies=[]; this.bullets=[]; this.enemyBullets=[]; this.particles=[]; this.xpOrbs=[]; this.textPopups=[];
        this.score=0; this.sessionCredits=0; this.level=1; this.currentXp=0; this.xpNeeded=100; this.frameCount=0;
        this.wave=1; this.bossActive=false;
        
        this.startWave();
        this.gameState = 'PLAYING';
        if(window.UI) window.UI.updateHud();
        this.loop();
    },

    startWave() {
        this.waveEnemiesTotal = Math.floor(12 + this.wave * 2.5);
        this.waveEnemiesSpawned = 0;
        const disp = document.getElementById('wave-display');
        if(disp) disp.innerText = `ROUND ${this.wave}`;
        this.createPopup(this.width/2, this.height/3, `ROUND ${this.wave}`, '#fbbf24', 40);
    },

    loop() {
        if(this.gameState !== 'PLAYING') return;
        requestAnimationFrame(() => this.loop());
        
        this.frameCount++;
        this.manageWaves();
        
        this.shake.val = Math.max(0, this.shake.val * 0.9);

        this.ctx.fillStyle = '#020617'; this.ctx.fillRect(0,0,this.width,this.height);
        
        this.ctx.save();
        this.ctx.translate((Math.random()-0.5)*this.shake.val, (Math.random()-0.5)*this.shake.val);
        this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
        this.stars.forEach(s => { this.ctx.fillRect(s.x, s.y, s.z, s.z); });

        this.player.update(); this.player.draw(this.ctx);

        this.enemies = this.enemies.filter(e => { e.update(); e.draw(this.ctx); return !e.marked; });
        this.bullets = this.bullets.filter(b => { 
            b.update(); b.draw(this.ctx);
            if(b.life > 0 && b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height && !b.ricochet) {
                for(let e of this.enemies) {
                    if(b.hitList.includes(e.id)) continue;
                    if(Math.hypot(b.x - e.x, b.y - e.y) < e.r + 5) {
                        const isCrit = Math.random() < this.player.critChance;
                        const dmg = (isCrit ? b.damage * this.player.critMult : b.damage) * (window.GAME_DATA.multipliers.damage || 1);
                        e.takeDamage(dmg, isCrit, this.player.freeze);
                        b.hitList.push(e.id);
                        this.createExplosion(b.x, b.y, 3, b.color);
                        if(b.pierce <= 0) { b.life = 0; break; }
                        b.pierce--;
                    }
                }
            } else if (b.ricochet && b.life > 0) {
                for(let e of this.enemies) {
                    if(b.hitList.includes(e.id)) continue;
                    if(Math.hypot(b.x - e.x, b.y - e.y) < e.r + 5) {
                        e.takeDamage(b.damage, false, this.player.freeze); b.hitList.push(e.id); b.life = 0; break;
                    }
                }
            }
            return b.life > 0;
        });
        
        this.enemyBullets = this.enemyBullets.filter(b => {
            b.x += b.vx; b.y += b.vy; b.life--;
            this.ctx.save();
            this.ctx.shadowBlur=5; this.ctx.shadowColor=b.color; this.ctx.fillStyle=b.color;
            this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.r || 4, 0, Math.PI*2); this.ctx.fill(); 
            this.ctx.restore();
            if(Math.hypot(b.x-this.player.x, b.y-this.player.y) < (b.r || 4) + 10) { this.player.takeDamage(10); return false; }
            return b.life > 0;
        });

        this.xpOrbs = this.xpOrbs.filter(x => {
            const dx = this.player.x - x.x;
            const dy = this.player.y - x.y;
            const dist = Math.hypot(dx, dy);
            
            // Magnet
            if(dist < this.player.pickupRange) { 
                x.x += dx * 0.08; 
                x.y += dy * 0.08; 
            }
            
            // Pickup
            if(dist < 20) { 
                this.gainXP(x.amt); 
                this.createPopup(this.player.x, this.player.y - 20, `+${x.amt}`, x.color, 12);
                return false; 
            }
            
            // Physics
            x.x += x.vx; x.y += x.vy; 
            x.vx *= 0.94; x.vy *= 0.94; 
            x.life--;
            
            // Draw
            this.ctx.save();
            this.ctx.shadowBlur = x.glow; 
            this.ctx.shadowColor = x.color; 
            this.ctx.fillStyle = x.color;
            this.ctx.beginPath(); 
            this.ctx.arc(x.x, x.y, x.r, 0, Math.PI*2); 
            this.ctx.fill();
            this.ctx.restore();
            
            return x.life > 0;
        });

        this.particles = this.particles.filter(p => { p.update(); p.draw(this.ctx); return p.life > 0; });
        this.textPopups = this.textPopups.filter(t => {
            t.y += t.vy; t.life--;
            this.ctx.font = `900 ${t.size}px Outfit`; this.ctx.fillStyle = t.color;
            this.ctx.strokeStyle = 'black'; this.ctx.lineWidth = 2;
            this.ctx.strokeText(t.text, t.x, t.y); this.ctx.fillText(t.text, t.x, t.y);
            return t.life > 0;
        });

        this.ctx.restore();
        const dashPct = Math.min(100, (1 - (this.player.dashCd/this.player.dashCdMax))*100);
        const dashEl = document.getElementById('dash-cooldown');
        if(dashEl) dashEl.style.height = (100 - dashPct) + '%';
        window.UI.updateHud();
    },

    manageWaves() {
        if(this.bossActive) return;
        if(this.waveEnemiesSpawned >= this.waveEnemiesTotal && this.enemies.length === 0) {
            const rewardXP = this.wave * 100;
            this.spawnXP(this.player.x, this.player.y - 60, rewardXP); // Use spawnXP helper
            this.createPopup(this.player.x, this.player.y - 80, `ROUND CLEAR!`, '#fbbf24', 24);
            this.wave++;
            if(this.wave % 5 === 0) {
                this.bossActive = true;
                this.enemies.push(new Enemy('boss', 2 + this.wave * 0.2));
                window.AudioSys.bossWarn();
                return;
            }
            this.startWave();
            return;
        }

        if(this.waveEnemiesSpawned < this.waveEnemiesTotal) {
            const spawnRate = Math.max(10, 60 - this.wave * 3);
            if(this.frameCount % spawnRate === 0) {
                const r = Math.random();
                let type = 'basic';
                
                // Progressive Difficulty Spawn Logic
                if(this.wave >= 2 && r > 0.6) type = 'dasher';
                if(this.wave >= 3 && r > 0.7) type = 'shooter';
                if(this.wave >= 4 && r > 0.75) type = 'heavy';
                if(this.wave >= 5 && r > 0.8) type = 'charger';
                if(this.wave >= 5 && r > 0.82) type = 'swarmer'; // Added back
                if(this.wave >= 6 && r > 0.85) type = 'sniper';
                if(this.wave >= 7 && r > 0.88) type = 'snake';
                if(this.wave >= 8 && r > 0.9) type = 'orbiter';
                if(this.wave >= 9 && r > 0.92) type = 'kamikaze';
                if(this.wave >= 10 && r > 0.94) type = 'teleporter';
                if(this.wave >= 12 && r > 0.95) type = 'carrier';
                if(this.wave >= 15 && r > 0.97) type = 'summoner';
                if(this.wave >= 20 && r > 0.98) type = 'tank';

                if(type === 'swarmer') {
                    for(let i=0; i<3; i++) { this.enemies.push(new Enemy('swarmer', 1 + this.wave * 0.1)); this.waveEnemiesSpawned++; }
                } else {
                    this.enemies.push(new Enemy(type, 1 + this.wave * 0.1));
                    this.waveEnemiesSpawned++;
                }
            }
        }
    },

    checkLevelUp() {
        if(this.currentXp >= this.xpNeeded) {
            this.currentXp -= this.xpNeeded; this.level++; 
            this.xpNeeded = Math.floor(this.xpNeeded * 1.3);
            this.gameState = 'UPGRADE'; 
            window.UI.generateUpgrades(); 
            window.AudioSys.levelUp();
        }
        window.UI.updateHud();
    },

    spawnXP(x, y, rawAmt) {
        const mult = window.GAME_DATA.multipliers.xp || 1.0;
        const amt = Math.ceil(rawAmt * mult);
        
        let color = '#22d3ee'; // Cyan (Common)
        let r = 3;
        let glow = 5;

        // Color coding based on amount
        if (amt >= 250) { color = '#c084fc'; r = 6; glow = 15; }      // Purple (Epic)
        else if (amt >= 100) { color = '#fb923c'; r = 5; glow = 12; } // Orange (Rare)
        else if (amt >= 25) { color = '#a3e635'; r = 4; glow = 8; }   // Lime (Uncommon)

        // Explosion scatter effect
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        
        this.xpOrbs.push({
            x: x, y: y, 
            vx: Math.cos(angle) * speed, 
            vy: Math.sin(angle) * speed,
            amt: amt, 
            color: color, 
            r: r,
            glow: glow,
            life: 1200 // 20 seconds
        });
    },

    gainXP(amt) {
        this.currentXp += amt;
        this.checkLevelUp();
        window.AudioSys.xp(Math.min(1000, amt * 2));
    },

    createExplosion(x, y, n, color) {
        for(let i=0; i<n; i++) {
            const a = Math.random()*7; const s = Math.random()*8;
            this.particles.push(new Particle(x, y, Math.cos(a)*s, Math.sin(a)*s, Math.random()*5+2, color, 40));
        }
    },
    createPopup(x, y, text, color, size=16) { this.textPopups.push({x, y, text, color, size, life: 60, vy: -2}); },
    
    gameOver() {
        this.gameState = 'GAMEOVER';
        const mult = window.GAME_DATA.multipliers.gold || 1.0;
        const finalGold = Math.floor(this.sessionCredits * mult);
        this.lastAwardedGold = finalGold;
        this.totalCurrency += finalGold;
        this.saveData();
        window.UI.gameOver();
    }
};

/* --- Classes --- */
class Player {
    constructor(weaponKey) {
        const w = window.WEAPONS[weaponKey] || window.WEAPONS['rifle'];
        const lvl = (window.GAME_DATA.weaponLevels || {})[weaponKey] || 1;
        const dmgMult = 1 + (lvl - 1) * 0.1;
        
        this.x = window.Game.width/2; this.y = window.Game.height/2;
        this.vel = {x:0, y:0}; this.angle = 0;
        this.maxHp = 100; this.hp = 100; this.regen = 0; this.maxSpeed = 5; this.acc = 0.8; this.drag = 0.9;
        
        this.weaponKey = weaponKey; this.damage = Math.floor(w.damage * dmgMult); this.maxCooldown = w.cooldown;
        this.bulletSpeed = w.speed; this.spread = w.spread; this.count = w.count; this.pierce = w.pierce;
        this.bulletColor = w.color;
        
        this.upgradeLevels = {}; 
        this.cooldown = 0; this.critChance = 0.05; this.critMult = 1.5; this.lifesteal = 0; 
        this.dodge = 0; this.pickupRange = 100;
        
        this.ricochet = false; this.homing = false; this.explosive = false; 
        this.tesla = false; this.freeze = false; this.backshot = false; 
        this.dashNova = false; this.cluster = false; this.shatter = false;
        this.blackHole = false;

        // New Upgrades
        this.luck = 0; this.goldMult = 1.0; 
        this.executioner = false; this.rage = false; this.dodgeChance = 0;
        this.orbitals = 0; this.orbitalAngle = 0;
        this.splitShot = false; this.rearGuard = false; 
        this.clone = false; this.nuke = false; this.nukeTimer = 600;

        this.teslaRange = 200; this.teslaCount = 1;
        this.dashCd = 0; this.dashCdMax = 120; this.dashing = 0; this.invuln = 0;
    }

    update() {
        if(window.Game.frameCount % 60 === 0 && this.regen > 0 && this.hp < this.maxHp) this.hp += this.regen;
        
        // Orbitals
        if(this.orbitals > 0) {
            this.orbitalAngle += 0.05;
            for(let i=0; i<this.orbitals; i++) {
                const angle = this.orbitalAngle + (Math.PI * 2 / this.orbitals) * i;
                const ox = this.x + Math.cos(angle) * 60;
                const oy = this.y + Math.sin(angle) * 60;
                
                // Orbital Damage
                window.Game.enemies.forEach(e => {
                    if(Math.hypot(e.x - ox, e.y - oy) < 20 && window.Game.frameCount % 10 === 0) {
                        e.takeDamage(this.damage * 0.5, false);
                        window.Game.createExplosion(ox, oy, 2, '#818cf8');
                    }
                });
            }
        }

        // Nuke
        if(this.nuke) {
            this.nukeTimer--;
            if(this.nukeTimer <= 0) {
                this.nukeTimer = 600; // 10s
                window.Game.createExplosion(this.x, this.y, 50, '#f43f5e');
                window.Game.enemies.forEach(e => e.takeDamage(500, true));
                window.Game.shake.add(20);
                window.AudioSys.play('noise', 100, 1, 0.5);
                window.Game.createPopup(this.x, this.y - 50, "ORBITAL STRIKE", '#f43f5e', 24);
            }
        }

        if(this.tesla && window.Game.frameCount % 30 === 0) {
            let hits = 0;
            const targets = window.Game.enemies.filter(e => Math.hypot(e.x-this.x, e.y-this.y) < this.teslaRange);
            for(let e of targets) {
                if(hits >= this.teslaCount) break;
                e.takeDamage(10, false); 
                window.Game.ctx.save();
                window.Game.ctx.strokeStyle = '#facc15'; window.Game.ctx.lineWidth = 2; window.Game.ctx.shadowBlur = 10; window.Game.ctx.shadowColor = '#facc15';
                window.Game.ctx.beginPath(); window.Game.ctx.moveTo(this.x, this.y); window.Game.ctx.lineTo(e.x, e.y); window.Game.ctx.stroke();
                window.Game.ctx.restore();
                hits++;
            }
            if(hits > 0) window.AudioSys.play('sawtooth', 800, 0.1, 0.05);
        }

        let dx = 0, dy = 0;
        if(window.keys['w'] || window.keys['ArrowUp']) dy--;
        if(window.keys['s'] || window.keys['ArrowDown']) dy++;
        if(window.keys['a'] || window.keys['ArrowLeft']) dx--;
        if(window.keys['d'] || window.keys['ArrowRight']) dx++;
        if(window.mobileInput.move.active) { dx = window.mobileInput.move.x; dy = window.mobileInput.move.y; }

        if(this.dashing > 0) {
            this.dashing--;
            if(window.Game.frameCount % 2 === 0) window.Game.particles.push(new Particle(this.x, this.y, 0, 0, 10, 'rgba(56, 189, 248, 0.4)', 15));
        } else {
            const len = Math.hypot(dx, dy);
            if(len > 1) { dx/=len; dy/=len; }
            this.vel.x += dx * this.acc; this.vel.y += dy * this.acc;
            this.vel.x *= this.drag; this.vel.y *= this.drag;
            const s = Math.hypot(this.vel.x, this.vel.y);
            if(s > this.maxSpeed) { const r = this.maxSpeed/s; this.vel.x *= r; this.vel.y *= r; }
        }

        this.x = Math.max(10, Math.min(window.Game.width-10, this.x + this.vel.x));
        this.y = Math.max(10, Math.min(window.Game.height-10, this.y + this.vel.y));

        if(window.mobileInput.aim.active) this.angle = Math.atan2(window.mobileInput.aim.y, window.mobileInput.aim.x);
        else this.angle = Math.atan2(window.mouse.y - this.y, window.mouse.x - this.x);

        if(this.dashCd > 0) this.dashCd--;
        if((window.keys[' '] || window.mobileInput.dash) && this.dashCd <= 0) this.dash();
        if(this.cooldown > 0) this.cooldown--;
        if(this.invuln > 0) this.invuln--;
        if((window.mouse.down || window.mobileInput.aim.active) && this.cooldown <= 0 && this.dashing <= 0) this.shoot();
    }
    
    // Helper to fire bullets
    fire(x, y, angle, damage, speed, pierce, color) {
         window.Game.bullets.push(new Bullet(x, y, angle, damage, speed, pierce, color, this));
    }

    dash() {
        this.dashing = 10; this.invuln = 15; this.dashCd = this.dashCdMax;
        const m = Math.hypot(this.vel.x, this.vel.y);
        const a = m > 0.1 ? Math.atan2(this.vel.y, this.vel.x) : this.angle;
        this.vel.x = Math.cos(a) * 20; this.vel.y = Math.sin(a) * 20;
        window.AudioSys.play('sine', 600, 0.2, 0.1, 100);
        if(this.dashNova) {
            window.Game.createExplosion(this.x, this.y, 12, '#38bdf8');
            window.Game.enemies.forEach(e => {
                if(Math.hypot(e.x-this.x, e.y-this.y) < 150) e.takeDamage(this.damage * 2, true);
            });
        }
    }

    shoot() {
        this.cooldown = this.maxCooldown;
        window.AudioSys.shoot(this.weaponKey);
        
        // Recoil
        this.vel.x -= Math.cos(this.angle) * 3;
        this.vel.y -= Math.sin(this.angle) * 3;
        window.Game.shake.add(2);
        
        // Muzzle Flash
        const tipX = this.x + Math.cos(this.angle) * 20;
        const tipY = this.y + Math.sin(this.angle) * 20;
        window.Game.particles.push(new Particle(tipX, tipY, 0, 0, 15, '#ffffff', 4));

        const totalArc = this.spread * (this.count > 1 ? 2 : 1);
        const startA = this.angle - totalArc/2;
        const step = this.count > 1 ? totalArc / (this.count-1) : 0;

        // Main Shot
        for(let i=0; i<this.count; i++) {
            const baseA = this.count > 1 ? startA + step*i : this.angle;
            const finalA = baseA + (Math.random()-0.5) * this.spread * 0.5; 
            this.fire(this.x + Math.cos(this.angle)*15, this.y + Math.sin(this.angle)*15, finalA, this.damage, this.bulletSpeed, this.pierce, this.bulletColor);
            
            // Clone Shot
            if(this.clone) {
                 this.fire(this.x + Math.cos(this.angle)*15 + 40, this.y + Math.sin(this.angle)*15, finalA, this.damage * 0.5, this.bulletSpeed, this.pierce, '#9ca3af');
            }
        }

        // Back Shot / Rear Guard
        if(this.backshot || this.rearGuard) {
            let count = this.rearGuard ? 3 : 1;
            let spread = this.rearGuard ? 0.3 : 0;
            for(let i=0; i<count; i++) {
                 let a = this.angle + Math.PI + (i - (count-1)/2) * spread;
                 this.fire(this.x, this.y, a, this.damage * 0.7, this.bulletSpeed, this.pierce, this.bulletColor);
            }
        }
        
        // Split Shot
        if(this.splitShot) {
             this.fire(this.x, this.y, this.angle + Math.PI/2, this.damage * 0.6, this.bulletSpeed, this.pierce, this.bulletColor);
             this.fire(this.x, this.y, this.angle - Math.PI/2, this.damage * 0.6, this.bulletSpeed, this.pierce, this.bulletColor);
        }
    }

    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); 
        
        // Draw Orbitals
        if(this.orbitals > 0) {
            for(let i=0; i<this.orbitals; i++) {
                const angle = this.orbitalAngle + (Math.PI * 2 / this.orbitals) * i;
                const ox = Math.cos(angle) * 60;
                const oy = Math.sin(angle) * 60;
                ctx.fillStyle = '#818cf8';
                ctx.shadowBlur = 10; ctx.shadowColor = '#818cf8';
                ctx.beginPath(); ctx.arc(ox, oy, 6, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        
        ctx.rotate(this.angle);
        if(this.invuln > 0 && window.Game.frameCount % 4 < 2) ctx.globalAlpha = 0.5;
        
        // Clone Effect
        if(this.clone) {
             ctx.save();
             ctx.translate(40, 0); // Offset clone
             ctx.globalAlpha = 0.4;
             ctx.fillStyle = '#9ca3af';
             ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, 10); ctx.lineTo(-8, 0); ctx.lineTo(-10, -10); ctx.fill();
             ctx.restore();
        }

        // Skin System
        const skinColor = window.GAME_DATA.skins.find(s => s.id === window.GAME_DATA.currentSkin)?.color || '#38bdf8';
        ctx.fillStyle = this.dashing > 0 ? '#38bdf8' : 'white';
        
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, 10); ctx.lineTo(-8, 0); ctx.lineTo(-10, -10); ctx.fill();
        
        // Engine Glow using Skin
        ctx.shadowBlur = 10; ctx.shadowColor = skinColor;
        ctx.fillStyle = skinColor; ctx.beginPath(); ctx.arc(-12, 0, 3 + Math.random()*2, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    takeDamage(amt) {
        if(this.invuln > 0 || this.dashing > 0) return;
        if(Math.random() < this.dodgeChance) { window.Game.createPopup(this.x, this.y - 30, "GHOST", '#cbd5e1'); return; }
        if(Math.random() < this.dodge) { window.Game.createPopup(this.x, this.y - 30, "DODGE", '#cbd5e1'); return; }
        this.hp -= amt; this.invuln = 30; window.Game.shake.add(15); window.AudioSys.hit();
        window.UI.updateHud();
        if(this.hp <= 0) window.Game.gameOver();
    }
}

class Bullet {
    constructor(x, y, angle, damage, speed, pierce, color, owner) {
        this.x=x; this.y=y; this.vx = Math.cos(angle)*speed; this.vy = Math.sin(angle)*speed;
        this.damage = damage; this.life = 80; this.pierce = pierce; this.color = color;
        this.hitList = []; this.homing = owner.homing; this.ricochet = owner.ricochet;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.life--;
        if(this.homing) {
            let nearest = null; let minD = 350;
            for(let e of window.Game.enemies) {
                const d = Math.hypot(e.x - this.x, e.y - this.y);
                if(d < minD) { minD = d; nearest = e; }
            }
            if(nearest) {
                const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                this.vx = this.vx * 0.9 + Math.cos(angle) * 2; this.vy = this.vy * 0.9 + Math.sin(angle) * 2;
                const curS = Math.hypot(this.vx, this.vy); const targetS = 14; 
                this.vx = (this.vx/curS)*targetS; this.vy = (this.vy/curS)*targetS;
            }
        }
        if(this.ricochet) {
            if(this.x < 0 || this.x > window.Game.width) { this.vx *= -1; this.x += this.vx; }
            if(this.y < 0 || this.y > window.Game.height) { this.vy *= -1; this.y += this.vy; }
        }
    }
    draw(ctx) {
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x - this.vx * 1.5, this.y - this.vy * 1.5); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI*2); ctx.fill();
    }
}

class Enemy {
    constructor(type, difficulty=1) {
        const angle = Math.random()*Math.PI*2;
        const r = Math.max(window.Game.width, window.Game.height)/2 + 50;
        this.x = window.Game.width/2 + Math.cos(angle)*r; this.y = window.Game.height/2 + Math.sin(angle)*r;
        this.type = type; this.id = Math.random(); this.marked = false; this.flash = 0;
        this.frozen = 0; this.visAngle = 0;
        
        let scale = difficulty;
        this.hp = 30 * scale; this.speed = 2; this.color = '#94a3b8'; this.r = 14;
        this.xp = 10; this.score = 50; this.credits = 1;

        if (type === 'dasher') { this.hp = 20*scale; this.speed = 4; this.color = '#facc15'; this.r = 10; }
        else if (type === 'heavy') { this.hp = 100*scale; this.speed = 1.2; this.color = '#334155'; this.r = 22; this.xp = 25; }
        else if (type === 'tank') { this.hp = 140*scale; this.speed = 1; this.color = '#ef4444'; this.r = 24; this.xp = 40; this.credits = 5; }
        else if (type === 'shooter') { 
            this.hp = 60*scale; this.speed = 1.8; this.color = '#fbbf24'; this.r = 16; 
            this.state = 'move'; this.timer = 0; this.xp = 25; this.credits = 3;
        }
        else if (type === 'orbiter') { this.hp = 40*scale; this.speed = 3; this.color = '#818cf8'; this.r = 12; this.angle = 0; }
        else if (type === 'swarmer') { this.hp = 10*scale; this.speed = 5; this.color = '#d946ef'; this.r = 8; this.xp = 5; this.credits = 0; }
        else if (type === 'sniper') { this.hp = 50*scale; this.speed = 1.5; this.color = '#22d3ee'; this.r = 14; this.xp = 30; this.timer = 0; }
        else if (type === 'kamikaze') { this.hp = 25*scale; this.speed = 2.5; this.color = '#f87171'; this.r = 12; }
        else if (type === 'carrier') { this.hp = 300*scale; this.speed = 0.8; this.color = '#64748b'; this.r = 30; this.timer = 0; this.xp = 100; }
        else if (type === 'boss') {
            this.hp = 2000 * scale; this.xp = 500; this.score = 5000; this.credits = 100; 
            this.speed = 0.5; this.color = '#a855f7'; this.r = 40; this.phase = 0; this.timer = 0;
        }
        
        // NEW TYPES
        else if (type === 'charger') { this.hp = 80*scale; this.speed = 2; this.color = '#f59e0b'; this.r = 16; this.state = 'idle'; this.timer = 60; this.chargeAngle = 0; this.xp = 35; }
        else if (type === 'snake') { this.hp = 40*scale; this.speed = 3; this.color = '#10b981'; this.r = 12; this.timer = 0; this.xp = 20; }
        else if (type === 'summoner') { this.hp = 150*scale; this.speed = 1; this.color = '#8b5cf6'; this.r = 20; this.timer = 0; this.xp = 60; }
        else if (type === 'teleporter') { this.hp = 50*scale; this.speed = 0; this.color = '#06b6d4'; this.r = 14; this.timer = 60; this.xp = 35; }

        this.maxHp = this.hp;
    }

    update() {
        if(this.flash > 0) this.flash--;
        let moveSpeed = this.speed * (window.GAME_DATA.multipliers.enemySpeed || 1.0);
        if(this.frozen > 0) { moveSpeed *= 0.5; this.frozen--; }
        
        const dx = window.Game.player.x - this.x; 
        const dy = window.Game.player.y - this.y;
        const dist = Math.hypot(dx, dy); 
        
        // Default facing: towards player
        let faceAngle = Math.atan2(dy, dx); 
        this.visAngle = faceAngle;

        // Collision Check (Don't overlap player)
        // If too close, stop moving forward, but allow other behaviors
        const minDist = this.r + 20; 
        let canMove = true;
        if(dist < minDist && this.type !== 'kamikaze' && this.type !== 'dasher') {
             canMove = false;
        }

        if(this.type === 'boss') {
            if(canMove) { this.x += Math.cos(faceAngle) * moveSpeed; this.y += Math.sin(faceAngle) * moveSpeed; }
            this.timer++;
            if(this.timer % 20 === 0) { 
                const spiral = (this.timer / 20) + (this.phase * 0.5);
                window.Game.enemyBullets.push({x:this.x, y:this.y, vx:Math.cos(spiral)*5, vy:Math.sin(spiral)*5, life:120, r:6, color:'#a855f7'});
                window.Game.enemyBullets.push({x:this.x, y:this.y, vx:Math.cos(spiral+Math.PI)*5, vy:Math.sin(spiral+Math.PI)*5, life:120, r:6, color:'#a855f7'});
            }
        } 
        else if (this.type === 'charger') {
            if(this.state === 'idle') {
                this.visAngle = faceAngle;
                this.timer--;
                // Slowly track
                if(canMove) {
                    this.x += Math.cos(this.visAngle) * moveSpeed * 0.5;
                    this.y += Math.sin(this.visAngle) * moveSpeed * 0.5;
                }
                
                if(this.timer <= 0) {
                    this.state = 'charge';
                    this.timer = 40;
                    this.chargeAngle = this.visAngle;
                    window.Game.createPopup(this.x, this.y - 20, "!", '#f59e0b', 24);
                }
            } else {
                // CHARGE!
                this.visAngle = this.chargeAngle;
                this.x += Math.cos(this.chargeAngle) * (moveSpeed * 5);
                this.y += Math.sin(this.chargeAngle) * (moveSpeed * 5);
                this.timer--;
                if(this.timer <= 0) { this.state = 'idle'; this.timer = 80; }
            }
        }
        else if (this.type === 'snake') {
            this.timer += 0.1;
            const sineOffset = Math.sin(this.timer) * 1.5;
            const moveAngle = faceAngle + sineOffset;
            this.visAngle = moveAngle;
            if(canMove) {
                this.x += Math.cos(moveAngle) * moveSpeed;
                this.y += Math.sin(moveAngle) * moveSpeed;
            }
        }
        else if (this.type === 'summoner') {
            if(dist < 300) { // Run away if too close
                 this.x -= Math.cos(this.visAngle) * moveSpeed;
                 this.y -= Math.sin(this.visAngle) * moveSpeed;
            } else if (dist > 500 && canMove) { // Get closer
                 this.x += Math.cos(this.visAngle) * moveSpeed;
                 this.y += Math.sin(this.visAngle) * moveSpeed;
            }
            
            this.timer++;
            if(this.timer % 300 === 0) { // Spawn enemies
                 for(let i=0; i<3; i++) {
                     const e = new Enemy('swarmer', 1);
                     e.x = this.x + (Math.random()-0.5)*40;
                     e.y = this.y + (Math.random()-0.5)*40;
                     window.Game.enemies.push(e);
                 }
                 window.Game.createExplosion(this.x, this.y, 10, '#d946ef');
            }
        }
        else if (this.type === 'teleporter') {
            this.timer--;
            if(this.timer <= 0) {
                this.timer = 120 + Math.random() * 60;
                // Teleport closer
                const angle = Math.atan2(dy, dx) + (Math.random()-0.5);
                const jumpDist = Math.min(dist - 50, 150);
                window.Game.createExplosion(this.x, this.y, 8, '#06b6d4');
                this.x += Math.cos(angle) * jumpDist;
                this.y += Math.sin(angle) * jumpDist;
                window.Game.createExplosion(this.x, this.y, 8, '#06b6d4');
                window.AudioSys.play('sine', 800, 0.1);
            }
        }
        else if(this.type === 'orbiter') {
            this.angle += 0.02;
            const orbitX = window.Game.player.x + Math.cos(this.angle) * 150;
            const orbitY = window.Game.player.y + Math.sin(this.angle) * 150;
            this.x += (orbitX - this.x) * 0.05; this.y += (orbitY - this.y) * 0.05;
        } else if(this.type === 'shooter') {
            this.timer++;
            if(this.state === 'move') {
                if(canMove) { this.x += Math.cos(faceAngle) * moveSpeed; this.y += Math.sin(faceAngle) * moveSpeed; }
                if(dist < 300) this.state = 'shoot';
            } else {
                if(canMove) { this.x += Math.cos(faceAngle + 1.5) * 0.5; this.y += Math.sin(faceAngle + 1.5) * 0.5; }
                if(this.timer % 100 === 0) window.Game.enemyBullets.push({x:this.x, y:this.y, vx:Math.cos(faceAngle)*5, vy:Math.sin(faceAngle)*5, life:100, r:4, color:'#fbbf24'});
                if(dist > 450) this.state = 'move';
            }
        } else if (this.type === 'sniper') {
            this.timer++;
            if(dist < 400) { this.x -= Math.cos(faceAngle) * moveSpeed; this.y -= Math.sin(faceAngle) * moveSpeed; }
            else if(dist > 600 && canMove) { this.x += Math.cos(faceAngle) * moveSpeed; this.y += Math.sin(faceAngle) * moveSpeed; }
            if(this.timer % 180 === 0) window.Game.enemyBullets.push({x:this.x, y:this.y, vx:Math.cos(faceAngle)*12, vy:Math.sin(faceAngle)*12, life:100, r:3, color:'#22d3ee'});
        } else if (this.type === 'kamikaze') {
            if(dist < 200) moveSpeed *= 2.5;
            this.x += Math.cos(faceAngle) * moveSpeed; this.y += Math.sin(faceAngle) * moveSpeed;
            if(dist < this.r + 20) { this.hp = 0; window.Game.player.takeDamage(30); this.takeDamage(999, false); }
        } else if (this.type === 'carrier') {
            this.timer++;
            if(canMove) { this.x += Math.cos(faceAngle) * moveSpeed; this.y += Math.sin(faceAngle) * moveSpeed; }
            if(this.timer % 200 === 0) window.Game.enemies.push(new Enemy('swarmer', 1));
        } else {
            if(canMove) { this.x += Math.cos(faceAngle) * moveSpeed; this.y += Math.sin(faceAngle) * moveSpeed; }
        }

        if(dist < this.r + 15) window.Game.player.takeDamage(10);
    }

    takeDamage(amt, isCrit, freeze=false) {
        let finalDmg = amt;
        const p = window.Game.player;
        if(p.executioner && this.hp < this.maxHp * 0.3) finalDmg *= 1.5;
        if(p.rage) {
             const missingPct = Math.max(0, (p.maxHp - p.hp) / p.maxHp);
             finalDmg *= (1 + missingPct);
        }

        this.hp -= finalDmg; this.flash = 3;
        if(freeze) this.frozen = 60;
        window.Game.createPopup(this.x, this.y - 20, Math.floor(finalDmg), isCrit ? '#fbbf24' : 'white', isCrit ? 24 : 16);
        
        if(this.hp <= 0 && !this.marked) {
            this.marked = true;
            window.Game.score += this.score; window.Game.sessionCredits += this.credits;
            window.Game.spawnXP(this.x, this.y, this.xp); window.Game.shake.add(4);
            
            if(this.type === 'boss') {
                window.Game.bossActive = false;
                window.Game.createExplosion(this.x, this.y, 50, this.color);
                window.Game.createPopup(window.Game.width/2, window.Game.height/3, "BOSS DEFEATED", '#a855f7', 40);
            } else {
                window.Game.createExplosion(this.x, this.y, 8, this.color);
            }

            if(this.frozen > 0 && window.Game.player.shatter) {
                window.Game.createExplosion(this.x, this.y, 8, '#a5f3fc'); 
                window.Game.enemies.forEach(e => {
                    if(e !== this && Math.hypot(e.x-this.x, e.y-this.y) < 100) e.takeDamage(window.Game.player.damage, false);
                });
            }

            if(window.Game.player.explosive) {
                 window.Game.createExplosion(this.x, this.y, 6, '#f97316');
                 window.Game.enemies.forEach(e => { if(e !== this && Math.hypot(e.x-this.x, e.y-this.y) < 100) e.takeDamage(window.Game.player.damage * 0.5, false); });
            }
            if(Math.random() < window.Game.player.lifesteal) { window.Game.player.hp = Math.min(window.Game.player.maxHp, window.Game.player.hp + 5); window.Game.createPopup(window.Game.player.x, window.Game.player.y, "+5 HP", '#22c55e'); }
        }
    }

    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.fillStyle = this.flash > 0 ? 'white' : this.color;
        ctx.shadowBlur = this.type === 'boss' ? 30 : 10; ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color; ctx.lineWidth = 2;

        // Most enemies now rotate to face their movement/target
        if(this.type !== 'orbiter' && this.type !== 'teleporter') ctx.rotate(this.visAngle);

        if (this.type === 'basic') {
            ctx.beginPath(); ctx.rect(-this.r/2, -this.r/2, this.r, this.r); ctx.stroke();
            ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1;
        }
        else if (this.type === 'dasher') {
            ctx.beginPath(); ctx.moveTo(this.r, 0); ctx.lineTo(-this.r, this.r); ctx.lineTo(-this.r/2, 0); ctx.lineTo(-this.r, -this.r); ctx.closePath();
            ctx.stroke();
        }
        else if (this.type === 'charger') {
            ctx.beginPath(); 
            ctx.moveTo(this.r, 0); ctx.lineTo(-this.r, this.r*0.8); ctx.lineTo(-this.r*0.5, 0); ctx.lineTo(-this.r, -this.r*0.8); 
            ctx.closePath(); ctx.fill();
        }
        else if (this.type === 'snake') {
            ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(4, -4, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(4, 4, 2, 0, Math.PI*2); ctx.fill();
        }
        else if (this.type === 'summoner') {
            ctx.beginPath();
            for(let i=0; i<6; i++) {
                const a = (i/6)*Math.PI*2;
                ctx.lineTo(Math.cos(a)*this.r, Math.sin(a)*this.r);
            }
            ctx.closePath(); ctx.stroke();
            ctx.beginPath(); ctx.arc(0,0,this.r*0.5,0,Math.PI*2); ctx.fill();
        }
        else if (this.type === 'teleporter') {
             ctx.globalAlpha = 0.6 + Math.sin(window.Game.frameCount * 0.2) * 0.4;
             ctx.beginPath(); ctx.moveTo(0, -this.r); ctx.lineTo(this.r, 0); ctx.lineTo(0, this.r); ctx.lineTo(-this.r, 0); ctx.closePath();
             ctx.fill(); ctx.globalAlpha = 1;
        }
        else if (this.type === 'heavy' || this.type === 'tank') {
            ctx.beginPath();
            for(let i=0; i<6; i++) {
                const a = (i/6) * Math.PI*2;
                ctx.lineTo(Math.cos(a)*this.r, Math.sin(a)*this.r);
            }
            ctx.closePath();
            ctx.stroke(); ctx.globalAlpha=0.5; ctx.fill(); ctx.globalAlpha=1;
        }
        else if (this.type === 'swarmer') {
            ctx.beginPath(); ctx.moveTo(this.r, 0); ctx.lineTo(-this.r, this.r); ctx.lineTo(-this.r, -this.r); ctx.fill();
        }
        else if (this.type === 'sniper') {
            ctx.strokeRect(-this.r/2, -this.r/2, this.r, this.r);
            ctx.beginPath(); ctx.moveTo(0, -this.r); ctx.lineTo(0, this.r); ctx.moveTo(-this.r, 0); ctx.lineTo(this.r, 0); ctx.stroke();
        }
        else if (this.type === 'kamikaze') {
            ctx.beginPath();
            for(let i=0; i<8; i++) {
                const a = (i/8)*Math.PI*2;
                const r = i%2===0 ? this.r : this.r/2;
                ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
            }
            ctx.closePath();
            ctx.fill();
        }
        else if (this.type === 'orbiter') { 
            ctx.beginPath(); ctx.arc(0,0,this.r,0,Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(Math.cos(window.Game.frameCount*0.1)*this.r, Math.sin(window.Game.frameCount*0.1)*this.r, 4, 0, Math.PI*2); ctx.fill();
        }
        else if (this.type === 'carrier') {
            ctx.strokeRect(-this.r, -this.r, this.r*2, this.r*2);
            ctx.strokeRect(-this.r/2, -this.r/2, this.r, this.r);
        }
        else if (this.type === 'boss') {
            ctx.beginPath(); ctx.arc(0,0,this.r,0,Math.PI*2); ctx.globalAlpha=0.2; ctx.fill(); ctx.globalAlpha=1; ctx.stroke();
            ctx.beginPath(); ctx.rect(-this.r*0.7, -this.r*0.7, this.r*1.4, this.r*1.4); ctx.stroke();
            ctx.strokeRect(-this.r/3, -this.r/3, this.r*0.66, this.r*0.66);
        }
        else if (this.type === 'shooter') {
            ctx.beginPath(); ctx.moveTo(this.r, 0); ctx.lineTo(-this.r, this.r); ctx.lineTo(-this.r, -this.r); ctx.stroke();
        }
        
        ctx.restore();
    }
}

class Particle {
    constructor(x,y,vx,vy,size,color,life) { this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.size=size;this.color=color;this.life=life;this.max=life; }
    update() { this.x+=this.vx; this.y+=this.vy; this.life--; this.vx*=0.92; this.vy*=0.92; }
    draw(ctx) { ctx.globalAlpha=this.life/this.max; ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,7); ctx.fill(); ctx.globalAlpha=1; }
}