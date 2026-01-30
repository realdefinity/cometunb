const suffixStandard = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

// --- NUCLEAR RIGHT-CLICK DISABLE ---
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

        /* Analytics Specific Styles */
        .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; margin-top: 20px; }
        .analytics-card { background: rgba(255,255,255,0.03); border: 1px solid #222; border-radius: 12px; padding: 15px; }
        .analytics-card h5 { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; }
        .graph-container { height: 100px; width: 100%; position: relative; }
        .stat-big { font-size: 1.2rem; font-weight: 800; color: #fff; font-family: 'JetBrains Mono'; }
        .stat-sub { font-size: 0.6rem; color: #555; }

        /* Shop Tabs */
        .shop-tabs { display: flex; gap: 16px; margin-bottom: 20px; border-bottom: 1px solid var(--panel-border); padding-bottom: 12px; }
        .tab-btn { font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; color: #444; cursor: pointer; transition: color 0.2s; position: relative; }
        .tab-btn.active { color: var(--text-main); }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -13px; left: 0; right: 0; height: 2px; background: var(--green); box-shadow: 0 0 10px var(--green-glow); }
        .tab-btn#btn-tab-staff.active::after { background: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
        
        .portfolio-empty { text-align: center; padding: 40px 20px; color: #444; font-family: 'JetBrains Mono'; font-size: 0.8rem; }

        /* Staff Specific Styling */
        .staff-card { background: linear-gradient(90deg, #0a111a 0%, #05080c 100%); border: 1px solid #1a2a3a; padding: 16px 20px; margin-bottom: 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; position: relative; overflow: hidden; transition: 0.2s; }
        .staff-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #3b82f6; box-shadow: 4px 0 20px rgba(59, 130, 246, 0.4); }
        .staff-card:hover { transform: translateX(4px); border-color: #3b82f6; background: #0c1828; }
        .staff-card.hired { opacity: 0.6; cursor: default; pointer-events: none; border-color: transparent; }
        .staff-card.hired::before { background: #555; box-shadow: none; }
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
    
    // CEO staff bonus multiplier check for analytics
    let ceoMult = game.staff && game.staff.includes(3) ? 1.5 : 1.0;

    const sources = upgrades.map((u, i) => ({
        name: u.name,
        income: game.counts[i] * u.baseRate * (1 + (game.influence * 0.10)) * (game.levels && game.levels[i] ? game.levels[i] : 1) * (maniaMode ? 2 : 1) * ceoMult
    })).sort((a, b) => b.income - a.income).slice(0, 5);
    
    sources.forEach(s => {
        if (s.income <= 0) return;
        const pct = (s.income / totalRate) * 100;
        html += `<div style="margin-bottom:8px;"><div class="breakdown-row"><span>${s.name}</span><span>${pct.toFixed(1)}%</span></div><div class="breakdown-bar-bg"><div class="breakdown-bar-fill" style="width:${pct}%"></div></div></div>`;
    });
    list.innerHTML = html || '<div class="portfolio-empty">No Active Assets</div>';
    drawIncomeGraph();
}

function renderRD() {
    const container = document.getElementById('rd-container');
    if (!container) return;

    container.innerHTML = `
        <div class="rd-viewport" id="rd-viewport">
            <div style="width:100%; height:1200px; position:relative;">
                <svg class="tech-tree-svg" id="tech-svg" style="width:100%; height:100%;"></svg>
                <div id="tech-nodes-layer"></div>
            </div>
        </div>
        <div id="tech-details" style="margin-top:15px; padding:15px; background:rgba(255,255,255,0.02); border-radius:10px; border:1px solid #222; text-align:center;">
            <div id="tech-info-name" style="font-weight:900; color:#fff; font-size:0.9rem;">SELECT A TECHNOLOGY</div>
            <div id="tech-info-desc" style="font-size:0.7rem; color:#666; margin-top:5px;">Check requirements to unlock powerful abilities.</div>
        </div>
    `;

    const svg = document.getElementById('tech-svg');
    const nodesLayer = document.getElementById('tech-nodes-layer');

    techTree.forEach(tech => {
        // ... (Logic remains identical to previous version) ...
        const isResearched = game.researchedTech.includes(tech.id);
        const parentsResearched = tech.parents.length === 0 || tech.parents.every(p => game.researchedTech.includes(p));
        const status = isResearched ? 'researched' : (parentsResearched ? 'available' : 'locked');

        tech.parents.forEach(pId => {
            const parent = techTree.find(t => t.id === pId);
            if (parent) {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
                
                // Vertical Circuit Routing (Down -> Over -> Down)
                const midY = (parent.y + tech.y) / 2;
                const d = `M ${parent.x} ${parent.y} L ${parent.x} ${midY} L ${tech.x} ${midY} L ${tech.x} ${tech.y}`;
                
                line.setAttribute("d", d);
                line.setAttribute("class", `tech-line ${isResearched ? 'active' : ''}`);
                svg.appendChild(line);
            }
        });

        // ... (Node creation logic remains identical) ...
        const node = document.createElement('div');
        node.className = `tech-node ${status}`;
        node.style.left = tech.x + 'px';
        node.style.top = tech.y + 'px';
        
        let icon = '🔒';
        if (status === 'available') icon = '⚡';
        if (status === 'researched') icon = '◉';

        node.innerHTML = `<div class="tech-node-icon">${icon}</div>`;

        node.onmouseenter = () => {
            const color = status === 'researched' ? '#22c55e' : (status === 'available' ? '#fff' : '#444');
            document.getElementById('tech-info-name').style.color = color;
            document.getElementById('tech-info-name').innerText = tech.name.toUpperCase();
            
            const costTxt = isResearched ? "STATUS: ACTIVE" : `COST: ${formatNumber(tech.cost)} INFLUENCE`;
            document.getElementById('tech-info-desc').innerHTML = `<span style="color:#ccc">${tech.desc}</span><br><span style="color:${color}; font-weight:700;">${costTxt}</span>`;
            
            if (window.playSound) playSound('click');
        };

        node.onclick = () => {
            if (status === 'available') {
                if (game.influence >= tech.cost) {
                    game.influence -= tech.cost;
                    game.researchedTech.push(tech.id);
                    if (window.playSound) playSound('buy');
                    showToast(`SYSTEM UPGRADE: ${tech.name}`, "success");
                    updateUI(0);
                    renderRD(); 
                } else {
                    showToast("Insufficient Influence Credits.", "error");
                }
            } else if (status === 'locked') {
                showToast("Previous node required.", "error");
            }
        };

        nodesLayer.appendChild(node);
    });
}


function renderSkins() {
    const container = document.getElementById('skins-container');
    if (!container) return;
    
    // Header
    let html = `<div style="font-weight:900; font-size:0.7rem; color:#444; letter-spacing:2px; margin-bottom:15px; text-align:center;">VISUAL FX MODULES</div>`;
    
    // Grid Container
    html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 8px;">`;
    
    particleSkins.forEach(s => {
        const active = game.activeSkin === s.id;
        const borderCol = active ? s.color : '#222';
        const bgCol = active ? 'rgba(255,255,255,0.05)' : 'transparent';
        const textCol = active ? '#fff' : '#555';
        
        // Tile Item
        html += `
            <div onclick="game.activeSkin='${s.id}'; renderSkins(); playSound('click');" 
                 style="
                    border: 1px solid ${borderCol}; 
                    background: ${bgCol};
                    border-radius: 8px; 
                    padding: 10px; 
                    cursor: pointer; 
                    text-align: center;
                    transition: all 0.2s;
                 "
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.background='rgba(255,255,255,0.03)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.background='${bgCol}'"
            >
                <div style="font-size: 1.2rem; margin-bottom: 4px;">${s.char}</div>
                <div style="font-size: 0.5rem; font-weight: 800; color: ${textCol}; letter-spacing: 0.5px;">${s.name.toUpperCase()}</div>
            </div>`;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

function openAnalytics() { openModal('analytics-modal'); }
window.openAnalytics = openAnalytics;

function setShopTab(tab) {
    window.currentShopTab = tab;
    const tabs = ['markets', 'staff', 'rd', 'shadow', 'casino'];
    
    // Hide all containers and reset all buttons
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-tab-${t}`);
        const cont = document.getElementById(`${t}-container`);
        const ctrl = document.getElementById(`${t}-controls`);
        if (btn) btn.classList.remove('active');
        if (cont) cont.style.display = 'none';
        if (ctrl) ctrl.style.display = 'none';
    });

    // Show selected
    const activeBtn = document.getElementById(`btn-tab-${tab}`);
    const activeCont = document.getElementById(`${tab}-container`);
    const activeCtrl = document.getElementById(`${tab}-controls`);
    const shopContainer = document.getElementById('shop-container');

    if (activeBtn) activeBtn.classList.add('active');
    if (activeCont) activeCont.style.display = 'block';
    if (activeCtrl) activeCtrl.style.display = 'block';

    // Special case for markets
    if (tab === 'markets') {
        if (shopContainer) shopContainer.style.display = 'block';
        if (document.getElementById('market-controls')) document.getElementById('market-controls').style.display = 'block';
    } else {
        if (shopContainer) shopContainer.style.display = 'none';
        if (document.getElementById('market-controls')) document.getElementById('market-controls').style.display = 'none';
    }

    // Call individual renderers
    if (tab === 'rd') renderRD();
    if (tab === 'skins') renderSkins();
    if (tab === 'staff') renderStaff();
    if (tab === 'shadow') renderShadow();
    if (tab === 'casino') renderCasino();
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
    let lobbyistMult = game.staff && game.staff.includes(2) ? 1.5 : 1.0;
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5) * lobbyistMult);
    let btn = document.getElementById('btn-open-prestige');
    if (potential > game.influence) {
        btn.classList.add('ready');
        btn.innerHTML = `LIQUIDATE ASSETS <span style="font-size:0.8em; opacity:0.9; margin-left:5px;">(+${formatNumber(potential - game.influence)} Inf)</span>`;
    } else {
        btn.classList.remove('ready');
        btn.innerHTML = `INSUFFICIENT VALUE GROWTH`;
    }

    // Hype
    const hypeBar = document.getElementById('hype-bar');
    if(hypeBar) hypeBar.style.width = hype + '%';
    const hText = document.getElementById('hype-text');
    if(hText) hText.innerText = Math.floor(hype) + '%';
    
    // Refresh Tabs
    if (currentShopTab === 'portfolio') renderPortfolio();
    else if (currentShopTab === 'staff') renderStaff();
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
        
        // CEO Multiplier
        let ceoMult = game.staff && game.staff.includes(3) ? 1.5 : 1.0;
        let boostRate = u.baseRate * influenceMult * (game.levels && game.levels[i] ? game.levels[i] : 1) * (maniaMode ? 2 : 1) * ceoMult;
        el.querySelector('.rate-boost').innerText = `+$${formatNumber(boostRate)}/s`;
        
        el.classList.remove('affordable', 'affordable-max', 'locked');
        if (affordable && (buyMode !== 'MAX' || max > 0)) el.classList.add(buyMode === 'MAX' ? 'affordable-max' : 'affordable');
        else if (game.counts[i] === 0 && !affordable) el.classList.add('locked');

        const masterBtn = el.querySelector('.lvl-up-btn');
        if (masterBtn) {
            const upgCost = getUpgradeCost(i);
            const canAffordUpg = game.money >= upgCost && game.counts[i] > 0;
            masterBtn.innerText = `LEVEL UP: $${formatNumber(upgCost)}`;
            masterBtn.className = `lvl-up-btn ${canAffordUpg ? 'ready' : ''}`;
        }
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
        div.innerHTML = `
                    <div class="upg-info">
                        <h4>${u.name}</h4>
                        <p><span class="rate-boost">+$0/s</span><span style="opacity:0.5">| Qty: 0</span></p>
                        <div class="lvl-up-btn" onclick="window.buyAssetUpgrade(${i}); event.stopPropagation();">LEVEL UP: $...</div>
                    </div>
                    <div class="upg-cost">
                        <div class="cost-text">...</div>
                        <div class="count-badge">0</div>
                    </div>`;
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

function renderUpgrades() {
    const container = document.getElementById('upgrades-container');
    if (!container) return;
    let html = '';
    marketUpgrades.forEach(u => {
        const isOwned = game.upgradesOwned.includes(u.id);
        if (!isOwned) {
            const canAfford = game.money >= u.cost;
            html += `
                <div class="upgrade ${canAfford ? 'affordable' : ''}" onclick="buyUpgrade(${u.id})">
                    <div class="upg-info">
                        <h4>${u.name}</h4>
                        <p>${u.desc}</p>
                    </div>
                    <div class="upg-cost">
                        <div class="cost-text">$${formatNumber(u.cost)}</div>
                    </div>
                </div>`;
        }
    });
    container.innerHTML = html || '<div class="portfolio-empty">ALL UPGRADES PURCHASED.</div>';
}

function buyUpgrade(id) {
    const u = marketUpgrades[id];
    if (game.money >= u.cost) {
        game.money -= u.cost;
        game.upgradesOwned.push(id);
        playSound('buy');
        showToast(`Unlocked: ${u.name}`, 'success');
        renderUpgrades();
    } else {
        showToast("Insufficient capital.", "error");
    }
}

// --- IMPROVED PRESTIGE SYSTEM ---
function openPrestige() {
    // 1. Calculate Potential
    // Formula: Sqrt(LifetimeEarnings / 1M) = Total Influence
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    let claimable = Math.max(0, potential - game.influence);

    // 2. Calculate Requirement for NEXT point
    // If you have 10 inf, you need (11^2)*1M lifetime earnings for the 11th point
    let nextPoint = (game.influence + claimable) + 1;
    let reqLifetime = Math.pow(nextPoint, 2) * 1000000;
    let missing = reqLifetime - game.lifetimeEarnings;

    // 3. Update Modal UI
    const elClaim = document.getElementById('claimable-influence');
    const elCur = document.getElementById('current-bonus-modal');
    const elNew = document.getElementById('new-bonus-modal');
    const btn = document.querySelector('#prestige-modal .opt-btn');

    if(elClaim) elClaim.innerText = formatNumber(claimable);
    if(elCur) elCur.innerText = formatNumber(game.influence * 10) + "%";
    if(elNew) elNew.innerText = formatNumber((game.influence + claimable) * 10) + "%";

    // 4. Smart Button State
    if (claimable > 0) {
        btn.classList.add('ready');
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        btn.innerHTML = `CONFIRM SALE <span style="font-size:0.7em; opacity:0.8">(+${formatNumber(claimable)} INF)</span>`;
        btn.onclick = confirmPrestige; // Ensure click is bound
    } else {
        btn.classList.remove('ready');
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
        // Tell the user exactly what they need
        btn.innerHTML = `NEED $${formatNumber(missing)} MORE LIFETIME VALUE`;
    }

    if (window.openModal) window.openModal('prestige-modal');
}
window.openPrestige = openPrestige;

function confirmPrestige() {
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    
    if (potential > game.influence) {
        // 1. Apply Influence
        game.influence = potential;
        
        // 2. Soft Reset (Keep Mastery Levels!)
        game.money = 0;
        game.counts = game.counts.map(() => 0); 
        // NOTE: We do NOT reset game.levels, staff, or research.
        // This makes your upgrades feel "Permanent".
        
        // 3. Save & Close
        if (window.closeModal) window.closeModal('prestige-modal');
        saveLocal();
        
        // 4. Refresh Visuals
        if (window.renderShop) window.renderShop();
        if (window.renderPortfolio) window.renderPortfolio();
        if (window.updateUI) updateUI(0);
        
        // 5. Celebration
        if (window.playSound) playSound('crit');
        if (window.showToast) showToast(`LIQUIDATION SUCCESS: ${formatNumber(game.influence)} INFLUENCE`, "success");
    }
}
window.confirmPrestige = confirmPrestige;

// --- SHADOW OPS RENDERER ---
function renderShadow() {
    const container = document.getElementById('shadow-container');
    if (!container) return;

    // Calculate Heat Cost (Bribe)
    const bribeCost = game.money * 0.10; // 10% of current cash to clear 10% heat
    
    let html = `
        <div style="background:#1a0505; border:1px solid #450a0a; padding:15px; border-radius:12px; margin-bottom:20px; text-align:center;">
            <div style="font-size:0.7rem; color:#f43f5e; font-weight:900; letter-spacing:2px; margin-bottom:5px;">HEAT LEVEL</div>
            <div style="width:100%; height:8px; background:#2a0a0a; border-radius:4px; overflow:hidden; position:relative;">
                <div style="width:${Math.min(100, game.heat)}%; height:100%; background:linear-gradient(90deg, #f43f5e, #ff0000); transition:width 0.2s;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px;">
                <span style="font-size:0.7rem; color:#f43f5e;">${game.heat.toFixed(1)}% / 100%</span>
                <button class="opt-btn" onclick="payBribe()" style="width:auto; padding:4px 8px; font-size:0.6rem; border-color:#f43f5e; color:#fff; background:#450a0a;">BRIBE (-10% HEAT)</button>
            </div>
            <div style="font-size:0.55rem; color:#888; margin-top:5px;">WARNING: 100% HEAT TRIGGERS FEDERAL RAID (50% CASH SEIZED).</div>
        </div>
    `;

    shadowAssets.forEach((s, i) => {
        const canAfford = game.money >= s.cost;
        html += `
            <div class="staff-card" onclick="buyShadow(${i})" style="border-color:${canAfford ? '#f43f5e' : '#333'};">
                <div class="upg-info">
                    <h4 style="color:#f43f5e">${s.name} <span style="font-size:0.7em; color:#fff;">(x${game.shadowCounts[i]})</span></h4>
                    <p>${s.desc}</p>
                    <span style="font-size:0.6rem; color:#f43f5e;">+${s.heat} HEAT/s</span>
                </div>
                <div class="upg-cost">
                    <div class="cost-text">$${formatNumber(s.cost)}</div>
                    <div class="count-badge" style="background:#450a0a; color:#f43f5e;">Illegal</div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

function buyShadow(id) {
    const s = shadowAssets[id];
    if (game.money >= s.cost) {
        game.money -= s.cost;
        game.shadowCounts[id]++;
        playSound('buy');
        renderShadow();
    } else {
        showToast("Insufficient Dirty Money", "error");
    }
}

function payBribe() {
    const cost = game.money * 0.10;
    if (game.money >= cost) {
        game.money -= cost;
        game.heat = Math.max(0, game.heat - 10);
        showToast("Bribe Accepted. Heat Reduced.", "success");
        renderShadow();
        updateUI(0);
    }
}

// --- CASINO RENDERER ---
function renderCasino() {
    const container = document.getElementById('casino-container');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding:20px; background:linear-gradient(135deg, #1a0b2e 0%, #000 100%); border:1px solid #a855f7; border-radius:16px;">
            <h2 style="color:#a855f7; margin-bottom:5px;">HIGH STAKES TERMINAL</h2>
            <p style="font-size:0.7rem; color:#ccc; margin-bottom:20px;">DOUBLE OR NOTHING</p>
            
            <div style="display:flex; gap:10px; justify-content:center; margin-bottom:20px;">
                <button class="opt-btn" onclick="gamble(0.1)">BET 10%</button>
                <button class="opt-btn" onclick="gamble(0.5)">BET 50%</button>
                <button class="opt-btn" onclick="gamble(1.0)" style="border-color:#a855f7; color:#a855f7;">ALL IN</button>
            </div>
            
            <div id="casino-result" style="height:40px; font-family:'JetBrains Mono'; font-weight:800; font-size:1.2rem;">READY?</div>
        </div>
    `;
}

function gamble(percent) {
    if (game.money <= 0) return showToast("You are broke.", "error");
    
    const bet = game.money * percent;
    const win = Math.random() > 0.5; // 50/50 chance
    
    const resEl = document.getElementById('casino-result');
    
    if (win) {
        game.money += bet;
        game.lifetimeEarnings += bet; // Gambling counts towards prestige
        resEl.innerHTML = `<span style="color:#22c55e">WIN +$${formatNumber(bet)}</span>`;
        playSound('crit');
        if (window.createParticle) {
             for(let i=0; i<20; i++) createParticle(window.innerWidth/2, window.innerHeight/2, '', 'spark');
        }
    } else {
        game.money -= bet;
        resEl.innerHTML = `<span style="color:#f43f5e">LOST -$${formatNumber(bet)}</span>`;
        playSound('error');
    }
    updateUI(0);
}

// Helper to bridge the new tabs
window.buyShadow = buyShadow;
window.payBribe = payBribe;
window.gamble = gamble;