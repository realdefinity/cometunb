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

    // Glow
    ctx.shadowBlur = 25;
    ctx.shadowColor = o.glow;
    
    // Main Body
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fillStyle = o.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Gradient Overlay
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.3, o.color);
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Pulse Core
    const pulse = 1 + Math.sin(window.Game.time * 0.1) * 0.05;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.25 * pulse, 0, Math.PI*2);
    ctx.fill();

    // Rings
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, w*0.65, h*0.2, Math.PI/4, 0, Math.PI*2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(0, 0, w*0.2, h*0.65, -Math.PI/4, 0, Math.PI*2);
    ctx.stroke();

    if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Shadow mask
    ctx.rotate(-spin);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(-w*0.35, -h*0.35, w*0.15, h*0.1, Math.PI/4, 0, Math.PI*2);
    ctx.fill();

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
            
            ctx.beginPath();
            ctx.moveTo(x, window.SETTINGS.spawnY);
            ctx.lineTo(x, window.Game.height);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.setLineDash([4, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.globalAlpha = 0.8;
            window.drawOrb(ctx, x, window.SETTINGS.spawnY, r, window.Game.currentIdx);
            ctx.globalAlpha = 1;
        }

        // Draw Effects
        // Shockwaves
        for (let i = window.Game.shockwaves.length - 1; i >= 0; i--) {
            let s = window.Game.shockwaves[i];
            s.r += 10;
            s.alpha -= 0.04;
            if (s.alpha <= 0) { window.Game.shockwaves.splice(i, 1); continue; }
            
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 5;
            ctx.globalAlpha = s.alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Particles
        for (let i = window.Game.particles.length - 1; i >= 0; i--) {
            let p = window.Game.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= 0.03;
            if (p.life <= 0) { window.Game.particles.splice(i, 1); continue; }
            
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }

        // Popups
        for (let i = window.Game.popups.length - 1; i >= 0; i--) {
            let p = window.Game.popups[i];
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) { window.Game.popups.splice(i, 1); continue; }
            
            ctx.fillStyle = 'white';
            ctx.globalAlpha = p.life;
            ctx.font = "900 28px Rajdhani";
            ctx.textAlign = "center";
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(p.text, p.x, p.y);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
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
        blink: Math.random()
    }));
}

function animStars() {
    bgCtx.clearRect(0,0,bgCanvas.width, bgCanvas.height);
    bgCtx.fillStyle = 'white';
    stars.forEach(s => {
        s.blink += 0.02;
        const alpha = 0.2 + Math.sin(s.blink) * 0.2;
        bgCtx.globalAlpha = alpha;
        bgCtx.beginPath();
        bgCtx.arc(s.x, s.y, s.size, 0, Math.PI*2);
        bgCtx.fill();
    });
    requestAnimationFrame(animStars);
}

initStars();
animStars();
window.addEventListener('resize', initStars);