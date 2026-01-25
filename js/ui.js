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

// --- GALAXY PATH VISUALIZER ---
let galaxyAnim;

function renderGalaxy(history) {
    const container = document.getElementById('galaxy-view');
    const canvas = document.getElementById('galaxy-canvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('target-tooltip');
    const ttContent = document.getElementById('tt-content');

    // Handle High-DPI Screens
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // --- NODE GENERATION ---
    const nodes = [];
    const padding = 40;
    const width = rect.width;
    const height = rect.height;

    // Create Nodes along a rough sine wave for flow
    history.forEach((title, i) => {
        const progress = i / (history.length - 1 || 1);
        
        // Calculate rough position
        let tx = padding + progress * (width - padding * 2);
        let ty = height / 2 + Math.sin(progress * Math.PI * 2) * (height / 4);
        
        // Add Randomness (The "Constellation" look)
        if (i !== 0 && i !== history.length - 1) {
            tx += (Math.random() - 0.5) * 40;
            ty += (Math.random() - 0.5) * 60;
        }

        nodes.push({
            x: tx,
            y: ty,
            title: title,
            r: i === 0 || i === history.length - 1 ? 8 : 5, // Start/End are bigger
            hover: 0, // Hover animation state
            type: i === 0 ? 'start' : (i === history.length - 1 ? 'end' : 'mid')
        });
    });

    // --- ANIMATION LOOP ---
    let time = 0;
    
    // Mouse Interaction
    let mx = -1000, my = -1000;
    canvas.onmousemove = (e) => {
        const r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
    };
    canvas.onmouseleave = () => { mx = -1000; tooltip.classList.remove('visible'); };

    if (galaxyAnim) cancelAnimationFrame(galaxyAnim);

    function draw() {
        ctx.clearRect(0, 0, width, height);
        time += 0.05;

        // 1. Draw Connecting Lines (The Path)
        ctx.beginPath();
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)"; // Blue accent low opacity
        ctx.lineWidth = 2;
        
        if (nodes.length > 0) {
            ctx.moveTo(nodes[0].x, nodes[0].y);
            // Curves between nodes
            for (let i = 0; i < nodes.length - 1; i++) {
                const p0 = nodes[i];
                const p1 = nodes[i + 1];
                // Bezier control point for smooth curves
                const cx = (p0.x + p1.x) / 2;
                const cy = (p0.y + p1.y) / 2;
                ctx.quadraticCurveTo(p0.x, p0.y, cx, cy);
                if (i === nodes.length - 2) ctx.lineTo(p1.x, p1.y);
            }
        }
        ctx.stroke();

        // 2. Draw Nodes
        let hoveredNode = null;

        nodes.forEach((n, i) => {
            // Distance Check
            const dist = Math.hypot(n.x - mx, n.y - my);
            const isHover = dist < 20;
            
            // Hover Animation Physics
            n.hover += (isHover ? 1 : -1) * 0.2;
            if (n.hover < 0) n.hover = 0;
            if (n.hover > 1) n.hover = 1;

            if (isHover) hoveredNode = n;

            // Draw Glow
            const glowSize = n.r * 2 + (Math.sin(time + i) * 2) + (n.hover * 10);
            const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowSize);
            
            let color = "255, 255, 255"; // Default White
            if (n.type === 'start') color = "34, 197, 94"; // Green
            if (n.type === 'end') color = "239, 68, 68"; // Red
            if (n.type === 'mid') color = "59, 130, 246"; // Blue

            grad.addColorStop(0, `rgba(${color}, ${0.8 + n.hover * 0.2})`);
            grad.addColorStop(1, `rgba(${color}, 0)`);
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(n.x, n.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Draw Core
            ctx.fillStyle = `rgba(255,255,255, ${0.9 + n.hover * 0.1})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r + (n.hover * 2), 0, Math.PI * 2);
            ctx.fill();
        });

        // 3. Handle Tooltip
        if (hoveredNode) {
            tooltip.classList.add('visible');
            // Position tooltip near mouse but use fixed positioning logic
            // Since tooltip is fixed, we use clientX/Y from the raw event if we had it, 
            // but here we approximate or just update content.
            // BETTER: Just update the text here, let CSS/Mousemove elsewhere handle position if possible.
            // Or manually set it:
            tooltip.style.left = (canvas.getBoundingClientRect().left + hoveredNode.x + 20) + 'px';
            tooltip.style.top = (canvas.getBoundingClientRect().top + hoveredNode.y - 40) + 'px';
            
            // Re-use the existing tooltip structure
            tooltip.querySelector('h5').textContent = hoveredNode.type.toUpperCase();
            ttContent.textContent = hoveredNode.title;
        } else {
            // Only hide if we aren't hovering another UI element that uses it
            // For simplicity in this context, we rely on mouseleave
        }

        galaxyAnim = requestAnimationFrame(draw);
    }

    draw();
}