const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let lastTick = performance.now();
let particles = [];

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor(x, y, text, type) {
        this.x = x; this.y = y;
        this.text = text;
        this.type = type; 
        this.life = 1.0;
        
        if(type === 'text') {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = -4 - Math.random() * 4;
            this.gravity = 0.15;
            this.drag = 0.96;
            this.scale = 1;
            this.color = maniaMode ? '#bf00ff' : '#00ffaa';
        } else if (type === 'spark') {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 12 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.5;
            this.drag = 0.88;
            this.scale = Math.random() * 3 + 1;
            this.decay = 0.03;
            this.color = Math.random() > 0.5 ? '#fff' : (maniaMode ? '#d400ff' : '#00ffaa');
        } else if (type === 'ripple') {
            this.scale = 0.1;
            this.maxScale = 3.0;
            this.decay = 0.02;
            this.color = '#fff';
            this.vx = 0; this.vy = 0;
        } else if (type === 'confetti') {
            this.x = Math.random() * width;
            this.y = -20;
            this.vx = (Math.random() - 0.5) * 5;
            this.vy = Math.random() * 8 + 5;
            this.gravity = 0.05;
            this.drag = 0.98;
            this.scale = Math.random() * 5 + 5;
            this.rotation = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 10;
            this.color = `hsl(${Math.random()*360}, 100%, 50%)`;
            this.decay = 0.005;
        }
    }

    update() {
        if (this.type === 'ripple') {
            this.scale += (this.maxScale - this.scale) * 0.1;
            this.life -= this.decay;
        } else if (this.type === 'confetti') {
            this.x += this.vx; this.y += this.vy; this.vy += this.gravity;
            this.vx *= this.drag;
            this.rotation += this.rotSpeed;
            this.life -= this.decay;
        } else if (this.type === 'spark') {
             this.x += this.vx; this.y += this.vy; this.vy += this.gravity;
             this.vx *= this.drag; this.vy *= this.drag;
             this.life -= this.decay;
        } else {
            this.x += this.vx; this.y += this.vy; this.vy += this.gravity;
            this.vx *= this.drag; this.vy *= this.drag;
            this.life -= 0.015;
            this.scale += 0.01;
        }
    }

    draw() {
        if(this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        
        if (this.type === 'ripple') {
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.arc(0, 0, this.scale * 40, 0, Math.PI*2);
            ctx.stroke();
        } else if (this.type === 'spark') {
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
        } else {
            ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);
            ctx.font = "800 22px Outfit";
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
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

    const btn = document.getElementById('main-btn');
    const rect = btn.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || (rect.left + rect.width/2);
    const clientY = e.clientY || e.touches?.[0]?.clientY || (rect.top + rect.height/2);
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    
    btn.style.transform = `rotateX(${-y / 8}deg) rotateY(${x / 8}deg) scale(0.92)`;
    setTimeout(() => {
        btn.style.transform = `rotateX(${-y / 12}deg) rotateY(${x / 12}deg) scale(1.02)`;
    }, 80);

    let baseRate = 0;
    game.counts.forEach((c, i) => { if(upgrades[i]) baseRate += c * upgrades[i].baseRate; });
    
    let clickVal = (1 + (baseRate * 0.05));
    let influenceMult = 1 + (game.influence * 0.10);
    let maniaMult = maniaMode ? 3 : 1;
    let total = clickVal * influenceMult * maniaMult;
    let isCrit = Math.random() < 0.05;
    if (isCrit) { total *= 5; playSound('crit'); createParticle(clientX, clientY, '', 'spark'); }
    else { playSound('click'); }

    game.money += total;
    game.lifetimeEarnings += total;

    if (!maniaMode) {
        hype = Math.min(100, hype + 4);
        if (hype >= 100) startMania();
    }

    createParticle(clientX, clientY, "+" + formatNumber(total), 'text');
    createParticle(clientX, clientY, '', 'ripple');
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
    document.getElementById('mania-text').style.opacity = "0.5";
    document.getElementById('mania-text').style.color = "#fff";
}

// --- FIXED GOLDEN BILL LOGIC ---
function spawnGoldenBill() {
    let bill = document.createElement('div');
    bill.className = 'golden-bill';
    bill.innerText = "$$$";
    
    // 1. Set Random Vertical Start (Avoid very top/bottom)
    let startY = Math.random() * (window.innerHeight - 200) + 100;
    bill.style.top = startY + "px";
    
    // 2. Start Off-screen Left
    let currentX = -150;
    bill.style.left = currentX + "px";

    // 3. Random Speed (Faster = Harder)
    // Between 4 and 10 pixels per frame (approx 240px/s to 600px/s)
    let speed = Math.random() * 6 + 4; 

    let startTime = Date.now();
    
    // 4. Movement Loop
    let billInterval = setInterval(() => {
        if(!bill.parentNode) { clearInterval(billInterval); return; }
        
        // Move Right
        currentX += speed;
        bill.style.left = currentX + "px";

        // Bob up and down (Faster bobbing for difficulty)
        let elapsed = (Date.now() - startTime) / 1000;
        bill.style.marginTop = (Math.sin(elapsed * 10) * 30) + "px";

        // Despawn if off-screen Right
        if (currentX > window.innerWidth) {
            bill.remove();
            clearInterval(billInterval);
        }
    }, 16); // ~60fps

    bill.onclick = (e) => {
        e.stopPropagation();
        clearInterval(billInterval); // Stop moving immediately
        
        let reward = game.money * 0.25;
        if(reward === 0) reward = 10000;
        game.money += reward;
        game.lifetimeEarnings += reward;
        
        for(let i=0; i<15; i++) createParticle(e.clientX, e.clientY, '', 'spark');
        createParticle(e.clientX, e.clientY, "+"+formatNumber(reward), 'text');
        
        let bal = document.getElementById('balance-el');
        bal.classList.add('pulse');
        setTimeout(() => bal.classList.remove('pulse'), 200);
        
        playSound('crit');
        bill.remove();
    };
    
    document.getElementById('event-layer').appendChild(bill);
}

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
        
        let rect = document.getElementById(`upg-${id}`).getBoundingClientRect();
        for(let i=0; i<8; i++) {
            createParticle(rect.right - 50 + (Math.random()*40), rect.top + (rect.height/2), '', 'spark');
        }
        playSound('buy');
    }
}

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

function gameLoop(currentTime) {
    let dt = (currentTime - lastTick) / 1000;
    if (dt > 86400) dt = 86400; if (dt < 0) dt = 0;
    lastTick = currentTime;

    let rate = calculateIncome();
    if (rate > 0) {
        let amount = rate * dt;
        game.money += amount;
        game.lifetimeEarnings += amount;
    }

    if (maniaMode) {
        maniaTimer -= dt;
        if(Math.random() > 0.8) createParticle(0,0,'','confetti');
        if (maniaTimer <= 0) endMania();
    } else {
        hype = Math.max(0, hype - (5 * dt));
    }

    tickerTimer += dt;
    if(tickerTimer > 25) {
        let item = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
        let newsEl = document.getElementById('news-ticker');
        newsEl.innerText = item + " // " + item + " //";
        newsEl.style.animation = 'none'; newsEl.offsetHeight; 
        newsEl.style.animation = 'ticker 25s linear infinite';
        tickerTimer = 0;
    }

    goldenBillTimer -= dt * 1000;
    if (goldenBillTimer <= 0) {
        spawnGoldenBill();
        goldenBillTimer = Math.random() * 30000 + 15000;
    }

    ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; p.update(); p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }

    updateUI(rate);
    autoSaveTimer += dt;
    if(autoSaveTimer > 5) { saveLocal(); autoSaveTimer = 0; }
    requestAnimationFrame(gameLoop);
}