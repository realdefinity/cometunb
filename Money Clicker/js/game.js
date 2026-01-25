const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: true }); // Optimized context
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
        
        // Physics randomization based on type
        if(type === 'text') {
            this.text = text;
            this.vx = (Math.random() - 0.5) * 1.5; // Slight drift
            this.vy = -2 - Math.random();          // Float up
            this.gravity = 0;
            this.drag = 0.98;
            this.decay = 0.015;
            this.scale = 1;
            this.color = '#fff'; 
        } 
        else if (type === 'spark') {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 15 + 5;  // Fast explosion
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.5;                    // Heavy gravity
            this.drag = 0.85;                      // High air resistance (snappy)
            this.decay = 0.03 + Math.random() * 0.02;
            this.scale = Math.random() * 3 + 2;
            // Randomize color between Gold, Green, and White
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
        // Apply Physics
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.life -= this.decay;

        if (this.type === 'confetti') {
            this.rotation += this.rotSpeed;
        } else if (this.type === 'text') {
            this.scale += 0.005; // Subtle grow
        }
    }

    draw() {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life; // Fade out

        if (this.type === 'spark') {
            ctx.translate(this.x, this.y);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.scale, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.type === 'confetti') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.scale/2, -this.scale/2, this.scale, this.scale * 1.5);
        } 
        else if (this.type === 'text') {
            ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);
            
            // High-End Text Rendering
            ctx.font = "800 28px Outfit";
            ctx.textAlign = "center";
            
            // Text Stroke (Outline) for visibility
            ctx.lineJoin = "round";
            ctx.lineWidth = 4;
            ctx.strokeStyle = "rgba(0,0,0,0.8)";
            ctx.strokeText(this.text, 0, 0);
            
            // Text Fill
            ctx.fillStyle = maniaMode ? '#eab308' : '#22c55e';
            ctx.fillText(this.text, 0, 0);
        }
        ctx.restore();
    }
}

function createParticle(x, y, text, type) {
    // Limit particles to prevent crash on low-end devices
    if(particles.length > 200) particles.shift();
    particles.push(new Particle(x, y, text, type));
}


// --- LOGIC CALCULATIONS ---
function calculateIncome() {
    let base = 0;
    // Sum up buildings
    game.counts.forEach((count, i) => { 
        if(upgrades[i]) base += count * upgrades[i].baseRate; 
    });
    
    // Multipliers
    let influenceMult = 1 + (game.influence * 0.10); 
    let maniaMult = maniaMode ? 2 : 1; // Mania is 2x
    
    return base * influenceMult * maniaMult;
}

// --- INPUT HANDLING (Clicking) ---
function clickAction(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if(audioCtx.state === 'suspended') audioCtx.resume();

    // 1. Get Coordinates
    // Support both mouse and touch
    let x, y;
    if (e.touches && e.touches.length > 0) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
    } else {
        x = e.clientX;
        y = e.clientY;
    }

    // 2. Calculate Click Value
    let baseRate = 0;
    game.counts.forEach((c, i) => { if(upgrades[i]) baseRate += c * upgrades[i].baseRate; });
    
    // Base Click is 1 + 5% of your automatic income
    let clickVal = (1 + (baseRate * 0.05));
    let influenceMult = 1 + (game.influence * 0.10);
    let maniaMult = maniaMode ? 2 : 1;
    let total = clickVal * influenceMult * maniaMult;

    // 3. Crit Logic (Critical Hit)
    let isCrit = Math.random() < 0.04; // 4% Chance
    if (isCrit) { 
        total *= 10; 
        playSound('crit'); 
        // Explosion of sparks
        for(let i=0; i<15; i++) createParticle(x, y, '', 'spark');
    } else { 
        playSound('click'); 
    }

    // 4. Update Data
    game.money += total;
    game.lifetimeEarnings += total;

    // 5. Visuals
    // Spawn text particle
    createParticle(x, y - 50, "+" + formatNumber(total), 'text');
    
    // Mania Progress
    if (!maniaMode) {
        hype = Math.min(100, hype + 5); // +5% hype per click
        if (hype >= 100) startMania();
    }
}


// --- EVENTS ---
function startMania() {
    maniaMode = true; 
    maniaTimer = 20; // 20 Seconds
    document.body.classList.add('mania-mode');
    playSound('crit'); // Sound cue
    
    // Initial Confetti Blast
    for(let i=0; i<40; i++) createParticle(0,0,'','confetti');
}

function endMania() {
    maniaMode = false; 
    hype = 0;
    document.body.classList.remove('mania-mode');
}

function spawnGoldenBill() {
    // Create the Chip Element
    let bill = document.createElement('div');
    bill.className = 'golden-bill';
    
    // Append to the Event Layer (Z-Index 101)
    document.getElementById('event-layer').appendChild(bill);
    
    // Click Handler
    bill.onmousedown = bill.ontouchstart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Reward: 20% of current bank or 5000 min
        let reward = Math.max(5000, game.money * 0.20);
        game.money += reward;
        game.lifetimeEarnings += reward;
        
        // Visuals
        let rect = bill.getBoundingClientRect();
        let centerX = rect.left + rect.width/2;
        let centerY = rect.top + rect.height/2;
        
        for(let i=0; i<20; i++) createParticle(centerX, centerY, '', 'spark');
        createParticle(centerX, centerY, "BONUS!", 'text');
        
        playSound('crit');
        bill.remove();
    };
    
    // Cleanup if missed (Sync with CSS animation duration)
    setTimeout(() => { 
        if(bill.parentNode) bill.remove(); 
    }, 10000); 
}

// --- BUYING LOGIC (Math) ---
function getCost(id, count) {
    let u = upgrades[id];
    let currentCost = u.baseCost * Math.pow(1.15, game.counts[id]);
    if (count === 1) return currentCost;
    
    // Geometric series sum for bulk buying
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
        
        // Visual Feedback at button location
        let btn = document.getElementById(`upg-${id}`);
        if(btn) {
            let rect = btn.getBoundingClientRect();
            // Sparks on the right side of the button
            for(let i=0; i<5; i++) {
                createParticle(rect.right - 40, rect.top + rect.height/2, '', 'spark');
            }
        }
        playSound('buy');
    }
}

// --- PRESTIGE LOGIC ---
function openPrestige() {
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    let claimable = Math.max(0, potential - game.influence);
    
    // Update Modal Text
    const elClaim = document.getElementById('claimable-influence');
    const elCur = document.getElementById('current-bonus-modal');
    const elNew = document.getElementById('new-bonus-modal');
    
    if(elClaim) elClaim.innerText = formatNumber(claimable);
    if(elCur) elCur.innerText = formatNumber(game.influence * 10) + "%";
    if(elNew) elNew.innerText = formatNumber((game.influence + claimable) * 10) + "%";
    
    openModal('prestige-modal');
}

function confirmPrestige() {
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    if (potential > game.influence) {
        game.influence = potential;
        // Reset Progress
        game.money = 0;
        game.counts = Array(upgrades.length).fill(0);
        
        closeModal('prestige-modal');
        saveLocal();
        renderShop(); // Refresh shop UI
        playSound('crit'); // Success sound
    }
}

// --- MAIN GAME LOOP ---
function gameLoop(currentTime) {
    // Delta Time Calculation (Frame Independence)
    let dt = (currentTime - lastTick) / 1000;
    if (dt > 1) dt = 1; // Cap at 1 second to prevent massive jumps on tab switching
    lastTick = currentTime;

    // 1. Calculate & Add Income
    let rate = calculateIncome();
    if (rate > 0) {
        game.money += rate * dt;
        game.lifetimeEarnings += rate * dt;
    }

    // 2. Handle Mania/Hype Decay
    if (maniaMode) {
        maniaTimer -= dt;
        // Passive confetti stream during mania
        if(Math.random() > 0.9) createParticle(width/2, height, '', 'confetti'); 
        if (maniaTimer <= 0) endMania();
    } else {
        hype = Math.max(0, hype - (10 * dt)); // Decay 10% per second
    }

    // 3. News Ticker Timer
    tickerTimer += dt;
    if(tickerTimer > 25) {
        let item = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
        let newsEl = document.getElementById('news-content');
        if(newsEl) {
             // Reset CSS Animation
            newsEl.style.animation = 'none'; 
            newsEl.offsetHeight; /* Trigger Reflow */
            newsEl.innerText = item;
            newsEl.style.animation = 'ticker 25s linear infinite';
        }
        tickerTimer = 0;
    }

    // 4. Bonus Drop Timer
    goldenBillTimer -= dt * 1000;
    if (goldenBillTimer <= 0) {
        spawnGoldenBill();
        goldenBillTimer = Math.random() * 40000 + 20000; // 20-60 Seconds
    }

    // 5. Draw Particles
    ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; 
        p.update(); 
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }

    // 6. Update HTML UI
    updateUI(rate);
    
    // 7. Auto Save (Every 10 seconds)
    autoSaveTimer += dt;
    if(autoSaveTimer > 10) { saveLocal(); autoSaveTimer = 0; }
    
    requestAnimationFrame(gameLoop);
}