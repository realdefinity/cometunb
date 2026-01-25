const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let lastTick = performance.now();
let particles = [];

const btnEl = document.getElementById('main-btn');
let btnTiltX = 0; let btnTiltY = 0; let btnScale = 1; let btnVelocity = 0; let isHovering = false;

function resize() { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; }
window.addEventListener('resize', resize);
resize();

btnEl.addEventListener('mouseenter', () => isHovering = true);
btnEl.addEventListener('mouseleave', () => { isHovering = false; btnTiltX = 0; btnTiltY = 0; });
btnEl.addEventListener('mousemove', (e) => {
    const rect = btnEl.getBoundingClientRect();
    btnTiltX = -(e.clientY - rect.top - rect.height/2) / 8;
    btnTiltY = (e.clientX - rect.left - rect.width/2) / 8;
});

function triggerClick(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    btnVelocity = -0.3; 

    let baseRate = 0;
    game.counts.forEach((c, i) => { if(upgrades[i]) baseRate += c * upgrades[i].baseRate; });
    let total = (1 + (baseRate * 0.05)) * (1 + (game.influence * 0.10)) * (maniaMode ? 3 : 1);
    
    let isCrit = Math.random() < 0.05;
    if (isCrit) { total *= 5; playSound('crit'); } else { playSound('click'); }

    game.money += total; game.lifetimeEarnings += total;
    if (!maniaMode) { hype = Math.min(100, hype + 4); if (hype >= 100) startMania(); }

    const rect = btnEl.getBoundingClientRect();
    const cx = e.clientX || rect.left + rect.width/2;
    const cy = e.clientY || rect.top + rect.height/2;
    createParticle(cx, cy, "+" + formatNumber(total), 'text');
    createParticle(cx, cy, '', 'shockwave'); 
    if(isCrit) createParticle(cx, cy, '', 'spark');
}
btnEl.addEventListener('pointerdown', triggerClick);

class Particle {
    constructor(x, y, text, type) {
        this.x = x; this.y = y; this.text = text; this.type = type; this.life = 1.0;
        if(type === 'text') {
            this.vx = (Math.random()-0.5)*4; this.vy = -5-Math.random()*5; this.gravity = 0.2; this.scale = 1;
            this.color = maniaMode ? '#fcd34d' : '#34d399';
        } else if (type === 'spark') {
            const angle = Math.random() * 6.28; const speed = Math.random()*15+5;
            this.vx = Math.cos(angle)*speed; this.vy = Math.sin(angle)*speed; this.gravity = 0.4; this.scale = Math.random()*3+1;
            this.color = Math.random()>0.5 ? '#fff' : (maniaMode ? '#f59e0b' : '#10b981');
        } else if (type === 'shockwave') {
            this.scale = 0.5; this.color = maniaMode ? 'rgba(252,211,77,' : 'rgba(16,185,129,';
            this.vx=0; this.vy=0;
        } else if (type === 'confetti') {
            this.x = Math.random()*width; this.y = -20; this.vx = (Math.random()-0.5)*5; this.vy = Math.random()*8+5;
            this.gravity = 0.05; this.scale = Math.random()*5+5; this.rotation = Math.random()*360;
            this.color = `hsl(${Math.random()>0.5?45:150}, 80%, 60%)`;
        }
    }
    update() {
        if (this.type === 'shockwave') { this.scale += 0.2; this.life -= 0.05; }
        else {
            this.x += this.vx; this.y += this.vy; if(this.gravity) this.vy += this.gravity;
            this.vx *= 0.95; this.vy *= 0.95;
            if(this.type === 'text') { this.life -= 0.015; this.scale += 0.01; }
            else if(this.type === 'spark') this.life -= 0.04;
            else this.life -= 0.005;
        }
    }
    draw() {
        if(this.life <= 0) return;
        ctx.save(); ctx.globalAlpha = this.life;
        if (this.type === 'shockwave') {
            ctx.translate(this.x, this.y); ctx.beginPath();
            ctx.strokeStyle = this.color + this.life + ')'; ctx.lineWidth = 8;
            ctx.arc(0, 0, this.scale * 30, 0, Math.PI*2); ctx.stroke();
        } else if (this.type === 'spark') {
            ctx.translate(this.x, this.y); ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.scale, 0, Math.PI*2); ctx.fill();
        } else if (this.type === 'confetti') {
            ctx.translate(this.x, this.y); ctx.rotate(this.rotation); ctx.fillStyle = this.color;
            ctx.fillRect(-this.scale/2, -this.scale/2, this.scale, this.scale);
        } else {
            ctx.translate(this.x, this.y); ctx.scale(this.scale, this.scale);
            ctx.font = "900 24px Outfit"; ctx.fillStyle = this.color;
            ctx.shadowColor = this.color; ctx.shadowBlur = 20; ctx.fillText(this.text, -20, 0);
        }
        ctx.restore();
    }
}

function createParticle(x, y, text, type) { particles.push(new Particle(x, y, text, type)); }
function startMania() { maniaMode = true; maniaTimer = 15; document.body.classList.add('mania-mode'); document.getElementById('mania-text').innerText = "MARKET MANIA (3x CASH)"; document.getElementById('mania-text').style.opacity = "1"; document.getElementById('mania-text').style.color = "var(--gold)"; playSound('crit'); for(let i=0; i<30; i++) createParticle(0,0,'','confetti'); }
function endMania() { maniaMode = false; hype = 0; document.body.classList.remove('mania-mode'); document.getElementById('mania-text').innerText = "MARKET STABLE"; document.getElementById('mania-text').style.opacity = "0.5"; document.getElementById('mania-text').style.color = "#fff"; }

let activeBills = [];
function spawnGoldenBill() {
    let bill = document.createElement('div'); bill.className = 'golden-bill'; bill.innerText = "$$$";
    let startY = Math.random() * (height - 300) + 150;
    bill.style.top = startY + "px"; bill.style.left = "-150px";
    document.getElementById('event-layer').appendChild(bill);
    let state = { el: bill, x: -150, vx: Math.random()*2+3, time: 0, amp: Math.random()*40+20, freq: Math.random()*0.04+0.02, rot: Math.random()*360, dead: false };
    activeBills.push(state);
    
    const collect = (e) => {
        e.stopPropagation(); e.preventDefault();
        state.dead = true; bill.remove();
        let reward = Math.max(500, game.money * 0.25);
        game.money += reward; game.lifetimeEarnings += reward;
        let rect = bill.getBoundingClientRect();
        let ex = e.clientX || (rect.left + rect.width/2); let ey = e.clientY || (rect.top + rect.height/2);
        for(let i=0; i<15; i++) createParticle(ex, ey, '', 'spark');
        createParticle(ex, ey, "+"+formatNumber(reward), 'text');
        let bal = document.getElementById('balance-el'); bal.classList.add('pulse'); setTimeout(() => bal.classList.remove('pulse'), 200);
        playSound('crit');
    };
    bill.addEventListener('pointerdown', collect);
}

function gameLoop(currentTime) {
    let dt = (currentTime - lastTick) / 1000; if (dt > 86400) dt = 86400; if (dt < 0) dt = 0; lastTick = currentTime;

    let targetScale = isHovering ? 1.05 : 1.0;
    let force = (targetScale - btnScale) * 0.2;
    btnVelocity = (btnVelocity + force) * 0.6;
    btnScale += btnVelocity;
    if (isNaN(btnScale) || btnScale < 0.1) { btnScale = 1; btnVelocity = 0; }
    btnEl.style.transform = `rotateX(${btnTiltX}deg) rotateY(${btnTiltY}deg) scale(${btnScale})`;

    let rate = 0;
    game.counts.forEach((count, i) => { if(upgrades[i]) rate += count * upgrades[i].baseRate; });
    rate *= (1 + (game.influence * 0.10)) * (maniaMode ? 3 : 1);
    if (rate > 0) { let amount = rate * dt; game.money += amount; game.lifetimeEarnings += amount; }

    if (maniaMode) { maniaTimer -= dt; if(Math.random() > 0.85) createParticle(0,0,'','confetti'); if (maniaTimer <= 0) endMania(); }
    else hype = Math.max(0, hype - (5 * dt));

    tickerTimer += dt;
    if(tickerTimer > 25) {
        let item = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
        let newsEl = document.getElementById('news-ticker');
        newsEl.innerText = item + " // " + item + " //";
        newsEl.style.animation = 'none'; newsEl.offsetHeight; newsEl.style.animation = 'ticker 25s linear infinite';
        tickerTimer = 0;
    }

    goldenBillTimer -= dt * 1000;
    if (goldenBillTimer <= 0) { spawnGoldenBill(); goldenBillTimer = Math.random() * 30000 + 15000; }

    activeBills = activeBills.filter(b => {
        if(b.dead) return false;
        b.x += b.vx; b.time += 1;
        let bob = Math.sin(b.time * b.freq) * b.amp;
        let rot = Math.sin(b.time * 0.05 + b.rot) * 15;
        b.el.style.transform = `translate(${b.x}px, ${bob}px) rotate(${rot}deg)`;
        if(b.x > width + 150) { b.el.remove(); return false; }
        return true;
    });

    ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.update(); p.draw(); if (p.life <= 0) particles.splice(i, 1); }

    updateUI(rate);
    autoSaveTimer += dt; if(autoSaveTimer > 5) { saveLocal(); autoSaveTimer = 0; }
    requestAnimationFrame(gameLoop);
}