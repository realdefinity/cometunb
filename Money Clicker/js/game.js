const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let lastTick = performance.now();
let particles = [];

// Resize Logic
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// Particle Engine
class Particle {
    constructor(x, y, text, type) {
        this.x = x; this.y = y;
        this.text = text;
        this.type = type; 
        this.life = 1.0;
        
        if(type === 'text') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = -3 - Math.random() * 3;
            this.gravity = 0.1;
            this.scale = 1;
            this.color = maniaMode ? '#d946ef' : '#10b981'; // Purple or Green
        } else if (type === 'spark') {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.4;
            this.drag = 0.92;
            this.scale = Math.random() * 3 + 1;
            this.decay = 0.04;
            this.color = Math.random() > 0.5 ? '#fff' : (maniaMode ? '#d946ef' : '#10b981');
        } else if (type === 'confetti') {
            this.x = Math.random() * width;
            this.y = -20;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = Math.random() * 5 + 5;
            this.gravity = 0.02;
            this.drag = 0.99;
            this.scale = Math.random() * 6 + 4;
            this.rotation = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 15;
            this.color = `hsl(${Math.random()*360}, 100%, 60%)`;
            this.decay = 0.005;
        }
    }

    update() {
        if (this.type === 'confetti') {
            this.x += this.vx; this.y += this.vy; this.vy += this.gravity;
            this.vx *= this.drag;
            this.rotation += this.rotSpeed;
            this.life -= this.decay;
        } else if (this.type === 'spark') {
             this.x += this.vx; this.y += this.vy; this.vy += this.gravity;
             this.vx *= this.drag; this.vy *= this.drag;
             this.life -= this.decay;
        } else { // Text
            this.x += this.vx; this.y += this.vy; this.vy += this.gravity;
            this.life -= 0.02;
        }
    }

    draw() {
        if(this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        
        if (this.type === 'spark') {
            ctx.translate(this.x, this.y);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.scale, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === 'confetti') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.scale/2, -this.scale/2, this.scale, this.scale);
        } else { // Text
            ctx.translate(this.x, this.y);
            ctx.font = "800 24px Outfit"; // Bigger font
            
            // Text Shadow for readability
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 4;
            ctx.strokeText(this.text, -20, 0);
            
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, -20, 0);
        }
        ctx.restore();
    }
}

function calculateIncome() {
    let base = 0;
    game.counts.forEach((count, i) => { if(upgrades[i]) base += count * upgrades[i].baseRate; });
    let influenceMult = 1 + (game.influence * 0.10); 
    let maniaMult = maniaMode ? 3 : 1;
    return base * influenceMult * maniaMult;
}

function createParticle(x, y, text, type) { particles.push(new Particle(x, y, text, type)); }

function clickAction(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if(audioCtx.state === 'suspended') audioCtx.resume();

    // Get Click Coordinates accurately
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    let baseRate = 0;
    game.counts.forEach((c, i) => { if(upgrades[i]) baseRate += c * upgrades[i].baseRate; });
    
    // Logic
    let clickVal = (1 + (baseRate * 0.05));
    let influenceMult = 1 + (game.influence * 0.10);
    let maniaMult = maniaMode ? 3 : 1;
    let total = clickVal * influenceMult * maniaMult;
    let isCrit = Math.random() < 0.05; // 5% Crit chance
    
    if (isCrit) { 
        total *= 5; 
        playSound('crit'); 
        // Crit Explosion
        for(let i=0; i<12; i++) createParticle(clientX, clientY, '', 'spark');
    } else { 
        playSound('click'); 
    }

    game.money += total;
    game.lifetimeEarnings += total;

    if (!maniaMode) {
        hype = Math.min(100, hype + 4);
        if (hype >= 100) startMania();
    }

    createParticle(clientX, clientY, "+" + formatNumber(total), 'text');
}

function startMania() {
    maniaMode = true; maniaTimer = 15;
    document.body.classList.add('mania-mode');
    document.getElementById('mania-text').innerText = "MARKET MANIA (3x CASH)";
    document.getElementById('mania-text').style.opacity = "1";
    document.getElementById('mania-text').style.color = "var(--purple)";
    playSound('crit');
    for(let i=0; i<30; i++) createParticle(0,0,'','confetti');
}

function endMania() {
    maniaMode = false; hype = 0;
    document.body.classList.remove('mania-mode');
    document.getElementById('mania-text').innerText = "MARKET STABLE";
    document.getElementById('mania-text').style.opacity = "0.4";
    document.getElementById('mania-text').style.color = "#fff";
}

// CSS-DRIVEN GOLDEN BILL
function spawnGoldenBill() {
    let bill = document.createElement('div');
    bill.className = 'golden-bill';
    
    // Spawn vertical position randomly
    let startY = Math.random() * (window.innerHeight - 200) + 100;
    bill.style.top = startY + "px";
    
    // Click Handler
    bill.onclick = (e) => {
        e.stopPropagation();
        let reward = game.money * 0.25;
        if(reward === 0) reward = 10000;
        
        game.money += reward;
        game.lifetimeEarnings += reward;
        
        // Visuals
        for(let i=0; i<20; i++) createParticle(e.clientX, e.clientY, '', 'spark');
        createParticle(e.clientX, e.clientY, "+"+formatNumber(reward), 'text');
        
        playSound('crit');
        bill.remove();
    };
    
    document.getElementById('event-layer').appendChild(bill);
    
    // Auto-remove after animation ends (12s roughly)
    setTimeout(() => { 
        if(bill.parentNode) bill.remove(); 
    }, 12000); 
}

// Buying Logic
function getCost(id, count) {
    let u = upgrades[id];
    let currentCost = u.baseCost * Math.pow(1.15, game.counts[id]);
    if (count === 1) return currentCost;
    let r = 1.15;
    return currentCost * (Math.pow(r, count) - 1) / (r - 1);
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
        
        // Spawn sparks at the shop item location
        let rect = document.getElementById(`upg-${id}`).getBoundingClientRect();
        for(let i=0; i<8; i++) {
            createParticle(rect.right - 50 + (Math.random()*40), rect.top + (rect.height/2), '', 'spark');
        }
        playSound('buy');
    }
}

// Prestige Logic
function openPrestige() {
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    let claimable = Math.max(0, potential - game.influence);
    
    document.getElementById('claimable-influence').innerText = formatNumber(claimable);
    document.getElementById('current-bonus-modal').innerText = formatNumber(game.influence * 10) + "%";
    document.getElementById('new-bonus-modal').innerText = formatNumber((game.influence + claimable) * 10) + "%";
    
    openModal('prestige-modal', '', '', false);
}

function confirmPrestige() {
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    if (potential > game.influence) {
        game.influence = potential;
        game.money = 0;
        game.counts = Array(upgrades.length).fill(0);
        closeModal('prestige-modal');
        saveLocal();
        renderShop();
        playSound('crit');
    }
}

// Main Loop
function gameLoop(currentTime) {
    let dt = (currentTime - lastTick) / 1000;
    if (dt > 86400) dt = 86400; if (dt < 0) dt = 0;
    lastTick = currentTime;

    // Income
    let rate = calculateIncome();
    if (rate > 0) {
        game.money += rate * dt;
        game.lifetimeEarnings += rate * dt;
    }

    // Mania & Hype
    if (maniaMode) {
        maniaTimer -= dt;
        if(Math.random() > 0.85) createParticle(0,0,'','confetti'); // Passive confetti
        if (maniaTimer <= 0) endMania();
    } else {
        hype = Math.max(0, hype - (5 * dt));
    }

    // Ticker Logic
    tickerTimer += dt;
    if(tickerTimer > 25) {
        let item = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
        let newsEl = document.getElementById('news-ticker');
        // Reset Animation hack
        newsEl.style.animation = 'none'; 
        newsEl.offsetHeight; /* trigger reflow */
        newsEl.innerText = item + " // " + item + " //";
        newsEl.style.animation = 'ticker 25s linear infinite';
        tickerTimer = 0;
    }

    // Golden Bill Spawner
    goldenBillTimer -= dt * 1000;
    if (goldenBillTimer <= 0) {
        spawnGoldenBill();
        goldenBillTimer = Math.random() * 30000 + 20000; // 20-50 seconds
    }

    // Draw Particles
    ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; 
        p.update(); 
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }

    updateUI(rate);
    
    // Auto Save
    autoSaveTimer += dt;
    if(autoSaveTimer > 5) { saveLocal(); autoSaveTimer = 0; }
    
    requestAnimationFrame(gameLoop);
}