const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: true }); 
let width, height;
let lastTick = performance.now();
let particles = [];

// --- RESIZE HANDLING ---
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// --- PARTICLE PHYSICS ENGINE ---
class Particle {
    constructor(x, y, text, type) {
        this.x = x; 
        this.y = y;
        this.type = type; 
        this.life = 1.0;
        
        if (type === 'text') {
            // MONEY NUMBER: Pops up, then falls down
            this.text = text;
            this.vx = (Math.random() - 0.5) * 4;  // Spread X
            this.vy = -8 - Math.random() * 5;     // Shoot Up Fast
            this.gravity = 0.5;                   // Fall Down
            this.drag = 0.96;
            this.decay = 0.015;
            this.scale = 1.0;
            this.color = maniaMode ? '#eab308' : '#22c55e'; // Gold or Green
        } 
        else if (type === 'bill') {
            // FALLING CASH: Flutters down
            this.vx = (Math.random() - 0.5) * 12; // Wide spread
            this.vy = -6 - Math.random() * 6;     // Initial pop
            this.gravity = 0.3;                   // Slow fall
            this.drag = 0.92;
            this.decay = 0.01;
            this.scale = Math.random() * 0.5 + 0.8;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.3;
            this.color = '#15803d'; // Darker money green
            this.w = 12; // Bill width
            this.h = 6;  // Bill height
        }
        else if (type === 'spark') {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 15 + 5;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.5;
            this.drag = 0.85;
            this.decay = 0.03 + Math.random() * 0.02;
            this.scale = Math.random() * 3 + 2;
            const rand = Math.random();
            this.color = rand > 0.6 ? '#eab308' : (rand > 0.3 ? '#22c55e' : '#ffffff');
        } 
        else if (type === 'confetti') {
            this.x = Math.random() * width;
            this.y = -20;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = Math.random() * 5 + 5;
            this.gravity = 0.05;
            this.drag = 0.99;
            this.scale = Math.random() * 6 + 4;
            this.rotation = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 10;
            this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
            this.decay = 0.005;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.life -= this.decay;

        if (this.type === 'bill') {
            this.rotation += this.rotSpeed;
            // Flutter effect (Sine wave on X)
            this.x += Math.sin(this.life * 10) * 0.5; 
        } else if (this.type === 'confetti') {
            this.rotation += this.rotSpeed;
        }
    }

    draw() {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);

        if (this.type === 'text') {
            ctx.scale(this.scale, this.scale);
            ctx.font = "800 28px Outfit";
            ctx.textAlign = "center";
            // Stroke for readability
            ctx.lineJoin = "round";
            ctx.lineWidth = 4;
            ctx.strokeStyle = "rgba(0,0,0,0.8)";
            ctx.strokeText(this.text, 0, 0);
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, 0, 0);
        }
        else if (this.type === 'bill') {
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
            // Little detail line on bill
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(-2, -3, 4, 6);
        }
        else if (this.type === 'spark') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.scale, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.type === 'confetti') {
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.scale/2, -this.scale/2, this.scale, this.scale * 1.5);
        }
        ctx.restore();
    }
}

function createParticle(x, y, text, type) {
    // Performance cap
    if(particles.length > 300) particles.shift();
    particles.push(new Particle(x, y, text, type));
}

// --- TECH HELPER ---
function getTechBonus(type) {
    let multiplier = 1;
    let addValue = 0;
    
    // Scan all owned tech
    game.researchedTech.forEach(id => {
        const tech = techTree.find(t => t.id === id);
        if (tech && tech.effect && tech.effect.type === type) {
            // For multipliers (e.g. 0.05), we add it to the base (1.05)
            // For straight values (e.g. mania_time), we add it directly
            if (type === 'mania_time') addValue += tech.effect.val;
            else multiplier += tech.effect.val;
        }
    });
    
    return { mult: multiplier, val: addValue };
}

function calculateIncome() {
    let base = 0;
    game.counts.forEach((count, i) => { 
        if(upgrades[i]) {
            let upgradeMult = 1;
            marketUpgrades.forEach(upg => { if (game.upgradesOwned.includes(upg.id) && upg.targetId === i) upgradeMult *= upg.mult; });
            let levelMult = 1 + ((game.levels[i] - 1) * 0.25);
            base += count * upgrades[i].baseRate * levelMult * upgradeMult; 
        }
    });

    // Tech Bonuses
    let techGlobal = getTechBonus('global_mult').mult;
    let singularityMult = game.researchedTech.includes(4) ? 2 : 1;
    
    let influenceMult = 1 + (game.influence * 0.10); 
    let maniaMult = game.researchedTech.includes(3) ? (maniaMode ? 3 : 1) : (maniaMode ? 2 : 1);
    let ceoMult = game.staff && game.staff.includes(3) ? 1.5 : 1.0;
    
    return base * influenceMult * maniaMult * singularityMult * techGlobal * ceoMult;
}

function clickAction(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    let x, y;
    if (e.touches && e.touches.length > 0) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
    else { x = e.clientX; y = e.clientY; }

    let baseRate = 0;
    game.counts.forEach((c, i) => { 
        if(upgrades[i]) {
            let levelMult = 1 + ((game.levels[i] - 1) * 0.25);
            baseRate += c * upgrades[i].baseRate * levelMult; 
        }
    });
    
    // Tech Bonuses
    let techClick = getTechBonus('click_mult').mult;
    let techCrit = getTechBonus('crit_chance').mult; // This returns 1 + 0.01 etc
    let siphonBoost = game.researchedTech.includes(1) ? 1.1 : 1;
    
    let ceoMult = game.staff && game.staff.includes(3) ? 1.5 : 1.0;
    let clickVal = (1 + (baseRate * 0.05)) * siphonBoost * techClick;
    
    let influenceMult = 1 + (game.influence * 0.10);
    let maniaMult = maniaMode ? 2 : 1;
    let total = clickVal * influenceMult * maniaMult * ceoMult;

    // Crit Logic
    let critChance = 0.04 + (techCrit - 1); // Subtract 1 base to get raw percentage add
    if (game.staff && game.staff.includes(1)) critChance += 0.10;

    let isCrit = Math.random() < critChance;
    if (isCrit) { 
        total *= 10; playSound('crit'); 
        for(let i=0; i<15; i++) createParticle(x, y, '', 'spark');
    } else playSound('click');

    game.money += total; game.lifetimeEarnings += total;
    createParticle(x, y - 50, "+" + formatNumber(total), 'text');
    
    if (!maniaMode) {
        let decay = getTechBonus('hype_decay').mult; // e.g. 0.9
        // If we have decay modifiers (less than 1), we reduce the decay rate? 
        // No, logic is: decayMult * dt. So if tech gives 0.9 multiplier, we want smaller decay.
        // Actually easier: Tech returns 1 by default. If we have tech that sets val 0.9, it multiplies.
        // But for decay, we start with 1. If tech says 0.9, we multiply.
        // However, existing tech data uses additive. Let's fix that in step 1.
        // (Note: In my data above, I used val: 0.9 for hype decay. 1 * 0.9 * 0.9 = 0.81. Wait, my helper sums. 1 + 0.9 = 1.9. That's wrong for decay.)
        // Correction: For decay, we will just hardcode the logic here for simplicity or use specific IDs.
        
        hype = Math.min(100, hype + 5);
        if (hype >= 100) startMania();
    }
    
    if (window.analytics) window.analytics.clickHistory.push(Date.now());
}

// Update getCost to use discount
function getCost(id, count) {
    let u = upgrades[id];
    let currentCost = u.baseCost * Math.pow(1.15, game.counts[id]);
    if (count === 1) return currentCost;
    let r = 1.15;
    let total = currentCost * (Math.pow(r, count) - 1) / (r - 1);
    
    if (count >= 100) total *= 0.8; else if (count >= 10) total *= 0.9;
    
    // Tech Discount
    let discount = getTechBonus('cost_discount').mult; // 1 + 0.02 + 0.05...
    // We want 1 - (discount - 1)
    let totalDiscount = discount - 1; 
    total = total * (1 - totalDiscount);
    
    return total;
}

// Update startMania to use time boost
function startMania() {
    maniaMode = true; 
    let extraTime = getTechBonus('mania_time').val;
    maniaTimer = 20 + extraTime;
    document.body.classList.add('mania-mode');
    playSound('crit');
    for(let i=0; i<40; i++) createParticle(width/2, height/2, '', 'confetti');
}
// --- EVENTS ---
function startMania() {
    maniaMode = true; 
    maniaTimer = 20;
    document.body.classList.add('mania-mode');
    playSound('crit');
    for(let i=0; i<40; i++) createParticle(width/2, height/2, '', 'confetti');
}

function endMania() {
    maniaMode = false; 
    hype = 0;
    document.body.classList.remove('mania-mode');
}

function spawnGoldenBill() {
    let bill = document.createElement('div');
    bill.className = 'golden-bill';
    const padding = 100;
    bill.style.left = (padding + Math.random() * (window.innerWidth - padding * 2)) + 'px';
    bill.style.top = (padding + Math.random() * (window.innerHeight - padding * 2)) + 'px';
    document.getElementById('event-layer').appendChild(bill);
    
    const collect = (x, y) => {
        let reward = Math.max(5000, game.money * 0.20);
        game.money += reward;
        game.lifetimeEarnings += reward;
        for(let i=0; i<20; i++) createParticle(x, y, '', 'spark');
        createParticle(x, y, "BONUS!", 'text');
        playSound('crit');
        if(bill.parentNode) bill.remove();
    };

    // Staff: Intern (ID: 0) Auto-Collect
    if (game.staff && game.staff.includes(0)) {
        setTimeout(() => {
            if (bill.parentNode) {
                let rect = bill.getBoundingClientRect();
                collect(rect.left + rect.width/2, rect.top + rect.height/2);
                if(window.pushNews) window.pushNews("INTERN COLLECTED MARKET BONUS.");
            }
        }, 1200);
    }

    bill.onmousedown = bill.ontouchstart = (e) => {
        e.stopPropagation(); e.preventDefault();
        let rect = bill.getBoundingClientRect();
        collect(rect.left + rect.width/2, rect.top + rect.height/2);
    };
    
    setTimeout(() => { if(bill.parentNode) bill.remove(); }, 10000); 
}

// --- UTILS ---
function getCost(id, count) {
    let u = upgrades[id];
    let currentCost = u.baseCost * Math.pow(1.15, game.counts[id]);
    if (count === 1) return currentCost;
    let r = 1.15;
    let total = currentCost * (Math.pow(r, count) - 1) / (r - 1);
    if (count >= 100) total *= 0.8; else if (count >= 10) total *= 0.9;
    return total;
}

function getMaxBuy(id) {
    let u = upgrades[id];
    let currentCost = u.baseCost * Math.pow(1.15, game.counts[id]);
    if (game.money < currentCost) return 0;
    let r = 1.15;
    return Math.floor(Math.log(1 + (game.money * (r - 1)) / currentCost) / Math.log(r));
}

function buy(id) {
    let max = getMaxBuy(id);
    let amount = (buyMode === 'MAX') ? max : buyMode;
    if (amount <= 0) { playSound('error'); return; }
    let cost = getCost(id, amount);
    if (game.money >= cost) {
        game.money -= cost;
        game.counts[id] += amount;
        let btn = document.getElementById(`upg-${id}`);
        if(btn) { 
            let rect = btn.getBoundingClientRect(); 
            for(let i=0; i<5; i++) createParticle(rect.right - 40, rect.top + rect.height/2, '', 'spark');
        }
        playSound('buy');
    }
}

// --- GAME LOOP ---
function gameLoop(currentTime) {
    let dt = (currentTime - lastTick) / 1000;
    if (dt > 1) dt = 1;
    lastTick = currentTime;

    let rate = calculateIncome();
    if (rate > 0) {
        game.money += rate * dt;
        game.lifetimeEarnings += rate * dt;
    }

    if (maniaMode) {
        maniaTimer -= dt;
        if(Math.random() > 0.95) createParticle(Math.random() * width, height + 10, '', 'confetti'); 
        if (maniaTimer <= 0) endMania();
    } else {
        // R&D: Market Pulse (ID: 2) slows decay
        let decayMult = game.researchedTech.includes(2) ? 4 : 8;
        hype = Math.max(0, hype - (decayMult * dt)); 
    }

    tickerTimer += dt;
    if(tickerTimer > 25) {
        let item = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
        if (window.pushNews) window.pushNews(item);
        tickerTimer = 0;
    }

    goldenBillTimer -= dt * 1000;
    if (goldenBillTimer <= 0) {
        spawnGoldenBill();
        goldenBillTimer = Math.random() * 40000 + 20000;
    }

    ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; 
        p.update(); 
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // R&D: Neural Link (ID: 0) Auto-Clicker
    if (game.researchedTech.includes(0)) {
        if (Math.random() < 0.015) clickAction({ clientX: width/2, clientY: height/2, type: 'click' });
    }

    if (window.updateUI) window.updateUI(rate);
    
    autoSaveTimer += dt;
    if(autoSaveTimer > 10) { if (window.saveLocal) window.saveLocal(); autoSaveTimer = 0; }
    
    requestAnimationFrame(gameLoop);
}

// Binds
document.getElementById('main-btn').addEventListener('mousedown', clickAction);
document.getElementById('main-btn').addEventListener('touchstart', clickAction);
requestAnimationFrame(gameLoop);