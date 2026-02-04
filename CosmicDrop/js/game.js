// Logic Module
const { Engine, World, Bodies, Body, Events, Composite, Vector } = Matter;

window.engine = Engine.create({ 
    enableSleeping: false,
    positionIterations: 10,
    velocityIterations: 10
});
window.engine.world.gravity.y = window.SETTINGS.gravity;

window.Game = {
    width: 0, height: 0,
    score: 0,
    currentIdx: 0, nextIdx: 0,
    state: 'MENU',
    canDrop: true,
    mouseX: 0,
    shakesLeft: window.SETTINGS.maxShakes,
    time: 0,
    
    particles: [],
    popups: [],
    shockwaves: [],

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        const root = document.getElementById('game-root');
        
        const moveHandler = (e) => {
            if (this.state !== 'PLAYING') return;
            const rect = root.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            this.mouseX = Math.max(0, Math.min(this.width, clientX - rect.left));
            
            const guide = document.getElementById('cursor-guide');
            if(guide) {
                guide.style.opacity = this.canDrop ? 0.4 : 0;
                guide.style.left = this.mouseX + 'px';
            }
        };

        root.addEventListener('mousemove', moveHandler);
        root.addEventListener('touchmove', (e) => { e.preventDefault(); moveHandler(e); }, { passive: false });

        const dropHandler = (e) => {
            if (e.target.closest('button')) return;
            this.drop();
        };
        root.addEventListener('mousedown', dropHandler);
        root.addEventListener('touchstart', (e) => {
            if(!e.target.closest('button')) e.preventDefault();
            dropHandler(e);
        }, { passive: false });

        document.addEventListener('keydown', e => {
            if (e.code === 'Space') this.triggerShake();
        });

        Events.on(window.engine, 'collisionStart', (e) => this.handleCollisions(e));
        Events.on(window.engine, 'beforeUpdate', () => this.updateBodies());
        
        // Start Render Loop
        requestAnimationFrame(window.loop);
    },

    resize() {
        const root = document.getElementById('game-root');
        this.width = root.clientWidth;
        this.height = root.clientHeight;
        const canvas = document.getElementById('world');
        canvas.width = this.width;
        canvas.height = this.height;

        World.clear(window.engine.world);
        Engine.clear(window.engine);

        const thick = 200;
        const floorOffset = 110;
        
        const walls = [
            Bodies.rectangle(this.width/2, this.height - floorOffset + thick/2, this.width, thick, { isStatic: true, friction: 1, label: 'ground' }),
            Bodies.rectangle(-thick/2, this.height/2, thick, this.height*4, { isStatic: true, friction: 0 }),
            Bodies.rectangle(this.width+thick/2, this.height/2, thick, this.height*4, { isStatic: true, friction: 0 })
        ];
        World.add(window.engine.world, walls);
    },

    start() {
        document.getElementById('startMenu').classList.remove('active');
        this.resetVars();
        this.state = 'PLAYING';
        this.resize();
    },

    reset() {
        document.getElementById('gameOverMenu').classList.remove('active');
        this.resetVars();
        this.state = 'PLAYING';
        this.resize();
    },

    resetVars() {
        this.score = 0;
        this.currentIdx = Math.floor(Math.random() * 3);
        this.nextIdx = Math.floor(Math.random() * 3);
        this.canDrop = true;
        this.shakesLeft = window.SETTINGS.maxShakes;
        this.updateUI();
        this.particles = [];
        this.popups = [];
        this.shockwaves = [];
    },

    drop() {
        if (!this.canDrop || this.state !== 'PLAYING') return;
        this.canDrop = false;
        
        const r = window.ORBS[this.currentIdx].r;
        const x = Math.max(r, Math.min(this.width - r, this.mouseX));
        
        const body = Bodies.circle(x, window.SETTINGS.spawnY, r, {
            restitution: window.SETTINGS.restitution,
            friction: window.SETTINGS.friction,
            frictionAir: window.SETTINGS.frictionAir,
            frictionStatic: window.SETTINGS.frictionStatic,
            density: 0.002 * (this.currentIdx + 1),
            planetIdx: this.currentIdx,
            scale: 1,
            scaleVelocity: 0,
            squash: 1,
            squashVelocity: 0,
            flash: 0
        });
        
        World.add(window.engine.world, body);
        window.AudioSys.play(this.currentIdx, 'drop');
        
        setTimeout(() => {
            this.currentIdx = this.nextIdx;
            this.nextIdx = Math.floor(Math.random() * 4);
            this.canDrop = true;
            this.updateUI();
        }, 500);
    },

    triggerShake() {
        if (this.shakesLeft <= 0 || this.state !== 'PLAYING') return;
        this.shakesLeft--;
        this.updateUI();
        
        Composite.allBodies(window.engine.world).forEach(b => {
            if (!b.isStatic) {
                const force = 0.06 * b.mass;
                Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * force, y: -force * 1.5 });
                b.squashVelocity = -0.15;
            }
        });
        
        const root = document.getElementById('game-root');
        root.classList.remove('shake-screen');
        void root.offsetWidth;
        root.classList.add('shake-screen');
    },

    handleCollisions(event) {
        const pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            const { bodyA, bodyB } = pairs[i];
            
            const speed = Vector.magnitude(Vector.sub(bodyA.velocity, bodyB.velocity));
            if (speed > 1.5) {
                if(!bodyA.isStatic) bodyA.squashVelocity = -0.015 * speed;
                if(!bodyB.isStatic) bodyB.squashVelocity = -0.015 * speed;
            }

            if (bodyA.planetIdx !== undefined && bodyB.planetIdx !== undefined) {
                if (bodyA.planetIdx === bodyB.planetIdx && bodyA.planetIdx < window.ORBS.length - 1) {
                    const idx = bodyA.planetIdx;
                    const midX = (bodyA.position.x + bodyB.position.x) / 2;
                    const midY = (bodyA.position.y + bodyB.position.y) / 2;
                    const nextIdx = idx + 1;
                    
                    World.remove(window.engine.world, [bodyA, bodyB]);
                    
                    const r = window.ORBS[nextIdx].r;
                    const newBody = Bodies.circle(midX, midY, r, {
                        restitution: window.SETTINGS.restitution,
                        friction: window.SETTINGS.friction,
                        density: 0.002 * (nextIdx + 1),
                        planetIdx: nextIdx,
                        scale: 0.2,
                        scaleVelocity: 0,
                        squash: 1,
                        squashVelocity: 0,
                        flash: 1.0
                    });
                    
                    World.add(window.engine.world, newBody);
                    
                    // Push neighbors
                    Composite.allBodies(window.engine.world).forEach(b => {
                        if (b !== newBody && !b.isStatic) {
                            const dist = Vector.magnitude(Vector.sub(b.position, newBody.position));
                            if (dist < r * 2.5) {
                                const force = Vector.normalise(Vector.sub(b.position, newBody.position));
                                const mag = 0.05 * b.mass;
                                Body.applyForce(b, b.position, Vector.mult(force, mag));
                            }
                        }
                    });

                    this.score += window.ORBS[nextIdx].val;
                    window.AudioSys.play(nextIdx, 'merge');
                    this.createExplosion(midX, midY, window.ORBS[nextIdx].color);
                    this.shockwaves.push({x: midX, y: midY, r: r, alpha: 1, color: window.ORBS[nextIdx].glow});
                    this.spawnPopup(midX, midY, `+${window.ORBS[nextIdx].val}`);
                    
                    if (nextIdx > 4) {
                        const root = document.getElementById('game-root');
                        root.classList.remove('shake-screen');
                        void root.offsetWidth;
                        root.classList.add('shake-screen');
                    }
                    
                    this.updateUI();
                }
            }
        }
    },

    updateBodies() {
        const bodies = Composite.allBodies(window.engine.world);
        bodies.forEach(b => {
            if (!b.isStatic) {
                if (b.flash > 0) b.flash -= 0.05;
                
                // Spring logic for scaling
                const scaleK = 0.15;
                const scaleD = 0.2;
                const scaleX = b.scale - 1;
                const scaleForce = -scaleK * scaleX - scaleD * b.scaleVelocity;
                b.scaleVelocity += scaleForce;
                b.scale += b.scaleVelocity;

                // Spring logic for squash
                const squashK = 0.2;
                const squashD = 0.15;
                const squashX = b.squash - 1;
                const squashForce = -squashK * squashX - squashD * b.squashVelocity;
                b.squashVelocity += squashForce;
                b.squash += b.squashVelocity;
                
                if(b.squash < 0.6) b.squash = 0.6;
                if(b.squash > 1.4) b.squash = 1.4;
            }
        });
    },

    updateUI() {
        document.getElementById('scoreVal').innerText = this.score;
        const pips = document.querySelectorAll('.ammo-pip');
        pips.forEach((p, i) => {
            if (i < this.shakesLeft) p.classList.add('active');
            else p.classList.remove('active');
        });
        document.getElementById('shakeBtn').disabled = this.shakesLeft <= 0;
        
        // Preview Box
        const nextCanvas = document.createElement('canvas');
        nextCanvas.width = 50; nextCanvas.height = 50;
        const nCtx = nextCanvas.getContext('2d');
        window.drawOrb(nCtx, 25, 25, 18, this.nextIdx);
        const nextBox = document.getElementById('nextBox');
        nextBox.innerHTML = '';
        nextBox.appendChild(nextCanvas);
    },

    createExplosion(x, y, color) {
        for(let i=0; i<16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10 + 5;
            this.particles.push({ 
                x: x, y: y, 
                vx: Math.cos(angle) * speed, 
                vy: Math.sin(angle) * speed, 
                life: 1.0, 
                color: color, 
                size: Math.random() * 4 + 2 
            });
        }
    },

    spawnPopup(x, y, text) {
        this.popups.push({ x, y, text, life: 1.0, vy: -3 });
    },

    checkDanger() {
        if (this.state !== 'PLAYING') return;
        let danger = false;
        Composite.allBodies(window.engine.world).forEach(b => {
            if (!b.isStatic && b.position.y < 130 && Math.abs(b.velocity.y) < 0.2 && Math.abs(b.velocity.x) < 0.2) {
                b.dangerTime = (b.dangerTime || 0) + 1;
                danger = true;
                if (b.dangerTime > 180) this.gameOver();
            } else {
                b.dangerTime = 0;
            }
        });
        
        const line = document.getElementById('dangerLine');
        if (danger) line.classList.add('active');
        else line.classList.remove('active');
    },

    gameOver() {
        this.state = 'GAMEOVER';
        document.getElementById('finalScore').innerText = this.score;
        document.getElementById('gameOverMenu').classList.add('active');
    }
};