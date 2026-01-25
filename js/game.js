async function initGame() {
    let s = document.getElementById('start-in').value;
    let t = document.getElementById('end-in').value;
    
    if(state.mode !== 'gauntlet' && (!s || !t)) return showToast("Please enter both pages");
    if(state.mode === 'gauntlet' && !s) return showToast("Please enter start page");

    if(state.mode === 'gauntlet') {
        showToast("Generating Gauntlet...");
        try {
            const r = await fetch(`${API}?action=query&list=random&rnnamespace=0&rnlimit=3&format=json&origin=*`);
            const d = await r.json();
            state.target = d.query.random.map(x => x.title);
            state.gauntletIndex = 0;
            t = state.target[0];
            setupGauntletUI();
        } catch(e) { return showToast("Error generating targets"); }
    } else { state.target = t; }
    
    state.start = s;
    fetchTargetDesc(t);

    if(state.timer) clearInterval(state.timer);
    state.clicks = 0; state.penalties = 0; state.history = []; state.checkpoint = null;
    state.startTime = Date.now(); state.isPlaying = true;

    if(state.mode === 'sudden_death') {
        const customTime = parseInt(document.getElementById('sd-time-in').value) || 30;
        state.sdTime = customTime;
    } else { state.sdTime = 30; }

    document.getElementById('target-display').textContent = t;
    document.getElementById('click-count').textContent = '0';
    document.getElementById('timer').textContent = state.mode === 'sudden_death' ? formatTime(state.sdTime) : '00:00';
    
    document.getElementById('btn-load-cp').disabled = true;
    document.getElementById('gauntlet-bar').classList.toggle('active', state.mode === 'gauntlet');

    document.getElementById('lobby').classList.add('hidden');
    document.getElementById('game-header').classList.add('active');
    document.getElementById('viewport').classList.add('active');

    loadPage(s);
    state.timer = setInterval(tick, 1000);
}

function formatTime(s) {
    const min = Math.floor(s / 60).toString().padStart(2,'0');
    const sec = (s % 60).toString().padStart(2,'0');
    return `${min}:${sec}`;
}

async function fetchTargetDesc(title) {
    state.targetDesc = "Loading...";
    try {
        const url = `${API}?action=query&prop=extracts&exintro&exchars=300&explaintext&titles=${encodeURIComponent(title)}&format=json&origin=*`;
        const r = await fetch(url);
        const d = await r.json();
        const pid = Object.keys(d.query.pages)[0];
        if(pid === "-1") state.targetDesc = "No definition available.";
        else state.targetDesc = d.query.pages[pid].extract;
    } catch(e) { state.targetDesc = "Could not fetch definition."; }
}

function tick() {
    if(state.mode === 'sudden_death') {
        state.sdTime--;
        document.getElementById('timer-box').innerHTML = `⏱ ${formatTime(state.sdTime)}`;
        const box = document.getElementById('timer-box');
        if(state.sdTime <= 10) box.classList.add('danger-pulse'); else box.classList.remove('danger-pulse');
        if(state.sdTime <= 0) {
            clearInterval(state.timer);
            showToast("Time Expired!");
            setTimeout(returnToLobby, 2000);
        }
    } else {
        const delta = Math.floor((Date.now() - state.startTime)/1000) + state.penalties;
        document.getElementById('timer').textContent = formatTime(delta);
    }
}

async function loadPage(title, pushToHistory = true) {
    const loader = document.getElementById('loader');
    const content = document.getElementById('article-content');
    loader.classList.add('active'); content.classList.add('exit');

    try {
        const url = `${API}?action=parse&page=${encodeURIComponent(title)}&format=json&prop=text&redirects=1&disableeditsection=1&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error) throw new Error("Page not found");
        const realTitle = data.parse.title;
        const html = data.parse.text['*'];

        if(pushToHistory) state.history.push(realTitle);

        render(realTitle, html);
        
        setTimeout(() => {
            loader.classList.remove('active');
            content.classList.remove('exit'); content.classList.add('enter');
            setTimeout(() => content.classList.remove('enter'), 500);
            document.getElementById('wiki-container').scrollTop = 0;
            checkWinCondition(realTitle);
        }, 300);

    } catch(e) {
        showToast("Error loading page");
        loader.classList.remove('active'); content.classList.remove('exit');
    }
}

function render(title, html) {
    const div = document.getElementById('article-content');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    ['.mw-editsection', '.reference', '.reflist', '.infobox', 'table', 'style', 'script', '.hatnote', '.mw-empty-elt'].forEach(s => 
        doc.querySelectorAll(s).forEach(e => e.remove())
    );

    doc.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if(href && href.startsWith('/wiki/') && !href.includes(':')) {
            const pageName = decodeURIComponent(href.replace('/wiki/', ''));
            a.dataset.page = pageName;
            a.removeAttribute('href'); a.removeAttribute('title');
            a.addEventListener('mouseenter', (e) => showPreview(e, pageName));
            a.addEventListener('mouseleave', hidePreview);
        } else {
            const span = document.createElement('span');
            span.innerHTML = a.innerHTML;
            a.replaceWith(span);
        }
    });

    doc.querySelectorAll('img').forEach(img => {
        if(img.src.startsWith('//')) img.src = 'https:' + img.src;
        img.loading = "lazy"; img.style.maxWidth = "100%"; img.style.height = "auto";
    });

    div.innerHTML = `<h1>${title}</h1>${doc.body.innerHTML}`;
}

function checkWinCondition(currentTitle) {
    const current = currentTitle.toLowerCase();
    if(state.mode === 'gauntlet') {
        const target = state.target[state.gauntletIndex].toLowerCase();
        if(current === target) {
            playSound('win'); state.gauntletIndex++;
            if(state.gauntletIndex >= state.target.length) winGame();
            else {
                const next = state.target[state.gauntletIndex];
                document.getElementById('target-display').textContent = next;
                fetchTargetDesc(next); showToast(`Target Reached! Next: ${next}`);
            }
        }
    } else { if(current === state.target.toLowerCase()) winGame(); }
}

function winGame() {
    clearInterval(state.timer);
    playSound('win');
    startConfetti();
    saveGameStats(true, Math.floor((Date.now() - state.startTime)/1000), state.clicks);
    
    document.getElementById('win-time').textContent = document.getElementById('timer').textContent;
    document.getElementById('win-clicks').textContent = state.clicks;
    document.getElementById('win-path').textContent = state.history.join(' → ');
    document.getElementById('win-screen').classList.remove('hidden');
    setTimeout(() => renderGalaxy(state.history), 100);
}