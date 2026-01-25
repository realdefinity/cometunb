// --- GAME LOOP & API ---

async function initGame() {
    let s = document.getElementById('start-in').value;
    let t = document.getElementById('end-in').value;
    
    // VALIDATION
    if((state.mode !== 'gauntlet' && state.mode !== 'survival') && (!s || !t)) return showToast("Please enter both pages");
    if((state.mode === 'gauntlet' || state.mode === 'survival') && !s) return showToast("Please enter start page");

    // SETUP TARGETS
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
    } 
    else if (state.mode === 'survival') {
        // SURVIVAL SETUP
        showToast("Initializing Survival...");
        try {
            const r = await fetch(`${API}?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`);
            const d = await r.json();
            state.target = d.query.random[0].title;
            state.survivalRound = 1;
            t = state.target;
        } catch(e) { return showToast("Error generating target"); }
    }
    else {
        state.target = t;
    }
    
    state.start = s;
    state.targetDesc = "Loading definition..."; 
    fetchTargetDesc(t);
    
    if(state.timer) clearInterval(state.timer);
    state.clicks = 0;
    state.penalties = 0;
    state.history = [];
    state.checkpoint = null;
    state.startTime = Date.now();
    state.isPlaying = true;

    // TIME SETUP
    if(state.mode === 'sudden_death') {
        state.sdTime = parseInt(document.getElementById('sd-time-in').value) || 30;
    } else if (state.mode === 'survival') {
        state.sdTime = 60; // Start with 60s
    } else {
        state.sdTime = 0;
    }

    // UI UPDATES
    document.getElementById('target-display').textContent = t;
    document.getElementById('click-count').textContent = '0';
    
    if(state.mode === 'sudden_death' || state.mode === 'survival') {
        document.getElementById('timer').textContent = formatTime(state.sdTime);
    } else {
        document.getElementById('timer').textContent = '00:00';
    }

    document.getElementById('btn-load-cp').disabled = true;
    
    // HUD Elements
    document.getElementById('gauntlet-bar').classList.toggle('active', state.mode === 'gauntlet');
    document.getElementById('surv-round-box').style.display = state.mode === 'survival' ? 'flex' : 'none';
    document.getElementById('surv-round').textContent = "1";

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

function setupGauntletUI() {
    const c = document.getElementById('g-dots-container');
    c.innerHTML = '';
    state.target.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = `g-dot ${i === 0 ? 'current' : ''}`;
        d.id = `g-dot-${i}`;
        c.appendChild(d);
    });
}

function tick() {
    // Both Sudden Death AND Survival count down
    if(state.mode === 'sudden_death' || state.mode === 'survival') {
        state.sdTime--;
        
        document.getElementById('timer-box').innerHTML = `⏱ ${formatTime(state.sdTime)}`;
        const box = document.getElementById('timer-box');
        
        if(state.sdTime <= 10) box.classList.add('danger-pulse');
        else box.classList.remove('danger-pulse');

        if(state.sdTime <= 0) {
            clearInterval(state.timer);
            playSound('alert');
            
            if(state.mode === 'survival') {
                endSurvivalGame();
            } else {
                showToast("Time Expired!");
                setTimeout(returnToLobby, 2000);
            }
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
            playSound('win');
            state.gauntletIndex++;
            if(state.gauntletIndex >= state.target.length) winGame();
            else {
                const next = state.target[state.gauntletIndex];
                document.getElementById('target-display').textContent = next;
                fetchTargetDesc(next);
                showToast(`Target Reached! Next: ${next}`);
            }
        }
    } 
    else if (state.mode === 'survival') {
        if(current === state.target.toLowerCase()) {
            nextSurvivalRound(currentTitle);
        }
    }
    else {
        if(current === state.target.toLowerCase()) winGame();
    }
}

// --- SURVIVAL LOGIC ---
async function nextSurvivalRound(currentTitle) {
    playSound('win');
    startConfetti();
    
    state.sdTime += 30; // Bonus time
    state.survivalRound++;
    
    showToast(`Round ${state.survivalRound}! +30s`);
    
    document.getElementById('surv-round').textContent = state.survivalRound;
    document.getElementById('timer-box').innerHTML = `⏱ ${formatTime(state.sdTime)}`;
    
    document.getElementById('target-display').innerHTML = `<span class="spin"></span> Fetching...`;
    
    try {
        const r = await fetch(`${API}?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`);
        const d = await r.json();
        const newTarget = d.query.random[0].title;
        
        state.target = newTarget;
        document.getElementById('target-display').textContent = newTarget;
        fetchTargetDesc(newTarget);
        
        // Use current page as new start
        state.start = currentTitle;
        
    } catch(e) {
        showToast("Error fetching next target");
    }
}

function endSurvivalGame() {
    const screen = document.getElementById('win-screen');
    const title = screen.querySelector('h1');
    const sub = document.getElementById('win-sub');
    
    // Custom "Game Over" Text
    title.textContent = "Game Over";
    title.style.color = "var(--danger)";
    sub.innerHTML = `You survived <b style="color:#fff; font-size:1.2rem;">${state.survivalRound}</b> Rounds`;
    
    document.getElementById('win-time').textContent = state.survivalRound; 
    document.getElementById('win-clicks').textContent = state.clicks;
    document.getElementById('win-path').textContent = state.history.join(' → ');
    
    screen.classList.remove('hidden');
    setTimeout(() => renderGalaxy(state.history), 100);
}

function winGame() {
    clearInterval(state.timer);
    playSound('win');
    startConfetti();
    saveGameStats(true, Math.floor((Date.now() - state.startTime)/1000), state.clicks);
    
    // Reset text just in case Survival changed it
    const screen = document.getElementById('win-screen');
    screen.querySelector('h1').textContent = "Victory!";
    screen.querySelector('h1').style.color = "var(--success)";
    
    document.getElementById('win-time').textContent = document.getElementById('timer').textContent;
    document.getElementById('win-clicks').textContent = state.clicks;
    document.getElementById('win-path').textContent = state.history.join(' → ');
    
    if(state.mode === 'gauntlet') document.getElementById('win-sub').textContent = "Gauntlet Completed";
    else document.getElementById('win-sub').textContent = "Destination Reached";

    screen.classList.remove('hidden');
    setTimeout(() => renderGalaxy(state.history), 100);
}

// ... Keep existing Randomize/Backtrack/Quit utils ...
async function randomize() {
    const btn = document.querySelector('.btn-text'); 
    const startIn = document.getElementById('start-in');
    const endIn = document.getElementById('end-in');
    const diff = document.getElementById('diff-value').value;
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span>🔄</span> Finding...`;
    
    startIn.value = "Scanning...";
    if(state.mode !== 'gauntlet' && state.mode !== 'survival') endIn.value = "Calculating...";

    try {
        const url = `${API}?action=query&generator=random&grnnamespace=0&grnlimit=20&prop=info&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.query || !data.query.pages) throw new Error("No data");

        let pages = Object.values(data.query.pages);
        pages = pages.filter(p => p.length > 2000);
        pages.sort((a, b) => a.length - b.length); 

        let sPage, tPage;

        if (diff === 'easy') {
            const pool = pages.slice(-5);
            sPage = pool[Math.floor(Math.random() * pool.length)].title;
            tPage = pages.slice(-6, -1)[0].title; 
        } else if (diff === 'hard') {
            const pool = pages.slice(0, 5);
            sPage = pool[Math.floor(Math.random() * pool.length)].title;
            tPage = pages.slice(1, 6)[0].title;
        } else {
            const mid = Math.floor(pages.length / 2);
            const pool = pages.slice(mid - 3, mid + 3);
            sPage = pool[Math.floor(Math.random() * pool.length)].title;
            tPage = pool[Math.floor(Math.random() * pool.length) === 0 ? 1 : 0].title;
        }

        if(!sPage) sPage = pages[pages.length-1].title;
        if(!tPage) tPage = pages[0].title;

        animateText('start-in', sPage);
        if(state.mode !== 'gauntlet' && state.mode !== 'survival') animateText('end-in', tPage);

    } catch(e) {
        showToast("Randomizer failed. Retrying...");
        const [s, t] = await Promise.all([getRandSimple(), getRandSimple()]);
        document.getElementById('start-in').value = s;
        if(state.mode !== 'gauntlet' && state.mode !== 'survival') document.getElementById('end-in').value = t;
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
}

async function getRandSimple() {
    const r = await fetch(`${API}?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`);
    const d = await r.json();
    return d.query.random[0].title;
}

function askBacktrack() {
    if(state.history.length <= 1) return showToast("Start of history");
    let penalty = (state.mode === 'sudden_death' || state.mode === 'survival') ? 0 : 10;
    showModal("Backtrack?", `Return to previous page. Penalty: ${state.mode === 'survival' ? 'None' : '+10s'}`, () => {
        state.penalties += penalty;
        state.history.pop(); 
        const prev = state.history[state.history.length - 1];
        state.history.pop(); 
        loadPage(prev);
        showToast(`Backtracked`);
    });
}

function setCheckpoint() {
    if(state.history.length === 0) return;
    const current = state.history[state.history.length-1];
    state.checkpoint = current;
    state.checkpointIndex = state.history.length - 1;
    document.getElementById('btn-load-cp').disabled = false;
    playSound('click');
    showToast(`Checkpoint Set: ${current}`);
}

function askLoadCheckpoint() {
    if(!state.checkpoint) return;
    showModal("Load Checkpoint?", `Return to ${state.checkpoint}.`, () => {
        state.history = state.history.slice(0, state.checkpointIndex);
        loadPage(state.checkpoint);
        showToast("Checkpoint Loaded");
    });
}

function askQuit() {
    showModal("Quit Game?", "All progress will be lost.", () => returnToLobby());
}

function returnToLobby() {
    clearInterval(state.timer);
    state.isPlaying = false;
    document.getElementById('game-header').classList.remove('active');
    document.getElementById('viewport').classList.remove('active');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('lobby').classList.remove('hidden');
}