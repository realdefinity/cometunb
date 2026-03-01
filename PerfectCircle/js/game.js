window.game = {
    ctx: null,

    init() {
        this.ctx = window.elements.canvas.getContext('2d', { alpha: false });
        this.bindEvents();
        this.resize();
        this.render();
    },

    bindEvents() {
        const canvas = window.elements.canvas;

        canvas.addEventListener('mousedown', this.start);
        canvas.addEventListener('touchstart', this.start, { passive: false });

        window.addEventListener('mousemove', this.move);
        window.addEventListener('touchmove', this.move, { passive: false });

        window.addEventListener('mouseup', this.end);
        window.addEventListener('touchend', this.end);

        window.addEventListener('mouseleave', this.end);
        window.addEventListener('blur', this.end);
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        window.state.width = window.innerWidth;
        window.state.height = window.innerHeight;
        window.elements.canvas.width = window.state.width;
        window.elements.canvas.height = window.state.height;
    },

    getPos(e) {
        return {
            x: e.touches ? e.touches[0].clientX : e.clientX,
            y: e.touches ? e.touches[0].clientY : e.clientY
        };
    },

    start: (e) => {
        if (e.cancelable) e.preventDefault();

        window.resetUI();

        window.state.isDrawing = true;
        window.state.points = [window.game.getPos(e)];
        window.state.analysis = null;
        window.state.hue = Math.random() * 360;

        if (navigator.vibrate) navigator.vibrate(10);
        window.audioEngine.startDraw();
    },

    move: (e) => {
        if (!window.state.isDrawing) return;
        if (e.cancelable) e.preventDefault();

        const pos = window.game.getPos(e);
        const last = window.state.points[window.state.points.length - 1];
        const dist = Math.hypot(pos.x - last.x, pos.y - last.y);

        if (dist <= 4) return;

        window.state.points.push(pos);
        window.state.hue += 1;

        const progress = Math.min(window.state.points.length / 150, 1.5);
        window.audioEngine.updatePitch(progress);

        if (Math.random() > 0.5) {
            window.state.particles.push(window.game.createParticle(pos.x, pos.y, `hsl(${window.state.hue}, 80%, 60%)`));
        }
    },

    end: () => {
        if (!window.state.isDrawing) return;
        window.state.isDrawing = false;
        window.audioEngine.stopDraw();

        if (navigator.vibrate) navigator.vibrate(20);

        window.game.analyzeAndShowResult();
    },

    analyzeAndShowResult() {
        const pts = window.state.points;
        if (pts.length < 30) {
            window.showFeedback('Too small!');
            window.resetGame();
            return;
        }

        let sumX = 0;
        let sumY = 0;
        pts.forEach(p => {
            sumX += p.x;
            sumY += p.y;
        });
        const cx = sumX / pts.length;
        const cy = sumY / pts.length;

        const radii = pts.map(p => Math.hypot(p.x - cx, p.y - cy));
        const meanR = radii.reduce((a, b) => a + b, 0) / radii.length;

        const sqDiff = radii.map(r => Math.pow(r - meanR, 2));
        const rmse = Math.sqrt(sqDiff.reduce((a, b) => a + b, 0) / radii.length);

        const errorPct = (rmse / meanR) * 100;
        const gap = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
        const gapPenalty = (gap / meanR) * 15;

        let totalAngle = 0;
        for (let i = 1; i < pts.length; i++) {
            const ang1 = Math.atan2(pts[i - 1].y - cy, pts[i - 1].x - cx);
            const ang2 = Math.atan2(pts[i].y - cy, pts[i].x - cx);
            let d = ang2 - ang1;
            if (d < -Math.PI) d += Math.PI * 2;
            if (d > Math.PI) d -= Math.PI * 2;
            totalAngle += d;
        }
        const deg = Math.abs(totalAngle * 180 / Math.PI);

        let anglePenalty = 0;
        if (deg < 320) anglePenalty = (360 - deg) * 0.5;
        if (deg > 400) anglePenalty = (deg - 360) * 0.5;

        const rawScore = 100 - (errorPct * 2) - gapPenalty - anglePenalty;
        const score = Math.max(0, Math.min(100, rawScore));

        window.state.analysis = {
            x: cx,
            y: cy,
            r: meanR,
            score,
            startAngle: Math.atan2(pts[0].y - cy, pts[0].x - cx)
        };

        const rankData = window.getRank(score);

        if (score > window.state.bestScore) {
            window.state.bestScore = score;
            localStorage.setItem('perfectcircle_best', String(score));
            window.elements.best.innerText = score.toFixed(1);
            this.explode(window.state.width / 2, window.state.height / 2, 100);
        }

        window.audioEngine.playWin(score);

        window.animateScore(score, rankData.color);

        window.elements.rank.innerText = rankData.title;
        window.elements.rank.style.borderColor = rankData.color;
        window.elements.rank.style.color = rankData.color;
        window.elements.rank.style.boxShadow = `0 0 30px ${rankData.color}40`;
        window.elements.rank.classList.add('visible');

        let msg = '';
        if (gapPenalty > 10) msg = 'Close the circle!';
        else if (anglePenalty > 20) msg = 'Draw fully around!';
        else if (errorPct > 10) msg = 'Too wobbly!';
        else msg = rankData.msg;

        window.elements.feedback.innerText = msg;
        window.elements.feedback.style.opacity = 1;
        window.elements.feedback.style.transform = 'translateY(0)';

        if (score > 90) this.explode(cx, cy, 50);
    },

    createParticle(x, y, color) {
        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color,
            size: Math.random() * 3 + 1
        };
    },

    explode(x, y, count) {
        for (let i = 0; i < count; i++) {
            window.state.particles.push(this.createParticle(x, y, `hsl(${Math.random() * 360}, 80%, 60%)`));
        }
    },

    drawGhostCircle(ctx) {
        if (!window.state.analysis || window.state.isDrawing) return;
        const a = window.state.analysis;

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, a.startAngle, a.startAngle + (Math.PI * 2 * window.state.ghostProgress));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    },

    drawPath(ctx) {
        const pts = window.state.points;
        if (pts.length <= 1) return;

        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${window.state.hue}, 80%, 60%)`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 10;

        if (window.state.isDrawing) {
            ctx.strokeStyle = `hsl(${window.state.hue}, 90%, 70%)`;
        } else {
            const score = window.state.analysis ? window.state.analysis.score : 0;
            const color = window.getRank(score).color;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
        }

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);

        for (let i = 1; i < pts.length - 2; i++) {
            const xc = (pts[i].x + pts[i + 1].x) / 2;
            const yc = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }

        if (pts.length > 2) {
            const last = pts[pts.length - 1];
            const secondLast = pts[pts.length - 2];
            ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
    },

    drawParticles(ctx) {
        for (let i = window.state.particles.length - 1; i >= 0; i--) {
            const p = window.state.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.02;

            if (p.life <= 0) {
                window.state.particles.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    },

    render: () => {
        const ctx = window.game.ctx;
        if (!ctx) return;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, window.state.width, window.state.height);

        window.game.drawGhostCircle(ctx);
        window.game.drawPath(ctx);
        window.game.drawParticles(ctx);

        requestAnimationFrame(window.game.render);
    }
};
