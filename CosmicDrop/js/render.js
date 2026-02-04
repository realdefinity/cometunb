const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');

window.drawOrb = function(ctx, x, y, r, idx, animScale = 1, squash = 1, flash = 0) {
    if(animScale <= 0) return;
    const o = window.ORBS[idx];
    
    // Deform w/h based on squash
    const w = r * animScale * (1/squash);
    const h = r * animScale * squash;

    ctx.save();
    ctx.translate(x, y);
    const spin = window.Game.time * 0.02 + idx;
    ctx.rotate(spin);

    // 1. Outer Glow
    ctx.shadowBlur = 30;
    ctx.shadowColor = o.glow;
    
    // 2. Main Body
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fillStyle = o.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Inner Depth Gradient
    const grad = ctx.createRadialGradient(-w*0.3, -h*0.3, 0, 0, 0, w);
    grad.addColorStop(0, 'rgba(255,255,255,0.2)');
    grad.addColorStop(0.5, o.color);
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = grad;
    ctx.fill();

    // 4. Rim Light (Bottom Crescent)
    ctx.rotate(-spin); // Lock rotation for lighting
    ctx.beginPath();
    ctx.ellipse(0, h*0.05, w*0.9, h*0.9, 0, 0, Math.PI); // Bottom half
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();

    // 5. Glossy Shine (Top Left)
    ctx.beginPath();
    ctx.ellipse(-w*0.35, -h*0.35, w*0.2, h*0.12, Math.PI/4, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 6. Center Pulse (Core)
    const pulse = 1 + Math.sin(window.Game.time * 0.1 + idx) * 0.03;
    ctx.beginPath();
    ctx.ellipse(0, 0, w*0.3*pulse, h*0.3*pulse, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    // 7. Flash effect (on merge)
    if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

window.loop = function() {
    Matter.Engine.update(window.engine, 1000 / 60);
    ctx.clearRect(0, 0, window.Game.width, window.Game.height);

    if (window.Game.state !== 'MENU') {
        window.Game.time++;
        window.Game.checkDanger();

        // Draw Bodies
        const bodies = Matter.Composite.allBodies(window.engine.world);
        bodies.forEach(b => {
            if (!b.isStatic) {
                window.drawOrb(ctx, b.position.x, b.position.y, b.circleRadius, b.planetIdx, b.scale, b.squash, b.flash);
            }
        });

        // Draw Aim Guide
        if (window.Game.state === 'PLAYING' && window.Game.canDrop) {
            const r = window.ORBS[window.Game.currentIdx].r;
            const x = Math.max(r, Math.min(window.Game.width - r, window.Game.mouseX));
            
            // Dashed Line
            ctx.beginPath();
            ctx.moveTo(x, window.SETTINGS.spawnY);
            ctx.lineTo(x, window.Game.height);
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 8]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Ghost Orb
            ctx.globalAlpha = 0.6;
            window.drawOrb(ctx, x, window.SETTINGS.spawnY, r, window.Game.currentIdx);
            ctx.globalAlpha = 1;
        }

        // Effects
        for (let i = window.Game.shockwaves.length - 1; i >= 0; i--) {
            let s = window.Game.shockwaves[i];
            s.r += 8; s.alpha -= 0.03;
            if (s.alpha <= 0) { window.Game.shockwaves.splice(i, 1); continue; }
            ctx.strokeStyle = s.color; ctx.lineWidth = 4;
            ctx.globalAlpha = s.alpha;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.stroke();
            ctx.globalAlpha = 1;
        }

        for (let i = window.Game.particles.length - 1; i >= 0; i--) {
            let p = window.Game.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            if (p.life <= 0) { window.Game.particles.splice(i, 1); continue; }
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1;
        }

        for (let i = window.Game.popups.length - 1; i >= 0; i--) {
            let p = window.Game.popups[i];
            p.y += p.vy; p.life -= 0.015;
            if (p.life <= 0) { window.Game.popups.splice(i, 1); continue; }
            ctx.fillStyle = 'white'; ctx.globalAlpha = p.life;
            ctx.font = "900 32px Rajdhani"; ctx.textAlign = "center";
            ctx.shadowColor = 'black'; ctx.shadowBlur = 10;
            ctx.fillText(p.text, p.x, p.y);
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
    }
    requestAnimationFrame(window.loop);
};

// Background Stars
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let stars = [];

function initStars() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    stars = Array(100).fill().map(() => ({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        size: Math.random() * 2,
        blink: Math.random(),
        speed: Math.random() * 0.2 + 0.1
    }));
}

function animStars() {
    bgCtx.clearRect(0,0,bgCanvas.width, bgCanvas.height);
    bgCtx.fillStyle = 'white';
    stars.forEach(s => {
        s.y -= s.speed;
        if(s.y < 0) s.y = bgCanvas.height;
        s.blink += 0.02;
        const alpha = 0.2 + Math.sin(s.blink) * 0.3;
        bgCtx.globalAlpha = alpha;
        bgCtx.beginPath();
        bgCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        bgCtx.fill();
    });
    requestAnimationFrame(animStars);
}

initStars();
animStars();
window.addEventListener('resize', initStars);