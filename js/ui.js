// --- UI & VISUALS ---

function showToast(msg) {
    const t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 3000);
}

function showModal(title, desc, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-desc').textContent = desc;
    
    // Remove old listeners to prevent stacking
    const btnConfirm = document.getElementById('btn-confirm');
    const newBtn = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
    
    newBtn.onclick = () => {
        overlay.classList.remove('visible');
        onConfirm();
    };
    
    document.getElementById('btn-cancel').onclick = () => overlay.classList.remove('visible');
    overlay.classList.add('visible');
}

// --- THEMES ---
const THEMES = [
    { id: 'classic', name: 'Classic' },
    { id: 'midnight', name: 'Midnight' },
    { id: 'amoled', name: 'OLED Black' },
    { id: 'cyberpunk', name: 'Cyberpunk' },
    { id: 'paper', name: 'Paper' },
    { id: 'ocean', name: 'Ocean' },
    { id: 'forest', name: 'Forest' },
    { id: 'sunset', name: 'Sunset' },
    { id: 'cloud', name: 'Cloud' },
    { id: 'matrix', name: 'Matrix' },
    { id: 'royal', name: 'Royal' },
    { id: 'coffee', name: 'Coffee' },
    { id: 'lavender', name: 'Lavender' },
    { id: 'mint', name: 'Mint' },
    { id: 'glacier', name: 'Glacier' }
];

function toggleThemes() {
    const p = document.getElementById('theme-panel');
    p.classList.toggle('visible');
}

function renderThemes() {
    const p = document.getElementById('theme-panel');
    if(!p) return;
    p.innerHTML = THEMES.map(t => 
        `<div class="t-opt ${document.documentElement.getAttribute('data-theme') === t.id ? 'active' : ''}" 
              onclick="setTheme('${t.id}')">${t.name}</div>`
    ).join('');
}

function setTheme(id) {
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem('wiki_theme', id);
    renderThemes();
}

// --- PREVIEW ---
function showPreview(e, title) {
    const p = document.getElementById('link-preview');
    if(!p) return;
    // Basic positioning logic
    const x = e.clientX + 15;
    const y = e.clientY + 15;
    p.style.transform = `translate(${x}px, ${y}px)`;
    p.classList.add('visible');
    document.getElementById('lp-title').textContent = title.replace(/_/g, ' ');
    document.getElementById('lp-desc').textContent = "Click to navigate...";
}

function hidePreview() {
    const p = document.getElementById('link-preview');
    if(p) p.classList.remove('visible');
}

function updateBreadcrumbs() {
    const b = document.getElementById('breadcrumbs');
    if(!b) return;
    b.innerHTML = state.history.map((h, i) => {
        const isLast = i === state.history.length - 1;
        return `<div class="crumb ${isLast ? 'active' : ''}"><span>${h}</span></div>`;
    }).join('');
    b.scrollLeft = b.scrollWidth;
}

// --- CONFETTI ---
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    
    for(let i=0; i<150; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            color: colors[Math.floor(Math.random()*colors.length)],
            life: 1
        });
    }

    function loop() {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        let active = false;
        particles.forEach(p => {
            if(p.life > 0) {
                active = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // Gravity
                p.life -= 0.01;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.fillRect(p.x, p.y, 8, 8);
            }
        });
        if(active) requestAnimationFrame(loop);
        else ctx.clearRect(0,0,canvas.width, canvas.height);
    }
    loop();
}

// --- GALAXY VISUALIZER ---
let galaxyAnim;
function renderGalaxy(history) {
    const container = document.getElementById('galaxy-view');
    const canvas = document.getElementById('galaxy-canvas');
    if(!container || !canvas) return;
    
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
            x: x, y: y, title: title,
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
    canvas.onmouseleave = () => { mx = -1000; if(tooltip) tooltip.classList.remove('visible'); };

    if (galaxyAnim) cancelAnimationFrame(galaxyAnim);

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // Draw Line
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
            ctx.stroke();
        }

        // Draw Nodes
        let activeNode = null;
        nodes.forEach((n) => {
            const dist = Math.hypot(n.x - mx, n.y - my);
            const isHover = dist < 20;

            n.hoverR += (isHover ? 1 : -1) * 0.2;
            if (n.hoverR < 0) n.hoverR = 0;
            if (n.hoverR > 4) n.hoverR = 4;

            if (isHover) activeNode = n;

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.baseR + n.hoverR, 0, Math.PI * 2);
            ctx.fillStyle = "white";
            ctx.shadowBlur = 10 + (n.hoverR * 5);
            ctx.shadowColor = "white";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        if (activeNode && tooltip) {
            tooltip.classList.add('visible');
            tooltip.style.left = (canvas.getBoundingClientRect().left + activeNode.x) + 'px';
            tooltip.style.top = (canvas.getBoundingClientRect().top + activeNode.y - 50) + 'px';
            tooltip.querySelector('h5').textContent = "PAGE VIEWED";
            if(ttContent) ttContent.textContent = activeNode.title;
        }

        galaxyAnim = requestAnimationFrame(draw);
    }
    draw();
}

// --- STATS SYSTEM (FIXED) ---

function getStats() {
    const raw = localStorage.getItem('wiki_stats');
    const defaultStats = {
        gamesPlayed: 0,
        wins: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalClicks: 0,
        totalTimeSeconds: 0,
        fastestRun: null, 
        themeUsage: {},
        totalXP: 0 // Ensure this always exists
    };
    
    if (!raw) return defaultStats;
    
    const s = JSON.parse(raw);
    // Merge to ensure new fields (like totalXP) exist in old saves
    return { ...defaultStats, ...s };
}

function saveGameStats(isWin, timeInSeconds, clicks) {
    const s = getStats();
    s.gamesPlayed++;
    s.totalClicks += clicks;
    s.totalTimeSeconds += timeInSeconds;

    const currentTheme = localStorage.getItem('wiki_theme') || 'Classic';
    s.themeUsage[currentTheme] = (s.themeUsage[currentTheme] || 0) + 1;

    if (isWin) {
        s.wins++;
        s.currentStreak++;
        if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
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
    if(!screen) return;
    
    const winRate = s.gamesPlayed > 0 ? Math.floor((s.wins / s.gamesPlayed) * 100) : 0;
    const avgClicks = s.wins > 0 ? (s.totalClicks / s.wins).toFixed(1) : 0;
    
    const hours = Math.floor(s.totalTimeSeconds / 3600);
    const mins = Math.floor((s.totalTimeSeconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    let fastStr = "--:--";
    if (s.fastestRun !== null) {
        const fm = Math.floor(s.fastestRun / 60).toString().padStart(2,'0');
        const fs = (s.fastestRun % 60).toString().padStart(2,'0');
        fastStr = `${fm}:${fs}`;
    }

    let favTheme = "None";
    let maxCount = 0;
    for (const [theme, count] of Object.entries(s.themeUsage)) {
        if (count > maxCount) {
            maxCount = count;
            favTheme = theme;
        }
    }

    document.getElementById('s-wins').textContent = s.wins;
    document.getElementById('s-rate').textContent = winRate + "%";
    document.getElementById('s-streak').textContent = s.currentStreak;
    document.getElementById('s-fast').textContent = fastStr;
    document.getElementById('s-avg-clicks').textContent = avgClicks;
    document.getElementById('s-total-time').textContent = timeStr;
    document.getElementById('s-total-links').textContent = s.totalClicks.toLocaleString();
    document.getElementById('s-fav-theme').textContent = favTheme;

    // UPDATE RANK UI IN STATS
    updateRankDisplay();

    screen.classList.remove('hidden');
}

function closeStats() {
    const s = document.getElementById('stats-screen');
    if(s) s.classList.add('hidden');
}

// --- RANK & XP SYSTEM ---
const RANKS = [
    { name: "Novice", xp: 0 },
    { name: "Explorer", xp: 500 },
    { name: "Scholar", xp: 1500 },
    { name: "Archivist", xp: 3000 },
    { name: "Historian", xp: 5000 },
    { name: "Encyclopedist", xp: 8000 },
    { name: "Time Lord", xp: 12000 },
    { name: "Omniscient", xp: 20000 }
];

function getRankData(xp) {
    let currentRank = RANKS[0];
    let nextRank = RANKS[1];
    
    for (let i = 0; i < RANKS.length; i++) {
        if (xp >= RANKS[i].xp) {
            currentRank = RANKS[i];
            nextRank = RANKS[i+1] || { name: "Max", xp: 999999 };
        }
    }
    const level = Math.floor(xp / 250) + 1;
    return { current: currentRank, next: nextRank, level };
}

function updateRankDisplay() {
    const s = getStats(); 
    const xp = s.totalXP || 0;
    const { current, next, level } = getRankData(xp);
    
    // Safety check: Only update if elements exist
    const lobbyBadge = document.getElementById('lobby-rank');
    if(lobbyBadge) lobbyBadge.textContent = `Lvl ${level}`;

    const rTitle = document.getElementById('rank-title');
    if(rTitle) {
        rTitle.textContent = current.name;
        document.getElementById('rank-lvl').textContent = `Lvl ${level}`;
        document.getElementById('xp-current').textContent = `${xp}`;
        document.getElementById('xp-next').textContent = `${next.xp}`;
        
        let pct = 0;
        if (next.name !== "Max") {
            const range = next.xp - current.xp;
            const progress = xp - current.xp;
            pct = Math.min(100, Math.max(0, (progress / range) * 100));
        } else {
            pct = 100;
        }
        document.getElementById('xp-bar').style.width = `${pct}%`;
    }
}

function addXP(amount) {
    const s = getStats();
    s.totalXP = (s.totalXP || 0) + amount;
    localStorage.setItem('wiki_stats', JSON.stringify(s));
    updateRankDisplay();
}

// --- MINI-MAP RENDERER ---
function renderMiniMap(doc) {
    const map = document.getElementById('mini-map');
    if(!map) return;
    
    map.innerHTML = '';
    map.classList.remove('active');

    const headers = Array.from(doc.querySelectorAll('h2, h3'));
    if (headers.length < 2) return; 

    headers.forEach((h, index) => {
        if (!h.id) h.id = `section-${index}`;
        
        const dot = document.createElement('div');
        dot.className = 'map-dot';
        dot.dataset.targetId = h.id;
        dot.dataset.section = h.innerText.replace(/\[edit\]/g, '').trim();
        
        dot.onclick = (e) => {
            e.stopPropagation();
            document.getElementById(h.id).scrollIntoView({ behavior: 'smooth' });
        };
        
        map.appendChild(dot);
    });

    setTimeout(() => {
        const container = document.getElementById('article-content');
        if(!container) return;
        
        const totalHeight = container.scrollHeight;
        
        headers.forEach((h) => {
            const dot = map.querySelector(`[data-target-id="${h.id}"]`);
            if(dot) {
                const ratio = h.offsetTop / totalHeight;
                dot.style.top = `${ratio * 100}%`;
            }
        });
        map.classList.add('active');
    }, 500); 
}

// --- TEXT DECODER ANIMATION ---
function animateText(elementId, finalText) {
    const el = document.getElementById(elementId);
    if(!el) return;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let iterations = 0;
    
    if(el.dataset.animInterval) clearInterval(parseInt(el.dataset.animInterval));

    const interval = setInterval(() => {
        el.value = finalText.split("").map((letter, index) => {
            if(index < iterations) return finalText[index];
            return chars[Math.floor(Math.random() * chars.length)];
        }).join("");

        if(iterations >= finalText.length) {
            clearInterval(interval);
            el.value = finalText;
        }

        iterations += 1 / 2;
    }, 30);

    el.dataset.animInterval = interval;
}

// Initial Call
window.addEventListener('load', updateRankDisplay);