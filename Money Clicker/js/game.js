const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: true });
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
        } else if (type === 'spark') {
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
        } else if (type === 'confetti') {
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
        this.x += this.vx; this.y += this.vy;
        this.vy += this.gravity; this.vx *= this.drag; this.vy *= this.drag;
        this.life -= this.decay;
        if (this.type === 'confetti') this.rotation += this.rotSpeed;
    }
    draw() {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        if (this.type === 'spark') {
            ctx.translate(this.x, this.y); ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.scale, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'confetti') {
            ctx.translate(this.x, this.y); ctx.rotate(this.rotation * Math.PI / 180); ctx.fillStyle = this.color;
            ctx.fillRect(-this.scale/2, -this.scale/2, this.scale, this.scale * 1.5);
        } else if (this.type === 'text') {
            ctx.translate(this.x, this.y); ctx.scale(this.scale, this.scale); ctx.font = "800 28px Outfit";
            ctx.textAlign = "center"; ctx.lineJoin = "round"; ctx.lineWidth = 4;
            ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.strokeText(this.text, 0, 0);
            ctx.fillStyle = maniaMode ? '#eab308' : '#22c55e'; ctx.fillText(this.text, 0, 0);
        }
        ctx.restore();
    }
}

function createParticle(x, y, text, type) {
    if(particles.length > 200) particles.shift();
    particles.push(new Particle(x, y, text, type));
}

/**
 * CALCULATE TOTAL PASSIVE INCOME
 * Includes Assets, Reputation bonus, Mania multiplier, and CEO staff bonus.
 */
function calculateIncome() {
    let base = 0;
    game.counts.forEach((count, i) => { 
        if(upgrades[i]) {
            const assetLevelMult = game.levels[i] || 1;
            base += count * upgrades[i].baseRate * assetLevelMult; 
        }
    });
    
    let influenceMult = 1 + (game.influence * 0.10); 
    let maniaMult = maniaMode ? 2 : 1; 
    
    // STAFF: Executive CEO (ID: 3) provides a 1.5x global multiplier
    let ceoMult = game.staff.includes(3) ? 1.5 : 1.0; 
    
    return base * influenceMult * maniaMult * ceoMult;
}

/**
 * MAIN CLICK LOGIC
 * Calculates value based on passive income, reputation, and critical hits.
 */
function clickAction(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    let x, y;
    if (e.touches && e.touches.length > 0) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
    else { x = e.clientX; y = e.clientY; }

    let baseRate = 0;
    game.counts.forEach((c, i) => { 
        if(upgrades[i]) {
            const assetLevelMult = game.levels[i] || 1;
            baseRate += c * upgrades[i].baseRate * assetLevelMult; 
        }
    });
    
    // Click value is 1 + 5% of passive base
    let clickVal = (1 + (baseRate * 0.05));
    let influenceMult = 1 + (game.influence * 0.10);
    let maniaMult = maniaMode ? 2 : 1;
    
    // STAFF: Executive CEO applies to clicks as well
    let ceoMult = game.staff.includes(3) ? 1.5 : 1.0;
    let total = clickVal * influenceMult * maniaMult * ceoMult;

    // STAFF: Quant Analyst (ID: 1) adds +10% Critical Hit chance
    let baseCritChance = 0.04;
    if (game.staff.includes(1)) baseCritChance += 0.10; 
    
    let isCrit = Math.random() < baseCritChance;
    if (isCrit) { 
        total *= 10; 
        playSound('crit'); 
        for(let i=0; i<15; i++) createParticle(x, y, '', 'spark');
    } else { 
        playSound('click'); 
    }

    game.money += total;
    game.lifetimeEarnings += total;
    
    // Particle text uses globally available formatNumber from ui.js
    createParticle(x, y - 50, "+" + formatNumber(total), 'text');
    
    if (!maniaMode) {
        hype = Math.min(100, hype + 5);
        if (hype >= 100) startMania();
    }
    
    analytics.clickHistory.push(Date.now());
}

/**
 * SPAWN GOLDEN BILL EVENT
 * Includes logic for manual collection and Intern automation.
 */
function spawnGoldenBill() {
    let bill = document.createElement('div');
    bill.className = 'golden-bill';
    
    // Random Position
    const padding = 100;
    bill.style.left = (padding + Math.random() * (window.innerWidth - padding * 2)) + 'px';
    bill.style.top = (padding + Math.random() * (window.innerHeight - padding * 2)) + 'px';
    
    document.getElementById('event-layer').appendChild(bill);

    const collect = (x, y) => {
        // Bonus is 20% of current wealth or $5k minimum
        let reward = Math.max(5000, game.money * 0.20);
        game.money += reward;
        game.lifetimeEarnings += reward;
        
        for(let i=0; i<20; i++) createParticle(x, y, '', 'spark');
        createParticle(x, y, "MARKET BONUS!", 'text');
        playSound('crit');
        
        if(bill.parentNode) bill.remove();
    };
    
    // STAFF: Junior Intern (ID: 0) automates collection
    if (game.staff.includes(0)) {
        setTimeout(() => {
            if (bill.parentNode) {
                let rect = bill.getBoundingClientRect();
                collect(rect.left + rect.width/2, rect.top + rect.height/2);
                pushNews("JUNIOR INTERN PROCESSED MARKET DIVIDEND.");
            }
        }, 1200); // Small delay for visual flair
    }

    bill.onmousedown = bill.ontouchstart = (e) => {
        e.stopPropagation(); e.preventDefault();
        let rect = bill.getBoundingClientRect();
        collect(rect.left + rect.width/2, rect.top + rect.height/2);
    };
    
    // Expiry
    setTimeout(() => { if(bill.parentNode) bill.remove(); }, 8000); 
}

/**
 * GAME LOOP
 * Handles physics updates and canvas drawing.
 */
function gameLoop(now) {
    const dt = now - lastTick;
    lastTick = now;

    ctx.clearRect(0, 0, width, height);

    // Filter and Update Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(gameLoop);
}

// Initialize Loop
requestAnimationFrame(gameLoop);