window.onload = () => {
    renderThemes();
    setupAutocomplete('start-in', 'sugg-start');
    setupAutocomplete('end-in', 'sugg-end');
    
    const savedTheme = localStorage.getItem('wiki_theme');
    if(savedTheme) document.documentElement.setAttribute('data-theme', savedTheme.toLowerCase());
    
    const savedMode = localStorage.getItem('wiki_mode');
    if(savedMode) setMode(savedMode);

    const targetPill = document.getElementById('target-pill');
    const tooltip = document.getElementById('target-tooltip');
    
    targetPill.addEventListener('mouseenter', () => {
        if(state.isPlaying && state.targetDesc) {
            document.getElementById('tt-content').innerHTML = state.targetDesc;
            tooltip.classList.add('visible');
        }
    });
    targetPill.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));

    document.getElementById('article-content').addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if(link && link.dataset.page) {
            playSound('click');
            state.clicks++;
            document.getElementById('click-count').textContent = state.clicks;
            loadPage(link.dataset.page);
        }
    });
};

function setMode(m) {
    state.mode = m;
    localStorage.setItem('wiki_mode', m);
    
    // Update Toggle UI
    document.querySelectorAll('.mode-opt').forEach(b => b.classList.remove('active'));
    if(m === 'standard') document.getElementById('m-std').classList.add('active');
    if(m === 'sudden_death') document.getElementById('m-sd').classList.add('active');
    if(m === 'gauntlet') document.getElementById('m-gnt').classList.add('active');

    // Toggle Inputs
    const endGrp = document.getElementById('end-input-group');
    const sdConfig = document.getElementById('sd-config');
    const diffSelector = document.getElementById('diff-selector');
    const label = document.getElementById('setting-label');

    if(m === 'gauntlet') {
        endGrp.style.opacity = '0.5'; endGrp.style.pointerEvents = 'none';
        document.getElementById('end-in').value = "Randomly Generated...";
        sdConfig.style.display = 'none';
        diffSelector.style.display = 'flex';
        label.textContent = "Difficulty";
    } else if (m === 'sudden_death') {
        endGrp.style.opacity = '1'; endGrp.style.pointerEvents = 'all';
        document.getElementById('end-in').value = "";
        sdConfig.style.display = 'block';
        diffSelector.style.display = 'none';
        label.textContent = "Time Limit";
    } else {
        endGrp.style.opacity = '1'; endGrp.style.pointerEvents = 'all';
        document.getElementById('end-in').value = "";
        sdConfig.style.display = 'none';
        diffSelector.style.display = 'flex';
        label.textContent = "Difficulty";
    }
}

// NEW: Difficulty Segmented Control Logic
function setDiff(val, el) {
    document.getElementById('diff-value').value = val;
    document.querySelectorAll('.diff-seg').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

function adjustTime(amount) {
    const input = document.getElementById('sd-time-in');
    let val = parseInt(input.value) || 30;
    
    val += amount;
    
    if (val < 10) val = 10;
    if (val > 300) val = 300;
    
    input.value = val;
}

// --- CUSTOM DROPDOWN LOGIC ---

function toggleDiffMenu() {
    const dd = document.getElementById('diff-dd');
    dd.classList.toggle('open');
}

function selectDiff(value, text) {
    // 1. Update Hidden Value (for Game Logic)
    document.getElementById('diff-value').value = value;
    
    // 2. Update Visual Label
    document.getElementById('diff-label').textContent = text;
    
    // 3. Update Visual Selection State
    document.querySelectorAll('.dd-opt').forEach(opt => opt.classList.remove('active'));
    // Find the one we clicked (using event bubbling is tricky here, so we just match text)
    const opts = document.querySelectorAll('.dd-opt');
    opts.forEach(o => {
        if(o.textContent === text) o.classList.add('active');
    });

    // 4. Close Menu (Bubbling handles the toggle, so we stop propagation if needed, 
    // but the simplest way is to let the parent toggle handle the close, 
    // OR explicitly remove 'open' if we want to be safe)
    // Since the click on the option propagates to the parent onclick="toggleDiffMenu()", 
    // it will naturally toggle closed. We don't need extra code here.
}

// Close dropdown if clicking outside
window.addEventListener('click', (e) => {
    const dd = document.getElementById('diff-dd');
    if (dd && !dd.contains(e.target)) {
        dd.classList.remove('open');
    }
});