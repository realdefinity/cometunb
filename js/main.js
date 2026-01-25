window.onload = () => {
    if (window.state && window.state.isPlaying) return;

    renderThemes();
    setupAutocomplete('start-in', 'sugg-start');
    setupAutocomplete('end-in', 'sugg-end');
    
    const savedTheme = localStorage.getItem('wiki_theme');
    if(savedTheme) document.documentElement.setAttribute('data-theme', savedTheme.toLowerCase());
    
    setMode(localStorage.getItem('wiki_mode') || 'standard');

    document.getElementById('article-content').addEventListener('click', (e) => {
        const link = e.target.closest('[data-page]'); 
        if (link) {
            e.preventDefault();
            playSound('click');
            state.clicks++;
            document.getElementById('click-count').textContent = state.clicks;
            loadPage(link.dataset.page);
        }
    });

    const targetPill = document.getElementById('target-pill');
    const tooltip = document.getElementById('target-tooltip');
    
    targetPill.addEventListener('mouseenter', () => {
        if(state.isPlaying) {
            const desc = state.targetDesc || "Loading definition...";
            document.getElementById('tt-content').innerHTML = desc;
            tooltip.classList.add('visible');
        }
    });
    
    targetPill.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
    });
};

function setMode(m) {
    state.mode = m;
    localStorage.setItem('wiki_mode', m);
    
    document.querySelectorAll('.seg-opt').forEach(b => b.classList.remove('active'));
    if(m === 'standard') document.getElementById('m-std').classList.add('active');
    if(m === 'sudden_death') document.getElementById('m-sd').classList.add('active');
    if(m === 'gauntlet') document.getElementById('m-gnt').classList.add('active');

    const endInput = document.getElementById('end-in');
    const sdConfig = document.getElementById('sd-config');
    const diffSelector = document.getElementById('diff-selector');
    const label = document.getElementById('setting-label');

    if(m === 'gauntlet') {
        endInput.value = "Randomly Generated...";
        endInput.disabled = true;
        endInput.style.opacity = '0.5';
        sdConfig.style.display = 'none';
        diffSelector.style.display = 'flex';
        label.textContent = "Difficulty";
    } else if (m === 'sudden_death') {
        endInput.value = "";
        endInput.disabled = false;
        endInput.style.opacity = '1';
        sdConfig.style.display = 'flex';
        diffSelector.style.display = 'none';
        label.textContent = "Time Limit";
    } else {
        endInput.value = "";
        endInput.disabled = false;
        endInput.style.opacity = '1';
        sdConfig.style.display = 'none';
        diffSelector.style.display = 'flex';
        label.textContent = "Difficulty";
    }
}

function setDiff(val, el) {
    document.getElementById('diff-value').value = val;
    document.querySelectorAll('.seg-opt-sm').forEach(s => s.classList.remove('active'));
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