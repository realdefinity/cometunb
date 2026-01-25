const suffixStandard = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

// --- FORMATTER ---
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

// --- UI UPDATE LOOP ---
function updateUI(rate) {
    // 1. Core Values
    document.title = `$${formatNumber(game.money)} - THE MINT`;
    document.getElementById('ui-money').innerText = formatNumber(game.money);
    
    const elRate = document.getElementById('ui-rate');
    if(elRate) elRate.innerText = formatNumber(rate);
    
    // 2. Rank & Influence Logic
    // Find current rank based on influence threshold
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
    
    // Display Current Info
    document.getElementById('rank-name').innerText = currentRank.name;
    document.getElementById('ui-influence').innerText = formatNumber(game.influence);
    
    // Calculate Rank Progress
    let rankProgress = 0;
    let nextGoalText = "MAX RANK";
    
    if (nextRank) {
        // Linear progress between current tier requirement and next tier requirement
        let range = nextRank.req - currentRank.req;
        let currentInTier = game.influence - currentRank.req;
        rankProgress = Math.max(0, Math.min(100, (currentInTier / range) * 100));
        nextGoalText = `${formatNumber(nextRank.req - game.influence)} Inf. to ${nextRank.name}`;
    } else {
        rankProgress = 100;
    }
    
    // Update Prestige Card UI
    const bar = document.getElementById('influence-bar');
    if(bar) bar.style.width = rankProgress + "%";
    
    const nextText = document.getElementById('next-rank-text');
    if(nextText) nextText.innerText = nextGoalText;
    
    // Bonus Display (1 Influence = +10% Speed)
    document.getElementById('ui-bonus').innerText = formatNumber(game.influence * 10);

    // 3. Prestige Button State
    // Calculate cost for NEXT point of influence (Standard Scaling)
    let potential = Math.floor(Math.pow(game.lifetimeEarnings / 1000000, 0.5));
    let btn = document.getElementById('btn-open-prestige');
    
    if (potential > game.influence) {
        btn.classList.add('ready');
        btn.innerHTML = `LIQUIDATE <span style="font-size:0.7em; opacity:0.8;">(+${formatNumber(potential - game.influence)} Inf)</span>`;
    } else {
        btn.classList.remove('ready');
        btn.innerHTML = `LIQUIDATE <span style="font-size:0.7em; opacity:0.5;">(Not Ready)</span>`;
    }

    // 4. Hype
    const hypeBar = document.getElementById('hype-bar');
    const hypeText = document.getElementById('hype-text');
    if(hypeBar) hypeBar.style.width = hype + '%';
    if(hypeText) hypeText.innerText = Math.floor(hype) + '%';
    
    // 5. Shop
    updateShopUI(influenceMult = 1 + (game.influence * 0.10));
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
        el.querySelector('h4').innerHTML = `${u.name} <span style="font-size:0.7em; opacity:0.6; margin-left:4px;">${buyAmountText}</span>`;
        
        let boostRate = u.baseRate * influenceMult * (maniaMode ? 2 : 1);
        el.querySelector('.rate-boost').innerText = `+$${formatNumber(boostRate)}/s`;
        
        el.classList.remove('affordable', 'affordable-max', 'locked');
        if (affordable && (buyMode !== 'MAX' || max > 0)) {
            el.classList.add(buyMode === 'MAX' ? 'affordable-max' : 'affordable');
        } else if (game.counts[i] === 0 && !affordable) {
            el.classList.add('locked');
        }
    });
}

// --- RENDER SHOP ---
function renderShop() {
    const container = document.getElementById('shop-container');
    container.innerHTML = '';
    upgrades.forEach((u, i) => {
        let div = document.createElement('div');
        div.className = 'upgrade';
        div.id = `upg-${i}`;
        div.onclick = () => buy(i);
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

// --- CONTROLS ---
function setBuyMode(mode, btn) {
    buyMode = mode;
    document.querySelectorAll('.buy-amt').forEach(b => b.classList.remove('active', 'active-max'));
    btn.classList.add(mode === 'MAX' ? 'active-max' : 'active');
    updateUI(0);
}

// --- MODALS ---
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
        txt.select(); document.execCommand('copy'); btn.innerText = "COPIED!";
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
            saveLocal(); location.reload();
        } catch(e) { alert("Invalid Data"); }
    };
    openModal('save-modal');
}

function hardReset() {
    if(confirm("FACTORY RESET: Wipe all progress?")) {
        localStorage.removeItem('mintV7_money_save');
        location.reload();
    }
}

// Audio Toggle
let audioEnabled = true;
function toggleAudio() {
    audioEnabled = !audioEnabled;
    const btn = document.getElementById('mute-toggle');
    if(audioEnabled) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        btn.classList.add('active'); btn.innerHTML = "&#128266;";
    } else {
        btn.classList.remove('active'); btn.innerHTML = "&#128263;";
    }
}