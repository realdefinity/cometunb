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