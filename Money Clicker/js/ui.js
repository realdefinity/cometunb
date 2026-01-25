const suffixStandard = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

// --- 1. FORMATTER ---
function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toLocaleString();
    
    // Logarithmic tier calculation
    let tier = Math.floor(Math.log10(num) / 3);
    
    if (tier < suffixStandard.length) {
        let suffix = suffixStandard[tier];
        let scale = Math.pow(10, tier * 3);
        return (num / scale).toFixed(2) + suffix;
    }
    
    // Fallback for scientific notation on massive numbers
    return num.toExponential(2).replace('+', '');
}

// --- 2. MAIN UI LOOP (Runs every frame) ---
function updateUI(rate) {
    // A. Title & Header
    document.title = `$${formatNumber(game.money)} - THE MINT`;
    document.getElementById('ui-money').innerText = formatNumber(game.money);
    
    // B. Dashboard Stats
    // Check if element exists before setting to prevent errors on load
    const elRate = document.getElementById('ui-rate');
    if(elRate) elRate.innerText = formatNumber(rate);
    
    document.getElementById('ui-influence').innerText = formatNumber(game.influence);
    
    // C. Influence Progress Bar (Prestige)
    let costForNext = Math.pow(game.influence + 1, 2) * 1000000;
    let costForCurrent = Math.pow(game.influence, 2) * 1000000;
    let progress = 0;
    
    if (game.lifetimeEarnings >= costForNext) {
        progress = 100;
    } else {
        let range = costForNext - costForCurrent;
        let currentInLevel = game.lifetimeEarnings - costForCurrent;
        progress = Math.max(0, Math.min(100, (currentInLevel / range) * 100));
    }
    
    const bar = document.getElementById('influence-bar');
    if(bar) bar.style.width = progress + "%";
    
    // D. Rank Name Update
    let rankIndex = Math.min(ranks.length - 1, Math.floor(game.influence / 5));
    document.getElementById('rank-name').innerText = ranks[rankIndex];

    // E. Hype Bar
    const hypeBar = document.getElementById('hype-bar');
    const hypeText = document.getElementById('hype-text');
    if(hypeBar) hypeBar.style.width = hype + '%';
    if(hypeText) hypeText.innerText = Math.floor(hype) + '%';
    
    // F. SHOP UPDATE LOOP (The Heavy Lifter)
    let influenceMult = 1 + (game.influence * 0.10);
    
    upgrades.forEach((u, i) => {
        let el = document.getElementById(`upg-${i}`);
        if (!el) return;
        
        // 1. Calculate Costs based on Buy Mode (1x, 10x, MAX)
        let max = getMaxBuy(i);
        let amt = (buyMode === 'MAX') ? max : buyMode;
        if(buyMode === 'MAX' && amt === 0) amt = 1; // Show cost for 1 if can't afford any

        let cost = getCost(i, amt);
        let affordable = game.money >= cost;
        
        // 2. Update Text Elements
        // We use querySelector only on specific children to be fast
        el.querySelector('.cost-text').innerText = "$" + formatNumber(cost);
        el.querySelector('.count-badge').innerText = game.counts[i];
        
        // Dynamic Name Updating (Shows "+10" etc)
        let buyAmountText = (buyMode === 'MAX' && max > 0) ? `+${max}` : (buyMode !== 1 && buyMode !== 'MAX' ? `+${amt}` : '');
        el.querySelector('h4').innerHTML = `${u.name} <span style="font-size:0.7em; opacity:0.6; margin-left:4px;">${buyAmountText}</span>`;
        
        // Update Rate Preview
        let boostRate = u.baseRate * influenceMult * (maniaMode ? 2 : 1);
        el.querySelector('.rate-boost').innerText = `+$${formatNumber(boostRate)}/s`;
        
        // 3. Handle Classes (Visual States)
        el.classList.remove('affordable', 'affordable-max', 'locked');
        
        if (affordable && (buyMode !== 'MAX' || max > 0)) {
            el.classList.add(buyMode === 'MAX' ? 'affordable-max' : 'affordable');
        } else if (game.counts[i] === 0 && !affordable) {
            el.classList.add('locked');
        }
    });
}

// --- 3. RENDER SHOP (Runs Once) ---
function renderShop() {
    const container = document.getElementById('shop-container');
    container.innerHTML = ''; // Clear current
    
    upgrades.forEach((u, i) => {
        let div = document.createElement('div');
        div.className = 'upgrade';
        div.id = `upg-${i}`;
        
        // Bind Click
        div.onclick = () => buy(i);
        
        // Generate "Data Blade" HTML
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

// --- 4. BUY MODE TOGGLE ---
function setBuyMode(mode, btn) {
    buyMode = mode;
    // Update visual buttons
    document.querySelectorAll('.buy-amt').forEach(b => b.classList.remove('active', 'active-max'));
    btn.classList.add(mode === 'MAX' ? 'active-max' : 'active');
    
    // Force UI refresh immediately
    updateUI(0);
}

// --- 5. MODAL SYSTEM ---
function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
    // Small delay to allow CSS transition to catch the display change
    setTimeout(() => modal.classList.add('open'), 10);
    
    // Setup Import/Export specific logic if needed
    if(id === 'save-modal') {
        const btn = document.getElementById('modal-action-btn');
        const txt = document.getElementById('save-data-input');
        
        // Determine if we are saving or loading based on context
        // (Simplified for this version: Button acts as Import if text exists, Export if empty)
        // You can split this into distinct functions if preferred.
    }
}

function openExport() {
    saveLocal();
    const modal = document.getElementById('save-modal');
    const txt = document.getElementById('save-data-input');
    const btn = document.getElementById('modal-action-btn');
    
    txt.value = btoa(JSON.stringify(game));
    btn.innerText = "COPY TO CLIPBOARD";
    btn.onclick = () => {
        txt.select();
        document.execCommand('copy');
        btn.innerText = "COPIED!";
        setTimeout(() => closeModal('save-modal'), 1000);
    };
    
    openModal('save-modal');
}

function openImport() {
    const modal = document.getElementById('save-modal');
    const txt = document.getElementById('save-data-input');
    const btn = document.getElementById('modal-action-btn');
    
    txt.value = "";
    txt.placeholder = "Paste your save string here...";
    btn.innerText = "IMPORT SAVE";
    
    btn.onclick = () => {
        try {
            let data = JSON.parse(atob(txt.value.trim()));
            game = { ...game, ...data };
            saveLocal();
            location.reload();
        } catch(e) {
            alert("Invalid Save Data");
        }
    };
    
    openModal('save-modal');
}

function hardReset() {
    if(confirm("FACTORY RESET: This will wipe all progress. Continue?")) {
        localStorage.removeItem('mintV7_money_save');
        location.reload();
    }
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
}

// Toggle Mute Icon
let audioEnabled = true;
function toggleAudio() {
    audioEnabled = !audioEnabled;
    const btn = document.getElementById('mute-toggle');
    if(audioEnabled) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        btn.classList.add('active');
        btn.innerHTML = "&#128266;"; // Speaker High
    } else {
        btn.classList.remove('active');
        btn.innerHTML = "&#128263;"; // Speaker Off
    }
}