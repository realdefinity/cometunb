const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let lastTick = performance.now();
let particles = [];

// --- BUTTON PHYSICS VARS ---
let btnTiltX = 0;
let btnTiltY = 0;
let btnScale = 1;
let btnVelocity = 0;
let isHovering = false;

// --- RESIZE LOGIC ---
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// --- MOUSE TRACKING FOR TILT ---
const btnEl = document.getElementById('main-btn');
btnEl.addEventListener('mouseenter', () => isHovering = true);
btnEl.addEventListener('mouseleave', () => {
    isHovering = false;
    btnTiltX = 0;
    btnTiltY = 0;
});
btnEl.addEventListener('mousemove', (e) => {
    const rect = btnEl.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Smoothly update target tilt
    btnTiltX = -y / 10;
    btnTiltY = x / 10;
});

// --- PARTICLE SYSTEM ---
class Particle {
    constructor(x, y, text, type) {
        this.x = x; this.y = y;
        this.text = text;
        this.type = type; 
        this.life = 1.0;
        
        if(type === 'text') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = -5 - Math.random() * 5;
            this.gravity = 0.2;
            this.drag = 0.96;
            this.scale = 1;
            this.color = maniaMode ? '#d8b4fe' : '#6ee7b7'; // Lighter colors for text
        } else if (type === 'spark') {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 15 + 5; // Faster sparks
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.4;
            this.drag = 0.85;
            this.scale = Math.random() * 3 + 1;
            this.decay = 0.04;
            this.color = Math.random() > 0.5 ? '#fff' : (maniaMode ? '#d400ff' : '#00ffaa');
        } else if (type === 'shockwave') { // NEW SHOCKWAVE
            this.scale = 0.5;
            this.maxScale = 4.0;
            this.decay = 0.04; // Fast fade
            this.color = maniaMode ? 'rgba(191,0,255,' : 'rgba(0,255,170,';
            this.vx = 0; this.vy = 0;
            this.lineWidth = 10;
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
            this.color = `hsl(${Math.random()*360}, 100%, 60%)`;
            this.decay = 0.005;
        }
    }

    update() {
        if (this.type === 'shockwave') {
            this.scale += 0.15; // Expand fast
            this.lineWidth *= 0.9; // Thin out
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
            this.scale += 0.01; // Text grows slightly
        }
    }

    draw() {
        if(this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        
        if (this.type === 'shockwave') {
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.strokeStyle = this.color + this.life + ')';
            ctx.lineWidth = this.lineWidth;
            ctx.arc(0, 0, this.scale * 30, 0, Math.PI*2);
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
            ctx.font = "900 24px Outfit"; // Bolder font
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
            ctx.fillText(this.text, -20, 0);
        }
        ctx.restore();
    }
}

// --- LOGIC ---
function calculateIncome() {
    let base = 0;
    game.counts.forEach((count, i) => { if(upgrades[i]) base += count * upgrades[i].baseRate; });
    let influenceMult = 1 + (game.influence * 0.10); 
    let maniaMult = maniaMode ? 3 : 1;
    return base * influenceMult * maniaMult;
}

function createParticle(x, y, text, type) { particles.push(new Particle(x, y, text, type)); }

// --- CLICK ACTION ---
function clickAction(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if(audioCtx.state === 'suspended') audioCtx.resume();

    const rect = btnEl.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || (rect.left + rect.width/2);
    const clientY = e.clientY || e.touches?.[0]?.clientY || (rect.top + rect.height/2);

    // KICK THE BUTTON PHYSICS
    // We impart negative velocity to simulate being hit inward
    btnVelocity = -0.15; 

    // Update Income
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
    createParticle(clientX, clientY, '', 'shockwave'); // Add Shockwave
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

// --- GOLDEN BILL LOGIC ---
let activeBills = [];

function spawnGoldenBill() {
    let bill = document.createElement('div');
    bill.className = 'golden-bill';
    bill.innerText = "$$$";
    
    // Position
    let startY = Math.random() * (window.innerHeight - 300) + 150;
    bill.style.top = startY + "px";
    bill.style.left = "-150px"; 
    document.getElementById('event-layer').appendChild(bill);

    let state = {
        el: bill,
        x: -150,
        y: startY,
        vx: Math.random() * 3 + 2, // Slightly slower, smoother speed
        time: 0,
        amplitude: Math.random() * 60 + 30, // Bigger floaty waves
        frequency: Math.random() * 0.02 + 0.01, // Slower waves
        rotation: (Math.random() - 0.5) * 15
    };
    activeBills.push(state);

    bill.onclick = (e) => {
        e.stopPropagation();
        state.dead = true; 
        bill.remove();

        // REWARD LOGIC: $500 Minimum if broke
        let reward = game.money * 0.25;
        if(reward < 500) reward = 500; 

        game.money += reward;
        game.lifetimeEarnings += reward;
        
        for(let i=0; i<15; i++) createParticle(e.clientX, e.clientY, '', 'spark');
        createParticle(e.clientX, e.clientY, "+"+formatNumber(reward), 'text');
        
        let bal = document.getElementById('balance-el');
        bal.classList.add('pulse');
        setTimeout(() => bal.classList.remove('pulse'), 200);
        
        playSound('crit');
    };
}

// --- MAIN LOOP ---
function gameLoop(currentTime) {
    let dt = (currentTime - lastTick) / 1000;
    if (dt > 86400) dt = 86400; if (dt < 0) dt = 0;
    lastTick = currentTime;

    // 1. BUTTON PHYSICS (Spring System)
    // Target scale is 1.0 normally, 1.05 if hovering
    let targetScale = isHovering ? 1.05 : 1.0;
    // Spring stiffness (tension) and damping (friction)
    let tension = 0.15; 
    let damping = 0.75; 
    
    // Physics Math
    let force = (targetScale - btnScale) * tension;
    btnVelocity += force;
    btnVelocity *= damping;
    btnScale += btnVelocity;

    // Apply Transform directly to DOM element
    btnEl.style.transform = `rotateX(${btnTiltX}deg) rotateY(${btnTiltY}deg) scale(${btnScale})`;

    // 2. Game Income
    let rate = calculateIncome();
    if (rate > 0) {
        let amount = rate * dt;
        game.money += amount;
        game.lifetimeEarnings += amount;
    }

    if (maniaMode) {
        maniaTimer -= dt;
        if(Math.random() > 0.85) createParticle(0,0,'','confetti');
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

    // 3. Animate Golden Bills
    activeBills = activeBills.filter(b => {
        if(b.dead) return false;
        b.x += b.vx;
        b.time += 1;
        
        let bob = Math.sin(b.time * b.frequency) * b.amplitude;
        let rot = Math.sin(b.time * 0.02) * 15; // Gentle sway

        b.el.style.transform = `translate(${b.x}px, ${bob}px) rotate(${rot}deg)`;

        if(b.x > window.innerWidth + 150) {
            b.el.remove();
            return false;
        }
        return true;
    });

    // 4. Particles
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