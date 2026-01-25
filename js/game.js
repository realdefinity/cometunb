// --- GAME LOOP & API ---
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
        } catch(e) {
            return showToast("Error generating targets");
        }
        setupGauntletUI();
    } else {
        state.target = t;
    }
    state.start = s;

    fetchTargetDesc(t);

    if(state.timer) clearInterval(state.timer);
    state.clicks = 0;
    state.penalties = 0;
    state.history = [];
    state.checkpoint = null;
    state.startTime = Date.now();
    state.isPlaying = true;
    
    // --- SUDDEN DEATH CUSTOM TIME LOGIC ---
    if(state.mode === 'sudden_death') {
        const customTime = parseInt(document.getElementById('sd-time-in').value) || 30;
        state.sdTime = customTime;
        state.sdMaxTime = customTime; // Save for resets if you implement retry later
    } else {
        state.sdTime = 30;
    }

    document.getElementById('target-display').textContent = t;
    document.getElementById('click-count').textContent = '0';
    
    // Format timer display immediately
    if(state.mode === 'sudden_death') {
        const m = Math.floor(state.sdTime / 60).toString().padStart(2,'0');
        const s = (state.sdTime % 60).toString().padStart(2,'0');
        document.getElementById('timer').textContent = `${m}:${s}`;
    } else {
        document.getElementById('timer').textContent = '00:00';
    }

    document.getElementById('btn-load-cp').disabled = true;
    document.getElementById('btn-set-cp').disabled = false;
    document.getElementById('timer-box').classList.remove('danger-pulse');
    document.getElementById('gauntlet-bar').classList.toggle('active', state.mode === 'gauntlet');
    
    document.getElementById('lobby').classList.add('hidden');
    document.getElementById('game-header').classList.add('active');
    document.getElementById('viewport').classList.add('active');

    loadPage(s);
    state.timer = setInterval(tick, 1000);
}

async function fetchTargetDesc(title) {
    state.targetDesc = "Loading definition...";
    try {
        const r = await fetch(`${API}?action=query&prop=extracts&exintro&exchars=300&explaintext&titles=${encodeURIComponent(title)}&format=json&origin=*`);
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
    if(state.mode === 'sudden_death') {
        state.sdTime--;
        
        // Format MM:SS for Sudden Death
        const m = Math.floor(state.sdTime / 60).toString().padStart(2,'0');
        const s = (state.sdTime % 60).toString().padStart(2,'0');
        
        const box = document.getElementById('timer-box');
        box.innerHTML = `⏱ ${m}:${s}`; // Fixed format
        
        if(state.sdTime <= 10) box.classList.add('danger-pulse');
        else box.classList.remove('danger-pulse');

        if(state.sdTime <= 0) {
            clearInterval(state.timer);
            playSound('alert');
            showToast("Time Expired! Game Over.");
            setTimeout(returnToLobby, 2500);
        }
    } else {
        const delta = Math.floor((Date.now() - state.startTime)/1000) + state.penalties;
        const m = Math.floor(delta/60).toString().padStart(2,'0');
        const s = (delta%60).toString().padStart(2,'0');
        document.getElementById('timer').textContent = `${m}:${s}`;
    }
}

async function loadPage(title, pushToHistory = true) {
    const loader = document.getElementById('loader');
    const content = document.getElementById('article-content');
    
    content.classList.remove('active');
    content.classList.add('exit'); 
    loader.classList.add('active');

    try {
        const url = `${API}?action=parse&page=${encodeURIComponent(title)}&format=json&prop=text|images&redirects=1&disableeditsection=1&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        
        if(data.error) throw new Error("Page not found");
        
        const realTitle = data.parse.title;
        const html = data.parse.text['*'];

        if(pushToHistory) state.history.push(realTitle);

        // Note: I removed the logic that resets time on page load for Sudden Death
        // because we are now using a fixed total time limit instead of "per page".
        // If you want "per page" time logic back, let me know.

        setTimeout(() => {
            render(realTitle, html);
            updateBreadcrumbs();
            loader.classList.remove('active');
            
            content.classList.remove('exit');
            content.classList.add('enter');
            void content.offsetWidth; 
            content.classList.remove('enter');
            content.classList.add('active'); 
            
            document.getElementById('wiki-container').scrollTop = 0;
            checkWinCondition(realTitle);
        }, 400);

    } catch(e) {
        showToast("Could not load page");
        loader.classList.remove('active');
        content.classList.remove('exit');
        content.classList.add('active');
    }
}

function checkWinCondition(currentTitle) {
    const current = currentTitle.toLowerCase();
    
    if(state.mode === 'gauntlet') {
        const currentTarget = state.target[state.gauntletIndex].toLowerCase();
        if(current === currentTarget) {
            playSound('win');
            state.gauntletIndex++;
            
            document.getElementById(`g-dot-${state.gauntletIndex-1}`).classList.remove('current');
            document.getElementById(`g-dot-${state.gauntletIndex-1}`).classList.add('done');

            if(state.gauntletIndex >= state.target.length) {
                winGame();
            } else {
                const nextT = state.target[state.gauntletIndex];
                document.getElementById(`g-dot-${state.gauntletIndex}`).classList.add('current');
                document.getElementById('target-display').textContent = nextT;
                fetchTargetDesc(nextT);
                showToast(`Target Reached! Next: ${nextT}`);
            }
        }
    } else {
        if(current === state.target.toLowerCase()) winGame();
    }
}

function render(title, html) {
    const div = document.getElementById('article-content');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    ['.mw-editsection', '.reference', '.reflist', '.infobox', 'table', 'style', 'script', '.hatnote', '.mw-empty-elt', '.portal'].forEach(s => 
        doc.querySelectorAll(s).forEach(e => e.remove())
    );

    doc.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if(href && href.startsWith('/wiki/') && !href.includes(':')) {
            const pageName = decodeURIComponent(href.replace('/wiki/', ''));
            a.dataset.page = pageName;
            a.removeAttribute('href');
            a.addEventListener('mouseenter', (e) => showPreview(e, pageName));
            a.addEventListener('mouseleave', hidePreview);
        } else if (!href || href.includes(':')) {
             const s = document.createElement('span');
            s.innerHTML = a.innerHTML;
            a.replaceWith(s);
        } else {
            const s = document.createElement('span');
            s.textContent = a.textContent;
            a.replaceWith(s);
        }
    });

    doc.querySelectorAll('img').forEach(img => {
        if(img.src.startsWith('//')) img.src = 'https:' + img.src;
        img.loading = "lazy";
    });

    div.innerHTML = `<h1>${title}</h1>${doc.body.innerHTML}`;
}

function winGame() {
    clearInterval(state.timer);
    playSound('win');
    startConfetti();
    
    const timeStr = document.getElementById('timer').textContent;
    document.getElementById('win-time').textContent = timeStr;
    document.getElementById('win-clicks').textContent = state.clicks;
    document.getElementById('win-penalties').textContent = state.penalties + 's';
    
    const path = state.history.join(' → ');
    document.getElementById('win-path').textContent = path;
    
    // --- NEW: SAVE STATS ---
    // Calculate total seconds for the record
    const now = Date.now();
    const duration = Math.floor((now - state.startTime) / 1000) + state.penalties;
    saveGameStats(true, duration, state.clicks);
    // -----------------------

    if(state.mode === 'gauntlet') document.getElementById('win-sub').textContent = "Gauntlet Completed";
    else document.getElementById('win-sub').textContent = "Destination Reached";

    document.getElementById('win-screen').classList.remove('hidden');
    
    setTimeout(() => {
        renderGalaxy(state.history);
    }, 100);
}

async function randomize() {
    const btn = document.querySelector('.rand-btn');
    const startIn = document.getElementById('start-in');
    const endIn = document.getElementById('end-in');
    const diff = document.getElementById('diff-select').value;
    
    // Visual Feedback
    btn.disabled = true;
    btn.innerHTML = `<div class="spin" style="width:14px; height:14px; border-width:2px; display:inline-block;"></div> Thinking...`;
    
    // Placeholder animation
    startIn.value = "Scanning Archive...";
    if(state.mode !== 'gauntlet') endIn.value = "Calculating complexity...";

    try {
        // 1. Fetch a BATCH of random pages (20 items) with their metadata (length)
        // We use generator=random to get pages + prop=info to get their size (bytes)
        const url = `${API}?action=query&generator=random&grnnamespace=0&grnlimit=20&prop=info&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.query || !data.query.pages) throw new Error("No data");

        // 2. Convert to Array and Filter
        let pages = Object.values(data.query.pages);
        
        // Filter out tiny stubs (under 2000 bytes) to ensure quality
        pages = pages.filter(p => p.length > 2000);

        // 3. Sort by Length (Proxy for "Difficulty/Connectivity")
        // Long pages = More links = Easier
        // Short pages = Fewer links = Harder
        pages.sort((a, b) => a.length - b.length); // Ascending (Smallest first)

        let sPage, tPage;

        // 4. Select based on Difficulty
        if (diff === 'easy') {
            // Pick from the top 5 Largest pages (End of array)
            const pool = pages.slice(-5);
            sPage = pool[Math.floor(Math.random() * pool.length)].title;
            // Get another batch or pick distinct
            tPage = pages.slice(-6, -1)[0].title; 
        } else if (diff === 'hard') {
            // Pick from the bottom 5 Smallest pages (Start of array)
            const pool = pages.slice(0, 5);
            sPage = pool[Math.floor(Math.random() * pool.length)].title;
            tPage = pages.slice(1, 6)[0].title;
        } else {
            // Medium: Pick from the middle
            const mid = Math.floor(pages.length / 2);
            const pool = pages.slice(mid - 3, mid + 3);
            sPage = pool[Math.floor(Math.random() * pool.length)].title;
            tPage = pool[Math.floor(Math.random() * pool.length) === 0 ? 1 : 0].title;
        }

        // Fallback if filtering killed too many pages
        if(!sPage) sPage = pages[pages.length-1].title;
        if(!tPage) tPage = pages[0].title;

        // 5. Apply Fluid Animation
        animateText('start-in', sPage);
        if(state.mode !== 'gauntlet') animateText('end-in', tPage);

    } catch(e) {
        console.error(e);
        showToast("Randomizer failed. Retrying...");
        // Fallback to simple random if batch fails
        const [s, t] = await Promise.all([getRandSimple(), getRandSimple()]);
        document.getElementById('start-in').value = s;
        if(state.mode !== 'gauntlet') document.getElementById('end-in').value = t;
    }

    btn.disabled = false;
    btn.innerHTML = "🎲 Randomize";
}

async function getRandSimple() {
    const r = await fetch(`${API}?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`);
    const d = await r.json();
    return d.query.random[0].title;
}

function askBacktrack() {
    if(state.history.length <= 1) return showToast("Start of history");
    let penalty = state.mode === 'sudden_death' ? 0 : 10;
    showModal("Backtrack?", `Return to previous page. Penalty: +${penalty}s`, () => {
        state.penalties += penalty;
        state.history.pop(); 
        const prev = state.history[state.history.length - 1];
        state.history.pop(); 
        loadPage(prev);
        showToast(`Backtracked (+${penalty}s)`);
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
    showModal("Load Checkpoint?", `Return to ${state.checkpoint}. Penalty: +20s`, () => {
        state.penalties += 20;
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