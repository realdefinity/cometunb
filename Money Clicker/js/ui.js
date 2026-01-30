const suffixStandard = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

// --- PREVENT RIGHT CLICK ---
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
}, { capture: true });

// --- STYLE INJECTION ---
(function injectUIStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        #toast-container { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column-reverse; gap: 8px; pointer-events: none; }
        .toast { 
            background: rgba(10, 10, 10, 0.95); border: 1px solid #333; color: #fff; 
            padding: 10px 20px; border-radius: 50px; font-size: 0.75rem; font-weight: 700; font-family: 'Outfit', sans-serif;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(10px);
            animation: toast-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex; align-items: center; gap: 8px;
        }
        .toast.success { border-color: rgba(34, 197, 94, 0.5); color: #4ade80; }
        .toast.error { border-color: rgba(239, 68, 68, 0.5); color: #f87171; }
        
        @keyframes toast-in { from { transform: translateY(20px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes toast-out { to { transform: translateY(-10px); opacity: 0; } }

        #ui-tooltip {
            position: fixed; pointer-events: none; z-index: 11000;
            background: rgba(5, 5, 5, 0.98); border: 1px solid #333;
            padding: 12px 16px; border-radius: 12px;
            font-size: 0.7rem; color: #ccc; font-family: 'JetBrains Mono', monospace;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            opacity: 0; transition: opacity 0.1s; transform: translate(15px, 15px);
        }
    `;
    document.head.appendChild(style);
    
    // Create Elements
    if (!document.getElementById('toast-container')) {
        const toastCont = document.createElement('div');
        toastCont.id = 'toast-container';
        document.body.appendChild(toastCont);
    }
    
    if (!document.getElementById('ui-tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.id = 'ui-tooltip';
        document.body.appendChild(tooltip);
    }
})();

// --- HELPERS ---
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

// --- COST CALCULATOR (Moved here for stability) ---
function getUpgradeCost(id) {
    // If game state isn't ready, return infinite cost
    if (!game || !game.levels) return Infinity;
    const level = game.levels[id] || 1;
    // Formula: Base * 25 * (1.5 ^ (Level - 1))
    return upgrades[id].baseCost * 25 * Math.pow(1.5, level - 1);
}
// Expose for game.js to use if needed
window.getUpgradeCost = getUpgradeCost;


// --- MAIN UI RENDERER ---
function updateUI(rate) {
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
    let nextGoalText = "MAX RANK";
    if (nextRank) {
        let range = nextRank.req - currentRank.req;
        let currentInTier = game.influence - currentRank.req;
        rankProgress = Math.max(0, Math.min(100, (currentInTier / range) * 100));
        nextGoalText = `${formatNumber(nextRank.req - game.influence)} INF TO ${nextRank.name.toUpperCase()}`;
    } else {
        rankProgress = 100;
    }
    
    const bar = document.getElementById('influence-bar');
    if(bar) bar.style.width = rankProgress + "%";
    
    const nextText = document.getElementById('next-rank-text');
    if(nextText) nextText.innerText = nextGoalText;

    // Prestige Button
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    let claimable = Math.max(0, potential - game.influence);
    let btn = document.getElementById('btn-open-prestige');
    
    if (claimable > 0) {
        btn.classList.add('ready');
        btn.innerHTML = `LIQUIDATE <span style="font-size:0.8em; opacity:0.8; margin-left:4px;">(+${formatNumber(claimable)} INF)</span>`;
    } else {
        btn.classList.remove('ready');
        btn.innerHTML = `INSUFFICIENT VALUE`;
    }

    // Hype
    const hypeBar = document.getElementById('hype-bar');
    if(hypeBar) hypeBar.style.width = hype + '%';
    const hText = document.getElementById('hype-text');
    if(hText) hText.innerText = Math.floor(hype) + '%';
    
    // Tab Refresh
    if (currentShopTab === 'portfolio') renderPortfolio();
    else if (currentShopTab === 'staff') renderStaff();
    else updateShopUI(1 + (game.influence * 0.10));
}

// --- TAB SYSTEM ---
let currentShopTab = 'markets';
function setShopTab(tab) {
    currentShopTab = tab;
    const tabs = ['markets', 'portfolio', 'staff', 'rd', 'loans', 'skins'];
    
    // Reset all buttons and containers
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-tab-${t}`);
        const cont = document.getElementById(`${t}-container`);
        if (btn) btn.classList.remove('active');
        if (cont) cont.style.display = 'none';
    });
    
    // Toggle Control Headers
    const mControls = document.getElementById('market-controls');
    const pControls = document.getElementById('portfolio-controls');
    const sControls = document.getElementById('staff-controls');
    
    if(mControls) mControls.style.display = tab === 'markets' ? 'block' : 'none';
    if(pControls) pControls.style.display = tab === 'portfolio' ? 'block' : 'none';
    if(sControls) sControls.style.display = tab === 'staff' ? 'block' : 'none';

    // Show active container
    const activeBtn = document.getElementById(`btn-tab-${tab}`);
    const activeCont = (tab === 'markets') ? document.getElementById('shop-container') : document.getElementById(`${tab}-container`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activeCont) activeCont.style.display = 'block';

    if (tab === 'portfolio') renderPortfolio();
    if (tab === 'staff') renderStaff();
    if (tab === 'markets') updateShopUI(1 + (game.influence * 0.10));
}
window.setShopTab = setShopTab;

// --- MARKET RENDERER ---
function renderShop() {
    const container = document.getElementById('shop-container');
    if(!container) return;
    container.innerHTML = '';
    upgrades.forEach((u, i) => {
        let div = document.createElement('div');
        div.className = 'upgrade';
        div.id = `upg-${i}`;
        div.onclick = () => buy(i);
        div.innerHTML = `
            <div class="upg-info">
                <h4>${u.name}</h4>
                <p><span class="rate-boost">+$0/s</span><span style="opacity:0.5">| Base: $${formatNumber(u.baseRate)}</span></p>
            </div>
            <div class="upg-cost">
                <div class="cost-text">...</div>
                <div class="count-badge">0</div>
            </div>`;
        container.appendChild(div);
    });
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
        
        // Calculate Yield Preview
        const level = (game.levels && game.levels[i]) ? game.levels[i] : 1;
        // Level mult: 1 + 25% per level above 1
        const levelMult = 1 + ((level - 1) * 0.25);
        let boostRate = u.baseRate * influenceMult * levelMult * (maniaMode ? 2 : 1);
        
        el.querySelector('.rate-boost').innerText = `+$${formatNumber(boostRate)}/s`;
        
        el.classList.remove('affordable', 'affordable-max', 'locked');
        if (affordable && (buyMode !== 'MAX' || max > 0)) el.classList.add(buyMode === 'MAX' ? 'affordable-max' : 'affordable');
        else if (game.counts[i] === 0 && !affordable) el.classList.add('locked');
    });
}

// --- PORTFOLIO RENDERER (The Fix) ---
function renderPortfolio() {
    const container = document.getElementById('portfolio-container');
    if (!container) return;
    
    // Safety: ensure levels array exists
    if (!game.levels) game.levels = Array(upgrades.length).fill(1);

    // 1. Filter Owned
    const ownedAssets = upgrades.map((u, i) => ({...u, originalIndex: i}))
                                .filter(u => game.counts[u.originalIndex] > 0);

    if (ownedAssets.length === 0) {
        container.innerHTML = `<div class="portfolio-empty" style="color:#666; margin-top:40px; font-weight:700;">NO ASSETS UNDER MANAGEMENT.<br>ACQUIRE ASSETS IN MARKETS.</div>`;
        return;
    }

    let html = '';
    ownedAssets.forEach(u => {
        const i = u.originalIndex;
        const level = game.levels[i] || 1;
        const count = game.counts[i];
        
        // Math: 1 + 25% per level
        const currentMult = 1 + ((level - 1) * 0.25);
        const nextMult = 1 + (level * 0.25);
        
        const cost = getUpgradeCost(i);
        const canAfford = game.money >= cost;

        // Note: Using onclick="window.buyAssetUpgrade" ensures global access
        html += `
            <div class="portfolio-card ${canAfford ? 'affordable' : ''}" onclick="window.buyAssetUpgrade(${i})">
                <div class="port-info">
                    <div class="port-header">
                        <h4>${u.name}</h4>
                        <span class="port-level">LVL ${level}</span>
                    </div>
                    <div class="port-stats">
                        <span class="stat-item">QTY: <strong>${formatNumber(count)}</strong></span>
                        <span class="stat-item">YIELD: <strong style="color:#22c55e">${currentMult.toFixed(2)}x</strong></span>
                    </div>
                </div>
                
                <div class="port-action">
                    <div class="upgrade-preview">NEXT: ${nextMult.toFixed(2)}x</div>
                    <div class="port-btn">
                        OPTIMIZE $${formatNumber(cost)}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
window.renderPortfolio = renderPortfolio;

// --- ASSET UPGRADE LOGIC ---
function buyAssetUpgrade(id) {
    const cost = getUpgradeCost(id);
    
    if (game.money >= cost && game.counts[id] > 0) {
        game.money -= cost;
        game.levels[id]++;
        
        if (window.playSound) playSound('buy');
        
        // Visuals
        const el = document.querySelector(`.portfolio-card[onclick*="(${id})"]`);
        if(el && window.createParticle) {
            const rect = el.getBoundingClientRect();
            for(let i=0; i<15; i++) createParticle(rect.left + rect.width/2, rect.top + rect.height/2, '', 'spark');
        }

        showToast(`${upgrades[id].name} upgraded to Level ${game.levels[id]}`, 'success');
        
        // Refresh
        renderPortfolio();
        updateUI(0);
    } else {
        showToast("Insufficient capital for optimization.", "error");
    }
}
window.buyAssetUpgrade = buyAssetUpgrade;

// --- STAFF RENDERER ---
function renderStaff() {
    const container = document.getElementById('staff-container');
    if (!container) return;
    let html = '';
    staffMembers.forEach((s) => {
        const isHired = game.staff.includes(s.id);
        const canAfford = game.money >= s.cost;
        html += `
            <div class="staff-card ${isHired ? 'hired' : ''}" onclick="window.buyStaff(${s.id})">
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
        if (window.playSound) playSound('buy');
        showToast(`${s.name} hired!`, 'success');
        renderStaff();
    } else {
        showToast("Insufficient capital.", "error");
    }
}
window.buyStaff = buyStaff;

// --- MODAL & DATA ---
function openModal(id) { const m = document.getElementById(id); if(m) { m.style.display = 'flex'; setTimeout(() => m.classList.add('open'), 10); } }
function closeModal(id) { const m = document.getElementById(id); if(m) { m.classList.remove('open'); setTimeout(() => m.style.display = 'none', 300); } }

function openExport() {
    saveLocal();
    const txt = document.getElementById('save-data-input');
    const btn = document.getElementById('modal-action-btn');
    if(!txt) return;
    txt.value = btoa(JSON.stringify(game));
    if(btn) {
        btn.innerText = "COPY TO CLIPBOARD";
        btn.onclick = () => { txt.select(); document.execCommand('copy'); btn.innerText = "COPIED!"; showToast("Data Copied", "success"); setTimeout(() => closeModal('save-modal'), 1000); };
    }
    openModal('save-modal');
}

function openImport() {
    const txt = document.getElementById('save-data-input');
    const btn = document.getElementById('modal-action-btn');
    if(!txt) return;
    txt.value = ""; txt.placeholder = "Paste save code...";
    if(btn) {
        btn.innerText = "IMPORT";
        btn.onclick = () => {
            try {
                let data = JSON.parse(atob(txt.value.trim()));
                game = { ...game, ...data };
                saveLocal(); location.reload();
            } catch(e) { showToast("Invalid Data", "error"); }
        };
    }
    openModal('save-modal');
}

function hardReset() { if(confirm("FACTORY RESET: Wipe all progress?")) { localStorage.removeItem('mintV7_money_save'); location.reload(); } }