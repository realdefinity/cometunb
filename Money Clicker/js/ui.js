const suffixStandard = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
}, { capture: true });

(function injectUIStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        #toast-container { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column-reverse; gap: 8px; pointer-events: none; }
        .toast { background: rgba(10, 10, 10, 0.9); border: 1px solid #333; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; font-family: 'Outfit', sans-serif; box-shadow: 0 5px 15px rgba(0,0,0,0.5); backdrop-filter: blur(8px); animation: toast-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; align-items: center; gap: 8px; }
        .toast.success { border-color: rgba(34, 197, 94, 0.3); color: #4ade80; }
        .toast.error { border-color: rgba(239, 68, 68, 0.3); color: #f87171; }
        @keyframes toast-in { from { transform: translateY(20px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes toast-out { to { transform: translateY(-10px); opacity: 0; } }

        #ui-tooltip { position: fixed; pointer-events: none; z-index: 11000; background: rgba(0, 0, 0, 0.95); border: 1px solid #333; padding: 10px 14px; border-radius: 8px; font-size: 0.7rem; color: #ccc; font-family: 'JetBrains Mono', monospace; box-shadow: 0 10px 40px rgba(0,0,0,1); opacity: 0; transition: opacity 0.1s; transform: translate(15px, 15px); }
        #ui-tooltip strong { display: block; color: #fff; margin-bottom: 4px; font-family: 'Outfit', sans-serif; font-size: 0.8rem; }
        #ui-tooltip .val { color: #eab308; font-weight: 700; }

        .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; margin-top: 20px; }
        .analytics-card { background: rgba(255,255,255,0.03); border: 1px solid #222; border-radius: 12px; padding: 15px; }
        .graph-container { height: 100px; width: 100%; position: relative; }
        .stat-big { font-size: 1.2rem; font-weight: 800; color: #fff; font-family: 'JetBrains Mono'; }

        /* Staff Specific Styling */
        .staff-card { background: linear-gradient(90deg, #0a111a 0%, #05080c 100%); border: 1px solid #1a2a3a; padding: 16px 20px; margin-bottom: 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; position: relative; overflow: hidden; transition: 0.2s; }
        .staff-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #3b82f6; box-shadow: 4px 0 20px rgba(59, 130, 246, 0.4); }
        .staff-card:hover { transform: translateX(4px); border-color: #3b82f6; background: #0c1828; }
        .staff-card.hired { opacity: 0.6; cursor: default; pointer-events: none; border-color: transparent; }
        .staff-card.hired::before { background: #555; box-shadow: none; }
    `;
    document.head.appendChild(style);
    
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

    tooltip.innerHTML = `<strong>${u.name} Analysis</strong><div>Cost: <span class="val">$${formatNumber(cost)}</span></div><div>Income: <span class="val">+$${formatNumber(rate)}/s</span></div><div style="margin-top:4px; border-top:1px solid #333; padding-top:4px; opacity:0.8;">ROI Time: <span style="color:${roiSeconds < 600 ? '#4ade80' : '#facc15'}">${roiText}</span></div>`;
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

function setShopTab(tab) {
    currentShopTab = tab;
    const marketBtn = document.getElementById('btn-tab-markets');
    const portfolioBtn = document.getElementById('btn-tab-portfolio');
    const staffBtn = document.getElementById('btn-tab-staff');
    
    const marketControls = document.getElementById('market-controls');
    const portfolioControls = document.getElementById('portfolio-controls');
    const staffControls = document.getElementById('staff-controls');
    
    const shopContainer = document.getElementById('shop-container');
    const portfolioContainer = document.getElementById('portfolio-container');
    const staffContainer = document.getElementById('staff-container');

    [marketBtn, portfolioBtn, staffBtn].forEach(b => b?.classList.remove('active'));
    [marketControls, portfolioControls, staffControls, shopContainer, portfolioContainer, staffContainer].forEach(c => c ? c.style.display = 'none' : null);

    if (tab === 'markets') {
        marketBtn.classList.add('active');
        marketControls.style.display = 'block';
        shopContainer.style.display = 'block';
    } else if (tab === 'portfolio') {
        portfolioBtn.classList.add('active');
        portfolioControls.style.display = 'block';
        portfolioContainer.style.display = 'block';
        renderPortfolio();
    } else if (tab === 'staff') {
        staffBtn.classList.add('active');
        staffControls.style.display = 'block';
        staffContainer.style.display = 'block';
        renderStaff();
    }
}
window.setShopTab = setShopTab;

function renderStaff() {
    const container = document.getElementById('staff-container');
    if (!container) return;
    let html = '';
    staffMembers.forEach((s) => {
        const isHired = game.staff.includes(s.id);
        const canAfford = game.money >= s.cost;
        html += `
            <div class="staff-card ${isHired ? 'hired' : ''}" onclick="buyStaff(${s.id})">
                <div class="upg-info">
                    <h4 style="color:${isHired ? '#555' : '#fff'}">${s.name}</h4>
                    <p>${s.desc}</p>
                    <span style="font-size:0.6rem; color:#3b82f6; font-weight:800; text-transform:uppercase; letter-spacing:1px;">ROLE: ${s.type}</span>
                </div>
                <div class="upg-cost">
                    <div class="cost-text" style="color: ${isHired ? '#444' : (canAfford ? '#fff' : '#555')}">${isHired ? 'EMPLOYED' : 'HIRE'}</div>
                    ${!isHired ? `<div class="count-badge" style="background:#3b82f6; color:#fff; border:none;">$${formatNumber(s.cost)}</div>` : ''}
                </div>
            </div>`;
    });
    container.innerHTML = html;
}
window.renderStaff = renderStaff;

function buyStaff(id) {
    if (game.staff.includes(id)) return;
    const s = staffMembers[id];
    if (game.money >= s.cost) {
        game.money -= s.cost;
        game.staff.push(id);
        playSound('buy');
        showToast(`${s.name} joined the team!`, 'success');
        pushNews(`PERSONNEL UPDATE: ${s.name.toUpperCase()} HIRED AS ${s.type.toUpperCase()}.`);
        renderStaff();
    } else {
        showToast("Insufficient capital for hiring.", "error");
    }
}
window.buyStaff = buyStaff;

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

function updateUI(rate) {
    analytics.update(rate);
    document.getElementById('ui-money').innerText = formatNumber(game.money);
    const elRate = document.getElementById('ui-rate');
    if(elRate) elRate.innerText = formatNumber(rate);

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

    // Adjusted prestige potential based on Lobbyist (ID: 2)
    let lobbyistBonus = game.staff.includes(2) ? 1.5 : 1.0;
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5) * lobbyistBonus);
    
    let btn = document.getElementById('btn-open-prestige');
    if (potential > game.influence) {
        btn.classList.add('ready');
        btn.innerHTML = `LIQUIDATE ASSETS <span style="font-size:0.8em; opacity:0.9; margin-left:5px;">(+${formatNumber(potential - game.influence)} Inf)</span>`;
    } else {
        btn.classList.remove('ready');
        btn.innerHTML = `INSUFFICIENT VALUE GROWTH`;
    }

    const hypeBar = document.getElementById('hype-bar');
    if(hypeBar) hypeBar.style.width = hype + '%';
    const hText = document.getElementById('hype-text');
    if(hText) hText.innerText = Math.floor(hype) + '%';
    
    if (currentShopTab === 'portfolio') renderPortfolio();
    else if (currentShopTab === 'staff') renderStaff();
    else updateShopUI(1 + (game.influence * 0.10));
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
        el.querySelector('h4').innerHTML = `${u.name} <span style="font-size:0.7em; opacity:0.5; margin-left:4px;">${buyAmountText}</span>`;
        
        // Apply Global CEO Multiplier (ID: 3)
        let ceoMult = game.staff.includes(3) ? 1.5 : 1.0;
        let boostRate = u.baseRate * influenceMult * (game.levels && game.levels[i] ? game.levels[i] : 1) * (maniaMode ? 2 : 1) * ceoMult;
        el.querySelector('.rate-boost').innerText = `+$${formatNumber(boostRate)}/s`;
        
        el.classList.remove('affordable', 'affordable-max', 'locked');
        if (affordable && (buyMode !== 'MAX' || max > 0)) el.classList.add(buyMode === 'MAX' ? 'affordable-max' : 'affordable');
        else if (game.counts[i] === 0 && !affordable) el.classList.add('locked');
    });
}