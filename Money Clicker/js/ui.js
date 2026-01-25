const suffixStandard = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

// --- 0. STYLE INJECTION (Toasts & Tooltips) ---
(function injectUIStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        /* Toast Container */
        #toast-container { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column-reverse; gap: 8px; pointer-events: none; }
        
        /* Toast Item */
        .toast { 
            background: rgba(10, 10, 10, 0.9); border: 1px solid #333; color: #fff; 
            padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; font-family: 'Outfit', sans-serif;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5); backdrop-filter: blur(8px);
            animation: toast-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex; align-items: center; gap: 8px;
        }
        .toast.success { border-color: rgba(34, 197, 94, 0.3); color: #4ade80; }
        .toast.error { border-color: rgba(239, 68, 68, 0.3); color: #f87171; }
        
        @keyframes toast-in { from { transform: translateY(20px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes toast-out { to { transform: translateY(-10px); opacity: 0; } }

        /* ROI Tooltip */
        #ui-tooltip {
            position: fixed; pointer-events: none; z-index: 11000;
            background: rgba(0, 0, 0, 0.95); border: 1px solid #333;
            padding: 10px 14px; border-radius: 8px;
            font-size: 0.7rem; color: #ccc; font-family: 'JetBrains Mono', monospace;
            box-shadow: 0 10px 40px rgba(0,0,0,1);
            opacity: 0; transition: opacity 0.1s; transform: translate(15px, 15px);
        }
        #ui-tooltip strong { display: block; color: #fff; margin-bottom: 4px; font-family: 'Outfit', sans-serif; font-size: 0.8rem; }
        #ui-tooltip .val { color: #eab308; font-weight: 700; }
        #ui-tooltip .bad { color: #ef4444; }
    `;
    document.head.appendChild(style);
    
    // Create Elements
    const toastCont = document.createElement('div');
    toastCont.id = 'toast-container';
    document.body.appendChild(toastCont);
    
    const tooltip = document.createElement('div');
    tooltip.id = 'ui-tooltip';
    document.body.appendChild(tooltip);
})();

// --- 1. FORMATTER ---
function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toLocaleString();
    let tier = Math.floor(Math.log10(num) / 3);
    if (tier < suffixStandard.length) {
        let suffix = suffixStandard[tier];
        let scale = Math.pow(10, tier * 3);
        return (num / scale).toFixed(2) + suffix;
    }
    return num.toExponential(2).replace('+', '');
}

// --- 2. NEW UI UTILITIES ---

// Toast System
function showToast(msg, type = 'info') {
    const cont = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = type === 'success' ? `<span>✓</span> ${msg}` : (type === 'error' ? `<span>✕</span> ${msg}` : msg);
    
    cont.appendChild(el);
    
    // Remove after 2.5s
    setTimeout(() => {
        el.style.animation = 'toast-out 0.3s forwards';
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

// Dynamic News System
function pushNews(text) {
    const el = document.getElementById('news-content');
    if (!el) return;
    
    // Force reset CSS animation to play immediately
    el.style.animation = 'none';
    el.offsetHeight; /* trigger reflow */
    el.innerText = text;
    el.style.animation = 'ticker 25s linear infinite';
}

// Tooltip Logic
const tooltip = document.getElementById('ui-tooltip');
function showTooltip(e, id) {
    const u = upgrades[id];
    let max = getMaxBuy(id);
    let amt = (buyMode === 'MAX') ? max : buyMode;
    if(buyMode === 'MAX' && amt === 0) amt = 1;
    let cost = getCost(id, amt);
    
    // Calculate ROI (Time to break even)
    // Rate = Base * Count * InfluenceMult * Mania
    let influenceMult = 1 + (game.influence * 0.10);
    let rate = u.baseRate * amt * influenceMult;
    let roiSeconds = rate > 0 ? cost / rate : 0;
    let roiText = roiSeconds < 60 ? `${roiSeconds.toFixed(1)}s` : 
                  (roiSeconds < 3600 ? `${(roiSeconds/60).toFixed(1)}m` : 
                  `${(roiSeconds/3600).toFixed(1)}h`);

    tooltip.innerHTML = `
        <strong>${u.name} Analysis</strong>
        <div>Cost: <span class="val">$${formatNumber(cost)}</span></div>
        <div>Income: <span class="val">+$${formatNumber(rate)}/s</span></div>
        <div style="margin-top:4px; border-top:1px solid #333; padding-top:4px; opacity:0.8;">
            ROI Time: <span style="color:${roiSeconds < 600 ? '#4ade80' : '#facc15'}">${roiText}</span>
        </div>
    `;
    tooltip.style.opacity = '1';
    moveTooltip(e);
}

function hideTooltip() {
    tooltip.style.opacity = '0';
}

function moveTooltip(e) {
    // Keep inside screen
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    if (x + 200 > window.innerWidth) x = e.clientX - 215;
    if (y + 100 > window.innerHeight) y = e.clientY - 100;
    
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}


// --- 3. MAIN UI LOOP ---
function updateUI(rate) {
    // 1. Core
    document.title = `$${formatNumber(game.money)} - THE MINT`;
    document.getElementById('ui-money').innerText = formatNumber(game.money);
    
    const elRate = document.getElementById('ui-rate');
    if(elRate) elRate.innerText = formatNumber(rate);
    
    // 2. Rank & Prestige Logic
    let currentRankIndex = 0;
    for(let i = 0; i < rankData.length; i++) {
        if(game.influence >= rankData[i].req) {
            currentRankIndex = i;
        } else {
            break; 
        }
    }
    
    let currentRank = rankData[currentRankIndex];
    let nextRank = rankData[currentRankIndex + 1];
    
    // Update Prestige Card
    document.getElementById('rank-name').innerText = currentRank.name;
    document.getElementById('ui-influence').innerText = formatNumber(game.influence);
    document.getElementById('ui-bonus').innerText = formatNumber(game.influence * 10);
    
    // Rank Progress Bar
    let rankProgress = 0;
    let nextGoalText = "MAX RANK ACHIEVED";
    
    if (nextRank) {
        let range = nextRank.req - currentRank.req;
        let currentInTier = game.influence - currentRank.req;
        rankProgress = Math.max(0, Math.min(100, (currentInTier / range) * 100));
        let missingInf = nextRank.req - game.influence;
        nextGoalText = `${formatNumber(missingInf)} INF TO ${nextRank.name.toUpperCase()}`;
    } else {
        rankProgress = 100;
    }
    
    const bar = document.getElementById('influence-bar');
    if(bar) bar.style.width = rankProgress + "%";
    
    const nextText = document.getElementById('next-rank-text');
    if(nextText) nextText.innerText = nextGoalText;

    // 3. Prestige Button State
    let nextPointTotal = game.influence + 1;
    let costForNextPoint = Math.pow(nextPointTotal, 2) * 1000000;
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    let btn = document.getElementById('btn-open-prestige');
    
    if (potential > game.influence) {
        let gain = potential - game.influence;
        btn.classList.add('ready');
        btn.innerHTML = `LIQUIDATE ASSETS <span style="font-size:0.8em; opacity:0.9; margin-left:5px;">(+${formatNumber(gain)} Inf)</span>`;
    } else {
        let missingCash = costForNextPoint - game.lifetimeEarnings;
        if(missingCash < 0) missingCash = 0; 
        btn.classList.remove('ready');
        btn.innerHTML = `NEED $${formatNumber(missingCash)} MORE VALUE`;
    }

    // 4. Hype
    const hypeBar = document.getElementById('hype-bar');
    const hypeText = document.getElementById('hype-text');
    if(hypeBar) hypeBar.style.width = hype + '%';
    if(hypeText) hypeText.innerText = Math.floor(hype) + '%';
    
    // 5. Shop
    updateShopUI(1 + (game.influence * 0.10));
}

function updateShopUI(influenceMult) {
    upgrades.forEach((u, i) => {
        let el = document.getElementById(`upg-${i}`);
        if (!el) return;
        
        let max = getMaxBuy(i);
        let amt = (buyMode === 'MAX') ? max : buyMode;
        if(buyMode === 'MAX' && amt === 0) amt = 1;

        let cost = getCost(i, amt);
        let affordable = game.money >= cost;
        
        // Update Text
        el.querySelector('.cost-text').innerText = "$" + formatNumber(cost);
        el.querySelector('.count-badge').innerText = game.counts[i];
        
        let buyAmountText = (buyMode === 'MAX' && max > 0) ? `+${max}` : (buyMode !== 1 && buyMode !== 'MAX' ? `+${amt}` : '');
        el.querySelector('h4').innerHTML = `${u.name} <span style="font-size:0.7em; opacity:0.5; margin-left:4px;">${buyAmountText}</span>`;
        
        let boostRate = u.baseRate * influenceMult * (maniaMode ? 2 : 1);
        el.querySelector('.rate-boost').innerText = `+$${formatNumber(boostRate)}/s`;
        
        // Update Classes
        el.classList.remove('affordable', 'affordable-max', 'locked');
        if (affordable && (buyMode !== 'MAX' || max > 0)) {
            el.classList.add(buyMode === 'MAX' ? 'affordable-max' : 'affordable');
        } else if (game.counts[i] === 0 && !affordable) {
            el.classList.add('locked');
        }
    });
}

function renderShop() {
    const container = document.getElementById('shop-container');
    container.innerHTML = '';
    upgrades.forEach((u, i) => {
        let div = document.createElement('div');
        div.className = 'upgrade';
        div.id = `upg-${i}`;
        
        // --- UPDATED CLICK HANDLER (News + Toasts) ---
        div.onclick = () => {
            let prevCount = game.counts[i];
            buy(i); // Call Game Logic
            
            if (game.counts[i] > prevCount) {
                // Success!
                pushNews(`MARKET ALERT: ACQUIRED ${u.name.toUpperCase()}. PORTFOLIO UP.`);
                showToast(`Bought ${u.name}`, 'success');
                // Instant update of tooltip numbers
                showTooltip({ clientX: parseFloat(tooltip.style.left), clientY: parseFloat(tooltip.style.top) }, i);
            } else {
                // Fail
                showToast(`Insufficient Funds`, 'error');
            }
        };

        // --- MOUSE EVENTS (Tooltips) ---
        div.onmouseenter = (e) => showTooltip(e, i);
        div.onmousemove = (e) => moveTooltip(e);
        div.onmouseleave = hideTooltip;

        div.innerHTML = `
            <div class="upg-info">
                <h4>${u.name}</h4>
                <p>
                    <span class="rate-boost">+$0/s</span> 
                    <span style="opacity:0.5">| Base: $${formatNumber(u.baseRate)}</span>
                </p>
            </div>
            <div class="upg-cost">
                <div class="cost-text">...</div>
                <div class="count-badge">0</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function setBuyMode(mode, btn) {
    buyMode = mode;
    document.querySelectorAll('.buy-amt').forEach(b => b.classList.remove('active', 'active-max'));
    btn.classList.add(mode === 'MAX' ? 'active-max' : 'active');
    updateUI(0);
}

function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
}

function openExport() {
    saveLocal();
    const txt = document.getElementById('save-data-input');
    const btn = document.getElementById('modal-action-btn');
    txt.value = btoa(JSON.stringify(game));
    btn.innerText = "COPY TO CLIPBOARD";
    btn.onclick = () => {
        txt.select(); document.execCommand('copy'); 
        btn.innerText = "COPIED!";
        showToast("Save Data Copied", "success");
        setTimeout(() => closeModal('save-modal'), 1000);
    };
    openModal('save-modal');
}

function openImport() {
    const txt = document.getElementById('save-data-input');
    const btn = document.getElementById('modal-action-btn');
    txt.value = ""; txt.placeholder = "Paste save code...";
    btn.innerText = "IMPORT";
    btn.onclick = () => {
        try {
            let data = JSON.parse(atob(txt.value.trim()));
            game = { ...game, ...data };
            saveLocal(); 
            showToast("Save Loaded", "success");
            setTimeout(() => location.reload(), 500);
        } catch(e) { 
            showToast("Invalid Save Data", "error"); 
        }
    };
    openModal('save-modal');
}

function hardReset() {
    if(confirm("FACTORY RESET: Wipe all progress?")) {
        localStorage.removeItem('mintV7_money_save');
        location.reload();
    }
}

let audioEnabled = true;
function toggleAudio() {
    audioEnabled = !audioEnabled;
    const btn = document.getElementById('mute-toggle');
    if(audioEnabled) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        btn.classList.add('active'); btn.innerHTML = "&#128266;";
        showToast("Audio Enabled", "info");
    } else {
        btn.classList.remove('active'); btn.innerHTML = "&#128263;";
        showToast("Audio Muted", "info");
    }
}