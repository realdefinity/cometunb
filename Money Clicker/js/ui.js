const suffixStandard = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

// --- NUCLEAR RIGHT-CLICK DISABLE ---
// This is placed at the top level to ensure it catches events immediately.
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
}, { capture: true });

// --- 0. STYLE & UI INJECTION (Toasts, Tooltips, Analytics, & Interaction) ---
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

        /* Analytics Specific Styles */
        .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; margin-top: 20px; }
        .analytics-card { background: rgba(255,255,255,0.03); border: 1px solid #222; border-radius: 12px; padding: 15px; }
        .analytics-card h5 { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; }
        .graph-container { height: 100px; width: 100%; position: relative; }
        .breakdown-row { display: flex; justify-content: space-between; font-size: 0.65rem; margin-bottom: 4px; font-family: 'JetBrains Mono'; }
        .breakdown-bar-bg { height: 4px; background: #222; border-radius: 2px; width: 100%; margin-top: 2px; overflow: hidden; }
        .breakdown-bar-fill { height: 100%; background: var(--green); }
        .stat-big { font-size: 1.2rem; font-weight: 800; color: #fff; font-family: 'JetBrains Mono'; }
        .stat-sub { font-size: 0.6rem; color: #555; }

        /* Portfolio Tabs */
        .shop-tabs { display: flex; gap: 16px; margin-bottom: 20px; border-bottom: 1px solid var(--panel-border); padding-bottom: 12px; }
        .tab-btn { font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; color: #444; cursor: pointer; transition: color 0.2s; position: relative; }
        .tab-btn.active { color: var(--text-main); }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -13px; left: 0; right: 0; height: 2px; background: var(--green); box-shadow: 0 0 10px var(--green-glow); }
        .portfolio-empty { text-align: center; padding: 40px 20px; color: #444; font-family: 'JetBrains Mono'; font-size: 0.8rem; }
    `;
    document.head.appendChild(style);
    
    // Create Elements
    const toastCont = document.createElement('div');
    toastCont.id = 'toast-container';
    document.body.appendChild(toastCont);
    
    const tooltip = document.createElement('div');
    tooltip.id = 'ui-tooltip';
    document.body.appendChild(tooltip);

    if (!document.getElementById('analytics-modal')) {
        const modal = document.createElement('div');
        modal.id = 'analytics-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="close-modal" onclick="closeModal('analytics-modal')">&times;</div>
                <h2 style="font-weight:900; letter-spacing:1px; margin-bottom:5px;">MARKET ANALYTICS</h2>
                <div class="analytics-grid">
                    <div class="analytics-card" style="grid-column: span 2;">
                        <h5>Income Velocity (60s)</h5>
                        <div class="graph-container"><canvas id="income-graph"></canvas></div>
                    </div>
                    <div class="analytics-card">
                        <h5>Asset Distribution</h5>
                        <div id="asset-breakdown-list"></div>
                    </div>
                    <div class="analytics-card">
                        <h5>Network Statistics</h5>
                        <div id="network-stats">
                            <div style="margin-bottom:10px;"><div class="stat-big" id="stat-session-earned">$0</div><div class="stat-sub">SESSION EARNINGS</div></div>
                            <div><div class="stat-big" id="stat-cps">0.0</div><div class="stat-sub">CLICKS PER SECOND</div></div>
                        </div>
                    </div>
                </div>
                <button class="opt-btn" onclick="closeModal('analytics-modal')" style="margin-top:20px;">CLOSE DATA STREAM</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
})();

// --- 1. STATE & UTILS ---
let currentShopTab = 'markets';

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

const analytics = {
    history: [],
    maxHistory: 60,
    sessionStartMoney: 0,
    clickHistory: [],
    lastGraphUpdate: 0,
    update(currentRate) {
        const now = Date.now();
        if (this.sessionStartMoney === 0) this.sessionStartMoney = game.money;
        if (now - this.lastGraphUpdate > 1000) {
            this.history.push(currentRate);
            if (this.history.length > this.maxHistory) this.history.shift();
            this.lastGraphUpdate = now;
        }
        this.clickHistory = this.clickHistory.filter(t => now - t < 1000);
    },
    getCPS() { return this.clickHistory.length; }
};

// Track clicks for Analytics
const originalClickAction = window.clickAction;
window.clickAction = function(e) {
    analytics.clickHistory.push(Date.now());
    if (originalClickAction) originalClickAction(e);
};

// --- 2. NOTIFICATIONS & TOOLTIPS ---
function showToast(msg, type = 'info') {
    const cont = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = type === 'success' ? `<span>✓</span> ${msg}` : (type === 'error' ? `<span>✕</span> ${msg}` : msg);
    cont.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'toast-out 0.3s forwards';
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

function pushNews(text) {
    const el = document.getElementById('news-content');
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight;
    el.innerText = text;
    el.style.animation = 'ticker 25s linear infinite';
}

const tooltip = document.getElementById('ui-tooltip');
function showTooltip(e, id) {
    const u = upgrades[id];
    let max = getMaxBuy(id);
    let amt = (buyMode === 'MAX') ? max : buyMode;
    if(buyMode === 'MAX' && amt === 0) amt = 1;
    let cost = getCost(id, amt);
    
    let influenceMult = 1 + (game.influence * 0.10);
    let levelMult = game.levels && game.levels[id] ? game.levels[id] : 1;
    let rate = u.baseRate * amt * influenceMult * levelMult;
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
function hideTooltip() { tooltip.style.opacity = '0'; }
function moveTooltip(e) {
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    if (x + 200 > window.innerWidth) x = e.clientX - 215;
    if (y + 100 > window.innerHeight) y = e.clientY - 100;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

// --- 3. ANALYTICS & GRAPHING ---
function drawIncomeGraph() {
    const canvas = document.getElementById('income-graph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    const data = analytics.history;
    if (data.length < 2) return;
    const max = Math.max(...data) * 1.2 || 10;
    const stepX = rect.width / (analytics.maxHistory - 1);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    data.forEach((val, i) => {
        const x = i * stepX;
        const y = rect.height - (val / max) * rect.height;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.lineTo((data.length - 1) * stepX, rect.height);
    ctx.lineTo(0, rect.height);
    const grad = ctx.createLinearGradient(0, 0, 0, rect.height);
    grad.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
    grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
}

function updateAnalyticsUI(rate) {
    if (document.getElementById('analytics-modal').style.display !== 'flex') return;
    document.getElementById('stat-session-earned').innerText = `$${formatNumber(game.money - analytics.sessionStartMoney)}`;
    document.getElementById('stat-cps').innerText = analytics.getCPS().toFixed(1);
    const list = document.getElementById('asset-breakdown-list');
    let html = '';
    const totalRate = rate || 1;
    const sources = upgrades.map((u, i) => ({
        name: u.name,
        income: game.counts[i] * u.baseRate * (1 + (game.influence * 0.10)) * (game.levels && game.levels[i] ? game.levels[i] : 1) * (maniaMode ? 2 : 1)
    })).sort((a, b) => b.income - a.income).slice(0, 5);
    sources.forEach(s => {
        if (s.income <= 0) return;
        const pct = (s.income / totalRate) * 100;
        html += `<div style="margin-bottom:8px;"><div class="breakdown-row"><span>${s.name}</span><span>${pct.toFixed(1)}%</span></div><div class="breakdown-bar-bg"><div class="breakdown-bar-fill" style="width:${pct}%"></div></div></div>`;
    });
    list.innerHTML = html || '<div class="portfolio-empty">No Active Assets</div>';
    drawIncomeGraph();
}

function openAnalytics() { openModal('analytics-modal'); }
window.openAnalytics = openAnalytics;

// --- 4. TABS & PORTFOLIO ---
function setShopTab(tab) {
    currentShopTab = tab;
    const marketBtn = document.getElementById('btn-tab-markets');
    const portfolioBtn = document.getElementById('btn-tab-portfolio');
    const marketControls = document.getElementById('market-controls');
    const portfolioControls = document.getElementById('portfolio-controls');
    const shopContainer = document.getElementById('shop-container');
    const portfolioContainer = document.getElementById('portfolio-container');

    if (tab === 'markets') {
        if(marketBtn) marketBtn.classList.add('active');
        if(portfolioBtn) portfolioBtn.classList.remove('active');
        if(marketControls) marketControls.style.display = 'block';
        if(portfolioControls) portfolioControls.style.display = 'none';
        if(shopContainer) shopContainer.style.display = 'block';
        if(portfolioContainer) portfolioContainer.style.display = 'none';
    } else {
        if(marketBtn) marketBtn.classList.remove('active');
        if(portfolioBtn) portfolioBtn.classList.add('active');
        if(marketControls) marketControls.style.display = 'none';
        if(portfolioControls) portfolioControls.style.display = 'block';
        if(shopContainer) shopContainer.style.display = 'none';
        if(portfolioContainer) portfolioContainer.style.display = 'block';
        renderPortfolio();
    }
}
window.setShopTab = setShopTab;

function renderPortfolio() {
    const container = document.getElementById('portfolio-container');
    if (!container) return;
    let ownedAny = false;
    let html = '';
    upgrades.forEach((u, i) => {
        if (game.counts[i] > 0) {
            ownedAny = true;
            let level = game.levels && game.levels[i] ? game.levels[i] : 1;
            let upgCost = window.getUpgradeCost ? window.getUpgradeCost(i) : 0;
            let canAfford = game.money >= upgCost;
            html += `
                <div class="upgrade ${canAfford ? 'affordable-max' : ''}" style="border-left: 3px solid var(--gold);">
                    <div class="upg-info">
                        <h4>${u.name} <span style="color:var(--gold)">Lv. ${level}</span></h4>
                        <p><span class="rate-boost">Yield Multiplier: ${level}x</span><span style="opacity:0.5">| Qty: ${game.counts[i]}</span></p>
                    </div>
                    <div class="upg-cost" onclick="window.buyAssetUpgrade(${i}); event.stopPropagation();">
                        <div class="cost-text" style="color: ${canAfford ? 'var(--gold)' : '#555'}">Optimize</div>
                        <div class="count-badge" style="background:var(--gold); color:#000; border:none;">$${formatNumber(upgCost)}</div>
                    </div>
                </div>`;
        }
    });
    container.innerHTML = ownedAny ? html : `<div class="portfolio-empty">NO ASSETS UNDER MANAGEMENT.</div>`;
}
window.renderPortfolio = renderPortfolio;

// --- 5. MAIN UI LOOP ---
function updateUI(rate) {
    analytics.update(rate);
    document.getElementById('ui-money').innerText = formatNumber(game.money);
    
    const elRate = document.getElementById('ui-rate');
    if(elRate) elRate.innerText = formatNumber(rate);

    // Rank Logic
    let currentRankIndex = 0;
    for(let i = 0; i < rankData.length; i++) {
        if(game.influence >= rankData[i].req) currentRankIndex = i;
        else break;
    }
    let currentRank = rankData[currentRankIndex];
    let nextRank = rankData[currentRankIndex + 1];
    document.getElementById('rank-name').innerText = currentRank.name;
    document.getElementById('ui-influence').innerText = formatNumber(game.influence);
    document.getElementById('ui-bonus').innerText = formatNumber(game.influence * 10);
    
    let rankProgress = 0;
    let nextGoalText = "MAX RANK ACHIEVED";
    if (nextRank) {
        let range = nextRank.req - currentRank.req;
        let currentInTier = game.influence - currentRank.req;
        rankProgress = Math.max(0, Math.min(100, (currentInTier / range) * 100));
        nextGoalText = `${formatNumber(nextRank.req - game.influence)} INF TO ${nextRank.name.toUpperCase()}`;
    } else rankProgress = 100;
    
    const bar = document.getElementById('influence-bar');
    if(bar) bar.style.width = rankProgress + "%";
    const nextText = document.getElementById('next-rank-text');
    if(nextText) nextText.innerText = nextGoalText;

    // Prestige Button
    let nextPointTotal = game.influence + 1;
    let costForNextPoint = Math.pow(nextPointTotal, 2) * 1000000;
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    let btn = document.getElementById('btn-open-prestige');
    if (potential > game.influence) {
        btn.classList.add('ready');
        btn.innerHTML = `LIQUIDATE ASSETS <span style="font-size:0.8em; opacity:0.9; margin-left:5px;">(+${formatNumber(potential - game.influence)} Inf)</span>`;
    } else {
        let missingCash = costForNextPoint - game.lifetimeEarnings;
        btn.classList.remove('ready');
        btn.innerHTML = `NEED $${formatNumber(Math.max(0, missingCash))} MORE VALUE`;
    }

    // Hype
    const hypeBar = document.getElementById('hype-bar');
    if(hypeBar) hypeBar.style.width = hype + '%';
    const hText = document.getElementById('hype-text');
    if(hText) hText.innerText = Math.floor(hype) + '%';
    
    // Refresh Shop/Portfolio
    if (currentShopTab === 'portfolio') renderPortfolio();
    else updateShopUI(1 + (game.influence * 0.10));

    updateAnalyticsUI(rate);
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
        
        el.querySelector('.cost-text').innerText = "$" + formatNumber(cost);
        el.querySelector('.count-badge').innerText = game.counts[i];
        
        let buyAmountText = (buyMode === 'MAX' && max > 0) ? `+${max}` : (buyMode !== 1 && buyMode !== 'MAX' ? `+${amt}` : '');
        let discountHtml = amt >= 100 ? `<span style='color:#22c55e; font-weight:800; font-size:0.7em; margin-left:6px;'>SALE -20%</span>` : (amt >= 10 ? `<span style='color:#22c55e; font-weight:800; font-size:0.7em; margin-left:6px;'>SALE -10%</span>` : '');

        el.querySelector('h4').innerHTML = `${u.name} <span style="font-size:0.7em; opacity:0.5; margin-left:4px;">${buyAmountText}</span>${discountHtml}`;
        let boostRate = u.baseRate * influenceMult * (game.levels && game.levels[i] ? game.levels[i] : 1) * (maniaMode ? 2 : 1);
        el.querySelector('.rate-boost').innerText = `+$${formatNumber(boostRate)}/s`;
        
        el.classList.remove('affordable', 'affordable-max', 'locked');
        if (affordable && (buyMode !== 'MAX' || max > 0)) el.classList.add(buyMode === 'MAX' ? 'affordable-max' : 'affordable');
        else if (game.counts[i] === 0 && !affordable) el.classList.add('locked');
    });
}

function renderShop() {
    const container = document.getElementById('shop-container');
    if(!container) return;
    container.innerHTML = '';
    upgrades.forEach((u, i) => {
        let div = document.createElement('div');
        div.className = 'upgrade';
        div.id = `upg-${i}`;
        div.onclick = () => {
            let prevCount = game.counts[i];
            buy(i);
            if (game.counts[i] > prevCount) {
                pushNews(`MARKET ALERT: ACQUIRED ${u.name.toUpperCase()}.`);
                showToast(`Bought ${u.name}`, 'success');
            } else showToast(`Insufficient Funds`, 'error');
        };
        div.onmouseenter = (e) => showTooltip(e, i);
        div.onmousemove = (e) => moveTooltip(e);
        div.onmouseleave = hideTooltip;
        div.innerHTML = `<div class="upg-info"><h4>${u.name}</h4><p><span class="rate-boost">+$0/s</span><span style="opacity:0.5">| Base: $${formatNumber(u.baseRate)}</span></p></div><div class="upg-cost"><div class="cost-text">...</div><div class="count-badge">0</div></div>`;
        container.appendChild(div);
    });
}

// --- 6. GLOBAL CONTROLS & MODALS ---
function setBuyMode(mode, btn) {
    buyMode = mode;
    document.querySelectorAll('.buy-amt').forEach(b => b.classList.remove('active', 'active-max'));
    btn.classList.add(mode === 'MAX' ? 'active-max' : 'active');
    updateUI(0);
}

function openModal(id) {
    const modal = document.getElementById(id);
    if(!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
}
function closeModal(id) { 
    const modal = document.getElementById(id);
    if(!modal) return;
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
}

function openExport() {
    saveLocal();
    const txt = document.getElementById('save-data-input');
    const btn = document.getElementById('modal-action-btn');
    if(!txt || !btn) return;
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
    if(!txt || !btn) return;
    txt.value = ""; txt.placeholder = "Paste code...";
    btn.innerText = "IMPORT";
    btn.onclick = () => {
        try {
            let data = JSON.parse(atob(txt.value.trim()));
            game = { ...game, ...data };
            saveLocal(); location.reload();
        } catch(e) { showToast("Invalid Data", "error"); }
    };
    openModal('save-modal');
}

function hardReset() { if(confirm("FACTORY RESET: Wipe progress?")) { localStorage.removeItem('mintV7_money_save'); location.reload(); } }

let audioEnabled = true;
function toggleAudio() {
    audioEnabled = !audioEnabled;
    const btn = document.getElementById('mute-toggle');
    if(audioEnabled) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        if(btn) { btn.classList.add('active'); btn.innerHTML = "&#128266;"; }
        showToast("Audio Enabled", "info");
    } else {
        if(btn) { btn.classList.remove('active'); btn.innerHTML = "&#128263;"; }
        showToast("Audio Muted", "info");
    }
}