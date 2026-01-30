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
        
        if(type === 'text') {
            this.text = text;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = -2 - Math.random();
            this.gravity = 0;
            this.drag = 0.98;
            this.decay = 0.015;
            this.scale = 1;
            this.color = '#fff'; 
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

        if (this.type === 'confetti') {
            this.rotation += this.rotSpeed;
        } else if (this.type === 'text') {
            this.scale += 0.005;
        }
    }

draw() {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;

        if (this.type === 'spark') {
            ctx.translate(this.x, this.y);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.scale, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.type === 'text') {
            ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);
            ctx.font = "800 28px Outfit";
            ctx.textAlign = "center";
            
            // Particle Skin Logic
            let skin = particleSkins.find(s => s.id === game.activeSkin) || particleSkins[0];
            let displayText = this.text.includes("+") ? this.text.replace("+", skin.char) : this.text;

            ctx.lineJoin = "round";
            ctx.lineWidth = 4;
            ctx.strokeStyle = "rgba(0,0,0,0.8)";
            ctx.strokeText(displayText, 0, 0);
            
            ctx.fillStyle = skin.color;
            ctx.fillText(displayText, 0, 0);
        }
        ctx.restore();
    }
}

function createParticle(x, y, text, type) {
    if(particles.length > 200) particles.shift();
    particles.push(new Particle(x, y, text, type));
}

// --- LOGIC CALCULATIONS ---
function calculateIncome() {
    let base = 0;
    game.counts.forEach((count, i) => { 
        if (upgrades[i]) {
            let upgradeMult = 1;
            // Check for purchased one-time upgrades
            marketUpgrades.forEach(upg => { 
                if (game.upgradesOwned.includes(upg.id) && upg.targetId === i) upgradeMult *= upg.mult; 
            });
            let levelMult = 1 + ((game.levels[i] - 1) * 0.25);
            base += count * upgrades[i].baseRate * levelMult * upgradeMult; 
        }
    });

    // R&D Multipliers
    let singularityMult = game.researchedTech.includes(4) ? 2 : 1;
    let influenceMult = 1 + (game.influence * 0.10); 
    let maniaMult = game.researchedTech.includes(3) ? (maniaMode ? 3 : 1) : (maniaMode ? 2 : 1);
    let ceoMult = game.staff && game.staff.includes(3) ? 1.5 : 1.0;

    let totalRate = base * influenceMult * maniaMult * singularityMult * ceoMult;

    // Debt Repayment (15%)
    if (game.debt > 0) {
        let deduction = totalRate * 0.15;
        if (deduction > game.debt) deduction = game.debt;
        game.debt -= deduction;
        totalRate -= deduction;
    }

    return totalRate;
}



// --- INPUT HANDLING (Clicking) ---
function clickAction(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    // 1. Get Coordinates
    let x, y;
    if (e.touches && e.touches.length > 0) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
    } else {
        x = e.clientX;
        y = e.clientY;
    }

    // 2. Calculate Base Rate
    let baseRate = 0;
    game.counts.forEach((c, i) => { 
        if(upgrades[i]) {
            let levelMult = 1 + ((game.levels[i] - 1) * 0.25);
            baseRate += c * upgrades[i].baseRate * levelMult; 
        }
    });
    
    // 3. Apply Multipliers & R&D
    // R&D: Data Siphon (ID: 1) = +10% click power
    let siphonBoost = game.researchedTech.includes(1) ? 1.1 : 1;
    // Staff: CEO (ID: 3) = 1.5x global multiplier
    let ceoMult = game.staff && game.staff.includes(3) ? 1.5 : 1.0;
    
    let clickVal = (1 + (baseRate * 0.05)) * siphonBoost;
    let influenceMult = 1 + (game.influence * 0.10);
    let maniaMult = maniaMode ? 2 : 1;
    
    let total = clickVal * influenceMult * maniaMult * ceoMult;

    // 4. Critical Hit Logic
    // Staff: Quant Analyst (ID: 1) = +10% crit chance
    let critChance = 0.04;
    if (game.staff && game.staff.includes(1)) critChance += 0.10;

    let isCrit = Math.random() < critChance;
    if (isCrit) { 
        total *= 10; 
        playSound('crit'); 
        for(let i=0; i<15; i++) createParticle(x, y, '', 'spark');
    } else { 
        playSound('click'); 
    }

    // 5. Update State
    game.money += total;
    game.lifetimeEarnings += total;

    // 6. Visuals
    createParticle(x, y - 50, "+" + formatNumber(total), 'text');
    
    if (!maniaMode) {
        hype = Math.min(100, hype + 5);
        if (hype >= 100) startMania();
    }
    
    if (window.analytics) window.analytics.clickHistory.push(Date.now());
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

    // STAFF: Junior Intern (ID: 0) auto-collect
    if (game.staff && game.staff.includes(0)) {
        setTimeout(() => {
            if (bill.parentNode) {
                let rect = bill.getBoundingClientRect();
                collect(rect.left + rect.width/2, rect.top + rect.height/2);
                if (window.pushNews) window.pushNews("INTERN COLLECTED MARKET BONUS.");
            }
        }, 1200);
    }

    bill.onmousedown = bill.ontouchstart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        let rect = bill.getBoundingClientRect();
        collect(rect.left + rect.width/2, rect.top + rect.height/2);
    };
    
    setTimeout(() => { if(bill.parentNode) bill.remove(); }, 10000); 
}

// --- BUYING LOGIC (Math) ---
function getCost(id, count) {
    let u = upgrades[id];
    let currentCost = u.baseCost * Math.pow(1.15, game.counts[id]);
    if (count === 1) return currentCost;
    
    let r = 1.15;
    let total = currentCost * (Math.pow(r, count) - 1) / (r - 1);
    
    if (count >= 100) total *= 0.8;
    else if (count >= 10) total *= 0.9;
    
    return total;
}

function getMaxBuy(id) {
    let u = upgrades[id];
    let currentCost = u.baseCost * Math.pow(1.15, game.counts[id]);
    if (game.money < currentCost) return 0;
    
    let r = 1.15;
    let count = Math.floor(Math.log(1 + (game.money * (r - 1)) / currentCost) / Math.log(r));
    return count;
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

// --- PORTFOLIO OPTIMIZATION ---
function buyAssetUpgrade(id) {
    const cost = getUpgradeCost(id);
    if (game.money >= cost) {
        game.money -= cost;
        game.levels[id] = (game.levels[id] || 1) + 1;
        playSound('buy');
        if (window.renderPortfolio) window.renderPortfolio();
        if (window.showToast) window.showToast(`${upgrades[id].name} optimized!`, 'success');
    } else {
        if (window.showToast) window.showToast("Insufficient capital.", "error");
    }
}
window.buyAssetUpgrade = buyAssetUpgrade;

function getUpgradeCost(id) {
    const level = game.levels[id] || 1;
    return upgrades[id].baseCost * 100 * Math.pow(5, level - 1);
}
window.getUpgradeCost = getUpgradeCost;

// --- PRESTIGE LOGIC ---
function openPrestige() {
    // STAFF: High-Stakes Lobbyist (ID: 2) increases influence gain
    let lobbyistMult = game.staff && game.staff.includes(2) ? 1.5 : 1.0;
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5) * lobbyistMult);
    let claimable = Math.max(0, potential - game.influence);
    
    const elClaim = document.getElementById('claimable-influence');
    const elCur = document.getElementById('current-bonus-modal');
    const elNew = document.getElementById('new-bonus-modal');
    
    if(elClaim) elClaim.innerText = formatNumber(claimable);
    if(elCur) elCur.innerText = formatNumber(game.influence * 10) + "%";
    if(elNew) elNew.innerText = formatNumber((game.influence + claimable) * 10) + "%";
    
    if (window.openModal) window.openModal('prestige-modal');
}
window.openPrestige = openPrestige;

function confirmPrestige() {
    let lobbyistMult = game.staff && game.staff.includes(2) ? 1.5 : 1.0;
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5) * lobbyistMult);
    if (potential > game.influence) {
        game.influence = potential;
        game.money = 0;
        game.counts = Array(upgrades.length).fill(0);
        game.levels = Array(upgrades.length).fill(1);
        
        if (window.closeModal) window.closeModal('prestige-modal');
        if (window.saveLocal) window.saveLocal();
        if (window.setShopTab) window.setShopTab('markets');
        playSound('crit');
    }
}
window.confirmPrestige = confirmPrestige;

// --- MAIN GAME LOOP ---
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
        hype = Math.max(0, hype - (8 * dt)); 
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
// R&D: Neural Link (ID: 0) - Automatic clicking 
    if (game.researchedTech.includes(0)) {
        if (Math.random() < 0.015) clickAction({ clientX: width/2, clientY: height/2, type: 'click' });
    }
    if (window.updateUI) window.updateUI(rate);
    
    autoSaveTimer += dt;
    if(autoSaveTimer > 10) { if (window.saveLocal) window.saveLocal(); autoSaveTimer = 0; }
    
    requestAnimationFrame(gameLoop);
}

// Bind Main Event
document.getElementById('main-btn').addEventListener('mousedown', clickAction);
document.getElementById('main-btn').addEventListener('touchstart', clickAction);

// Initialize Loop
requestAnimationFrame(gameLoop);