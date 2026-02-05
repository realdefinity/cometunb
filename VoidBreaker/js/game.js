window.Game = {
    canvas: null, ctx: null, width: 0, height: 0,
    gameState: 'MENU', currentLoadout: 'rifle',
    score: 0, frameCount: 0, sessionCredits: 0,
    killStreak: 0, killStreakTimer: 0,
    
    // Wave System
    wave: 1,
    waveTimer: 0,
    bossActive: false,
    
    enemies: [], bullets: [], enemyBullets: [], particles: [], textPopups: [], xpOrbs: [], stars: [],
    player: null,
    level: 1, currentXp: 0, xpNeeded: 100,
    
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
            if(c) this.totalCurrency = parseInt(c);
            if(w) this.unlockedWeapons = JSON.parse(w);
        } catch(e) {}
        window.UI.updateMenuUI();
    },

    saveData() {
        localStorage.setItem('void_breaker_currency', this.totalCurrency);
        localStorage.setItem('void_breaker_unlocks', JSON.stringify(this.unlockedWeapons));
    },

    startGame() {
        this.player = new Player(this.currentLoadout);
        this.enemies=[]; this.bullets=[]; this.enemyBullets=[]; this.particles=[]; this.xpOrbs=[]; this.textPopups=[];
        this.score=0; this.sessionCredits=0; this.level=1; this.currentXp=0; this.xpNeeded=100; this.frameCount=0;
        this.killStreak=0; this.wave=1; this.waveTimer=0; this.bossActive=false;
        this.gameState = 'PLAYING';
        window.UI.updateHud();
        this.loop();
        document.getElementById('wave-display').innerText = "WAVE 1";
    },

    loop() {
        if(this.gameState !== 'PLAYING') return;
        requestAnimationFrame(() => this.loop());
        
        this.frameCount++;
        this.manageWaves();
        
        if(this.killStreakTimer > 0) this.killStreakTimer--; else this.killStreak = 0;
        this.shake.val = Math.max(0, this.shake.val * 0.9);

        this.ctx.fillStyle = '#020617'; this.ctx.fillRect(0,0,this.width,this.height);
        
        // Stars
        this.ctx.save();
        this.ctx.translate((Math.random()-0.5)*this.shake.val, (Math.random()-0.5)*this.shake.val);
        this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
        this.stars.forEach(s => { this.ctx.fillRect(s.x, s.y, s.z, s.z); });

        this.player.update(); this.player.draw(this.ctx);

        this.enemies = this.enemies.filter(e => { e.update(); e.draw(this.ctx); return !e.marked; });
        this.bullets = this.bullets.filter(b => { 
            b.update(); b.draw(this.ctx);
            // Bullet Collision
            if(b.life > 0 && b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height && !b.ricochet) {
                for(let e of this.enemies) {
                    if(b.hitList.includes(e.id)) continue;
                    if(Math.hypot(b.x - e.x, b.y - e.y) < e.r + 5) {
                        const isCrit = Math.random() < this.player.critChance;
                        const dmg = isCrit ? b.damage * this.player.critMult : b.damage;
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
                        
                        // START FIX: Use save/restore to isolate drawing state
                        this.ctx.save();
                        this.ctx.shadowBlur = 5; 
                        this.ctx.shadowColor = b.color; 
                        this.ctx.fillStyle = b.color;
                        this.ctx.beginPath(); 
                        this.ctx.arc(b.x, b.y, b.r || 4, 0, Math.PI*2); 
                        this.ctx.fill(); 
                        this.ctx.restore();
                        // END FIX

                        if(Math.hypot(b.x-this.player.x, b.y-this.player.y) < (b.r || 4) + 10) { 
                            this.player.takeDamage(10); 
                            return false; 
                        }
                        return b.life > 0;
                    });

        this.xpOrbs = this.xpOrbs.filter(x => {
            const d = Math.hypot(this.player.x-x.x, this.player.y-x.y);
            if(d < this.player.pickupRange) { x.x += (this.player.x-x.x)*0.1; x.y += (this.player.y-x.y)*0.1; }
            if(d < 20) { window.AudioSys.xp((this.currentXp/this.xpNeeded)*200); this.currentXp += x.amt; this.checkLevelUp(); return false; }
            x.x += x.vx; x.y += x.vy; x.vx *= 0.95; x.vy *= 0.95; x.life--;
            this.ctx.fillStyle = '#6366f1'; this.ctx.beginPath(); this.ctx.arc(x.x, x.y, 3, 0, 7); this.ctx.fill();
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
        document.getElementById('dash-cooldown').style.height = (100 - dashPct) + '%';
        window.UI.updateHud();
    },

    manageWaves() {
        if(this.bossActive) return;
        this.waveTimer++;
        
        // Spawn Boss every 5 waves
        if(this.wave % 5 === 0 && this.enemies.length === 0) {
            this.bossActive = true;
            this.enemies.push(new Enemy('boss', 2 + this.wave * 0.2));
            document.getElementById('boss-hud').style.opacity = 1;
            window.AudioSys.bossWarn();
            return;
        }

        // Advance Wave
        if(this.waveTimer > 1800) { // 30 seconds per wave
            this.wave++;
            this.waveTimer = 0;
            this.createPopup(this.width/2, this.height/3, `WAVE ${this.wave}`, '#fbbf24', 40);
            
            // UPDATE THE UI DISPLAY
            const waveDisplay = document.getElementById('wave-display');
            if(waveDisplay) waveDisplay.innerText = `WAVE ${this.wave}`;
        }

        // Spawn Logic based on Wave
        const spawnRate = Math.max(10, 60 - this.wave * 2);
        if(this.frameCount % spawnRate === 0) {
            const r = Math.random();
            let type = 'basic';
            if(this.wave > 2 && r > 0.7) type = 'dasher';
            if(this.wave > 3 && r > 0.8) type = 'shooter';
            if(this.wave > 5 && r > 0.85) type = 'heavy';
            if(this.wave > 7 && r > 0.9) type = 'orbiter';
            
            this.enemies.push(new Enemy(type, 1 + this.wave * 0.1));
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

    createExplosion(x, y, n, color) {
        for(let i=0; i<n; i++) {
            const a = Math.random()*7; const s = Math.random()*8;
            this.particles.push(new Particle(x, y, Math.cos(a)*s, Math.sin(a)*s, Math.random()*5+2, color, 40));
        }
    },
    createPopup(x, y, text, color, size=16) { this.textPopups.push({x, y, text, color, size, life: 60, vy: -2}); },
    createXP(x, y, amt) { this.xpOrbs.push({x, y, amt, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, life: 1000}); },
    
    gameOver() {
        this.gameState = 'GAMEOVER';
        this.totalCurrency += this.sessionCredits;
        this.saveData();
        window.UI.gameOver();
    }
};

class Player {
    constructor(weaponKey) {
        const w = window.WEAPONS[weaponKey];
        this.x = window.Game.width/2; this.y = window.Game.height/2;
        this.vel = {x:0, y:0}; this.angle = 0;
        this.maxHp = 100; this.hp = 100; this.regen = 0; this.maxSpeed = 5; this.acc = 0.8; this.drag = 0.9;
        
        // Weapon Stats
        this.weaponKey = weaponKey; this.damage = w.damage; this.maxCooldown = w.cooldown;
        this.bulletSpeed = w.speed; this.spread = w.spread; this.count = w.count; this.pierce = w.pierce;
        this.bulletColor = w.color;
        
        // Upgrades
        this.cooldown = 0; this.critChance = 0.05; this.critMult = 1.5; this.lifesteal = 0; 
        this.dodge = 0; this.pickupRange = 100;
        this.ricochet = false; this.homing = false; this.explosive = false; 
        this.tesla = false; this.freeze = false;

        this.dashCd = 0; this.dashCdMax = 120; this.dashing = 0; this.invuln = 0;
    }

    update() {
        // Passive Regen
        if(window.Game.frameCount % 60 === 0 && this.regen > 0 && this.hp < this.maxHp) this.hp += this.regen;
        
        // Tesla Coil
        if(this.tesla && window.Game.frameCount % 30 === 0) {
            let hit = false;
            window.Game.enemies.forEach(e => {
                if(Math.hypot(e.x-this.x, e.y-this.y) < 200) {
                    e.takeDamage(10, false); hit = true;
                    // Draw Lightning
                    window.Game.ctx.strokeStyle = '#facc15'; window.Game.ctx.lineWidth = 2;
                    window.Game.ctx.beginPath(); window.Game.ctx.moveTo(this.x, this.y); window.Game.ctx.lineTo(e.x, e.y); window.Game.ctx.stroke();
                }
            });
            if(hit) window.AudioSys.play('sawtooth', 800, 0.1, 0.05);
        }

        // Movement
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

    dash() {
        this.dashing = 10; this.invuln = 15; this.dashCd = this.dashCdMax;
        const m = Math.hypot(this.vel.x, this.vel.y);
        const a = m > 0.1 ? Math.atan2(this.vel.y, this.vel.x) : this.angle;
        this.vel.x = Math.cos(a) * 20; this.vel.y = Math.sin(a) * 20;
        window.AudioSys.play('sine', 600, 0.2, 0.1, 100);
    }

    shoot() {
        this.cooldown = this.maxCooldown;
        window.AudioSys.shoot(this.weaponKey);
        const totalArc = this.spread * (this.count > 1 ? 2 : 1);
        const startA = this.angle - totalArc/2;
        const step = this.count > 1 ? totalArc / (this.count-1) : 0;

        for(let i=0; i<this.count; i++) {
            const baseA = this.count > 1 ? startA + step*i : this.angle;
            const finalA = baseA + (Math.random()-0.5) * this.spread * 0.5; 
            window.Game.bullets.push(new Bullet(
                this.x + Math.cos(this.angle)*15, this.y + Math.sin(this.angle)*15,
                finalA, this.damage, this.bulletSpeed, this.pierce, this.bulletColor, this
            ));
        }
    }

    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        if(this.invuln > 0 && window.Game.frameCount % 4 < 2) ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.dashing > 0 ? '#38bdf8' : 'white';
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, 10); ctx.lineTo(-8, 0); ctx.lineTo(-10, -10); ctx.fill();
        ctx.restore();
    }

    takeDamage(amt) {
        if(this.invuln > 0 || this.dashing > 0) return;
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
    draw(ctx) { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill(); }
}

class Enemy {
    constructor(type, difficulty=1) {
        const angle = Math.random()*Math.PI*2;
        const r = Math.max(window.Game.width, window.Game.height)/2 + 50;
        this.x = window.Game.width/2 + Math.cos(angle)*r; this.y = window.Game.height/2 + Math.sin(angle)*r;
        this.type = type; this.id = Math.random(); this.marked = false; this.flash = 0;
        this.frozen = 0;
        
        let scale = difficulty;
        // Default Stats
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
        else if (type === 'boss') {
            this.hp = 2000 * scale; this.maxHp = this.hp; this.xp = 500; this.score = 5000; this.credits = 100; 
            this.speed = 0.5; this.color = '#a855f7'; this.r = 40; this.phase = 0; this.timer = 0;
        }
    }

    update() {
        if(this.flash > 0) this.flash--;
        let moveSpeed = this.speed;
        if(this.frozen > 0) { moveSpeed *= 0.5; this.frozen--; }

        const dx = window.Game.player.x - this.x; const dy = window.Game.player.y - this.y;
        const dist = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx);

        if(this.type === 'boss') {
            this.x += Math.cos(angle) * moveSpeed; this.y += Math.sin(angle) * moveSpeed;
            this.timer++;
            if(this.timer % 15 === 0) { 
                const spiral = (this.timer / 20) + (this.phase * 0.5);
                window.Game.enemyBullets.push({x:this.x, y:this.y, vx:Math.cos(spiral)*5, vy:Math.sin(spiral)*5, life:120, r:6, color:'#a855f7'});
                window.Game.enemyBullets.push({x:this.x, y:this.y, vx:Math.cos(spiral+Math.PI)*5, vy:Math.sin(spiral+Math.PI)*5, life:120, r:6, color:'#a855f7'});
            }
        } else if(this.type === 'orbiter') {
            this.angle += 0.02;
            const orbitX = window.Game.player.x + Math.cos(this.angle) * 150;
            const orbitY = window.Game.player.y + Math.sin(this.angle) * 150;
            this.x += (orbitX - this.x) * 0.05; this.y += (orbitY - this.y) * 0.05;
        } else if(this.type === 'shooter') {
            this.timer++;
            if(this.state === 'move') {
                this.x += Math.cos(angle) * moveSpeed; this.y += Math.sin(angle) * moveSpeed;
                if(dist < 300) this.state = 'shoot';
            } else {
                this.x += Math.cos(angle + 1.5) * 0.5; this.y += Math.sin(angle + 1.5) * 0.5; 
                if(this.timer % 100 === 0) window.Game.enemyBullets.push({x:this.x, y:this.y, vx:Math.cos(angle)*5, vy:Math.sin(angle)*5, life:100, r:4, color:'#fbbf24'});
                if(dist > 450) this.state = 'move';
            }
        } else {
            this.x += Math.cos(angle) * moveSpeed; this.y += Math.sin(angle) * moveSpeed;
        }

        if(dist < this.r + 15) window.Game.player.takeDamage(10);
    }

    takeDamage(amt, isCrit, freeze=false) {
        this.hp -= amt; this.flash = 3;
        if(freeze) this.frozen = 60; // 1 second freeze
        window.Game.createPopup(this.x, this.y - 20, Math.floor(amt), isCrit ? '#fbbf24' : 'white', isCrit ? 24 : 16);
        
        if(this.hp <= 0 && !this.marked) {
            this.marked = true;
            window.Game.score += this.score; window.Game.sessionCredits += this.credits;
            window.Game.createXP(this.x, this.y, this.xp); window.Game.shake.add(4);
            
            if(this.type === 'boss') {
                window.Game.bossActive = false;
                document.getElementById('boss-hud').style.opacity = 0;
                window.Game.createExplosion(this.x, this.y, 50, this.color);
                window.Game.createPopup(window.Game.width/2, window.Game.height/3, "TITAN DESTROYED", '#a855f7', 40);
            } else {
                window.Game.createExplosion(this.x, this.y, 8, this.color);
            }

            // Streak
            window.Game.killStreak++; window.Game.killStreakTimer = 120;
            if(window.Game.killStreak % 5 === 0) {
                let msg = window.Game.killStreak + " KILLS";
                if(window.Game.killStreak === 20) msg = "UNSTOPPABLE";
                window.Game.createPopup(window.Game.player.x, window.Game.player.y - 50, msg, '#f43f5e', 30);
                window.Game.sessionCredits += 5;
            }

            if(window.Game.player.explosive) {
                 window.Game.createExplosion(this.x, this.y, 6, '#f97316');
                 window.Game.enemies.forEach(e => { if(e !== this && Math.hypot(e.x-this.x, e.y-this.y) < 100) e.takeDamage(window.Game.player.damage * 0.5, false); });
            }
            if(Math.random() < window.Game.player.lifesteal) { window.Game.player.hp = Math.min(window.Game.player.maxHp, window.Game.player.hp + 5); window.Game.createPopup(window.Game.player.x, window.Game.player.y, "+5 HP", '#22c55e'); }
            document.getElementById('scoreDisplay').innerText = window.Game.score.toLocaleString();
        }
    }

draw(ctx) {
        ctx.save(); 
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.flash > 0 ? 'white' : this.color;
        ctx.shadowBlur = this.type === 'boss' ? 20 : 0; 
        ctx.shadowColor = this.color;

        // FIXED: Added braces {} to ensure drawing logic stays contained
        if (this.type === 'basic') {
            ctx.fillRect(-this.r+2, -this.r+2, this.r*2, this.r*2);
        }
        else if (this.type === 'dasher') { 
            ctx.beginPath(); 
            ctx.moveTo(this.r, 0); 
            ctx.lineTo(-this.r, this.r/2); 
            ctx.lineTo(-this.r, -this.r/2); 
            ctx.fill(); 
        }
        else if (this.type === 'orbiter') { 
            ctx.beginPath(); 
            ctx.arc(0,0,this.r,0,Math.PI*2); 
            ctx.fill(); 
            ctx.strokeStyle = 'white'; 
            ctx.lineWidth = 2; 
            ctx.stroke(); 
        }
        else if (this.type === 'shooter') {
            ctx.beginPath();
            ctx.moveTo(this.r, 0);
            ctx.lineTo(-this.r, this.r);
            ctx.lineTo(-this.r, -this.r);
            ctx.fill();
        }
        else { 
            // Tank, Heavy, Boss fallback
            ctx.beginPath(); 
            ctx.arc(0,0,this.r,0,Math.PI*2); 
            ctx.fill(); 
        }
        
        ctx.restore();
    }
}

class Particle {
    constructor(x,y,vx,vy,size,color,life) { this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.size=size;this.color=color;this.life=life;this.max=life; }
    update() { this.x+=this.vx; this.y+=this.vy; this.life--; this.vx*=0.92; this.vy*=0.92; }
    draw(ctx) { ctx.globalAlpha=this.life/this.max; ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,7); ctx.fill(); ctx.globalAlpha=1; }
}