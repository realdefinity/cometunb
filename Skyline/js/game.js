window.game = {
    init() {
        const st = window.state;
        st.ctx = st.canvas.getContext('2d');
        st.bgCtx = st.bgCanvas.getContext('2d');

        this.resize();
        this.initStars();
        window.ui.highScoreVal.innerText = String(st.highScore);

        window.addEventListener('resize', () => {
            this.resize();
            this.initStars();
        });

        const handleInput = (e) => {
            if (e.target && e.target.tagName === 'BUTTON') return;
            if (e.cancelable) e.preventDefault();
            this.placeBlock();
        };

        window.addEventListener('mousedown', handleInput);
        window.addEventListener('touchstart', handleInput, { passive: false });
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.placeBlock();
        });

        window.ui.startBtn.onclick = () => this.startGame();
        window.ui.restartBtn.onclick = () => this.startGame();

        this.renderLoop();
    },

    resize() {
        const st = window.state;
        st.width = st.canvas.width = window.innerWidth;
        st.height = st.canvas.height = window.innerHeight;
        st.bgCanvas.width = st.width;
        st.bgCanvas.height = st.height;
    },

    initStars() {
        const st = window.state;
        st.bgStars = [];
        for (let i = 0; i < 100; i++) {
            st.bgStars.push({
                x: Math.random() * st.width,
                y: Math.random() * st.height,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random(),
                speed: Math.random() * 0.5 + 0.1
            });
        }
    },

    startGame() {
        const st = window.state;
        window.audioEngine.init();

        window.ui.startMenu.classList.remove('active');
        window.ui.gameOverMenu.classList.remove('active');
        window.uiHelpers.updateScoreUI(0);

        st.blocks = [];
        st.debris = [];
        st.particles = [];
        st.score = 0;
        st.combo = 0;
        st.speed = window.CONFIG.startSpeed;
        st.hue = 210;
        st.direction = 1;
        st.cameraY = 0;
        st.shake = 0;

        const startX = (st.width / 2) - (window.CONFIG.baseWidth / 2);
        const startY = st.height - 150;
        st.blocks.push({
            x: startX,
            y: startY,
            w: window.CONFIG.baseWidth,
            h: window.CONFIG.blockHeight,
            color: `hsl(${st.hue}, 100%, 60%)`,
            hue: st.hue
        });

        this.spawnNext();
        st.isPlaying = true;
        st.inputLocked = false;
    },

    spawnNext() {
        const st = window.state;
        const prev = st.blocks[st.blocks.length - 1];
        st.hue = (st.hue + 8) % 360;

        let startX;
        if (st.score === 0) {
            startX = prev.x;
        } else {
            startX = (st.direction === 1)
                ? -window.CONFIG.spawnDist
                : st.width + window.CONFIG.spawnDist - prev.w;
        }

        st.current = {
            x: startX,
            y: prev.y - window.CONFIG.blockHeight,
            w: prev.w,
            h: window.CONFIG.blockHeight,
            color: `hsl(${st.hue}, 100%, 60%)`,
            hue: st.hue,
            vx: st.speed * st.direction
        };
    },

    placeBlock() {
        const st = window.state;
        if (!st.isPlaying || !st.current || st.inputLocked) return;

        st.inputLocked = true;
        setTimeout(() => {
            st.inputLocked = false;
        }, 150);

        const prev = st.blocks[st.blocks.length - 1];
        const diff = st.current.x - prev.x;
        const absDiff = Math.abs(diff);

        // Ignore accidental taps before the moving block reaches play space.
        if (st.score > 0 && (st.current.x + st.current.w < 0 || st.current.x > st.width)) {
            return;
        }

        if (absDiff <= window.CONFIG.tolerance) {
            st.current.x = prev.x;
            st.combo += 1;
            st.score += 1;
            window.audioEngine.playStack(true);
            this.createParticles(st.current.x + st.current.w / 2, st.current.y + st.current.h / 2, st.current.w, st.current.color);
            window.uiHelpers.triggerFlash();

            if (st.combo > 1 && st.combo % window.CONFIG.growCombo === 0) {
                st.current.w += window.CONFIG.growAmount;
                st.current.x -= window.CONFIG.growAmount / 2;
                window.uiHelpers.showPopup('EXPAND!', st.current.y);
                window.audioEngine.playEffect('grow');
            } else {
                window.uiHelpers.showPopup('PERFECT', st.current.y);
            }

            st.shake = 5;
            st.blocks.push({ ...st.current });
            this.spawnNext();
        } else if (absDiff < st.current.w) {
            st.combo = 0;
            st.score += 1;
            window.audioEngine.playStack(false);

            const cutW = absDiff;
            const keepW = st.current.w - cutW;
            st.current.w = keepW;

            if (diff > 0) {
                this.spawnDebris(st.current.x + keepW, st.current.y, cutW, st.current.h, st.speed);
            } else {
                this.spawnDebris(st.current.x, st.current.y, cutW, st.current.h, -st.speed);
                st.current.x = prev.x;
            }

            st.shake = 3;
            st.blocks.push({ ...st.current });
            this.spawnNext();
        } else {
            this.gameOver();
            return;
        }

        st.speed = Math.min(window.CONFIG.maxSpeed, st.speed + window.CONFIG.speedInc);
        st.direction *= -1;
        window.uiHelpers.updateScoreUI(st.score);
    },

    gameOver() {
        const st = window.state;
        st.isPlaying = false;
        window.audioEngine.playEffect('fail');
        this.spawnDebris(st.current.x, st.current.y, st.current.w, st.current.h, st.current.vx);
        st.shake = 20;

        if (st.score > st.highScore) {
            st.highScore = st.score;
            localStorage.setItem('skyline_highScore', String(st.highScore));
            window.ui.highScoreVal.innerText = String(st.highScore);
        }

        window.ui.finalScore.innerText = String(st.score);
        window.ui.finalBest.innerText = String(st.highScore);
        window.ui.gameOverMenu.classList.add('active');
    },

    update() {
        const st = window.state;
        if (!st.current) return;

        st.current.x += st.current.vx;

        if (st.current.vx > 0 && st.current.x > st.width - 50) st.current.vx *= -1;
        if (st.current.vx < 0 && st.current.x + st.current.w < 50) st.current.vx *= -1;

        let targetY = 0;
        if (st.blocks.length > 0) {
            const topBlock = st.blocks[st.blocks.length - 1];
            const idealY = st.height * 0.6;
            if (topBlock.y < idealY) targetY = idealY - topBlock.y;
        }
        st.cameraY += (targetY - st.cameraY) * 0.1;

        st.shake *= 0.9;
        if (st.shake < 0.5) st.shake = 0;

        for (let i = st.debris.length - 1; i >= 0; i--) {
            const d = st.debris[i];
            d.x += d.vx;
            d.y += d.vy;
            d.rot += d.vr;
            d.vy += 0.8;
            if (d.y > st.height + st.cameraY + 100) st.debris.splice(i, 1);
        }

        for (let i = st.particles.length - 1; i >= 0; i--) {
            const p = st.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) st.particles.splice(i, 1);
        }
    },

    drawBackground() {
        const st = window.state;
        const ctx = st.bgCtx;

        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, st.width, st.height);

        ctx.strokeStyle = 'rgba(96, 165, 250, 0.15)';
        ctx.lineWidth = 1;

        const centerX = st.width / 2;
        for (let i = -10; i <= 10; i++) {
            const x = centerX + (i * 100);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(centerX + (i * 400), st.height);
            ctx.stroke();
        }

        st.gridOffset = (st.gridOffset + 1 + (st.cameraY * 0.05)) % 100;
        for (let y = st.gridOffset; y < st.height; y += 80) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(st.width, y);
            ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        st.bgStars.forEach(s => {
            s.y += s.speed + (st.cameraY * 0.005);
            if (s.y > st.height) s.y = 0;

            ctx.globalAlpha = s.alpha * (0.5 + Math.sin(Date.now() * 0.005 * s.speed) * 0.5);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        const grad = ctx.createRadialGradient(st.width / 2, st.height / 2, st.width / 4, st.width / 2, st.height / 2, st.width);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, st.width, st.height);
    },

    drawBlock(block) {
        const st = window.state;
        const ctx = st.ctx;
        const grad = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.h);
        grad.addColorStop(0, `hsl(${block.hue}, 100%, 70%)`);
        grad.addColorStop(1, `hsl(${block.hue}, 100%, 50%)`);

        ctx.shadowBlur = 20;
        ctx.shadowColor = block.color;
        ctx.fillStyle = grad;
        ctx.fillRect(block.x, block.y, block.w, block.h);

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(block.x, block.y, block.w, block.h * 0.15);
    },

    drawGame() {
        const st = window.state;
        const ctx = st.ctx;
        ctx.clearRect(0, 0, st.width, st.height);

        ctx.save();

        const shakeX = (Math.random() - 0.5) * st.shake;
        const shakeY = (Math.random() - 0.5) * st.shake;
        ctx.translate(0, st.cameraY + shakeY);
        ctx.translate(shakeX, 0);

        st.debris.forEach(d => {
            ctx.save();
            ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
            ctx.rotate(d.rot);
            ctx.fillStyle = d.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
            ctx.restore();
            ctx.globalAlpha = 1;
        });

        st.blocks.forEach(b => this.drawBlock(b));
        if (st.isPlaying && st.current) this.drawBlock(st.current);

        st.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        ctx.restore();
    },

    spawnDebris(x, y, w, h, vx) {
        window.state.debris.push({
            x, y, w, h,
            vx,
            vy: -5,
            rot: 0,
            vr: (Math.random() - 0.5) * 0.2,
            color: '#fff'
        });
    },

    createParticles(x, y, width, color) {
        const ps = window.state.particles;
        for (let i = 0; i < 15; i++) {
            ps.push({
                x: x + (Math.random() - 0.5) * width,
                y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 1) * 10,
                life: 1,
                size: Math.random() * 4 + 2,
                color
            });
        }
    },

    renderLoop: () => {
        if (window.state.isPlaying) window.game.update();
        window.game.drawBackground();
        window.game.drawGame();
        requestAnimationFrame(window.game.renderLoop);
    }
};
