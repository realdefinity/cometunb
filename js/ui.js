// --- AUDIO SYSTEM ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    }
}

// --- MODALS & TOASTS ---
function showModal(title, desc, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-desc');
    const btnConfirm = document.getElementById('btn-confirm');
    const btnCancel = document.getElementById('btn-cancel');

    titleEl.textContent = title;
    descEl.textContent = desc;
    
    overlay.classList.add('visible');
    playSound('alert');

    // Clean previous listeners
    const newConfirm = btnConfirm.cloneNode(true);
    const newCancel = btnCancel.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);
    btnCancel.parentNode.replaceChild(newCancel, btnCancel);

    newConfirm.addEventListener('click', () => {
        overlay.classList.remove('visible');
        onConfirm();
    });
    newCancel.addEventListener('click', () => {
        overlay.classList.remove('visible');
    });
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 3000);
}

// --- THEMES ---
function renderThemes() {
    const list = document.getElementById('theme-panel');
    const current = localStorage.getItem('wiki_theme') || 'Classic';
    
    list.innerHTML = ''; // Clear existing list to prevent duplicates

    themes.forEach(t => {
        const d = document.createElement('div');
        d.className = 't-opt';
        d.textContent = t;
        
        if (t === current) d.classList.add('active');

        d.onclick = () => {
            document.documentElement.setAttribute('data-theme', t.toLowerCase());
            localStorage.setItem('wiki_theme', t);
            
            // Visual Update
            document.querySelectorAll('.t-opt').forEach(el => el.classList.remove('active'));
            d.classList.add('active');
            
            // Optional: Close panel on click? 
            // list.classList.remove('visible'); 
        };
        list.appendChild(d);
    });
}
function toggleThemes() { document.getElementById('theme-panel').classList.toggle('visible'); }

// --- BREADCRUMBS ---
function updateBreadcrumbs() {
    const c = document.getElementById('breadcrumbs');
    c.innerHTML = '';
    state.history.forEach((h, i) => {
        const div = document.createElement('div');
        div.className = `crumb ${i === state.history.length-1 ? 'active' : ''}`;
        div.innerHTML = `<span>${h}</span> ${i < state.history.length-1 ? '›' : ''}`;
        c.appendChild(div);
    });
    c.scrollLeft = c.scrollWidth;
}

// --- LINK PREVIEW ---
let previewTimeout;
async function showPreview(e, title) {
    previewTimeout = setTimeout(async () => {
        const box = document.getElementById('link-preview');
        const img = document.getElementById('lp-img');
        const rect = e.target.getBoundingClientRect();
        
        box.style.top = (rect.bottom + 15) + 'px';
        let leftPos = rect.left;
        if(leftPos + 300 > window.innerWidth) leftPos = window.innerWidth - 320;
        box.style.left = leftPos + 'px';
        
        try {
            const r = await fetch(`${API}?action=query&prop=extracts|pageimages&exchars=150&exintro&titles=${encodeURIComponent(title)}&format=json&pithumbsize=200&origin=*`);
            const d = await r.json();
            const pid = Object.keys(d.query.pages)[0];
            const page = d.query.pages[pid];

            if(page.thumbnail) {
                img.src = page.thumbnail.source;
                img.style.display = 'block';
            } else {
                img.style.display = 'none';
            }
            document.getElementById('lp-title').textContent = page.title;
            document.getElementById('lp-desc').innerHTML = page.extract || "No description available.";
            box.classList.add('visible');
        } catch(err) {}
    }, 600); 
}
function hidePreview() {
    clearTimeout(previewTimeout);
    document.getElementById('link-preview').classList.remove('visible');
}

// --- AUTOCOMPLETE ---
function setupAutocomplete(id, boxId) {
    const input = document.getElementById(id);
    const box = document.getElementById(boxId);
    let t;
    input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(async () => {
            if(input.value.length < 2) { box.style.display='none'; return; }
            const r = await fetch(`${API}?action=opensearch&search=${input.value}&limit=5&origin=*`);
            const d = await r.json();
            box.innerHTML = '';
            d[1].forEach(x => {
                const div = document.createElement('div');
                div.className = 'sugg-item';
                div.textContent = x;
                div.onclick = () => { input.value = x; box.style.display='none'; };
                box.appendChild(div);
            });
            box.style.display = 'block';
        }, 300);
    });
    document.addEventListener('click', e => { if(e.target !== input) box.style.display='none'; });
}

// --- CONFETTI ---
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#ffffff'];

    for(let i=0; i<150; i++) {
        particles.push({
            x: canvas.width/2, y: canvas.height/2,
            vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15,
            color: colors[Math.floor(Math.random()*colors.length)],
            size: Math.random()*8 + 2,
            life: 100
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        particles.forEach(p => {
            if(p.life > 0) {
                active = true;
                p.x += p.vx; p.y += p.vy;
                p.vy += 0.2; // gravity
                p.life--;
                p.size *= 0.96;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });
        if(active) requestAnimationFrame(draw);
    }
    draw();
}

let galaxyAnim;

function renderGalaxy(history) {
    const container = document.getElementById('galaxy-view');
    const canvas = document.getElementById('galaxy-canvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('target-tooltip');
    const ttContent = document.getElementById('tt-content');

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const nodes = [];
    const width = rect.width;
    const height = rect.height;
    const padding = 60;

    history.forEach((title, i) => {
        const pct = i / (history.length - 1 || 1);
        
        let x = padding + pct * (width - padding * 2);
        let y = height / 2 + Math.sin(pct * Math.PI * 2) * 30;

        nodes.push({
            x: x,
            y: y,
            title: title,
            baseR: i === 0 || i === history.length - 1 ? 6 : 3,
            hoverR: 0
        });
    });

    let mx = -1000, my = -1000;
    canvas.onmousemove = (e) => {
        const r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
    };
    canvas.onmouseleave = () => {
        mx = -1000; 
        tooltip.classList.remove('visible'); 
    };

    if (galaxyAnim) cancelAnimationFrame(galaxyAnim);

    function draw() {
        ctx.clearRect(0, 0, width, height);

        if (nodes.length > 1) {
            ctx.beginPath();
            ctx.moveTo(nodes[0].x, nodes[0].y);
            
            for (let i = 0; i < nodes.length - 1; i++) {
                const p0 = nodes[i];
                const p1 = nodes[i + 1];
                const cx = (p0.x + p1.x) / 2;
                const cy = (p0.y + p1.y) / 2;
                ctx.quadraticCurveTo(p0.x, p0.y, cx, cy);
            }
            ctx.lineTo(nodes[nodes.length-1].x, nodes[nodes.length-1].y);

            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
            gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.5)");
            gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        let activeNode = null;

        nodes.forEach((n, i) => {
            const dist = Math.hypot(n.x - mx, n.y - my);
            const isHover = dist < 20;

            n.hoverR += (isHover ? 1 : -1) * 0.2;
            if (n.hoverR < 0) n.hoverR = 0;
            if (n.hoverR > 4) n.hoverR = 4;

            if (isHover) activeNode = n;

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.baseR + n.hoverR, 0, Math.PI * 2);
            ctx.fillStyle = "white";
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.shadowBlur = 10 + (n.hoverR * 5);
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        if (activeNode) {
            tooltip.classList.add('visible');
            tooltip.style.left = (canvas.getBoundingClientRect().left + activeNode.x) + 'px';
            tooltip.style.top = (canvas.getBoundingClientRect().top + activeNode.y - 50) + 'px';
            tooltip.querySelector('h5').textContent = "PAGE VIEWED";
            ttContent.textContent = activeNode.title;
        }

        galaxyAnim = requestAnimationFrame(draw);
    }

    draw();
}

// --- STATS SYSTEM ---

function getStats() {
    const defaultStats = {
        gamesPlayed: 0,
        wins: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalClicks: 0,
        totalTimeSeconds: 0,
        fastestRun: null, // seconds
        themeUsage: {}
    };
    return JSON.parse(localStorage.getItem('wiki_stats')) || defaultStats;
}

function saveGameStats(isWin, timeInSeconds, clicks) {
    const s = getStats();
    s.gamesPlayed++;
    s.totalClicks += clicks;
    s.totalTimeSeconds += timeInSeconds;

    // Theme Tracking
    const currentTheme = localStorage.getItem('wiki_theme') || 'Classic';
    s.themeUsage[currentTheme] = (s.themeUsage[currentTheme] || 0) + 1;

    if (isWin) {
        s.wins++;
        s.currentStreak++;
        if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
        
        // Check Fastest Run (Only updates if strictly faster)
        if (s.fastestRun === null || timeInSeconds < s.fastestRun) {
            s.fastestRun = timeInSeconds;
        }
    } else {
        s.currentStreak = 0;
    }

    localStorage.setItem('wiki_stats', JSON.stringify(s));
}

function showStats() {
    const s = getStats();
    const screen = document.getElementById('stats-screen');
    
    // Calculate Derived Stats
    const winRate = s.gamesPlayed > 0 ? Math.floor((s.wins / s.gamesPlayed) * 100) : 0;
    const avgClicks = s.wins > 0 ? (s.totalClicks / s.wins).toFixed(1) : 0;
    
    // Format Time (Seconds -> H:M)
    const hours = Math.floor(s.totalTimeSeconds / 3600);
    const mins = Math.floor((s.totalTimeSeconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    // Format Fastest Run
    let fastStr = "--:--";
    if (s.fastestRun !== null) {
        const fm = Math.floor(s.fastestRun / 60).toString().padStart(2,'0');
        const fs = (s.fastestRun % 60).toString().padStart(2,'0');
        fastStr = `${fm}:${fs}`;
    }

    // Find Fav Theme
    let favTheme = "None";
    let maxCount = 0;
    for (const [theme, count] of Object.entries(s.themeUsage)) {
        if (count > maxCount) {
            maxCount = count;
            favTheme = theme;
        }
    }

    // Update UI
    document.getElementById('s-wins').textContent = s.wins;
    document.getElementById('s-rate').textContent = winRate + "%";
    document.getElementById('s-streak').textContent = s.currentStreak;
    document.getElementById('s-fast').textContent = fastStr;
    document.getElementById('s-avg-clicks').textContent = avgClicks;
    document.getElementById('s-total-time').textContent = timeStr;
    document.getElementById('s-total-links').textContent = s.totalClicks.toLocaleString();
    document.getElementById('s-fav-theme').textContent = favTheme;

    screen.classList.remove('hidden');
}

function closeStats() {
    document.getElementById('stats-screen').classList.add('hidden');
}

// --- TEXT DECODER ANIMATION ---
function animateText(elementId, finalText) {
    const el = document.getElementById(elementId);
    if(!el) return;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let iterations = 0;
    const maxIterations = 15; // How long it scrambles
    
    // Clear previous interval if exists (attach to element to track it)
    if(el.dataset.animInterval) clearInterval(parseInt(el.dataset.animInterval));

    const interval = setInterval(() => {
        el.value = finalText.split("").map((letter, index) => {
            if(index < iterations) {
                return finalText[index]; // Lock in correct char
            }
            return chars[Math.floor(Math.random() * chars.length)]; // Scramble
        }).join("");

        if(iterations >= finalText.length) {
            clearInterval(interval);
            el.value = finalText; // Ensure final fidelity
        }

        iterations += 1 / 2; // Speed of decoding
    }, 30);

    el.dataset.animInterval = interval;
}